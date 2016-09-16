#!/usr/bin/env node

'use strict';

const fs = require('fs');

let mainModuleContents = fs.readFileSync(`${__dirname}/../lib/sklad.js`, {encoding: 'utf-8'});
mainModuleContents = mainModuleContents.replace(/\sfrom\s'\.\//g, ' from \'./lib/');

fs.writeFileSync(`${__dirname}/../es2015.js`, mainModuleContents);
