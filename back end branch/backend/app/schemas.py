from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


# ---------- Fornecedores ----------
class FornecedorBase(BaseModel):
    nome: str
    email: EmailStr
    ativo: bool = True


class FornecedorCreate(FornecedorBase):
    senha: str


class FornecedorUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    ativo: Optional[bool] = None
    senha: Optional[str] = None


class FornecedorOut(FornecedorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Produtos ----------
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


# ---------- Listas ----------
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
