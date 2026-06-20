# Fault Tree PEG grammar (ft-grammar.pegjs)
# Parse a textual fault tree format. Produces an AST with nodes, gates, events and connections.

Start
  = _ ft:FaultTree _ { return ft }

FaultTree
  = "FAULTTREE"i __ id:Identifier _ "{" _ nodes:Node+ _ "}" { return { type: 'FaultTree', id, nodes } }

Node
  = BasicEvent / GateDecl / _

BasicEvent
  = "BE"i __ id:Identifier _ ":" _ label:String _ attrs:AttrSection? _ ";" _ {
      return { kind: 'BasicEvent', id, label, attrs: attrs || {} } }

GateDecl
  = "GATE"i __ id:Identifier _ ":" _ type:GateType _ "(" _ inputs:InputList _ ")" _ "->" _ out:OutputId _ attrs:AttrSection? _ ";" _ {
      return { kind: 'Gate', id, gateType: type, inputs, output: out, attrs: attrs || {} } }

GateType
  = Maj / "INHIBIT"i { return text() }
  / "COMP"i { return text() }
  / "AND"i { return text() }
  / "OR"i { return text() }
  / "NAND"i { return text() }
  / "NOR"i { return text() }
  / "XOR"i { return text() }
  / "NOT"i { return text() }

Maj
  = "MAJ"i _ "(" _ k:Integer _ ")" { return { type: 'MAJ', k: parseInt(k,10) } }

InputList
  = first:Ref rest:(_ "," _ Ref)* {
      const others = rest.map(r=>r[3]); return [first].concat(others) }

Ref
  = OutputId / Identifier

OutputId
  = "$" id:Identifier { return id }
  / id:Identifier { return id }

AttrSection
  = "[" _ a:AttrList _ "]" { const obj={}; a.forEach(kv=>obj[kv.key]=kv.value); return obj }

AttrList
  = first:Attr rest:(_ "," _ Attr)* { return [first].concat(rest.map(r=>r[3])) }

Attr
  = key:Identifier _ "=" _ val:(Number / String / Expr) { return { key, value: val } }

Expr
  = head:Term tail:(_ Op _ Term)* {
      return tail.reduce((acc, item)=>({ op: item[1], left: acc, right: item[3] }), head)
    }

Term
  = Number / Identifier

Op
  = "+" / "-" / "*" / "/" / "==" / ">=" / "<=" / ">" / "<"

Identifier
  = $([a-zA-Z_] [a-zA-Z0-9_]*)

String
  = '"' chars:([^"\\] / \\.)* '"' { return chars.join('').replace(/\\"/g,'"') }

Number
  = $([0-9]+ ("." [0-9]+)?) { return parseFloat(text()) }

Integer
  = $([0-9]+)

_  = [ \t\r\n]*
__ = [ \t\r\n]+
