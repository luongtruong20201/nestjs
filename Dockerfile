FROM node:20-alpine3.16

WORKDIR /app

COPY package*.json .
COPY tsconfig.json .
COPY .env .
COPY ./src ./src

RUN npm i -g @nestjs/cli
RUN npm i --legacy-peer-deps
RUN npm run build

EXPOSE 8000

CMD [ "npm", "start" ]