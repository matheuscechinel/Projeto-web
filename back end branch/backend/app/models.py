from sqlalchemy import Boolean, Column, Integer, Numeric, String
from .database import Base


class Fornecedor(Base):
    __tablename__ = "fornecedores"

    id = Column(Integer, primary_key=True, index=True)
    ativo = Column(Boolean, nullable=False, default=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    senha = Column(String(255), nullable=False)


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    ativo = Column(Boolean, nullable=False, default=True)
    nome = Column(String(100), nullable=False)


class Lista(Base):
    __tablename__ = "listas"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, nullable=False)
    produto_id = Column(Integer, nullable=False)
    quantidade = Column(Numeric, nullable=False)
