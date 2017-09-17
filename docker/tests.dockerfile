FROM node:alpine

RUN apk add --no-cache git

WORKDIR /opt/hubot-alerts
CMD ["sh", "-c", "npm install && npm test"]

