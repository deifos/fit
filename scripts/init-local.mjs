import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!fs.existsSync('.dev.vars')){fs.writeFileSync('.dev.vars',`BETTER_AUTH_SECRET=${randomBytes(40).toString('hex')}\nLOCAL_SETUP_TOKEN=${randomBytes(32).toString('hex')}\nOWNER_EMAIL=local-test@fit.invalid\n`);console.log('Created ignored local secrets. The test identity is local only.');}
