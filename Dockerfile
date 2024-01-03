FROM ruby:3.0.2-slim AS build

# Sets the path where the app is going to be installed
ENV RAILS_ROOT /Elvis

# Configure github PAT for bundler
ARG GITHUB_TOKEN
ENV BUNDLE_GITHUB__COM $GITHUB_TOKEN
RUN export BUNDLE_GITHUB__COM=$BUNDLE_GITHUB__COM

ARG PLUGINS_LIST_DOWNLOAD_URL

# Creates the directory and all the parents (if they don't exist)
RUN mkdir -p $RAILS_ROOT

# This is given by the Ruby Image.
# This will be the de-facto directory that
# all the contents are going to be stored.
WORKDIR $RAILS_ROOT

RUN apt-get update
RUN apt-get install -y --no-install-recommends libjemalloc2

ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2

RUN gem install bundler
RUN apt-get install -y \
  curl \
  python \
  build-essential \
  libpq-dev postgresql-client \
  git \
  shared-mime-info \
    &&\
  curl -sL https://deb.nodesource.com/setup_14.x | bash - && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
  apt-get update && apt-get install -y nodejs yarn

RUN rm -rf vendor/cache
RUN bundle config set force_ruby_platform true

COPY Gemfile /Elvis/
COPY lib /Elvis/lib

RUN PLUGINS_LIST_DOWNLOAD_URL=$PLUGINS_LIST_DOWNLOAD_URL bundle install


COPY package.json yarn.lock Gemfile Rakefile /Elvis/
COPY config /Elvis/config
COPY lib /Elvis/lib
RUN rm -rf /Elvis/config/initializers
RUN rm -rf /Elvis/config/routes.rb

RUN PLUGINS_LIST_DOWNLOAD_URL=$PLUGINS_LIST_DOWNLOAD_URL rake elvis:plugins:install_npm_dependencies

RUN yarn install --check-files

COPY bin /Elvis/bin

ENV RAILS_LOG_TO_STDOUT=true
RUN PLUGINS_LIST_DOWNLOAD_URL=$PLUGINS_LIST_DOWNLOAD_URL bundle exec rails elvis:plugins:copy_react
RUN PLUGINS_LIST_DOWNLOAD_URL=$PLUGINS_LIST_DOWNLOAD_URL bundle exec rails elvis:plugins:assets

COPY frontend /Elvis/frontend
COPY db /Elvis/db
COPY public /Elvis/public
COPY app/assets /Elvis/app/assets
COPY .postcssrc.yml .babelrc /Elvis/

# compile webpacker without app components/routes/initializers
RUN bundle exec rails webpacker:compile
ENV RAILS_ENV=kubernetes
ENV SECRET_KEY_BASE $(bundle exec rails secret)

# copy app components/routes/initializers
COPY config/routes.rb /Elvis/config/routes.rb
COPY app /Elvis/app
COPY config/initializers /Elvis/config/initializers

RUN bundle exec bootsnap precompile --gemfile app/ lib/

RUN rm -rf log/*
RUN rm -rf tmp/cache
RUN rm -rf frontend

# remove yarn dependencies and modules
RUN yarn cache clean
RUN rm -rf node_modules

# remove git files
RUN rm -rf .git

COPY entrypoints /Elvis/entrypoints
COPY config.ru /Elvis/












FROM ruby:3.0.2-slim AS release

ENV RAILS_ROOT /Elvis
ENV RAILS_ENV=kubernetes
ENV RAILS_LOG_TO_STDOUT=true
ENV SECRET_KEY_BASE $(bundle exec rails secret)

# ~18mb
RUN apt update

# ~ 63mb => pdf generation
RUN apt-get install -y --no-install-recommends libjemalloc2 curl shared-mime-info postgresql-client libfontconfig1 libxrender1 libxtst6 libxi6 libpng16-16 libjpeg62 cron

# ~ 35mb
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && \
          curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
          echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
          apt-get update

# need to install nodejs for rails to start because rails use it to run js in back-office. see https://github.com/rails/execjs
# ~ 97mb
RUN apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2

RUN mkdir -p $RAILS_ROOT
WORKDIR $RAILS_ROOT

# ~ 760mb => too big ?
COPY --from=build /usr/local/bundle /usr/local/bundle

# ~ 50mb => because of bootsnap precompile. It is bigger for more speed
COPY --from=build $RAILS_ROOT $RAILS_ROOT

EXPOSE 80
RUN chmod +x /Elvis/entrypoints/init.sh
RUN chmod +x /Elvis/entrypoints/start.sh
ENTRYPOINT ["/Elvis/entrypoints/start.sh"]
