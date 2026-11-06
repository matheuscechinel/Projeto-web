from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session
from . import models, schemas


def list_fornecedores(db: Session):
    return db.query(models.Fornecedor).order_by(models.Fornecedor.id).all()


def list_fornecedores_com_acessos(db: Session):
    acessos: dict[int, list[str]] = {}
    for item in db.query(models.FornecedorAcesso).order_by(models.FornecedorAcesso.id).all():
        acessos.setdefault(item.fornecedor_id, []).append(item.estabelecimento)
    return [
        {"id": f.id, "nome": f.nome, "email": f.email, "ativo": f.ativo, "acessos": acessos.get(f.id, [])}
        for f in list_fornecedores(db)
    ]


def get_fornecedor(db: Session, fornecedor_id: int):
    return db.query(models.Fornecedor).filter(models.Fornecedor.id == fornecedor_id).first()


def get_fornecedor_by_email(db: Session, email: str):
    return db.query(models.Fornecedor).filter(func.lower(models.Fornecedor.email) == email.lower()).first()


def create_fornecedor(db: Session, data: schemas.FornecedorCreate):
    obj = models.Fornecedor(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_fornecedor(db: Session, obj: models.Fornecedor, data: schemas.FornecedorUpdate):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_fornecedor(db: Session, obj: models.Fornecedor):
    db.query(models.FornecedorAcesso).filter(models.FornecedorAcesso.fornecedor_id == obj.id).delete(synchronize_session=False)
    db.delete(obj)
    db.commit()



def get_acessos(db: Session, fornecedor_id: int):
    return [item.estabelecimento for item in db.query(models.FornecedorAcesso).filter(models.FornecedorAcesso.fornecedor_id == fornecedor_id).all()]


def set_acessos(db: Session, fornecedor_id: int, estabelecimentos: list[str]):
    db.query(models.FornecedorAcesso).filter(models.FornecedorAcesso.fornecedor_id == fornecedor_id).delete(synchronize_session=False)
    for estabelecimento in estabelecimentos:
        db.add(models.FornecedorAcesso(fornecedor_id=fornecedor_id, estabelecimento=estabelecimento))
    db.commit()
    return get_acessos(db, fornecedor_id)


def list_produtos(db: Session):
    return db.query(models.Produto).filter(models.Produto.ativo.is_(True)).order_by(models.Produto.id).all()


def get_produto(db: Session, produto_id: int):
    return db.query(models.Produto).filter(models.Produto.id == produto_id).first()


def get_or_create_produto(db: Session, nome: str):
    obj = db.query(models.Produto).filter(func.lower(models.Produto.nome) == nome.lower()).first()
    if obj:
        return obj
    obj = models.Produto(nome=nome, ativo=True)
    db.add(obj)
    db.flush()
    return obj


def create_produto(db: Session, data: schemas.ProdutoCreate):
    obj = models.Produto(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_produto(db: Session, obj: models.Produto, data: schemas.ProdutoUpdate):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_produto(db: Session, obj: models.Produto):
    obj.ativo = False
    db.commit()


def _pedido_dict(pedido):
    return pedido


def list_pedidos(db: Session, estabelecimento: str | None = None, fornecedor_id: int | None = None):
    query = db.query(models.Pedido).order_by(models.Pedido.id.desc())
    if estabelecimento:
        query = query.filter(models.Pedido.estabelecimento == estabelecimento)
    return query.all()


def get_pedido(db: Session, pedido_id: int):
    return db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()


def create_pedidos(db: Session, data: schemas.PedidoCreate):
    agora = datetime.now()
    grupo = int(agora.timestamp() * 1000)
    produto = get_or_create_produto(db, data.nome)
    validade = data.validade or (agora + timedelta(days=data.prazo)).date()
    pedidos = []
    for estabelecimento in data.estabelecimentos:
        pedido = models.Pedido(
            grupo_pedido=grupo,
            produto_id=produto.id,
            nome=data.nome,
            categoria=data.nome.lower(),
            quantidade=data.quantidade,
            unidade=data.unidade.lower(),
            estabelecimento=estabelecimento,
            validade=validade,
            data_oferta=agora,
            melhor_preco=Decimal("0"),
            oferta_fornecedor=None,
            fornecedor_id=None,
            fornecedor=None,
            avaliacao="Novo",
        )
        db.add(pedido)
        pedidos.append(pedido)
    db.commit()
    for pedido in pedidos:
        db.refresh(pedido)
    return pedidos


def update_pedido(db: Session, pedido_id: int, data: schemas.PedidoUpdate):
    original = get_pedido(db, pedido_id)
    if not original:
        return []

    grupo = original.grupo_pedido
    payload = data.model_dump(exclude_unset=True)
    destinos = payload.pop("estabelecimentos", None)
    prazo = payload.pop("prazo", None)

    if prazo is not None and payload.get("validade") is None:
        payload["validade"] = (datetime.now() + timedelta(days=prazo)).date()
    if payload.get("unidade"):
        payload["unidade"] = payload["unidade"].lower()
    if "nome" in payload and payload["nome"]:
        produto = get_or_create_produto(db, payload["nome"])
        payload["produto_id"] = produto.id
        payload["categoria"] = payload["nome"].lower()

    grupo_pedidos = db.query(models.Pedido).filter(models.Pedido.grupo_pedido == grupo).all()
    if destinos is None:
        destinos = [original.estabelecimento]

    for item in grupo_pedidos:
        db.delete(item)
    db.flush()

    novos = []
    for indice, destino in enumerate(destinos):
        pedido = models.Pedido(
            **{**payload,
               "grupo_pedido": grupo,
               "estabelecimento": destino,
               "nome": payload.get("nome", original.nome),
               "categoria": payload.get("categoria", original.categoria),
               "quantidade": payload.get("quantidade", original.quantidade),
               "unidade": payload.get("unidade", original.unidade),
               "validade": payload.get("validade", original.validade),
               "produto_id": payload.get("produto_id", original.produto_id),
               "data_oferta": original.data_oferta,
               "melhor_preco": original.melhor_preco,
               "oferta_fornecedor": original.oferta_fornecedor,
               "fornecedor_id": original.fornecedor_id,
               "fornecedor": original.fornecedor,
               "avaliacao": original.avaliacao})
        db.add(pedido)
        novos.append(pedido)
    db.commit()
    for item in novos:
        db.refresh(item)
    return novos


def create_oferta(db: Session, pedido: models.Pedido, fornecedor: models.Fornecedor, preco: Decimal):
    agora = datetime.now()
    oferta = models.Oferta(pedido_id=pedido.id, fornecedor_id=fornecedor.id, preco=preco, criada_em=agora)
    db.add(oferta)
    pedido.oferta_fornecedor = preco
    pedido.fornecedor_id = fornecedor.id
    pedido.fornecedor = fornecedor.nome
    pedido.data_oferta = agora
    if not pedido.melhor_preco or pedido.melhor_preco == 0:
        pedido.melhor_preco = preco
    else:
        pedido.melhor_preco = min(pedido.melhor_preco, preco)
    pedido.avaliacao = "Novo"
    db.commit()
    db.refresh(oferta)
    db.refresh(pedido)
    return oferta


def list_ofertas(db: Session, pedido_id: int | None = None):
    query = db.query(models.Oferta).order_by(models.Oferta.criada_em.desc())
    if pedido_id:
        query = query.filter(models.Oferta.pedido_id == pedido_id)
    return query.all()


def list_listas(db: Session):
    return db.query(models.Lista).order_by(models.Lista.id).all()


def get_lista(db: Session, lista_id: int):
    return db.query(models.Lista).filter(models.Lista.id == lista_id).first()


def create_lista(db: Session, data: schemas.ListaCreate):
    obj = models.Lista(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_lista(db: Session, obj: models.Lista, data: schemas.ListaUpdate):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_lista(db: Session, obj: models.Lista):
    db.delete(obj)
    db.commit()


# Códigos de verificação por e-mail
def get_codigo(db: Session, email: str):
    return (
        db.query(models.CodigoVerificacao)
        .filter(models.CodigoVerificacao.email == email)
        .order_by(models.CodigoVerificacao.id.desc())
        .first()
    )


def apagar_codigos(db: Session, email: str):
    db.query(models.CodigoVerificacao).filter(models.CodigoVerificacao.email == email).delete(synchronize_session='fetch')
    db.commit()


def salvar_codigo(db: Session, email: str, codigo_hash: str, criado_em: datetime, expira_em: datetime):
    # só existe um código ativo por e-mail: o novo invalida o anterior
    db.query(models.CodigoVerificacao).filter(models.CodigoVerificacao.email == email).delete(synchronize_session='fetch')
    db.add(models.CodigoVerificacao(email=email, codigo_hash=codigo_hash, criado_em=criado_em, expira_em=expira_em, tentativas=0))
    db.commit()


def registrar_tentativa_errada(db: Session, registro: models.CodigoVerificacao):
    registro.tentativas += 1
    db.commit()
