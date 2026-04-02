# Custom API Key Feature - Code Examples

## Backend Usage Examples

### Integrating API Key Service in New Services

```python
from services.api_key_service import APIKeyService
from sqlalchemy.orm import Session

class MyService:
    def __init__(self, db: Session):
        self.db = db
        self.api_key_svc = APIKeyService(db)
    
    def process_with_user_api(self, user_id: int, content: str):
        # Get the appropriate API key for this user
        api_key = self.api_key_svc.get_api_key_for_user(user_id)
        
        if api_key:
            # Use user's custom key
            return self.call_api_with_key(content, api_key)
        else:
            # Fall back to platform key
            from core.config import AI_API_KEY
            return self.call_api_with_key(content, AI_API_KEY)
    
    def call_api_with_key(self, content: str, api_key: str):
        import requests
        
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={"messages": [{"role": "user", "content": content}]},
            headers=headers
        )
        return response.json()
```

### Manually Updating API Key Usage

```python
from services.api_key_service import APIKeyService
from sqlalchemy.orm import Session

def record_api_usage(db: Session, user_id: int, tokens_used: int):
    """Record API usage for quota tracking"""
    api_key_svc = APIKeyService(db)
    
    # Update last used timestamp
    api_key_svc.update_api_key_last_used(user_id)
    
    # TODO: Log actual usage for quota calculation
    # This requires implementing the actual usage tracking
```

### Using API Key in Middleware

```python
from fastapi import Request
from services.api_key_service import APIKeyService

async def api_key_middleware(request: Request, call_next):
    """Middleware to attach user's API key to request context"""
    user_id = request.user.id  # From JWT token
    
    db = request.state.db
    api_key_svc = APIKeyService(db)
    
    # Get user's preferred API key
    api_key = api_key_svc.get_api_key_for_user(user_id)
    
    # Store in request context for use in endpoints
    request.state.api_key = api_key or settings.AI_API_KEY
    request.state.uses_custom_key = bool(api_key)
    
    response = await call_next(request)
    return response
```

## API Endpoint Examples

### cURL Commands

```bash
# 1. Save API Key
curl -X POST http://localhost:8000/users/me/api-key \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "sk-or8t5...",
    "provider": "openrouter"
  }'

# Response:
# {
#   "has_custom_key": true,
#   "use_custom_api_key": false,
#   "provider": "openrouter",
#   "masked_key": "****...",
#   "api_key_created_at": "2024-03-29T15:30:00Z",
#   "api_key_last_used": null
# }

# 2. Get Current Status
curl http://localhost:8000/users/me/api-key/status \
  -H "Authorization: Bearer your_jwt_token"

# 3. Enable Custom API Key
curl -X PATCH http://localhost:8000/users/me/api-key/toggle \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "use_custom_api_key": true
  }'

# 4. Get Quota Information
curl http://localhost:8000/users/me/api-key/quota \
  -H "Authorization: Bearer your_jwt_token"

# 5. Delete API Key
curl -X DELETE http://localhost:8000/users/me/api-key \
  -H "Authorization: Bearer your_jwt_token"
```

### Python Requests Example

```python
import requests

API_BASE = "http://localhost:8000"
TOKEN = "your_jwt_token"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Save API key
response = requests.post(
    f"{API_BASE}/users/me/api-key",
    json={"api_key": "sk-or8t5...", "provider": "openrouter"},
    headers=headers
)
print(response.json())

# Get status
response = requests.get(
    f"{API_BASE}/users/me/api-key/status",
    headers=headers
)
status = response.json()
print(f"Using custom key: {status['use_custom_api_key']}")
print(f"Key: {status['masked_key']}")

# Toggle usage
response = requests.patch(
    f"{API_BASE}/users/me/api-key/toggle",
    json={"use_custom_api_key": True},
    headers=headers
)

# Get quota
response = requests.get(
    f"{API_BASE}/users/me/api-key/quota",
    headers=headers
)
quota = response.json()
print(f"Usage: {quota['quota_used']}/{quota['quota_limit_free']}")
print(f"Remaining: {quota['quota_remaining']}")
```

