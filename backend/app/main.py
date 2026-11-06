import os
from datetime import timedelta
from math import ceil

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import engine, get_db
from .email_service import ErroEnvioEmail, enviar_codigo
from .seguranca import (
    CODIGO_MAX_TENTATIVAS,
    CODIGO_REENVIO_SEGUNDOS,
    CODIGO_VALIDADE_MIN,
    agora_utc,
    codigo_confere,
    criar_token,
    exigir_admin,
    exigir_fornecedor,
    gerar_codigo,
    hash_codigo,
    usuario_atual,
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Comprass API", version="2.1.0")

ORIGENS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS,
    allow_credentials=False,  # a sessão vai no header Authorization, não em cookie
    allow_methods=["*"],
    allow_headers=["*"],
)

ESTABELECIMENTOS = ["Restaurante", "Sushi 1", "Sushi 2"]
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@plataforma.com").strip().lower()
ADMIN_NAME = os.getenv("ADMIN_NAME", "Administração")


@app.get("/")
def root():
    return {"status": "ok", "service": "comprass-api", "version": app.version}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}


# Autenticação por código enviado ao e-mail
def _buscar_conta(db: Session, email: str):
    if email == ADMIN_EMAIL:
        return {"id": None, "nome": ADMIN_NAME, "email": email, "papel": "admin", "empresa": ADMIN_NAME}
    fornecedor = crud.get_fornecedor_by_email(db, email)
    if fornecedor and fornecedor.ativo:
        return {
            "id": fornecedor.id,
            "nome": fornecedor.nome,
            "email": fornecedor.email.lower(),
            "papel": "fornecedor",
            "empresa": fornecedor.nome,
        }
    return None


@app.post("/auth/solicitar-codigo")
def solicitar_codigo(data: schemas.CodigoRequest, db: Session = Depends(get_db)):
    email = str(data.email).strip().lower()
    if not _buscar_conta(db, email):
        raise HTTPException(status_code=404, detail="E-mail não corresponde a uma conta cadastrada.")

    agora = agora_utc()
    anterior = crud.get_codigo(db, email)
    if anterior:
        decorrido = (agora - anterior.criado_em).total_seconds()
        if decorrido < CODIGO_REENVIO_SEGUNDOS:
            espera = ceil(CODIGO_REENVIO_SEGUNDOS - decorrido)
            raise HTTPException(status_code=429, detail=f"Aguarde {espera}s para solicitar um novo código.")

    codigo = gerar_codigo()
    crud.salvar_codigo(db, email, hash_codigo(email, codigo), agora, agora + timedelta(minutes=CODIGO_VALIDADE_MIN))
    try:
        enviar_codigo(email, codigo, CODIGO_VALIDADE_MIN)
    except ErroEnvioEmail:
        crud.apagar_codigos(db, email)
        raise HTTPException(status_code=503, detail="Não foi possível enviar o e-mail. Tente novamente em instantes.")
    return {"status": "enviado"}


@app.post("/auth/verificar-codigo", response_model=schemas.LoginOut)
def verificar_codigo(data: schemas.CodigoVerify, db: Session = Depends(get_db)):
    email = str(data.email).strip().lower()
    conta = _buscar_conta(db, email)
    registro = crud.get_codigo(db, email)
    if not conta or not registro:
        raise HTTPException(status_code=401, detail="Nenhum código ativo. Solicite um novo código.")

    if agora_utc() > registro.expira_em:
        crud.apagar_codigos(db, email)
        raise HTTPException(status_code=401, detail="Código expirado. Solicite um novo código.")

    if registro.tentativas >= CODIGO_MAX_TENTATIVAS:
        raise HTTPException(status_code=429, detail="Muitas tentativas. Solicite um novo código.")

    if not codigo_confere(email, data.codigo.strip(), registro.codigo_hash):
        crud.registrar_tentativa_errada(db, registro)
        raise HTTPException(status_code=401, detail="Código inválido.")

    crud.apagar_codigos(db, email)  # uso único
    token = criar_token(email=conta["email"], papel=conta["papel"], uid=conta["id"], nome=conta["nome"])
    return schemas.LoginOut(token=token, **conta)


@app.get("/estabelecimentos", response_model=list[str])
def get_estabelecimentos(_: dict = Depends(usuario_atual)):
    return ESTABELECIMENTOS


