# Captures de Projo pour le site

Ce dossier est vide pour l'instant : le visuel principal du site est une maquette en HTML et
CSS (bloc `<figure class="window js-tilt">` de `index.html`), avec des titres et des affiches
fictifs.

## Règles

- Aucune affiche, aucun titre ni aucune chaîne réels (droits d'auteur), aucune marque de tiers.
  Faire les captures avec un catalogue de démonstration, ou flouter les affiches.
- Aucun nom, aucune adresse de serveur, aucun identifiant visible (Réglages > Compte en
  particulier).
- Fenêtre seule, sans le bureau autour (Cmd-Maj-4, puis Espace, puis Option-clic sur la
  fenêtre pour retirer l'ombre).

## Noms et formats attendus

Pour chaque capture, trois fichiers de même nom : `.avif` (le plus léger), `.webp`, et `.png`
en repli. Largeur 2560 px (écran Retina, la fenêtre s'affiche à 1180 px au plus).

| Nom | Contenu | Remplace |
|---|---|---|
| `accueil` | L'accueil : bandeau et rangées d'affiches | la maquette du visuel principal |
| `lecteur` | Le lecteur avec ses commandes et le panneau Audio et sous-titres | le visuel de la carte "Un lecteur complet" |
| `fiche` | Une fiche de série avec ses épisodes | (nouvelle carte possible) |
| `tv` | L'onglet TV avec le guide des programmes | le visuel de la carte "Chaînes TV" |

Conversion (outils Homebrew) :

```sh
cwebp -q 82 accueil.png -o accueil.webp
avifenc -q 60 accueil.png accueil.avif
```

## Remplacer la maquette par une capture

Dans `index.html`, remplacer le contenu de `<figure class="window js-tilt">` (la barre
`win-bar` et le bloc `app`) par :

```html
<picture>
  <source srcset="assets/captures/accueil.avif" type="image/avif">
  <source srcset="assets/captures/accueil.webp" type="image/webp">
  <img src="assets/captures/accueil.png" width="2560" height="1600"
       alt="L'accueil de Projo : un grand bandeau, puis des rangées d'affiches.">
</picture>
```

La première capture est visible au chargement : pas de `loading="lazy"` sur elle. Les
suivantes, plus bas dans la page, prennent `loading="lazy" decoding="async"`. Supprimer
ensuite la ligne "Interface simulée. Titres et affiches fictifs." (`showcase-note`).
