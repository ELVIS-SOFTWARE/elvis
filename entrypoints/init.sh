#!/bin/bash

set -ex

export kube_env=init

bundle exec rake db:prepare --trace
bundle exec rake elvis:plugins:discover
bundle exec rake elvis:plugins:migrate
bundle exec rails chewy:upgrade

