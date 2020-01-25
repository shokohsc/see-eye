FROM node:alpine as builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production --no-optional && npm cache clean --force
ENV PATH /usr/src/app/node_modules/.bin:$PATH

FROM shokohsc/alpine-node

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY ./root/etc/services.d/node-consumer /etc/services.d/node-consumer
COPY . .

HEALTHCHECK CMD curl --fail http://localhost:3000/api/ || exit 1

EXPOSE 3000
