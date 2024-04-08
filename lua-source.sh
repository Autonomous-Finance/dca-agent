#!/bin/bash

cd ao

/opt/homebrew/bin/amalg.lua -s test-process.lua -o build/output.lua ownership.ownership validations.validations

cd ..

lua_source=$(<ao/build/output.lua)

echo "export const BOT_SOURCE = \`$lua_source\`" > src/lua/bot-source.ts

echo "Success. Check out ao/build/output.lua and src/lua/bot-source.ts"