#!/usr/bin/env node
// parse-ft.js
// Small runner that compiles the PEG grammar at runtime (requires 'pegjs') and parses an example FT file.

import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const gramPath = path.join(__dirname, 'ft-grammar.pegjs');
const samplePath = process.argv[2] || path.join(__dirname, '..', 'examples', 'sample.ft');

function die(msg){ console.error(msg); process.exit(1); }

if (!fs.existsSync(gramPath)) die('Grammar not found: ' + gramPath);
const grammar = fs.readFileSync(gramPath,'utf8');

// Prefer bundled standalone parser if present to avoid runtime dependency
const bundledParserPath = path.join(__dirname, 'parser.js');
if (fs.existsSync(bundledParserPath)){
  const mod = await import(url.pathToFileURL(bundledParserPath).href);
  const input = fs.readFileSync(samplePath,'utf8');
  try{
    const ast = mod.parse(input);
    console.log('Parsed AST (bundled parser):');
    console.log(JSON.stringify(ast, null, 2));
  } catch(e){ console.error('Parse error:', e.message); process.exit(4); }
  process.exit(0);
}

// Fallback: try to load pegjs and compile grammar at runtime
let peg;
try{
  peg = globalThis.require ? globalThis.require('pegjs') : null;
}catch(e){ peg = null }
if (!peg) {
  try{ const mod = await import('pegjs'); peg = mod.default || mod; } catch(e){
    console.error('pegjs module not found and no bundled parser available. Install pegjs or use bun to run parser.');
    console.error('  bun add --dev pegjs');
    console.error('  or npm install --save-dev pegjs');
    process.exit(2);
  }
}

let parser;
try{ parser = peg.generate(grammar, { output: 'parser', cache: false }); }
catch(e){ console.error('Error compiling grammar:', e.message); process.exit(3); }

if (!fs.existsSync(samplePath)) die('Sample FT not found: ' + samplePath);
const input = fs.readFileSync(samplePath,'utf8');
try{ const ast = parser.parse(input); console.log('Parsed AST:'); console.log(JSON.stringify(ast, null, 2)); }
catch(e){ console.error('Parse error:', e.message); if (e.location) console.error('At', JSON.stringify(e.location)); process.exit(4); }
