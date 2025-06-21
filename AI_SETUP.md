# Configuration de l'API AI

### 1. Obtenir une clé API Google AI

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée

### 2. Configurer la variable d'environnement

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Google AI API Key for Genkit
GOOGLE_GENAI_API_KEY=votre_clé_api_ici

# Firebase Configuration (si pas déjà configuré)
NEXT_PUBLIC_FIREBASE_API_KEY=votre_firebase_api_key_ici
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_firebase_auth_domain_ici
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_firebase_project_id_ici
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_firebase_storage_bucket_ici
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_firebase_messaging_sender_id_ici
NEXT_PUBLIC_FIREBASE_APP_ID=votre_firebase_app_id_ici
```

### 3. Redémarrer le serveur

Après avoir ajouté la variable d'environnement, redémarrez le serveur de développement :

```bash
npm run dev
```

### 4. Tester l'API

Une fois configuré, vous pouvez tester l'API en :

1. Allant sur la page de détail d'un contact
2. Cliquant sur "Recalculate Score" ou "Generate Sales Strategy"
3. Vérifiant que les actions AI fonctionnent correctement

## Fichiers corrigés

Les fichiers suivants ont été corrigés pour fonctionner sans dépendances externes :

- `src/ai/flows/score-lead.ts` - Scoring des leads
- `src/ai/flows/generate-sales-strategy.ts` - Génération de stratégie de vente
- `src/ai/ai-instance.ts` - Configuration de l'instance AI

## Fonctionnalités AI disponibles

1. **Recalcul de score** : Analyse l'engagement, les échanges, l'historique et autres critères pour attribuer un score de 0 à 100
2. **Génération de stratégie** : Crée des séquences d'emails, des actions de suivi et des priorités basées sur le résumé des interactions

## Dépannage

Si l'API ne fonctionne toujours pas :

1. Vérifiez que la clé API est correcte
2. Assurez-vous que le fichier `.env.local` est à la racine du projet
3. Redémarrez le serveur après avoir modifié les variables d'environnement
4. Vérifiez les logs de la console pour les erreurs
