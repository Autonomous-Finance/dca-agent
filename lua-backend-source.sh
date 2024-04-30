#!/bin/bash

cd ao

/opt/homebrew/bin/amalg.lua -s backend.lua -o build/output-backend.lua permissions.permissions utils.response utils.assertions utils.type backend.registration backend.agent-updates backend.queries
