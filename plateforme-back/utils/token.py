from secrets import token_urlsafe


def generate_reset_token() -> str:
    """Generate a cryptographically secure URL-safe reset token."""
    return token_urlsafe(48)
