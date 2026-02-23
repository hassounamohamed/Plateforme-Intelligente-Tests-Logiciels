from pydantic import BaseModel


class CreateUserRequest(BaseModel):
    nom: str
    email: str
    motDePasse: str
    telephone: str | None = None
    role_id: int | None = None   # role optionnel
