# 🚀 Guide de Déploiement - EVKR2

## 📋 Variables d'Environnement Requises

Pour déployer votre application en production, vous devez configurer les variables d'environnement suivantes :

### 1. Configuration de l'Authentification

```bash
# Hash SHA-256 du mot de passe (actuellement "EVKR2025")
AUTH_PASSWORD_HASH=8c1e113c8dba17ac97e13da6c0c88dc850659b5e1879d79a07a686db06ee66c1

# User ID pour charger vos données personnelles
PREMIUM_USER_ID=user_1765360632102_j8nnt1x8x
```

### 2. Configuration de l'API News

```bash
# Clé API GNews (déjà configurée)
GNEWS_API_KEY=votre_cle_api_gnews
```

### 3. Optionnel - Rate Limiting

```bash
RATE_LIMIT_ENABLED=true
```

---

## 🔐 Changer le Mot de Passe

Si vous souhaitez utiliser un mot de passe différent de "EVKR2025" :

### Option 1 : Avec Node.js

```bash
node -e "const crypto = require('crypto'); console.log(crypto.createHash('sha256').update('VOTRE_NOUVEAU_MOT_DE_PASSE').digest('hex'))"
```

### Option 2 : Avec OpenSSL

```bash
echo -n "VOTRE_NOUVEAU_MOT_DE_PASSE" | openssl dgst -sha256
```

Copiez ensuite le hash généré dans la variable `AUTH_PASSWORD_HASH`.

---

## 📦 Déploiement sur différentes plateformes

### Vercel

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez les variables suivantes :
   - `AUTH_PASSWORD_HASH`
   - `PREMIUM_USER_ID`
   - `GNEWS_API_KEY`

### Netlify

1. Allez dans **Site settings** → **Build & deploy** → **Environment**
2. Ajoutez les mêmes variables

### Autres plateformes

Consultez la documentation de votre hébergeur pour savoir comment configurer les variables d'environnement.

---

## 🔄 Chargement des Données

Le système fonctionne de la manière suivante :

1. **Sans authentification** : Les données de [user-default.json](data/user-default.json) sont chargées (maintenant avec vos données réelles)
2. **Avec authentification** : Un cookie `userId` est défini avec `PREMIUM_USER_ID`, chargeant automatiquement vos données depuis [user-user_1765360632102_j8nnt1x8x.json](data/user-user_1765360632102_j8nnt1x8x.json)

---

## 🛡️ Améliorations de Sécurité Appliquées

### ✅ Ce qui a été fait :

1. **Mot de passe hashé** : Le mot de passe n'est plus en clair dans le code
2. **Validation côté serveur** : L'authentification se fait maintenant via l'API `/api/auth`
3. **Cookies sécurisés** : 
   - `httpOnly: true` (protection contre XSS)
   - `secure: true` en production (HTTPS uniquement)
   - `sameSite: 'strict'` (protection CSRF)
4. **Rate limiting** : Maximum 5 tentatives de connexion par minute par IP
5. **Protection CSRF** : En-têtes de sécurité configurés

### 🔍 Recommandations supplémentaires :

- **Changez le mot de passe** en production pour quelque chose de plus complexe
- **Activez HTTPS** sur votre hébergement (généralement automatique)
- **Surveillez les logs** pour détecter les tentatives d'intrusion
- **Mettez à jour régulièrement** les dépendances npm

---

## 🧪 Tester en Local

1. Assurez-vous que le fichier [.env](.env) contient les bonnes variables
2. Lancez l'application :

```bash
npm run dev
```

3. Testez l'authentification avec le mot de passe "EVKR2025"
4. Vérifiez que vos données (355 XP, objectifs, etc.) sont bien chargées

---

## 📝 Notes Importantes

- Les fichiers `.env` ne sont **JAMAIS** versionnés dans Git
- Gardez une copie sécurisée de vos variables d'environnement
- En cas de fuite du mot de passe, régénérez immédiatement un nouveau hash
- Les données utilisateur sont stockées dans le dossier `data/` qui doit être persistant

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez que toutes les variables d'environnement sont configurées
2. Consultez les logs de votre hébergeur
3. Testez en local pour isoler le problème
