FROM node:20-alpine

WORKDIR /app

# Instalar deps (prod por defecto)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar backend + estáticos compilados
COPY src ./src
COPY dist ./dist
COPY config ./config
COPY knexfile.js ./knexfile.js

ENV NODE_ENV=production
ENV HOST_URL=0.0.0.0
ENV PORT=5500

EXPOSE 5500

CMD ["node", "src/server.js"]