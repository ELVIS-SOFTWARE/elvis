#!/bin/bash

set -ex

if [ -f tmp/pids/server.pid ]; then
  rm tmp/pids/server.pid
fi

export kube_env=start

crond -b -l 8
bundle exec rails s -b 0.0.0.0 -p "${PORT:-80}"
