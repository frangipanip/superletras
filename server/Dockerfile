# API de recompensas: solo usa módulos de Node (node:sqlite), no hace falta npm install.
FROM node:24-alpine
WORKDIR /app

COPY shared ./shared
COPY server ./server

ENV PORT=3001
ENV DB_PATH=/data/superletras.db
VOLUME /data
EXPOSE 3001
CMD ["node", "server/index.js"]
