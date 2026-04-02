# Custom API Key Feature - Quick Start

## For Users

### Adding Your API Key

1. **Go to Profile Settings**
   - Navigate to your user profile
   - Find "Clé API personnalisée" section
   - Click "Add your API key" button

2. **Enter Your API Key**
   - Paste your OpenRouter API key
   - Format: `sk-...`
   - Click "Save"

3. **Enable Your Key (Optional)**
   - After saving, you can toggle between your key and the platform key
   - Choose "My API key" to use it
   - Choose "Platform key" to use shared quota

4. **Monitor Usage**
   - See your monthly quota usage
   - Check when quota resets
   - Get alerted when quota is exhausted

### Important Security Notes

🔐 **Your API key is:**
- Encrypted before storage
- Never showed in full (only last 4 chars visible)
- Only accessible by you
- Never logged or shared

⚠️ **Never:**
- Share your API key
- Post it publicly
- Include it in screenshots

## For Developers

### Installation

1. **Apply Database Migration**
   ```bash
   cd plateforme-back
   alembic upgrade head
   ```

2. **Restart Backend**
   ```bash
   # Stop and restart FastAPI server
   python main.py
   ```

3. **Add Component to UI**
   ```tsx
   import { APIKeyManagement } from "@/features/profile/APIKeyManagement";
   
   // In your profile page:
   <APIKeyManagement />
   ```

### Testing the Feature

#### Backend (API)
```bash
# Save API key
curl -X POST http://localhost:8000/users/me/api-key \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"api_key": "sk-test123"}'

# Check status
curl http://localhost:8000/users/me/api-key/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Enable custom key
curl -X PATCH http://localhost:8000/users/me/api-key/toggle \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"use_custom_api_key": true}'
```

#### Frontend
1. Open Profile page
2. Scroll to "Clé API personnalisée"
3. Add a test API key
4. Verify it's masked (****1234)
5. Toggle between custom and platform keys
6. Delete to confirm

### Key Files

| File | Purpose |
|------|---------|
| `models/user.py` | User model with API key fields |
| `schemas/api_key.py` | Request/response schemas |
| `services/api_key_service.py` | Business logic |
| `api/users.py` | API endpoints |
| `services/ai_generation_service.py` | AI service using custom keys |
| `features/profile/APIKeyManagement.tsx` | React component |

## Architecture

```
User ↔ Frontend UI
       ↓
    React Hooks
       ↓
    API Calls
       ↓
FastAPI Endpoints (/users/me/api-key/*)
       ↓
    APIKeyService
       ↓
    Database (encrypted)
       ↓
    User's API Key (Fernet encrypted)
```

## Data Flow

### Saving an API Key

```
User Input
    ↓
React Component validates
    ↓
POST /users/me/api-key
    ↓
APIKeyService.save_api_key()
    ↓
Automatic encryption via EncryptedString
    ↓
Database storage
    ↓
Response: masked key "****abcd"
```

### Using Custom Key for AI

```
User requests AI generation
    ↓
AIGenerationService.executer_generation()
    ↓
APIKeyService.get_api_key_for_user()
    ↓
User has custom key? YES
    ↓
Use custom key (encrypted → decrypted in memory)
    ↓
Call OpenRouter API
    ↓
Update last_used timestamp
```

## Quota System (Current)

⚠️ **Currently using mock data**

To implement real quota tracking:

1. **Log Each API Call**
   ```python
   # In AIGenerationService after each API call
   api_key_svc.log_api_usage(user_id, tokens_used)
   ```

2. **Create Usage Table**
   ```sql
   CREATE TABLE api_usage (
     id INTEGER PRIMARY KEY,
     user_id INTEGER NOT NULL,
     timestamp DATETIME,
     tokens_used INTEGER,
     provider VARCHAR(50)
   );
   ```

3. **Update get_api_key_quota()**
   ```python
   def get_api_key_quota(self, user_id):
       usage = db.query(APIUsage)\
           .filter_by(user_id=user_id)\
           .filter(APIUsage.timestamp > month_start)\
           .all()
       quota_used = sum(u.tokens_used for u in usage)
       # ... calculate remaining
   ```

## Environment Setup

No new environment variables needed. Uses existing:
- `ENCRYPTION_KEY` - For API key encryption
- `AI_API_KEY` - Platform's API key (fallback)

Existing configs work as-is.

## Common Issues & Solutions

### "API key not encrypting"
**Solution**: Verify `ENCRYPTION_KEY` in `.env` is set (should be base64)
```bash
# Check encryption
python -c "from core.encryption import get_fernet; print(get_fernet())"
```

### Migration fails
**Solution**: Check PostgreSQL is running and accessible
```bash
alembic downgrade -1  # Rollback if needed
alembic upgrade head  # Re-run
```

### Custom key not being used
**Solution**: Verify toggle is set to "Use custom key"
```python
# Check in DB
SELECT use_custom_api_key FROM utilisateur WHERE id = ?;
```

### Frontend not showing component
**Solution**: Ensure import is correct and parent is rendered
```tsx
// Verify path: features/profile/APIKeyManagement.tsx
import { APIKeyManagement } from "@/features/profile/APIKeyManagement";
```

## Performance

- ✅ Lazy loading of APIKeyService
- ✅ Encrypted storage doesn't impact queries (indexed)
- ✅ No N+1 queries
- ✅ Minimal frontend bundle size

## Security Checklist

- ✅ Keys encrypted at rest (Fernet)
- ✅ Keys handled in-memory only
- ✅ Never logged raw
- ✅ User isolation enforced
- ✅ HTTPS recommended for deployment
- ✅ Input validation on API key format
- ✅ Rate limiting recommended

## Next Steps

1. **Run migration** → `alembic upgrade head`
2. **Add component** → Import in profile page
3. **Test** → curl or frontend UI
4. **Monitor** → Check logs for errors
5. **Deploy** → HTTPS only in production

## Support

See `CUSTOM_API_KEY_SETUP.md` for detailed documentation.
