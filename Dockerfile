FROM node:alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install --production --no-optional && npm cache clean --force
ENV PATH /app/node_modules/.bin:$PATH

ARG FROM_TAG='latest'
FROM shokohsc/alpine-js:${FROM_TAG:-latest}

COPY --from=builder /app/node_modules ./node_modules
COPY . .

HEALTHCHECK CMD curl --fail http://localhost:3000/api/ || exit 1

EXPOSE 3000
