# Modèle Tesseract (OCR) — français

`fra.traineddata` provient du dépôt public
[tesseract-ocr/tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast)
(licence Apache 2.0), variante "fast" (plus petite, plus rapide que "best").

Vendorisé ici (plutôt que téléchargé à l'exécution depuis un CDN) pour deux
raisons :

1. **Fiabilité** : pas de dépendance réseau au moment du traitement d'un
   document e-Marque (voir `pdf-raster-ocr-extractor.ts`).
2. **Next.js ne trace pas les fichiers lus dynamiquement** via `fs` : ce
   fichier doit être physiquement présent dans le repo et déclaré dans
   `next.config.ts` (`outputFileTracingIncludes`) pour finir dans le bundle
   de la fonction serverless qui en a besoin.

Ce n'est pas une donnée du club ni un secret : c'est un modèle de langue
générique et public, comme une police de caractères.

Pour mettre à jour ce fichier :

```bash
curl -o fra.traineddata https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/fra.traineddata
```
