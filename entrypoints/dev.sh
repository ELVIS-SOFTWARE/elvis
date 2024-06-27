#!/bin/bash

bundle install --local

if [ -f tmp/pids/server.pid ]; then
  rm tmp/pids/server.pid
fi

cmd="$1"

if [ -z "$cmd" ]; then
  foreman start
else
  exec "$cmd"
fi

