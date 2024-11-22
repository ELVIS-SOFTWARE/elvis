FROM ruby:3.3.6-alpine AS build

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

RUN apk update

RUN apk add --no-interactive \
  curl \
  python3 \
  build-base \
  libpq-dev postgresql-client \
  git \
  shared-mime-info \
    nodejs \
    yarn \
    jemalloc \
    py3-setuptools

ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2

RUN gem install bundler

RUN rm -rf vendor/cache
RUN bundle config set force_ruby_platform true

COPY Gemfile /Elvis/
COPY lib /Elvis/lib

ENV RAILS_ENV=kubernetes
ENV SECRET_KEY_BASE $(bundle exec rails secret)

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
COPY babel.config.js postcss.config.js /Elvis/

# ignore error when precompiling assets
RUN NODE_OPTIONS=--openssl-legacy-provider rails assets:precompile

# copy app components/routes/initializers
COPY config/routes.rb /Elvis/config/routes.rb
COPY app /Elvis/app
COPY config/initializers /Elvis/config/initializers

RUN bundle exec bootsnap precompile --gemfile app/ lib/

RUN rm -rf log/*
RUN rm -rf tmp/cache
RUN rm -rf frontend
RUN rm -rf package.json yarn.lock

# remove yarn dependencies and modules
RUN rm -rf node_modules

# remove git files
RUN rm -rf .git

COPY entrypoints /Elvis/entrypoints
COPY config.ru /Elvis/

RUN rm -r /usr/local/bundle/cache














FROM ruby:3.3.6-alpine

ENV RAILS_ROOT /Elvis
ENV RAILS_ENV=kubernetes
ENV RAILS_LOG_TO_STDOUT=true
ENV SECRET_KEY_BASE $(bundle exec rails secret)

RUN adduser -Ds /bin/sh elvis

# ~2mb
RUN apk update

# ~ 34mb => pdf generation
RUN apk add --no-interactive libpq libcap bash jemalloc curl shared-mime-info fontconfig libxrender libxtst libxi libpng libjpeg
RUN setcap 'cap_net_bind_service=+ep' /usr/local/bin/ruby

ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2

RUN mkdir -p $RAILS_ROOT
WORKDIR $RAILS_ROOT

# ~ 560mb => with 450mb for wkhtmltopdf-binary
COPY --from=build /usr/local/bundle /usr/local/bundle

# ~ 50mb => because of bootsnap precompile. It is bigger for more speed
COPY --from=build $RAILS_ROOT $RAILS_ROOT

RUN chown -R elvis:elvis $RAILS_ROOT

USER elvis

EXPOSE 80

MAINTAINER "Elvis Team"

RUN chmod u+x /Elvis/entrypoints/*.sh

ENTRYPOINT ["/Elvis/entrypoints/start.sh"]
