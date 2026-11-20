# Projo

Projo est un lecteur IPTV natif pour Mac : il range les films, les séries et les chaînes d'un
abonnement Xtream Codes que vous possédez déjà comme une plateforme de streaming (bandeau,
rangées d'affiches, fiches, Ma liste, recherche, lecteur complet). Projo ne fournit aucun contenu.

**Site : https://feltrincyril.github.io/projo-releases/**

Ce dépôt sert à distribuer l'application : les images disque (Releases), le flux des mises à
jour automatiques et le site.

## Télécharger

[Dernière version](https://github.com/FELTRINCyril/projo-releases/releases/latest), fichier
`Projo-<version>-<build>.dmg`.

Projo exige macOS 26 et un Mac Apple Silicon (puce M1 ou plus récente).

## Installer

1. Ouvrez l'image disque téléchargée.
2. Faites glisser Projo sur le dossier Applications, puis éjectez l'image disque.
3. À la première ouverture, macOS rappelle que Projo vient d'Internet : cliquez sur "Ouvrir".

Projo est signé par son développeur et validé par Apple (notarisé) : aucun réglage de sécurité
à modifier.

## Mises à jour

Projo vérifie au lancement, puis une fois par jour, s'il existe une nouvelle version. Un bandeau
"Nouvelle version disponible" s'affiche alors en haut de la fenêtre : "Mettre à jour" montre les
notes de version et installe la mise à jour. Chaque mise à jour est signée et vérifiée avant
son installation. Réglages > À propos permet de lancer une recherche ou de couper la
vérification automatique.

Vous avez la 0.22 ou une version plus ancienne : elle ne sait pas se mettre à jour seule.
Installez une fois la dernière version à sa place ; votre compte, Ma liste et votre progression
sont gardés.

## Retours

Les retours passent par les issues de ce dépôt :

- [Signaler un problème](https://github.com/FELTRINCyril/projo-releases/issues/new?template=probleme.yml)
- [Proposer une idée ou une amélioration](https://github.com/FELTRINCyril/projo-releases/issues/new?template=idee.yml)
- [Poser une question](https://github.com/FELTRINCyril/projo-releases/issues/new?template=question.yml)

**Les issues sont publiques.** N'y mettez jamais d'identifiant, de mot de passe, d'adresse de
serveur ni de lien M3U, même dans une capture d'écran.

## Licences et sources

Projo utilise mpv et FFmpeg, sous licence LGPL. L'image disque contient un dossier
"Informations légales" (depuis la 0.24) avec :

- "Licences et sources" : les licences des composants, les sources des bibliothèques utilisées
  et de quoi relier Projo avec une version modifiée de ces bibliothèques ;
- `LISEZMOI.txt`, qui décrit ce dossier.

Projo n'est affilié à aucun service de streaming ni à aucun fournisseur IPTV.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `appcast.xml` | Flux des mises à jour automatiques, lu par Projo. Écrit par le script de publication. |
| `Projo-<version>-<build>.html` | Notes de chaque version, affichées dans la fenêtre de mise à jour. |
| `index.html`, `versions.html`, `assets/` | Le site (GitHub Pages, branche `main`, racine) et sa page des versions. |
| `.github/ISSUE_TEMPLATE/` | Formulaires des issues. |
