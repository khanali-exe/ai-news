"""Subscription endpoints — subscribe, confirm, unsubscribe."""
import secrets
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscriber import Subscriber
from app.services.email_sender import send_email, confirmation_email_html
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscribe", tags=["subscribe"])


class SubscribeRequest(BaseModel):
    email: EmailStr


SUBSCRIPTIONS_ENABLED = False


@router.post("")
def subscribe(body: SubscribeRequest, db: Session = Depends(get_db)):
    if not SUBSCRIPTIONS_ENABLED:
        return {"status": "ok"}
    settings = get_settings()
    email = body.email.lower().strip()

    existing = db.query(Subscriber).filter(Subscriber.email == email).first()
    if existing:
        if existing.confirmed:
            # Don't leak whether someone is subscribed — return same response
            return {"status": "ok"}
        # Re-send confirmation
        confirm_url = f"{settings.email_site_url}/subscribe/confirm?token={existing.token}"
        send_email(
            to=email,
            subject="Confirm your AI Intelligence Hub subscription",
            html=confirmation_email_html(confirm_url, settings.email_site_url),
        )
        return {"status": "ok"}

    token = secrets.token_urlsafe(32)
    sub = Subscriber(email=email, token=token, confirmed=False)
    db.add(sub)
    db.commit()

    confirm_url = f"{settings.email_site_url}/subscribe/confirm?token={token}"
    sent = send_email(
        to=email,
        subject="Confirm your AI Intelligence Hub subscription",
        html=confirmation_email_html(confirm_url, settings.email_site_url),
    )

    if not sent:
        logger.warning("Could not send confirmation email to %s (key not configured)", email)

    return {"status": "ok"}


@router.get("/confirm", response_class=HTMLResponse)
def confirm(token: str, db: Session = Depends(get_db)):
    sub = db.query(Subscriber).filter(Subscriber.token == token).first()
    if not sub:
        return _page("Invalid link", "This confirmation link is invalid or has expired.", success=False)

    sub.confirmed = True
    db.commit()
    return _page("You're subscribed!", "You'll receive a daily digest on days when new verified AI news is published.")


@router.get("/unsubscribe", response_class=HTMLResponse)
def unsubscribe(token: str, db: Session = Depends(get_db)):
    sub = db.query(Subscriber).filter(Subscriber.token == token).first()
    if sub:
        db.delete(sub)
        db.commit()
    return _page("Unsubscribed", "You've been removed from the daily digest. No more emails.")


def _page(title: str, message: str, success: bool = True) -> str:
    color = "#0ea5e9" if success else "#dc2626"
    icon  = "✓" if success else "✕"
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{title} — AI Intelligence Hub</title>
  <style>
    body{{margin:0;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         display:flex;align-items:center;justify-content:center;min-height:100vh;}}
    .card{{background:#0d0e12;border:1px solid #1e2028;border-radius:16px;padding:48px 40px;
           max-width:420px;text-align:center;}}
    .icon{{width:52px;height:52px;border-radius:50%;background:{color}22;border:2px solid {color}44;
           display:flex;align-items:center;justify-content:center;margin:0 auto 20px;
           font-size:22px;color:{color};}}
    h1{{color:#e2e2e8;font-size:20px;font-weight:700;margin:0 0 10px;}}
    p{{color:#5a5a6e;font-size:14px;line-height:1.6;margin:0 0 24px;}}
    a{{display:inline-block;background:linear-gradient(135deg,#0ea5e9,#818cf8);color:#fff;
       text-decoration:none;padding:11px 24px;border-radius:10px;font-size:13px;font-weight:600;}}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">{icon}</div>
    <h1>{title}</h1>
    <p>{message}</p>
    <a href="/">Back to feed</a>
  </div>
</body>
</html>"""
