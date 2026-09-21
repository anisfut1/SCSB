import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @napi-rs/canvas expédie un binding natif (.node) que le bundler de Next.js
  // ne sait pas empaqueter ("non-ecmascript placeable asset") ; tesseract.js
  // charge son worker dynamiquement de façon similaire. On les exclut du
  // bundling et on les laisse chargés via require() Node natif au runtime
  // (présents normalement dans node_modules côté serveur/Vercel).
  serverExternalPackages: ["@napi-rs/canvas", "tesseract.js"],

  // Le modèle de langue Tesseract (fra.traineddata) n'est référencé qu'à
  // l'exécution (fs.readFileSync par tesseract.js), pas via un `import` —
  // sans cette déclaration, Next.js ne l'inclurait pas dans le bundle de
  // la fonction serverless qui traite les documents e-Marque. Voir
  // src/server/emarque/extractors/pdf-raster-ocr-extractor.ts.
  outputFileTracingIncludes: {
    "/api/internal/discover-emarque": ["./src/server/emarque/ocr-data/**/*"],
  },
};

export default nextConfig;
