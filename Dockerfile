FROM node:20.12.2-bullseye-slim
EXPOSE 5000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]