FROM node:alpine

RUN adduser -s /bin/ash -D testbot \
    && npm install -g yo generator-hubot \
    && su - testbot -c 'yo hubot --defaults'

ADD hubot-docker/package.json hubot-docker/external-scripts.json /home/testbot/

RUN chown -R testbot:testbot /home/testbot

VOLUME /opt/hubot-onsupportduty
WORKDIR /opt/hubot-onsupportduty

# The complex command below is due to the following:
# - I'm using /opt/hubot-onsupportduty volume instead of copying files into image
#   - this allows to cache node_modules on the host and so is much faster when
#     the content of hubot-onsupportduty module changes and dependencies have to be
#     downloaded
#   - volume content is not present during image build but only during container
#     execution
# - I depend on `tests` container to run `npm install` to ensure all dependencies
#   are present. QUESTION: can this result in container start timing issues?
# - Hubot does not seem to work as root so I'm running it as `testbot` user
# - As `testbot` I'm adding hubot-onsupportduty as a local (folder) dependency
# - I start hubot as `testbot` user
# ENTRYPOINT ["/bin/sh", "-c", \
#   "npm install && su - testbot -c 'npm install --save /opt/hubot-onsupportduty && bin/hubot --alias /'"]
USER testbot
WORKDIR /home/testbot
ENTRYPOINT ["/bin/sh", "-c", "npm install --save /opt/hubot-onsupportduty && bin/hubot --alias /"]
