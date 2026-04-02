# Custom AI API Key Feature - Implementation Guide

## Overview

This feature allows users to provide their own AI API key (OpenRouter) when the free platform quota is exhausted. Users gain unlimited access by configuring their personal API key without sharing it with the platform.

## What Has Been Implemented

### 1. **Database Changes** ✅

**File**: [plateforme-back/migrations/versions/g6h7i8j9k0l1_add_custom_api_key_fields_to_utilisateur.py](plateforme-back/migrations/versions/g6h7i8j9k0l1_add_custom_api_key_fields_to_utilisateur.py)

**User Model Updates**: [plateforme-back/models/user.py](plateforme-back/models/user.py)

Added 4 new encrypted fields to the `utilisateur` table:
- `custom_api_key` (EncryptedString) - User's OpenRouter API key, encrypted with Fernet
- `use_custom_api_key` (Boolean) - Toggle to enable custom key
- `api_key_created_at` (DateTime) - When user added their API key
- `api_key_last_used` (DateTime) - When custom key was last used for a request

**Running Migration**:
```bash
cd plateforme-back
alembic upgrade head
```

### 2. **Backend - Schemas** ✅

**File**: [plateforme-back/schemas/api_key.py](plateforme-back/schemas/api_key.py)

Defined Pydantic schemas for request/response validation:
- `APIKeyCreateRequest` - Save/update API key
- `APIKeyStatusResponse` - Current API key status
- `APIKeyToggleRequest` - Enable/disable custom key
- `APIKeyDeleteResponse` - Delete confirmation
- `APIKeyQuotaResponse` - Usage quota information

### 3. **Backend - API Key Service** ✅

**File**: [plateforme-back/services/api_key_service.py](plateforme-back/services/api_key_service.py)

Core business logic for API key management:

**Methods**:
- `save_api_key(user_id, api_key, provider)` - Encrypt and store API key
- `get_api_key_status(user_id)` - Get current status with masked key
- `toggle_api_key(user_id, use_custom)` - Enable/disable custom key
- `delete_api_key(user_id)` - Delete and revert to platform key
- `get_api_key_quota(user_id)` - Get usage quota and limits
- `get_api_key_for_user(user_id)` - Retrieve user's API key for requests
- `update_api_key_last_used(user_id)` - Track usage

**Security Features**:
- API keys are encrypted automatically via `EncryptedString` field
- Never exposed in API responses - only masked version returned (last 4 chars)
- Users cannot access other users' keys

### 4. **Backend - REST API Endpoints** ✅

**File**: [plateforme-back/api/users.py](plateforme-back/api/users.py)

Added endpoints to manage API keys:

```
POST   /users/me/api-key              Save/update API key
GET    /users/me/api-key/status       Get API key status
PATCH  /users/me/api-key/toggle       Toggle custom key usage
DELETE /users/me/api-key              Delete API key
GET    /users/me/api-key/quota        Get quota usage
```

All endpoints require authentication and only affect the current user.

### 5. **Backend - AI Generation Service** ✅

**File**: [plateforme-back/services/ai_generation_service.py](plateforme-back/services/ai_generation_service.py)

Modified to support custom API keys:

**Changes**:
- Added `_get_api_key_for_request()` - Selects appropriate key (custom or platform)
- Updated `_run()` - Sets `current_user_id` to track user context
- Modified `_appeler_ia()` - Uses user's custom key if available
- Changed `_appeler_google()` - Accepts API key parameter instead of using global config

**Logic Flow**:
1. Retrieve generation record with user_id
2. Check if user has custom API key enabled
3. Use custom key OR fall back to platform key
4. Include authentication header with selected key in API request
5. Track last usage time for custom key

### 6. **Frontend - API Integration** ✅

**Files**:
- [plateforme-tests/src/features/profile/api-key-api.ts](plateforme-tests/src/features/profile/api-key-api.ts)

TypeScript API functions:
- `saveAPIKeyApi()` - Save new API key
- `getAPIKeyStatusApi()` - Fetch current status
- `toggleAPIKeyApi()` - Enable/disable custom key
- `deleteAPIKeyApi()` - Delete API key
- `getAPIKeyQuotaApi()` - Fetch quota information

### 7. **Frontend - Custom Hooks** ✅

**Files**:
- [plateforme-tests/src/features/profile/api-key-hooks.ts](plateforme-tests/src/features/profile/api-key-hooks.ts)

React hook for managing API key state:
- `useAPIKey()` - Main hook with all API key operations

**Features**:
- Automatic loading of API key status on mount
- Error and success message management
- Loader states for each operation
- Quota fetching

### 8. **Frontend - React Component** ✅

**Files**:
- [plateforme-tests/src/features/profile/APIKeyManagement.tsx](plateforme-tests/src/features/profile/APIKeyManagement.tsx)

Complete UI component for API key management with:
- Add/Update API key form
- Masked key display (****abcd)
- Toggle between custom and platform keys
- API usage quota bar chart
- Delete confirmation dialog
- Success/error alerts
- Quota exhaustion warnings

## Integration Steps

### Step 1: Run Database Migration

```bash
cd plateforme-back
alembic upgrade head
```

### Step 2: Update Dependencies (if needed)

The code uses existing dependencies. No new packages required.

### Step 3: Add Component to Profile Page

