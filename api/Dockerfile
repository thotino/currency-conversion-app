FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000
EXPOSE 9229

CMD ["npm", "run", "start:dev:inspect"]
