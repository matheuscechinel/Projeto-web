from sqlalchemy.orm import Session
from . import models, schemas


# ---------- Fornecedores ----------
def list_fornecedores(db: Session):
    return db.query(models.Fornecedor).order_by(models.Fornecedor.id).all()


def get_fornecedor(db: Session, fornecedor_id: int):
    return db.query(models.Fornecedor).filter(models.Fornecedor.id == fornecedor_id).first()


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
    db.delete(obj)
    db.commit()


# ---------- Produtos ----------
def list_produtos(db: Session):
    return db.query(models.Produto).order_by(models.Produto.id).all()


def get_produto(db: Session, produto_id: int):
    return db.query(models.Produto).filter(models.Produto.id == produto_id).first()


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
    db.delete(obj)
    db.commit()


# ---------- Listas ----------
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
