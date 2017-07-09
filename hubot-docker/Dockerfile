FROM node:alpine

# RUN adduser -s /bin/ash -D hubot

# RUN npm install -g yo generator-hubot

# USER hubot

# RUN mkdir -p /home/hubot/bot && \
#     cd /home/hubot/bot && \
#     yo hubot --defaults

# ADD hubot-docker/package.json hubot-docker/external-scripts.json /home/hubot/bot/
# ADD . /home/hubot/hubot-onsupportduty/

# RUN chown -R hubot:hubot /home/hubot

# USER hubot

# WORKDIR /home/hubot/hubot-onsupportduty

# RUN npm install

# CMD ["npm", "test"]


# WORKDIR /home/hubot/bot

# RUN npm install --save /home/hubot/hubot-onsupportduty && npm install

# ENTRYPOINT ["/home/hubot/bot/bin/hubot"]
# CMD ["--alias", "/"]
# CMD ["/home/hubot/bot/node_modules/.bin/mocha", "--compilers", "coffee:../bot/node_modules/coffee-script/register", "/home/hubot/hubot-onsupportduty/test/*.coffee"]

VOLUME /opt/hubot-onsupportduty

# RUN npm install -g yo generator-hubot && \
#     mkdir -p /opt/testbot && \
#     cd /opt/testbot && \
#     yo hubot --defaults

# ADD hubot-docker/package.json hubot-docker/external-scripts.json /opt/testbot/
# RUN cd /opt/testbot && \
#     npm install --save /opt/hubot-onsupportduty && \
#     npm install && \
#     npm prune

WORKDIR /opt/hubot-onsupportduty
RUN npm install

CMD ["npm", "test"]
