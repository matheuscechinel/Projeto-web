from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, Integer, Numeric, String
from .database import Base


class Fornecedor(Base):
    __tablename__ = "fornecedores"

    id = Column(Integer, primary_key=True, index=True)
    ativo = Column(Boolean, nullable=False, default=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    senha = Column(String(255), nullable=False)


class FornecedorAcesso(Base):
    __tablename__ = "fornecedor_acessos"

    id = Column(Integer, primary_key=True, index=True)
    fornecedor_id = Column(Integer, nullable=False, index=True)
    estabelecimento = Column(String(100), nullable=False)


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    ativo = Column(Boolean, nullable=False, default=True)
    nome = Column(String(100), nullable=False, index=True)


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    grupo_pedido = Column(BigInteger, nullable=False, index=True)
    produto_id = Column(Integer, nullable=True, index=True)
    nome = Column(String(100), nullable=False, index=True)
    categoria = Column(String(100), nullable=False, index=True)
    quantidade = Column(Numeric, nullable=False)
    unidade = Column(String(30), nullable=False)
    estabelecimento = Column(String(100), nullable=False, index=True)
    validade = Column(Date, nullable=True)
    data_oferta = Column(DateTime, nullable=True)
    melhor_preco = Column(Numeric(12, 2), nullable=False, default=0)
    oferta_fornecedor = Column(Numeric(12, 2), nullable=True)
    fornecedor_id = Column(Integer, nullable=True, index=True)
    fornecedor = Column(String(150), nullable=True)
    avaliacao = Column(String(30), nullable=False, default="Novo")


class Oferta(Base):
    __tablename__ = "ofertas"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, nullable=False, index=True)
    fornecedor_id = Column(Integer, nullable=False, index=True)
    preco = Column(Numeric(12, 2), nullable=False)
    criada_em = Column(DateTime, nullable=False)


class Lista(Base):
    __tablename__ = "listas"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, nullable=False)
    produto_id = Column(Integer, nullable=False)
    quantidade = Column(Numeric, nullable=False)


class CodigoVerificacao(Base):
    __tablename__ = "codigos_verificacao"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), nullable=False, index=True)
    codigo_hash = Column(String(64), nullable=False)
    criado_em = Column(DateTime, nullable=False)
    expira_em = Column(DateTime, nullable=False)
    tentativas = Column(Integer, nullable=False, default=0)
