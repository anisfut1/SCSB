# Image officielle Playwright : Node + Chromium + toutes les dépendances OS
# nécessaires à un Chromium headless déjà installées — évite la longue liste
# de paquets apt qu'un `node:20-slim` nu demanderait (§50 du brief FBI :
# déployable sans ré-architecturer). Garder cette version alignée avec la
# version `playwright` de package.json.
FROM mcr.microsoft.com/playwright:v1.63.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src
RUN npm install --include=dev && npm run build && npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 8080

# §48 du brief FBI : /health minimal, sans secret.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
