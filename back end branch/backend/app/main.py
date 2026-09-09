from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import engine, get_db

# Cria as tabelas caso ainda nao existam (nao substitui as ja criadas pelo dump)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Comprass API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ajuste para o dominio do seu front em producao
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "comprass-api"}


# ============ Fornecedores ============
@app.get("/fornecedores", response_model=list[schemas.FornecedorOut])
def get_fornecedores(db: Session = Depends(get_db)):
    return crud.list_fornecedores(db)


@app.post("/fornecedores", response_model=schemas.FornecedorOut, status_code=201)
def post_fornecedor(data: schemas.FornecedorCreate, db: Session = Depends(get_db)):
    return crud.create_fornecedor(db, data)


@app.put("/fornecedores/{fornecedor_id}", response_model=schemas.FornecedorOut)
def put_fornecedor(fornecedor_id: int, data: schemas.FornecedorUpdate, db: Session = Depends(get_db)):
    obj = crud.get_fornecedor(db, fornecedor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    return crud.update_fornecedor(db, obj, data)


@app.delete("/fornecedores/{fornecedor_id}", status_code=204)
def delete_fornecedor(fornecedor_id: int, db: Session = Depends(get_db)):
    obj = crud.get_fornecedor(db, fornecedor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    crud.delete_fornecedor(db, obj)


# ============ Produtos ============
@app.get("/produtos", response_model=list[schemas.ProdutoOut])
def get_produtos(db: Session = Depends(get_db)):
    return crud.list_produtos(db)


@app.post("/produtos", response_model=schemas.ProdutoOut, status_code=201)
def post_produto(data: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    return crud.create_produto(db, data)


@app.put("/produtos/{produto_id}", response_model=schemas.ProdutoOut)
def put_produto(produto_id: int, data: schemas.ProdutoUpdate, db: Session = Depends(get_db)):
    obj = crud.get_produto(db, produto_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    return crud.update_produto(db, obj, data)


@app.delete("/produtos/{produto_id}", status_code=204)
def delete_produto(produto_id: int, db: Session = Depends(get_db)):
    obj = crud.get_produto(db, produto_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    crud.delete_produto(db, obj)


# ============ Listas ============
@app.get("/listas", response_model=list[schemas.ListaOut])
def get_listas(db: Session = Depends(get_db)):
    return crud.list_listas(db)


@app.post("/listas", response_model=schemas.ListaOut, status_code=201)
def post_lista(data: schemas.ListaCreate, db: Session = Depends(get_db)):
    return crud.create_lista(db, data)


@app.put("/listas/{lista_id}", response_model=schemas.ListaOut)
def put_lista(lista_id: int, data: schemas.ListaUpdate, db: Session = Depends(get_db)):
    obj = crud.get_lista(db, lista_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Item de lista nao encontrado")
    return crud.update_lista(db, obj, data)


@app.delete("/listas/{lista_id}", status_code=204)
def delete_lista(lista_id: int, db: Session = Depends(get_db)):
    obj = crud.get_lista(db, lista_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Item de lista nao encontrado")
    crud.delete_lista(db, obj)
