// Simple fault-tree parser (standalone, lightweight)
// Supports a subset of the FT language used here: FAULTTREE, BE, GATE with attrs

export function parse(input){
  const lines = input.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0 && !l.startsWith('//'));
  let i = 0;
  function expectPrefix(prefix){ if(!lines[i] || !lines[i].toUpperCase().startsWith(prefix)) throw new Error('Expected '+prefix+' at line '+(i+1)); }

  // parse FAULTTREE id {
  const first = lines[i++];
  const m = /^FAULTTREE\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{?/i.exec(first);
  if(!m) throw new Error('Invalid FAULTTREE header');
  const ftId = m[1];
  // if header didn't include {, next line may be {
  if(!first.includes('{')){
    if(lines[i] !== '{') throw new Error('Expected { after FAULTTREE header');
    i++; // skip {
  } else {
    // if { was on same line, nothing to skip
  }

  const nodes = [];

  while(i < lines.length){
    const line = lines[i++];
    if(line === '}') break;
    // Basic event: BE id: "label" [attr=val,...];
    const beMatch = /^BE\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*("[^"]+")\s*(\[.*\])?;?$/i.exec(line);
    if(beMatch){
      const id = beMatch[1];
      const label = JSON.parse(beMatch[2]);
      const attrs = parseAttrs(beMatch[3]);
      nodes.push({ kind: 'BasicEvent', id, label, attrs });
      continue;
    }
    // Gate: GATE id: TYPE(a,b) -> outId [attrs];
    const gateMatch = /^GATE\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z0-9_() ,]+)\s*\(([^)]*)\)\s*->\s*\$?([A-Za-z_][A-Za-z0-9_]*)\s*(\[.*\])?;?$/i.exec(line);
    if(gateMatch){
      const id = gateMatch[1];
      const typeRaw = gateMatch[2].trim();
      // handle MAJ(k)
      let gateType = typeRaw;
      const majMatch = /MAJ\s*\(\s*(\d+)\s*\)/i.exec(typeRaw);
      if(majMatch) gateType = { type: 'MAJ', k: parseInt(majMatch[1],10) };
      const inputs = gateMatch[3].split(',').map(s=>s.trim()).filter(s=>s.length>0).map(t=>t.replace(/^\$/,''));
      const output = gateMatch[4];
      const attrs = parseAttrs(gateMatch[5]);
      nodes.push({ kind:'Gate', id, gateType, inputs, output, attrs });
      continue;
    }

    // allow comments or blank lines
    if(line.startsWith('//') || line.length===0) continue;

    throw new Error('Unrecognized line: '+line+' (at '+(i)+')');
  }

  // Semantic validations
  const beIds = new Set(nodes.filter(n=>n.kind==='BasicEvent').map(n=>n.id));
  const outputToGate = new Map();
  for(const n of nodes){
    if(n.kind==='Gate'){
      if(outputToGate.has(n.output)){
        throw new Error(`Duplicate output id '${n.output}' produced by gates '${outputToGate.get(n.output)}' and '${n.id}'`);
      }
      outputToGate.set(n.output, n.id);
    }
  }

  // Ensure each gate input references an existing BE id or gate output id
  for(const n of nodes){
    if(n.kind==='Gate'){
      for(const inp of n.inputs){
        if(!beIds.has(inp) && !outputToGate.has(inp)){
          throw new Error(`Gate '${n.id}' has unknown input reference '${inp}'`);
        }
      }
    }
  }

  return { type:'FaultTree', id: ftId, nodes };
}

function parseAttrs(s){
  if(!s) return {};
  const inner = s.replace(/^\[/,'').replace(/\]$/,'').trim();
  if(!inner) return {};
  const parts = inner.split(/\s*,\s*/);
  const obj = {};
  for(const p of parts){
    const eq = p.indexOf('=');
    if(eq<0) { obj[p]=true; continue; }
    const key = p.slice(0,eq).trim();
    let val = p.slice(eq+1).trim();
    if(/^".*"$/.test(val) || /^'.*'$/.test(val)){
      val = val.slice(1,-1);
    } else if(/^[0-9.]+$/.test(val)){
      val = Number(val);
    }
    obj[key]=val;
  }
  return obj;
}

// If run directly, parse sample file and print AST
if(typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].endsWith('parser.js')){
  const fs = await import('fs');
  const path = await import('path');
  const sample = process.argv[2] || path.join(process.cwd(), 'examples', 'sample.ft');
  const input = fs.readFileSync(sample, 'utf8');
  try{
    const ast = parse(input);
    console.log(JSON.stringify(ast, null, 2));
  } catch(e){ console.error('Parse error:', e.message); process.exit(1); }
}
