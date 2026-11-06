"""Envio do código de verificação por e-mail (SMTP).

EMAIL_MODO=smtp    -> envia de verdade (padrão quando SMTP_HOST está definido)
EMAIL_MODO=console -> só escreve o código no log do servidor (apenas desenvolvimento)
"""
import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

logger = logging.getLogger("comprass.email")


class ErroEnvioEmail(Exception):
    pass


def _montar_mensagem(destino: str, codigo: str, validade_min: int, remetente: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = f"{codigo} é o seu código de acesso ao Comprass"
    msg["From"] = remetente
    msg["To"] = destino
    msg.set_content(
        f"Seu código de acesso ao Comprass é: {codigo}\n\n"
        f"Ele vale por {validade_min} minutos e só pode ser usado uma vez.\n"
        "Se você não tentou entrar, ignore este e-mail."
    )
    msg.add_alternative(
        f"""\
<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#222">
  <h2 style="margin:0 0 12px">Seu código de acesso</h2>
  <p style="margin:0 0 16px">Use o código abaixo para entrar no Comprass:</p>
  <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:0 0 16px;
            background:#f3f3f5;border-radius:10px;padding:14px 0;text-align:center">{codigo}</p>
  <p style="color:#666;font-size:13px;margin:0">Vale por {validade_min} minutos e só pode ser usado uma vez.
  Se você não tentou entrar, ignore este e-mail.</p>
</div>""",
        subtype="html",
    )
    return msg


def enviar_codigo(destino: str, codigo: str, validade_min: int) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    modo = os.getenv("EMAIL_MODO", "smtp" if host else "console").lower()

    if modo == "console":
        logger.warning("[EMAIL-DEV] código para %s: %s", destino, codigo)
        print(f"[EMAIL-DEV] código para {destino}: {codigo}", flush=True)
        return

    if not host:
        raise ErroEnvioEmail("SMTP_HOST não configurado.")

    porta = int(os.getenv("SMTP_PORT", "587"))
    usuario = os.getenv("SMTP_USER", "").strip()
    senha = os.getenv("SMTP_PASSWORD", "")
    remetente = os.getenv("SMTP_FROM", "").strip() or usuario
    usar_ssl = os.getenv("SMTP_SSL", "false").lower() == "true"
    usar_starttls = os.getenv("SMTP_STARTTLS", "true").lower() == "true"
    mensagem = _montar_mensagem(destino, codigo, validade_min, remetente)
    contexto = ssl.create_default_context()

    try:
        if usar_ssl:
            with smtplib.SMTP_SSL(host, porta, context=contexto, timeout=15) as servidor:
                if usuario:
                    servidor.login(usuario, senha)
                servidor.send_message(mensagem)
        else:
            with smtplib.SMTP(host, porta, timeout=15) as servidor:
                servidor.ehlo()
                if usar_starttls:
                    servidor.starttls(context=contexto)
                    servidor.ehlo()
                if usuario:
                    servidor.login(usuario, senha)
                servidor.send_message(mensagem)
    except (smtplib.SMTPException, OSError) as erro:
        logger.exception("Falha ao enviar e-mail para %s", destino)
        raise ErroEnvioEmail(str(erro)) from erro
