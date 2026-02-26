# 🧪 Guide de Test - Authentification et Redirections

## ✅ Configuration vérifiée

### Backend (port 8000)
- ✅ 5 rôles créés avec les bons codes:
  - `SUPER_ADMIN` → /dashboard/super-admin
  - `PRODUCT_OWNER` → /dashboard/product-owner
  - `SCRUM_MASTER` → /dashboard/scrum-master
  - `TESTEUR_QA` → /dashboard/qa
  - `DEVELOPPEUR` → /dashboard/developer

### Frontend (port 3000)
- ✅ Codes de rôles synchronisés avec le backend
- ✅ Redirections configurées par rôle
- ✅ Middleware protège toutes les routes /dashboard/*

## 🧪 Test de Connexion Super Admin

### 1. Démarrer le frontend
```bash
cd plateforme-tests
npm run dev
```

### 2. Se connecter
1. Ouvrir http://localhost:3000/auth/login
2. Utiliser les identifiants:
   - **Email**: `admin@example.com`
   - **Mot de passe**: `admin123`
3. Cliquer sur "Sign in"

### 3. Vérification
Vous devriez être **automatiquement redirigé** vers:
```
http://localhost:3000/dashboard/super-admin
```

## 🔍 Vérification dans la Console

Ouvrez la console du navigateur (F12) et vérifiez:

### Logs de connexion:
```
[Login] Attempting login with: { username: 'admin@example.com' }
[Login] Response received: {
  access_token: "eyJ...",
  token_type: "bearer",
  user_id: 1,
  nom: "Super Admin",
  email: "admin@example.com",
  role: {
    id: 1,
    nom: "Super Administrateur",
    code: "SUPER_ADMIN",
    niveau_acces: 100
  }
}
[Login] Redirecting to: /dashboard/super-admin
```

### Vérification du token dans localStorage:
```javascript
// Dans la console du navigateur
localStorage.getItem('access_token')
// Devrait retourner le JWT token
```

### Vérification des cookies:
```javascript
// Dans la console du navigateur
document.cookie
// Devrait contenir: access_token=eyJ...
```

## 🧪 Test des Autres Rôles

### Créer des utilisateurs de test

Vous pouvez créer d'autres utilisateurs via l'API:

```bash
# Pour créer un développeur
curl -X POST http://127.0.0.1:8000/auth/sign_up \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "John Developer",
    "email": "dev@example.com",
    "motDePasse": "dev123",
    "role_id": 5
  }'

# Pour créer un testeur QA
curl -X POST http://127.0.0.1:8000/auth/sign_up \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Jane QA",
    "email": "qa@example.com",
    "motDePasse": "qa123",
    "role_id": 4
  }'
```

### IDs des rôles:
- 1 = SUPER_ADMIN
- 2 = PRODUCT_OWNER
- 3 = SCRUM_MASTER
- 4 = TESTEUR_QA
- 5 = DEVELOPPEUR

## 🔒 Test du Middleware de Protection

### Test 1: Accès non authentifié
1. Ouvrir une fenêtre de navigation privée
2. Aller sur http://localhost:3000/dashboard/super-admin
3. **Résultat attendu**: Redirection vers /auth/login

### Test 2: Accès avec un autre rôle
1. Se connecter en tant que développeur
2. Essayer d'accéder à /dashboard/super-admin
3. **Résultat attendu**: Redirection vers /dashboard (puis vers /dashboard/developer)

## 🐛 Dépannage

### Problème: Pas de redirection après login
**Solution**: Vérifiez dans la console:
```javascript
// Le rôle est-il retourné ?
// Le code du rôle correspond-il ?
```

### Problème: Token non trouvé
**Solution**: Vérifiez:
```javascript
localStorage.getItem('access_token')
document.cookie
```

### Problème: Erreur 401 sur /auth/me
**Solution**: Le token est peut-être expiré. Reconnectez-vous.

## 📝 Notes Importantes

1. **Synchronisation des codes**: Les codes de rôles doivent être **exactement identiques** entre backend et frontend
2. **JWT dans cookies ET localStorage**: Nécessaire pour le middleware Next.js ET axios
3. **Redirection double**: 
   - 1ère redirection: Dans `useLogin` après login
   - 2ème redirection: Dans `/dashboard/page.tsx` si accès direct
4. **Protection middleware**: Active uniquement sur `/dashboard/*` (voir matcher dans middleware.ts)

## ✅ Checklist de Test Complet

- [ ] Backend tourne sur port 8000
- [ ] Frontend tourne sur port 3000
- [ ] Connexion Super Admin réussie
- [ ] Redirection automatique vers /dashboard/super-admin
- [ ] Token présent dans localStorage
- [ ] Token présent dans les cookies
- [ ] Dashboard Super Admin s'affiche correctement
- [ ] Bouton logout fonctionne
- [ ] Accès direct à /dashboard redirige bien selon le rôle
- [ ] Accès non authentifié redirige vers /auth/login
