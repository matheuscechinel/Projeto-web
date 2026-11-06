import secrets
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class FornecedorBase(BaseModel):
    nome: str
    email: EmailStr
    ativo: bool = True


class FornecedorCreate(FornecedorBase):
    # o front entra por código por e-mail e não tem campo de senha; gera uma aleatória
    senha: str = Field(default_factory=lambda: secrets.token_urlsafe(12), min_length=1)


class FornecedorUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    ativo: Optional[bool] = None
    senha: Optional[str] = None


class FornecedorOut(FornecedorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class FornecedorComAcessosOut(FornecedorOut):
    acessos: list[str] = []


class CodigoRequest(BaseModel):
    email: EmailStr


class CodigoVerify(BaseModel):
    email: EmailStr
    codigo: str


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class LoginOut(BaseModel):
    token: Optional[str] = None
    id: Optional[int] = None
    nome: str
    email: EmailStr
    papel: str
    empresa: str


class AcessoUpdate(BaseModel):
    estabelecimentos: list[str] = []


class ProdutoBase(BaseModel):
    nome: str
    ativo: bool = True


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None


class ProdutoOut(ProdutoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PedidoCreate(BaseModel):
    nome: str
    quantidade: Decimal
    unidade: str
    estabelecimentos: list[str] = Field(min_length=1, max_length=3)
    prazo: int = Field(default=7, ge=1)
    validade: Optional[date] = None  # data escolhida no front (tem prioridade sobre prazo)


class PedidoUpdate(BaseModel):
    nome: Optional[str] = None
    quantidade: Optional[Decimal] = None
    unidade: Optional[str] = None
    estabelecimentos: Optional[list[str]] = Field(default=None, min_length=1, max_length=3)
    prazo: Optional[int] = Field(default=None, ge=1)
    validade: Optional[date] = None


class PedidoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    grupo_pedido: int
    produto_id: Optional[int]
    nome: str
    categoria: str
    quantidade: Decimal
    unidade: str
    estabelecimento: str
    validade: Optional[date]
    data_oferta: Optional[datetime]
    melhor_preco: Decimal
    oferta_fornecedor: Optional[Decimal]
    fornecedor_id: Optional[int]
    fornecedor: Optional[str]
    avaliacao: str


class OfertaCreate(BaseModel):
    preco: Decimal = Field(gt=0)


class OfertaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    pedido_id: int
    fornecedor_id: int
    preco: Decimal
    criada_em: datetime


class ListaBase(BaseModel):
    pedido_id: int
    produto_id: int
    quantidade: Decimal


class ListaCreate(ListaBase):
    pass


class ListaUpdate(BaseModel):
    pedido_id: Optional[int] = None
    produto_id: Optional[int] = None
    quantidade: Optional[Decimal] = None


class ListaOut(ListaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