## Frontend Usage Examples

### Using the Component

```tsx
// In your profile page
import { APIKeyManagement } from "@/features/profile/APIKeyManagement";

export function ProfilePage() {
  return (
    <div className="max-w-3xl">
      <h1>Paramètres du profil</h1>
      
      {/* Other sections */}
      <section>
        <h2>Sécurité</h2>
        <ChangePassword />
      </section>
      
      {/* API Key Management */}
      <section>
        <APIKeyManagement />
      </section>
    </div>
  );
}
```

### Using the Hook Directly

```tsx
import { useAPIKey } from "@/features/profile/api-key-hooks";

export function CustomAPIKeyStatus() {
  const {
    apiKeyStatus,
    apiKeyQuota,
    isLoading,
    error,
    fetchAPIKeyStatus,
  } = useAPIKey();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>API Key Status</h3>
      {apiKeyStatus?.has_custom_key ? (
        <>
          <p>Custom Key: {apiKeyStatus.masked_key}</p>
          <p>Using: {apiKeyStatus.use_custom_api_key ? "Custom" : "Platform"}</p>
        </>
      ) : (
        <p>No custom API key configured</p>
      )}
      
      {apiKeyQuota && (
        <>
          <p>Quota: {apiKeyQuota.quota_used}/{apiKeyQuota.quota_limit_free}</p>
          <p>Remaining: {apiKeyQuota.quota_remaining}</p>
        </>
      )}
      
      <button onClick={fetchAPIKeyStatus}>Refresh</button>
    </div>
  );
}
```

### Using API Functions Directly

```tsx
import { 
  saveAPIKeyApi, 
  getAPIKeyStatusApi,
  toggleAPIKeyApi,
  deleteAPIKeyApi,
  getAPIKeyQuotaApi 
} from "@/features/profile/api-key-api";

async function manageAPIKey() {
  try {
    // Save a key
    const saveResult = await saveAPIKeyApi({
      api_key: "sk-...",
      provider: "openrouter"
    });
    console.log("Key saved:", saveResult.masked_key);
    
    // Get status
    const status = await getAPIKeyStatusApi();
    console.log("Using custom key:", status.use_custom_api_key);
    
    // Toggle
    await toggleAPIKeyApi(true);
    console.log("Switched to custom key");
    
    // Check quota
    const quota = await getAPIKeyQuotaApi();
    console.log(`Used: ${quota.quota_used}/${quota.quota_limit_free}`);
    
    // Delete
    await deleteAPIKeyApi();
    console.log("Key deleted");
    
  } catch (error) {
    console.error("API error:", error);
  }
}
```

## Database Query Examples

### Check User's API Key Status

```sql
-- View API key configuration for a user
SELECT 
  id,
  nom,
  email,
  custom_api_key IS NOT NULL as has_custom_key,
  use_custom_api_key,
  api_key_created_at,
  api_key_last_used
FROM utilisateur
WHERE id = ?;

-- Note: custom_api_key will show encrypted value if selected
-- It's encrypted as Fernet token (base64 string)
```

### Find All Users with Custom Keys

```sql
-- Find users who have added custom keys
SELECT 
  id,
  nom,
  email,
  use_custom_api_key,
  api_key_created_at,
  api_key_last_used
FROM utilisateur
WHERE custom_api_key IS NOT NULL
ORDER BY api_key_created_at DESC;
```

### Check Recent Activity

```sql
-- Find users who recently used custom keys
SELECT 
  id,
  nom,
  email,
  api_key_last_used,
  NOW() - api_key_last_used as time_since_usage
FROM utilisateur
WHERE custom_api_key IS NOT NULL 
  AND api_key_last_used IS NOT NULL
  AND api_key_last_used > NOW() - INTERVAL '7 days'
ORDER BY api_key_last_used DESC;
```