# Fornecedores (somente administrador)
@app.get("/fornecedores", response_model=list[schemas.FornecedorComAcessosOut])
def get_fornecedores(db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    return crud.list_fornecedores_com_acessos(db)


@app.get("/fornecedores/{fornecedor_id}", response_model=schemas.FornecedorOut)
def get_fornecedor(fornecedor_id: int, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    obj = crud.get_fornecedor(db, fornecedor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    return obj


@app.get("/fornecedores/{fornecedor_id}/acessos", response_model=list[str])
def get_acessos(fornecedor_id: int, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    if not crud.get_fornecedor(db, fornecedor_id):
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    return crud.get_acessos(db, fornecedor_id)


@app.put("/fornecedores/{fornecedor_id}/acessos", response_model=list[str])
def put_acessos(fornecedor_id: int, data: schemas.AcessoUpdate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    if not crud.get_fornecedor(db, fornecedor_id):
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    return crud.set_acessos(db, fornecedor_id, data.estabelecimentos)


@app.post("/fornecedores", response_model=schemas.FornecedorOut, status_code=201)
def post_fornecedor(data: schemas.FornecedorCreate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    if str(data.email).lower() == ADMIN_EMAIL or crud.get_fornecedor_by_email(db, str(data.email)):
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")
    return crud.create_fornecedor(db, data)


@app.put("/fornecedores/{fornecedor_id}", response_model=schemas.FornecedorOut)
def put_fornecedor(fornecedor_id: int, data: schemas.FornecedorUpdate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    obj = crud.get_fornecedor(db, fornecedor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    if data.email is not None:
        existente = crud.get_fornecedor_by_email(db, str(data.email))
        if (existente and existente.id != obj.id) or str(data.email).lower() == ADMIN_EMAIL:
            raise HTTPException(status_code=409, detail="E-mail já cadastrado")
    return crud.update_fornecedor(db, obj, data)


@app.delete("/fornecedores/{fornecedor_id}", status_code=204)
def delete_fornecedor(fornecedor_id: int, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    obj = crud.get_fornecedor(db, fornecedor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    crud.delete_fornecedor(db, obj)


# Produtos
@app.get("/produtos", response_model=list[schemas.ProdutoOut])
def get_produtos(db: Session = Depends(get_db), _: dict = Depends(usuario_atual)):
    return crud.list_produtos(db)


@app.post("/produtos", response_model=schemas.ProdutoOut, status_code=201)
def post_produto(data: schemas.ProdutoCreate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    return crud.create_produto(db, data)


@app.put("/produtos/{produto_id}", response_model=schemas.ProdutoOut)
def put_produto(produto_id: int, data: schemas.ProdutoUpdate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    obj = crud.get_produto(db, produto_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    return crud.update_produto(db, obj, data)


@app.delete("/produtos/{produto_id}", status_code=204)
def delete_produto(produto_id: int, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    obj = crud.get_produto(db, produto_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    crud.delete_produto(db, obj)


# Pedidos
@app.get("/pedidos", response_model=list[schemas.PedidoOut])
def get_pedidos(
    estabelecimento: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: dict = Depends(usuario_atual),
):
    return crud.list_pedidos(db, estabelecimento=estabelecimento)


@app.get("/pedidos/{pedido_id}", response_model=schemas.PedidoOut)
def get_pedido(pedido_id: int, db: Session = Depends(get_db), _: dict = Depends(usuario_atual)):
    pedido = crud.get_pedido(db, pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido


@app.post("/pedidos", response_model=list[schemas.PedidoOut], status_code=201)
def post_pedido(data: schemas.PedidoCreate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    return crud.create_pedidos(db, data)


@app.put("/pedidos/{pedido_id}", response_model=list[schemas.PedidoOut])
def put_pedido(pedido_id: int, data: schemas.PedidoUpdate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    pedidos = crud.update_pedido(db, pedido_id, data)
    if not pedidos:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedidos


# Ofertas
@app.get("/ofertas", response_model=list[schemas.OfertaOut])
def get_ofertas(pedido_id: int | None = Query(default=None), db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    return crud.list_ofertas(db, pedido_id)


@app.post("/pedidos/{pedido_id}/ofertas", response_model=schemas.OfertaOut, status_code=201)
def post_oferta(
    pedido_id: int,
    data: schemas.OfertaCreate,
    db: Session = Depends(get_db),
    usuario: dict = Depends(exigir_fornecedor),
):
    pedido = crud.get_pedido(db, pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    fornecedor = crud.get_fornecedor(db, usuario["id"])  # o fornecedor vem do token, não da URL
    if not fornecedor or not fornecedor.ativo:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    return crud.create_oferta(db, pedido, fornecedor, data.preco)


# Listas - mantidas para compatibilidade com a API anterior
@app.get("/listas", response_model=list[schemas.ListaOut])
def get_listas(db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    return crud.list_listas(db)


@app.post("/listas", response_model=schemas.ListaOut, status_code=201)
def post_lista(data: schemas.ListaCreate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    return crud.create_lista(db, data)


@app.put("/listas/{lista_id}", response_model=schemas.ListaOut)
def put_lista(lista_id: int, data: schemas.ListaUpdate, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    obj = crud.get_lista(db, lista_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Item de lista nao encontrado")
    return crud.update_lista(db, obj, data)


@app.delete("/listas/{lista_id}", status_code=204)
def delete_lista(lista_id: int, db: Session = Depends(get_db), _: dict = Depends(exigir_admin)):
    obj = crud.get_lista(db, lista_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Item de lista nao encontrado")
    crud.delete_lista(db, obj)
