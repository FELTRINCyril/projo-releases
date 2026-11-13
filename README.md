# Projo

Lecteur IPTV pour macOS 26 (Mac Apple Silicon), avec une interface façon Netflix, pour un
abonnement Xtream Codes. Ce dépôt sert seulement à distribuer l'application : les
installateurs (DMG) et le flux des mises à jour.

## Télécharger

Dernière version : [Releases](https://github.com/FELTRINCyril/projo-releases/releases/latest),
fichier `Projo-<version>-<build>.dmg`.

## Installer

1. Ouvrez le DMG et faites glisser Projo.app sur le dossier Applications.
2. Éjectez l'image disque.

## Première ouverture ("Ouvrir quand même")

Projo n'est pas notarisé par Apple : macOS le bloque à la première ouverture. Une seule fois :

1. Essayez d'ouvrir Projo depuis Applications, puis fermez le message.
2. Ouvrez Réglages Système > Confidentialité et sécurité.
3. Dans la section Sécurité, cliquez sur "Ouvrir quand même" à côté de Projo, puis confirmez
   avec votre mot de passe ou Touch ID.

Sur macOS 26, le clic droit > Ouvrir ne suffit plus : passez par les Réglages Système.

## Mises à jour

Projo vérifie au lancement, puis une fois par jour, s'il existe une nouvelle version (le fichier
`appcast.xml` de ce dépôt, servi par GitHub Pages). Un bandeau "Nouvelle version disponible"
s'affiche alors en haut de la fenêtre : "Mettre à jour" ouvre la fenêtre de mise à jour, avec les
notes de version et le bouton "Installer". Les mises à jour sont signées (EdDSA) et vérifiées
avant l'installation. La vérification automatique se règle dans Réglages > À propos.

## Licences et sources

Projo utilise mpv et FFmpeg (LGPL). Chaque DMG contient un dossier "Licences et sources" : les
licences des composants, les sources des bibliothèques utilisées et `COMPILER.md`, qui explique
comment recompiler Projo avec une version modifiée de ces bibliothèques.
