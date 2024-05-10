#!/bin/bash

cd ao

/opt/homebrew/bin/amalg.lua -s backend.lua -o build/output-backend.lua permissions.permissions utils.response backend.registration backend.agent-updates backend.queries

# prepend resets to the output file
cat backend/resets.lua | cat - build/output-backend.lua > temp && mv temp build/output-backend.lua
