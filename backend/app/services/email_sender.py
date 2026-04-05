"""Email sending via Resend API."""
import logging
import resend
from app.config import get_settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html: str) -> bool:
    settings = get_settings()
    if not settings.resend_api_key or settings.resend_api_key.startswith("re_your"):
        logger.warning("RESEND_API_KEY not configured — email not sent to %s", to)
        return False

    resend.api_key = settings.resend_api_key
    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


def confirmation_email_html(confirm_url: str, site_url: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <div style="background:#0d0e12;border:1px solid #1e2028;border-radius:16px;overflow:hidden;">
      <div style="height:3px;background:linear-gradient(90deg,#0ea5e9,#818cf8);"></div>
      <div style="padding:40px 36px;">
        <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:28px;">
          <div style="width:28px;height:28px;background:linear-gradient(135deg,#0ea5e9,#818cf8);border-radius:8px;display:flex;align-items:center;justify-content:center;">
            <span style="color:white;font-size:14px;">⚡</span>
          </div>
          <span style="color:#e2e2e8;font-size:14px;font-weight:600;">AI Intelligence Hub</span>
        </div>
        <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px;line-height:1.3;">
          Confirm your daily digest
        </h1>
        <p style="color:#5a5a6e;font-size:14px;line-height:1.6;margin:0 0 28px;">
          You'll receive one email per day — only on days when verified AI news is published.
          No news that day? No email.
        </p>
        <a href="{confirm_url}"
           style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#818cf8);color:#ffffff;
                  text-decoration:none;padding:13px 28px;border-radius:10px;font-size:14px;font-weight:600;">
          Confirm subscription →
        </a>
        <p style="color:#3a3a4e;font-size:12px;margin:28px 0 0;line-height:1.5;">
          If you didn't sign up, ignore this email. This link expires in 48 hours.
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""


def digest_email_html(date_label: str, articles: list[dict], site_url: str, unsub_url: str) -> str:
    def article_card(a: dict) -> str:
        cat_colors = {
            "models": "#7c3aed", "research": "#2563eb", "tools": "#059669",
            "business": "#d97706", "policy": "#dc2626", "other": "#0ea5e9",
        }
        accent = cat_colors.get(a.get("category") or "other", "#0ea5e9")
        article_url = f"{site_url}/article/{a['slug']}"
        return f"""
        <div style="background:#0d0e12;border:1px solid #1e2028;border-radius:12px;
                    overflow:hidden;margin-bottom:12px;">
          <div style="height:2px;background:{accent};opacity:0.7;"></div>
          <div style="padding:18px 20px;">
            <div style="margin-bottom:8px;">
              <span style="background:{accent}22;border:1px solid {accent}44;color:{accent};
                           font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;
                           text-transform:uppercase;letter-spacing:0.05em;">
                {(a.get('category') or 'other').upper()}
              </span>
              {('<span style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2);'
                'color:#7dd3fc;font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;margin-left:6px;">'
                '● Primary</span>') if a.get('source', {}).get('trust_tier') == 'primary' else ''}
            </div>
            <h3 style="color:#e2e2e8;font-size:15px;font-weight:600;margin:0 0 8px;line-height:1.4;">
              {a['title']}
            </h3>
            {f'<p style="color:#5a5a6e;font-size:13px;line-height:1.55;margin:0 0 14px;">{a["tl_dr"]}</p>' if a.get('tl_dr') else ''}
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="color:#3a3a4e;font-size:12px;">{a.get('source', {}).get('name', '')}</span>
              <a href="{article_url}" style="color:{accent};font-size:12px;font-weight:600;text-decoration:none;">
                Read more →
              </a>
            </div>
          </div>
        </div>"""

    cards_html = "".join(article_card(a) for a in articles)
    count = len(articles)

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;padding:0 20px;">
    <div style="background:#0d0e12;border:1px solid #1e2028;border-radius:16px;overflow:hidden;">
      <div style="height:3px;background:linear-gradient(90deg,#0ea5e9,#818cf8);"></div>
      <div style="padding:36px;">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:28px;height:28px;background:linear-gradient(135deg,#0ea5e9,#818cf8);
                        border-radius:8px;text-align:center;line-height:28px;font-size:14px;">⚡</div>
            <span style="color:#e2e2e8;font-size:14px;font-weight:600;">AI Intelligence Hub</span>
          </div>
          <span style="color:#3a3a4e;font-size:12px;">{date_label}</span>
        </div>

        <!-- Title -->
        <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 6px;">
          Your Daily AI Digest
        </h1>
        <p style="color:#5a5a6e;font-size:13px;margin:0 0 28px;">
          {count} verified article{'s' if count != 1 else ''} published today
        </p>

        <!-- Articles -->
        {cards_html}

        <!-- CTA -->
        <div style="text-align:center;margin-top:28px;">
          <a href="{site_url}"
             style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#818cf8);
                    color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;
                    font-size:14px;font-weight:600;">
            View all articles →
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #1e2028;margin-top:32px;padding-top:20px;text-align:center;">
          <p style="color:#3a3a4e;font-size:11px;margin:0;line-height:1.6;">
            You're receiving this because you subscribed to AI Intelligence Hub daily digest.<br>
            <a href="{unsub_url}" style="color:#3a3a4e;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""
