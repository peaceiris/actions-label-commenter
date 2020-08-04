ARG NODE_VERSION

FROM node:${NODE_VERSION}-buster-slim

SHELL ["/bin/bash", "-l", "-c"]

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libcurl4-gnutls-dev libexpat1-dev gettext libz-dev libssl-dev autoconf \
    ca-certificates \
    wget \
    vim && \
    rm -rf /var/lib/apt/lists/* && \
    npm i -g npm

WORKDIR /repo

CMD [ "bash" ]
