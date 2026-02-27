# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# -------- DEV --------
FROM base AS dev
RUN npm ci
COPY . .
ENV NODE_ENV=development
EXPOSE 5500
CMD ["npm", "run", "dev"]

# -------- PROD --------
FROM base AS prod
RUN npm ci --omit=dev
COPY src ./src
COPY dist ./dist
COPY knexfile.js ./knexfile.js
ENV NODE_ENV=production
EXPOSE 5500
CMD ["npm", "run", "prod"]