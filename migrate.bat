@echo off
echo Applying database migration...
node -e "const { execSync } = require('child_process'); execSync('node node_modules/wrangler/bin/wrangler.js d1 migrations apply estudio-aline-andrade --local', { stdio: 'inherit' });"
echo Migration complete!
pause
