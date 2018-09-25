#!/usr/bin/env bash
rm -rf ./build
yarn run build
docker build -t kepler-web:latest .

