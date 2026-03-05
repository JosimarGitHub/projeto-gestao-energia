FROM node:20-slim

WORKDIR /app

# Copia apenas os arquivos de pacotes primeiro (otimiza o cache do Docker)
COPY package*.json ./

RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
