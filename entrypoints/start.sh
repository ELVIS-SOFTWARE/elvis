#!/bin/bash

set -ex

if [ -f tmp/pids/server.pid ]; then
  rm tmp/pids/server.pid
fi

export kube_env=start

bundle exec rails s -b 0.0.0.0 -p 80
