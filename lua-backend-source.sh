#!/bin/bash

if [[ "$(uname)" == "Linux" ]]; then
    BIN_PATH="$HOME/.luarocks/bin"
else
    BIN_PATH="/opt/homebrew/bin"
fi

cd ao

$BIN_PATH/amalg.lua -s backend.lua -o build/output-backend.lua permissions.permissions utils.response backend.registration backend.agent-updates backend.queries

# prepend resets to the output file
cat backend/resets.lua | cat - build/output-backend.lua > temp && mv temp build/output-backend.lua
