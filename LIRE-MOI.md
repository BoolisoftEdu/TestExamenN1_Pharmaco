# QuizPharma_Cloudflare

Version Cloudflare de votre application, questions et interface conservées.

## Mise en service
1. Installer Node.js LTS. Ouvrir le terminal dans ce dossier.
2. `npm install` puis `npx wrangler login`.
3. `npx wrangler d1 create quizpharma-cloudflare`. Copier le database_id retourné dans wrangler.jsonc à la place de REMPLACER_PAR_ID_D1. Chaque application a sa propre base.
4. `npx wrangler d1 execute quizpharma-cloudflare --remote --file=schema.sql`.
5. `npx wrangler secret put ADMIN_PASSWORD` et saisir votre mot de passe formateur (il n'est pas dans ces fichiers).
6. `npm run deploy`. Le terminal affiche votre lien workers.dev. Tester étudiant ET formateur.

Sans NETLIFY_ORIGIN, Cloudflare sert directement toute l'application : recommandé, aucun nouveau déploiement Netlify requis.

Pour donner la priorité aux fichiers Netlify, ajouter dans vars de wrangler.jsonc : `"NETLIFY_ORIGIN": "https://VOTRE-SITE.netlify.app"`, puis republier Cloudflare. Le lien à communiquer reste le lien Cloudflare. Les fichiers Netlify sont vérifiés par empreinte SHA-256; en cas d'erreur, blocage, fichier différent ou délai supérieur à 2,5 secondes, la copie Cloudflare est servie. Les réponses sont toujours traitées par Cloudflare/D1, même si les fichiers viennent de Netlify.

## Ancien lien Netlify (facultatif)
Pour que l'ancien lien utilise lui aussi D1 tant que Netlify fonctionne : remplacer netlify/functions/api.mjs dans votre dépôt Netlify par netlify-optionnel/api.mjs et définir CLOUDFLARE_ORIGIN sur votre URL Cloudflare. Cela coûte un nouveau déploiement Netlify. Si Netlify suspend complètement le site, ce lien ne peut plus rediriger : utiliser impérativement le lien Cloudflare distribué aux étudiants.

## Résultats déjà présents
La nouvelle base D1 est vide. AVANT le changement : exporter les résultats Excel/CSV depuis l'ancien espace formateur et conserver ces fichiers. Ne pas basculer pendant une tentative en cours : les sessions Netlify existantes ne sont pas transférées automatiquement et les stockages locaux des navigateurs sont propres à chaque domaine. Pour les nouvelles tentatives, distribuer uniquement le lien Cloudflare. Les anciens résultats restent dans Netlify et les exports; ils ne sont pas fusionnés avec D1 par cette version.

## Limites
Ce dispositif protège contre l'indisponibilité de Netlify, pas contre une panne/quota Cloudflare. Workers Free : 100 000 requêtes/jour pour le compte, 10 ms CPU par requête; D1 Free : 100 000 lignes écrites et 5 millions lues/jour, partagés entre applications. Une réponse peut générer plusieurs requêtes. Aucune garantie pour 200 étudiants × 240 questions le même jour. Prévoir un test et surveiller les quotas; pour une session d'examen, envisager Workers Paid.

Ne jamais déposer ADMIN_PASSWORD, .dev.vars ou des résultats nominatifs dans un dépôt public.
