"""Códigos de verificação, tokens de sessão (JWT) e dependências de autorização."""
import hashlib
import hmac
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import crud
from .database import get_db  # também carrega o .env

logger = logging.getLogger("comprass.auth")

SEGREDO = os.getenv("JWT_SECRET")
if not SEGREDO:
    SEGREDO = secrets.token_urlsafe(48)
    logger.warning("JWT_SECRET não definido: usando segredo temporário (as sessões caem ao reiniciar). Defina no .env.")

ALGORITMO = "HS256"
TOKEN_VALIDADE_HORAS = int(os.getenv("TOKEN_HORAS", "8"))
CODIGO_VALIDADE_MIN = int(os.getenv("CODIGO_VALIDADE_MIN", "10"))
CODIGO_MAX_TENTATIVAS = int(os.getenv("CODIGO_MAX_TENTATIVAS", "5"))
CODIGO_REENVIO_SEGUNDOS = int(os.getenv("CODIGO_REENVIO_SEGUNDOS", "60"))


def agora_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def gerar_codigo() -> str:
    return f"{secrets.randbelow(10**6):06d}"


def hash_codigo(email: str, codigo: str) -> str:
    return hmac.new(SEGREDO.encode(), f"{email}:{codigo}".encode(), hashlib.sha256).hexdigest()


def codigo_confere(email: str, codigo: str, hash_salvo: str) -> bool:
    return hmac.compare_digest(hash_codigo(email, codigo), hash_salvo)


def criar_token(*, email: str, papel: str, uid: int | None, nome: str) -> str:
    agora = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "papel": papel,
        "uid": uid,
        "nome": nome,
        "iat": agora,
        "exp": agora + timedelta(hours=TOKEN_VALIDADE_HORAS),
    }
    return jwt.encode(payload, SEGREDO, algorithm=ALGORITMO)


_bearer = HTTPBearer(auto_error=False)


def usuario_atual(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> dict:
    cabecalho = {"WWW-Authenticate": "Bearer"}
    if not credenciais:
        raise HTTPException(status_code=401, detail="Não autenticado.", headers=cabecalho)
    try:
        dados = jwt.decode(credenciais.credentials, SEGREDO, algorithms=[ALGORITMO])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.", headers=cabecalho)

    if dados.get("papel") == "fornecedor":
        fornecedor = crud.get_fornecedor(db, dados.get("uid"))
        if not fornecedor or not fornecedor.ativo:
            raise HTTPException(status_code=401, detail="Conta desativada.", headers=cabecalho)

    return {"email": dados["sub"], "papel": dados["papel"], "id": dados.get("uid"), "nome": dados.get("nome")}


def exigir_admin(usuario: dict = Depends(usuario_atual)) -> dict:
    if usuario["papel"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return usuario


def exigir_fornecedor(usuario: dict = Depends(usuario_atual)) -> dict:
    if usuario["papel"] != "fornecedor":
        raise HTTPException(status_code=403, detail="Acesso restrito a fornecedores.")
    return usuario