## Testing Examples

### Pytest for Backend

```python
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

@pytest.fixture
def auth_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}

def test_save_api_key(auth_headers):
    response = client.post(
        "/users/me/api-key",
        headers=auth_headers,
        json={"api_key": "sk-test123456789", "provider": "openrouter"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["has_custom_key"] is True
    assert data["use_custom_api_key"] is False
    assert "****" in data["masked_key"]
    assert data["api_key"] not in str(data)  # Never exposed

def test_toggle_api_key(auth_headers):
    # First save a key
    client.post(
        "/users/me/api-key",
        headers=auth_headers,
        json={"api_key": "sk-test123456789"}
    )
    
    # Toggle it
    response = client.patch(
        "/users/me/api-key/toggle",
        headers=auth_headers,
        json={"use_custom_api_key": True}
    )
    
    assert response.status_code == 200
    assert response.json()["use_custom_api_key"] is True

def test_delete_api_key(auth_headers):
    # First save a key
    client.post(
        "/users/me/api-key",
        headers=auth_headers,
        json={"api_key": "sk-test123456789"}
    )
    
    # Delete it
    response = client.delete(
        "/users/me/api-key",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    
    # Verify it's gone
    response = client.get(
        "/users/me/api-key/status",
        headers=auth_headers
    )
    assert response.json()["has_custom_key"] is False
```

### React Testing Library Example

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { APIKeyManagement } from "@/features/profile/APIKeyManagement";

describe("APIKeyManagement", () => {
  test("saves API key", async () => {
    render(<APIKeyManagement />);
    
    const input = screen.getByPlaceholderText(/clé API/i);
    const button = screen.getByRole("button", { name: /sauvegarder/i });
    
    fireEvent.change(input, { target: { value: "sk-test123456789" } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/clé API sauvegardée/i)).toBeInTheDocument();
    });
  });

  test("toggles API key usage", async () => {
    render(<APIKeyManagement />);
    
    const customKeyButton = screen.getByRole("button", { name: /ma clé api/i });
    fireEvent.click(customKeyButton);
    
    await waitFor(() => {
      expect(screen.getByText(/utilisation de votre clé/i)).toBeInTheDocument();
    });
  });
});
```

## Environment Configuration Examples

### .env File

```bash
# Existing configuration
DATABASE_URL=postgresql://user:password@localhost/db
SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-base64-encryption-key
AI_API_KEY=sk-platform-key-here
AI_MODEL=google/gemma-3-12b-it
AI_API_URL=https://openrouter.ai/api/v1/chat/completions

# API Key feature uses these existing variables
# No additional configuration needed
```

### Docker Environment

```yaml
services:
  backend:
    environment:
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - AI_API_KEY=${AI_API_KEY}
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/pilt
```

## Error Handling Examples

### Backend

```python
from fastapi import HTTPException
from services.api_key_service import APIKeyService

@router.post("/users/me/api-key")
async def save_api_key(request: APIKeyCreateRequest, user_id: int):
    try:
        service = APIKeyService(db)
        return service.save_api_key(user_id, request.api_key)
    except ValueError as e:
        # Invalid input
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Server error
        logger.exception("Failed to save API key")
        raise HTTPException(status_code=500, detail="Failed to save API key")
```

### Frontend

```tsx
const { error, clearError, saveAPIKey } = useAPIKey();

const handleSave = async () => {
  const success = await saveAPIKey(apiKey);
  
  if (!success) {
    // Error is now available in error state
    if (error.includes("minimum")) {
      showValidationError("Key too short");
    } else {
      showGeneralError(error);
    }
  }
};

// Clear error on click
<button onClick={clearError}>Dismiss</button>
```

These examples demonstrate all major use cases of the API key feature across different parts of the application.
