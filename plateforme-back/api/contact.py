from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from services.email_service import send_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.post("/")
def send_contact_message(request: ContactRequest):
    try:
        subject = f"Nouveau message de contact de {request.name}"
        text_body = f"Nom: {request.name}\nEmail: {request.email}\n\nMessage:\n{request.message}"
        
        # Send to the contact email. Use the sender's name as the visible From
        # and set Reply-To so replies go directly to the user who submitted
        # the contact form.
        send_email(
            to_email="contact@flowpilot.tn",
            subject=subject,
            body=text_body,
            display_name=request.name,
            reply_to=request.email,
        )
        return {"message": "Message sent successfully"}
    except Exception as e:
        logger.exception("Failed to send contact message")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erreur lors de l'envoi du message")
