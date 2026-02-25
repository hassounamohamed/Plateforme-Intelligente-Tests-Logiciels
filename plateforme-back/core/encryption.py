"""
Chiffrement transparent des données sensibles via SQLAlchemy TypeDecorator.
Utilise Fernet (AES-128-CBC + HMAC-SHA256) de la librairie cryptography.

Usage dans un modèle:
    from core.encryption import EncryptedString
    telephone = Column(EncryptedString)
"""
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import String
from sqlalchemy.types import TypeDecorator


def get_fernet() -> Fernet:
    """Instancier Fernet avec la clé chargée depuis la config."""
    from core.config import ENCRYPTION_KEY
    return Fernet(ENCRYPTION_KEY.encode())


class EncryptedString(TypeDecorator):
    """
    Type SQLAlchemy qui chiffre automatiquement les valeurs à l'écriture
    et les déchiffre à la lecture.

    - Stockage en base : token Fernet (texte base64, ~100 chars)
    - Valeurs NULL conservées NULL
    - Rétrocompatible : si la valeur en base n'est pas un token Fernet valide
      (données existantes en clair), la valeur brute est retournée plutôt
      que lever une exception.
    """
    impl = String
    cache_ok = True

    def process_bind_param(self, value: Optional[str], dialect) -> Optional[str]:
        """Chiffrer avant écriture en base."""
        if value is None:
            return None
        fernet = get_fernet()
        return fernet.encrypt(value.encode()).decode()

    def process_result_value(self, value: Optional[str], dialect) -> Optional[str]:
        """Déchiffrer après lecture depuis la base."""
        if value is None:
            return None
        try:
            fernet = get_fernet()
            return fernet.decrypt(value.encode()).decode()
        except (InvalidToken, Exception):
            # Données existantes en texte clair (avant migration)
            return value
