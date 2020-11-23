ARG NODE_VERSION

FROM node:${NODE_VERSION}-buster-slim

SHELL ["/bin/bash", "-l", "-c"]

ENV DEBIAN_FRONTEND="noninteractive"
ENV NODE_ENV="development"

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    vim \
    git && \
    apt-get autoclean && \
    apt-get clean && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* && \
    npm i -g npm && \
    npm cache clean --force

WORKDIR /repo

ENV LANG="C.UTF-8"
ENV CI="true"
ENV ImageVersion="20200717.1"
ENV GITHUB_SERVER_URL="https://github.com"
ENV GITHUB_API_URL="https://api.github.com"
ENV GITHUB_GRAPHQL_URL="https://api.github.com/graphql"
ENV GITHUB_REPOSITORY_OWNER="peaceiris"
ENV GITHUB_ACTIONS="true"
ENV GITHUB_ACTOR="peaceiris"
ENV GITHUB_REPOSITORY="actions/pages"
ENV RUNNER_OS="Linux"
ENV RUNNER_TOOL_CACHE="/opt/hostedtoolcache"
ENV RUNNER_USER="runner"
ENV RUNNER_TEMP="/home/runner/work/_temp"
ENV RUNNER_WORKSPACE="/home/runner/work/pages"

CMD [ "bash" ]
