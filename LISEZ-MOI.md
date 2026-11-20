# État des Lieux IA — evim immobilier · By NSimo (v2)

Application d'états des lieux d'entrée et de sortie pour les agents, avec :

- un compte par agent (email et mot de passe), créé uniquement avec une **clé d'invitation** donnée par l'administrateur ;
- des données synchronisées en ligne entre le téléphone (APK Android) et le PC (navigateur) ;
- l'analyse des photos par Gemini, la comparaison entrée/sortie, les signatures et le PDF.

**Qui voit quoi :** chaque agent voit uniquement ses états des lieux. L'administrateur voit tout, gère l'équipe (activer ou désactiver un agent) et crée les clés d'invitation.

Tant que Firebase n'est pas configuré, l'appli tourne en **mode démo** : tout reste sur l'appareil, et le premier compte créé devient administrateur. Ça permet de tester tout de suite.

---

## Étape 1 : créer le serveur Firebase (gratuit, environ 10 minutes)

1. Va sur https://console.firebase.google.com avec ton compte Google, clique sur **Créer un projet**, nomme-le `evim-edl` (Google Analytics n'est pas utile).
2. **Authentication** : ouvre **Commencer → Email/Mot de passe**, active-le puis clique sur **Enregistrer**.
3. **Firestore Database** : clique sur **Créer une base de données**, choisis l'emplacement `europe-west` puis le **mode production**.
4. Toujours dans Firestore, ouvre l'onglet **Règles**. Colle le contenu du fichier `firestore.rules`, remplace `TON_EMAIL@exemple.com` par ton adresse, puis clique sur **Publier**.
5. Va dans **Paramètres du projet (⚙) → Vos applications → icône Web `</>`**. Donne un nom, puis copie le bloc `firebaseConfig`.
6. Ouvre `www/firebase-config.js` et remplace les `A_REMPLIR` par les valeurs copiées. Remplace aussi `TON_EMAIL@exemple.com` par **la même adresse** qu'à l'étape 4.

Pas besoin de carte bancaire : les photos sont compressées et stockées dans Firestore, ce qui ne demande pas l'offre payante « Storage ».

## Étape 2 : créer ton compte administrateur

Ouvre l'appli, va dans **Créer un compte** et inscris-toi avec ton adresse administrateur, en laissant la clé vide.

Ensuite :

- dans **Mon compte**, colle la clé Gemini de l'agence (créée sur aistudio.google.com → « Get API key »). Elle sera utilisée par tous les agents ;
- dans **Équipe**, appuie sur **Générer** pour obtenir une clé `EVIM-XXXX-XXXX`, puis envoie-la à l'agent. Chaque clé ne sert qu'une seule fois.

## Étape 3 : APK Android et version PC avec GitHub

1. Crée un compte sur https://github.com, puis un dépôt nommé `evim-edl`.
   - Mets-le en **Public** si tu veux la version PC gratuite (GitHub Pages). Le dépôt ne contient aucun mot de passe : la sécurité passe par les règles Firebase.
2. Ajoute tous les fichiers du dossier avec **uploading an existing file**.
3. Crée le fichier `.github/workflows/build-apk.yml` (**Add file → Create new file**) et colles-y le contenu de `build-apk.yml`.
4. Dans **Settings → Pages**, choisis **Source : GitHub Actions**.
5. Dans l'onglet **Actions**, attends que tout soit vert (environ 5 minutes). Tu obtiens alors :
   - **l'APK** : clique sur la compilation, puis télécharge **EtatDesLieuxIA-apk** ;
   - **la version PC** : `https://TON-PSEUDO.github.io/evim-edl/`, à ouvrir dans Chrome ou Edge sur n'importe quel PC, avec le même compte que sur le téléphone.

Chaque modification envoyée sur GitHub refabrique l'APK et met à jour le site.

En mode démo, **Ouvrir sur PC.bat** lance l'appli en local sur le PC, sans synchronisation.

## Fichiers

- `www/` : l'application
  - `app.js` : les écrans
  - `backend.js` : les comptes et la synchronisation
  - `gemini.js` : l'IA
  - `pdf.js` : le rapport PDF
- `www/firebase-config.js` : à remplir (étape 1)
- `firestore.rules` : les règles de sécurité du serveur
- `build-apk.yml` : la fabrication de l'APK et la publication du site PC
