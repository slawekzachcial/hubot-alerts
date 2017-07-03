FROM node:alpine

RUN adduser -s /bin/ash -D hubot

RUN npm install -g yo generator-hubot

USER hubot

RUN mkdir -p /home/hubot/bot && \
    cd /home/hubot/bot && \
    yo hubot --defaults

ADD . /home/hubot/hubot-onsupportduty/

WORKDIR /home/hubot/bot

RUN npm install --save /home/hubot/hubot-onsupportduty && \
        echo '["hubot-redis-brain", "hubot-onsupportduty"]' > external-scripts.json

ENTRYPOINT /home/hubot/bot/bin/hubot
