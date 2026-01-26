# Guide de Sécurité - Application Nuxt

## 🔒 Mesures de Sécurité Implémentées

### 1. **Sécurité des Headers HTTP**
- ✅ `X-Frame-Options: DENY` - Protection contre clickjacking
- ✅ `X-Content-Type-Options: nosniff` - Prévention du MIME sniffing
- ✅ `X-XSS-Protection` - Protection XSS
- ✅ `Strict-Transport-Security` - Force HTTPS en production
- ✅ `Content-Security-Policy` - Politique de sécurité du contenu
- ✅ `Referrer-Policy` - Contrôle des informations de référence
- ✅ `Permissions-Policy` - Restriction des APIs du navigateur

### 2. **Protection Contre les Injections**
- ✅ Validation et sanitization de toutes les entrées utilisateur
- ✅ Protection contre les path traversal (validation des userId)
- ✅ Sanitization des noms de fichiers
- ✅ Validation des paramètres API (région, langue, symboles boursiers)
- ✅ Limites de taille sur les entrées

### 3. **Rate Limiting**
- ✅ 30 requêtes/minute pour les APIs de lecture (news, user-data GET, stock-price)
- ✅ 20 requêtes/minute pour les APIs d'écriture (user-data POST, translate)
- ✅ Rate limiting par IP
- ✅ Headers de rate limit dans les réponses

### 4. **Gestion des Cookies Sécurisée**
- ✅ `httpOnly: true` - Non accessible via JavaScript
- ✅ `secure: true` en production - Transmission uniquement via HTTPS
- ✅ `sameSite: 'strict'` - Protection CSRF
- ✅ Expiration appropriée (24h pour auth, 1 an pour userId)

### 5. **Authentification Renforcée**
- ✅ Hash des codes d'accès avec SHA-256
- ✅ Comparaison timing-safe pour prévenir les attaques par timing
- ✅ Middleware d'authentification sur les routes protégées
- ✅ Variables d'environnement pour les secrets

### 6. **Validation des Données**
- ✅ Validation stricte des types de données
- ✅ Limites de taille (XP max, nombre de quests/objectives)
- ✅ Validation des formats (email, userId, symboles boursiers)
- ✅ Whitelist pour les valeurs acceptées (langues, régions)

### 7. **Gestion des API Keys**
- ✅ API keys stockées dans variables d'environnement
- ✅ Validation de la présence et du format des API keys
- ✅ Pas de valeurs par défaut exposées
- ✅ Timeouts sur les requêtes externes

### 8. **Cache et Performance**
- ✅ Cache pour les traductions (24h)
- ✅ Nettoyage automatique des caches obsolètes
- ✅ Limite de taille des caches

## 🚀 Configuration Requise

### Variables d'Environnement
Créez un fichier `.env` à la racine du projet :

```env
# API Key pour GNews
GNEWS_API_KEY=votre_clé_api_gnews

# Secret d'authentification (générez une chaîne aléatoire)
AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Code d'accès pour protéger les pages
ACCESS_CODE=votre_code_secret_fort

# Environnement
NODE_ENV=production
```

## 📋 Checklist de Déploiement

### Avant le Déploiement
- [ ] Configurer toutes les variables d'environnement
- [ ] Générer un `AUTH_SECRET` fort
- [ ] Définir un `ACCESS_CODE` robuste
- [ ] Vérifier que `NODE_ENV=production`
- [ ] S'assurer que le dossier `data/` n'est pas versionné
- [ ] Exécuter `npm audit` pour vérifier les vulnérabilités

### Configuration Serveur
- [ ] Activer HTTPS (certificat SSL/TLS)
- [ ] Configurer un reverse proxy (Nginx/Apache)
- [ ] Activer les logs de sécurité
- [ ] Configurer un firewall
- [ ] Limiter les permissions des fichiers (chmod 644 pour les fichiers, 755 pour les dossiers)
- [ ] Créer un utilisateur dédié pour l'application (non-root)

### Monitoring
- [ ] Configurer des alertes pour les erreurs 429 (rate limit)
- [ ] Monitorer les tentatives de path traversal
- [ ] Surveiller les échecs d'authentification
- [ ] Logger les requêtes suspectes

## 🔍 Tests de Sécurité Recommandés

```bash
# Audit des dépendances npm
npm audit

# Fix automatique des vulnérabilités
npm audit fix

# Scanner OWASP ZAP (après déploiement)
# https://www.zaproxy.org/

# Test des headers de sécurité
# https://securityheaders.com/
```

## 🛡️ Bonnes Pratiques Continues

1. **Mettre à jour régulièrement** les dépendances npm
2. **Exécuter `npm audit`** avant chaque déploiement
3. **Surveiller les logs** pour détecter les comportements suspects
4. **Faire des backups réguliers** du dossier `data/`
5. **Tester l'authentification** après chaque modification
6. **Vérifier les rate limits** en cas de trafic élevé
7. **Renouveler les secrets** périodiquement

## ⚠️ Limitations Connues

- Le rate limiting est en mémoire (perdu au redémarrage)
  - **Solution** : Utiliser Redis pour un rate limiting persistant
- L'authentification est basique
  - **Solution** : Implémenter OAuth2/JWT pour une auth plus robuste
- Pas de 2FA
  - **Solution** : Ajouter TOTP ou SMS pour une couche supplémentaire

## 🆘 Support

En cas de problème de sécurité :
1. Désactiver immédiatement l'application
2. Vérifier les logs pour identifier la vulnérabilité
3. Mettre à jour les secrets compromis
4. Patcher la vulnérabilité
5. Redéployer l'application

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Nuxt Security Best Practices](https://nuxt.com/docs/guide/going-further/security)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
