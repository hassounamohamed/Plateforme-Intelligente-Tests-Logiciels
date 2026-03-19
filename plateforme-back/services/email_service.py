import logging
import smtplib
from email.message import EmailMessage

from core.config import SMTP_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USE_TLS, SMTP_USER

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, body: str, html_body: str | None = None) -> None:
	"""Send a generic email via SMTP using environment-based configuration."""
	if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD or not SMTP_FROM:
		raise RuntimeError(
			"SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM."
		)

	msg = EmailMessage()
	msg["Subject"] = subject
	msg["From"] = SMTP_FROM
	msg["To"] = to_email
	msg.set_content(body)

	if html_body:
		msg.add_alternative(html_body, subtype="html")

	try:
		with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
			if SMTP_USE_TLS:
				server.starttls()
			server.login(SMTP_USER, SMTP_PASSWORD)
			server.send_message(msg)
	except smtplib.SMTPAuthenticationError as exc:
		logger.exception("SMTP authentication failed for user %s", SMTP_USER)
		raise RuntimeError(
			"SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD. "
			"For Gmail, use a Google App Password (2-Step Verification required)."
		) from exc
	except (smtplib.SMTPException, OSError) as exc:
		logger.exception("SMTP transport failed")
		raise RuntimeError(
			"Failed to connect/send through SMTP. Check SMTP_HOST, SMTP_PORT, SMTP_USE_TLS and network access."
		) from exc


def send_reset_email(to_email: str, reset_link: str) -> None:
	"""Send password reset email via SMTP with HTML and plaintext versions."""
	text_body = (
		"You requested a password reset.\n"
		f"Use this link (valid for 15 minutes): {reset_link}\n"
		"If you did not request this, you can ignore this email."
	)

	html_body = f"""
	<html>
	  <body style=\"font-family: Arial, sans-serif; color: #111827;\">
		<div style=\"max-width: 600px; margin: 0 auto; padding: 16px;\">
		  <h2 style=\"margin-bottom: 12px;\">Password Reset</h2>
		  <p style=\"margin-bottom: 16px;\">You requested a password reset for your account.</p>
		  <p style=\"margin-bottom: 20px;\">
			<a href=\"{reset_link}\" style=\"background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; display: inline-block;\">
			  Reset Password
			</a>
		  </p>
		  <p style=\"margin-bottom: 10px; font-size: 14px;\">Or copy and paste this link into your browser:</p>
		  <p style=\"word-break: break-all; font-size: 14px; color: #2563eb;\">{reset_link}</p>
		  <p style=\"margin-top: 16px; font-size: 13px; color: #6b7280;\">This link expires in 15 minutes.</p>
		  <p style=\"font-size: 13px; color: #6b7280;\">If you did not request this reset, ignore this email.</p>
		</div>
	  </body>
	</html>
	"""

	send_email(
		to_email=to_email,
		subject="Password Reset",
		body=text_body,
		html_body=html_body,
	)

	logger.info("Password reset email sent to %s", to_email)
