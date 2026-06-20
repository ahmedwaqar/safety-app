Parse FT demo (bun/node)

Quick instructions to run the PEG parser using `bun` (preferred) or `node`.

Using bun:
```bash
cd /Users/waqarahmed/Documents/Docs/Jobs/Cobot/SafetyApp
bun add --dev pegjs
bun tools/parse-ft.js examples/sample.ft
```

Using node (if installed):
```bash
cd /Users/waqarahmed/Documents/Docs/Jobs/Cobot/SafetyApp
npm install --save-dev pegjs
node tools/parse-ft.js examples/sample.ft
```

If you want me to precompile the grammar into a standalone `tools/parser.js` so no runtime dependency is required, tell me and I'll add it.