In your profile page component, import and use the `APIKeyManagement` component:

```tsx
import { APIKeyManagement } from "@/features/profile/APIKeyManagement";

export function ProfilePage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Other profile sections */}
      <APIKeyManagement />
    </div>
  );
}
```

### Step 4: (Optional) Add Menu Item

Add a link in the profile/settings menu to access the API key management section.

## Security Measures

✅ **Encryption**: API keys stored with Fernet (AES-128-CBC + HMAC-SHA256)

✅ **No Exposure**: Keys never appear in API responses, logs, or frontend

✅ **Masking**: Only last 4 characters visible to user (****abcd)

✅ **User Isolation**: Each user can only access/modify their own key

✅ **Validation**: Input validation on API key format

✅ **Audit Trail**: Timestamps track when key was created and last used

## Environment Variables

No additional environment variables needed. Uses existing:
- `AI_API_URL` - OpenRouter endpoint
- `AI_MODEL` - Default model name
- `AI_API_KEY` - Platform's shared API key (fallback)
- `ENCRYPTION_KEY` - For field-level encryption (already configured)

## File Structure

```
plateforme-back/
├── models/
│   └── user.py                          ✅ Updated
├── migrations/
│   └── versions/
│       └── g6h7i8j9k0l1_*.py            ✅ Created
├── schemas/
│   └── api_key.py                       ✅ Created
├── services/
│   ├── api_key_service.py               ✅ Created
│   └── ai_generation_service.py         ✅ Updated
└── api/
    └── users.py                          ✅ Updated

plateforme-tests/
└── src/
    └── features/
        └── profile/
            ├── api-key-api.ts           ✅ Created
            ├── api-key-hooks.ts         ✅ Created
            └── APIKeyManagement.tsx     ✅ Created
```

## API Quota System

**Free Quota**: 10,000 requests/month (configurable)

**Tracking**: Currently mock implementation (requires enhancement):
- TODO: Implement actual usage tracking in log_systems
- TODO: Add usage counter to track AI API calls per user

To implement full quota tracking:
1. Create `api_usage_log` table or extend `ai_logs`
2. Track each API call with timestamp and tokens used
3. Update `APIKeyService.get_api_key_quota()` to query actual usage
4. Add monthly reset logic

## Testing

### Backend Testing

Test the API endpoints:

```bash
# Save API key
curl -X POST http://localhost:8000/users/me/api-key \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"api_key": "sk-test-key-123456789", "provider": "openrouter"}'

# Get status
curl http://localhost:8000/users/me/api-key/status \
  -H "Authorization: Bearer {token}"

# Toggle API key
curl -X PATCH http://localhost:8000/users/me/api-key/toggle \
  -H "Authorization: Bearer {token}" \
  -d '{"use_custom_api_key": true}'

# Get quota
curl http://localhost:8000/users/me/api-key/quota \
  -H "Authorization: Bearer {token}"

# Delete API key
curl -X DELETE http://localhost:8000/users/me/api-key \
  -H "Authorization: Bearer {token}"
```

### Frontend Testing

1. Navigate to user profile
2. Scroll to "Clé API personnalisée" section
3. Test saving an API key
4. Verify masked display (****abcd)
5. Toggle between custom and platform keys
6. Test quota display
7. Delete and confirm

## Feature Checklist

- ✅ Database schema with encrypted API key storage
- ✅ API key service for CRUD operations
- ✅ REST endpoints for API key management
- ✅ AI service integration with custom key usage
- ✅ React UI component with full functionality
- ✅ API key masking and security
- ✅ Quota tracking (mock - needs real tracking)
- ✅ User profile integration ready
- ✅ Error handling and validation
- ✅ Success/error alerts
- ✅ Delete confirmation dialog
- ✅ Responsive design

## Future Enhancements

1. **Real Usage Tracking**
   - Implement actual API call tracking
   - Calculate tokens/credits used
   - Reset quota monthly

2. **Multiple API Key Providers**
   - Support other providers (Google, Azure, etc.)
   - Allow switching between providers

3. **API Key Management**
   - Generate temporary API keys for sharing
   - API key expiration dates
   - Usage per API key

4. **Advanced Quota Settings**
   - Custom quota limits
   - Usage alerts (80%, 100%)
   - Automatic switching between keys
   - Rate limiting per user

5. **Admin Dashboard**
   - View usage across all users
   - Monitor quota consumption
   - Billing integration

6. **Notifications**
   - Email alerts for quota exhaustion
   - Usage reports
   - Security alerts for failed auth

## Troubleshooting

### API keys not encrypting

Verify `ENCRYPTION_KEY` is set in `.env`:
```bash
python -c "from core.config import ENCRYPTION_KEY; print('OK' if ENCRYPTION_KEY else 'ERROR')"
```

### Migration fails

Check database schema:
```bash
alembic current
alembic history
```

### Custom key not being used

Verify in database:
```sql
SELECT id, nom, email, has_custom_key, use_custom_api_key FROM utilisateur WHERE id = ?;
```

### Frontend component not displaying

Check that `APIKeyManagement` is imported correctly and parent component is rendered.

## Support

For issues or questions:
1. Check backend logs for API key service errors
2. Verify database migration completed
3. Test API endpoints with curl
4. Check browser console for frontend errors
5. Verify user authentication token is valid
