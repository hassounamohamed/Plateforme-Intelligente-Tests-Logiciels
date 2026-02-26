from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    nom: str = Field(..., min_length=1, description="Nom complet de l'utilisateur")
    email: EmailStr = Field(..., description="Adresse email de l'utilisateur")
    motDePasse: str = Field(..., min_length=8, description="Mot de passe (min 8 caractères)")
    telephone: str | None = Field(None, description="Numéro de téléphone (optionnel)")
    role_id: int = Field(default=2, ge=1, le=5, description="ID du rôle (1=SUPER_ADMIN, 2=DEVELOPPEUR, 3=TESTEUR_QA, 4=PRODUCT_OWNER, 5=SCRUM_MASTER)")
