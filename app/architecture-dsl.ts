import { createElement, createRelationship, UML_ELEMENT_KINDS, UML_RELATIONSHIP_KINDS } from "./uml-core.js";

const identifierPattern = "[A-Za-z][A-Za-z0-9_.-]*";
const aliasPattern = "[A-Za-z][A-Za-z0-9_-]*";
const sidePattern = "top|right|bottom|left";
const elementAliases = { node: "deploymentNode", usecase: "useCase", abstractclass: "abstractClass", datatype: "dataType" };
const relationshipAliases = { interface: "interfaceConnector" };
const relationshipOperators = {
  "--": "association",
  "->": "dependency",
  "-->": "dependency",
  "..>": "dependency",
  "--|>": "generalization",
  "..|>": "realization",
  "o--": "aggregation",
  "*--": "composition"
};

export class ArchitectureDslError extends Error {
  line: number;

  constructor(message: string, line: number) {
    super(`Line ${line}: ${message}`);
    this.name = "ArchitectureDslError";
    this.line = line;
  }
}

function quote(value = "") {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function unquote(value = "") {
  try { return JSON.parse(value); } catch { return value.slice(1, -1); }
}

function normalizeElementKind(keyword: string) {
  const direct = UML_ELEMENT_KINDS.find(kind => kind.toLowerCase() === keyword.toLowerCase());
  return direct || elementAliases[keyword.toLowerCase()];
}

function normalizeRelationshipKind(keyword: string) {
  const direct = UML_RELATIONSHIP_KINDS.find(kind => kind.toLowerCase() === keyword.toLowerCase());
  return direct || relationshipAliases[keyword.toLowerCase()];
}

function sourceElementKind(kind: string) {
  return kind === "deploymentNode" ? "node" : kind;
}

function sourceRelationshipKind(kind: string) {
  return kind === "interfaceConnector" ? "interface" : kind;
}

function isComment(line: string) {
  const text = line.trim();
  return text.startsWith("#") || text.startsWith("'");
}

function defaultPosition(index: number) {
  return { x: 120 + (index % 3) * 280, y: 120 + Math.floor(index / 3) * 180 };
}

function existingElementByAlias(diagram, alias: string) {
  return diagram?.elements?.find(element => String(element.taggedValues?.alias || "").toLowerCase() === alias.toLowerCase());
}

function parseElement(lines: string[], start: number, existingDiagram, placementIndex: number) {
  const raw = lines[start].trim();
  const simple = raw.match(new RegExp(`^(${identifierPattern})\\s+("(?:\\\\.|[^"\\\\])*")\\s+as\\s+(${aliasPattern})\\s*(\\{)?$`, "i"));
  const legacy = raw.match(new RegExp(`^(${identifierPattern})\\s+(${aliasPattern})\\s+("(?:\\\\.|[^"\\\\])*")(?:\\s+at\\s+(-?\\d+(?:\\.\\d+)?)\\s*,\\s*(-?\\d+(?:\\.\\d+)?))?(?:\\s+size\\s+(\\d+(?:\\.\\d+)?)\\s*,\\s*(\\d+(?:\\.\\d+)?))?\\s*(\\{)?$`, "i"));
  const match = simple || legacy;
  if (!match) return null;
  const kind = normalizeElementKind(match[1]);
  if (!kind || kind === "interfaceConnector") return null;
  const alias = simple ? match[3] : match[2];
  const name = simple ? match[2] : match[3];
  const hasBlock = simple ? match[4] : match[8];
  const prior = existingElementByAlias(existingDiagram, alias);
  const fallback = defaultPosition(placementIndex);
  const x = legacy?.[4] === undefined ? prior?.view?.x ?? fallback.x : Number(legacy[4]);
  const y = legacy?.[5] === undefined ? prior?.view?.y ?? fallback.y : Number(legacy[5]);
  const element = createElement(kind, unquote(name), x, y, legacy?.[6] === undefined ? prior?.view?.width : Number(legacy[6]), legacy?.[7] === undefined ? prior?.view?.height : Number(legacy[7]));
  if (prior?.id) element.id = prior.id;
  if (prior?.view) element.view = structuredClone(prior.view);
  element.taggedValues.alias = alias;
  if (!hasBlock) return { element, end: start };

  element.properties.attributes = [];
  element.properties.operations = [];
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line || isComment(line)) continue;
    if (line === "}") return { element, end: index };
    const property = line.match(/^(stereotype|attribute|operation|documentation|doc|body)\s+("(?:\\.|[^"\\])*")$/i);
    const textScale = line.match(/^textScale\s+(\d+(?:\.\d+)?)$/i);
    const stereotype = line.match(/^<<(.+)>>$/);
    const member = line.match(/^([+\-#~]?\s*[A-Za-z_][^{}]*)$/);
    if (property) {
      const value = unquote(property[2]);
      const key = property[1].toLowerCase() === "doc" ? "documentation" : property[1].toLowerCase();
      if (key === "stereotype") element.stereotype = value;
      else if (key === "attribute") element.properties.attributes.push(value);
      else if (key === "operation") element.properties.operations.push(value);
      else element.properties[key] = value;
      continue;
    }
    if (stereotype) { element.stereotype = stereotype[1].trim(); continue; }
    if (member) {
      (member[1].includes("(") ? element.properties.operations : element.properties.attributes).push(member[1]);
      continue;
    }
    if (textScale) {
      element.view.style.textScale = Number(textScale[1]);
      continue;
    }
    throw new ArchitectureDslError("Unsupported element property", index + 1);
  }
  throw new ArchitectureDslError(`Element ${alias} is missing a closing brace`, start + 1);
}

function parseEndpoint(value: string) {
  const match = value.match(new RegExp(`^(${aliasPattern})(?:\\.(${sidePattern}))?$`, "i"));
  return match ? { alias: match[1], side: (match[2] || "").toLowerCase() } : null;
}

function parseRelationship(line: string, lineNumber: number) {
  const legacy = line.match(new RegExp(`^(${identifierPattern})\\s+(${aliasPattern})\\s+("(?:\\\\.|[^"\\\\])*")\\s+from\\s+(${aliasPattern})(?:\\.(${sidePattern}))?\\s+to\\s+(${aliasPattern})(?:\\.(${sidePattern}))?$`, "i"));
  if (legacy) {
    const kind = normalizeRelationshipKind(legacy[1]);
    if (!kind) return null;
    return { line: lineNumber, kind, authoredAlias: legacy[2], label: unquote(legacy[3]), sourceAlias: legacy[4], sourceSide: (legacy[5] || "").toLowerCase(), targetAlias: legacy[6], targetSide: (legacy[7] || "").toLowerCase() };
  }
  let rest = line;
  let explicitKind = "";
  const firstWord = line.match(new RegExp(`^(${identifierPattern})\\s+(.+)$`));
  const candidateKind = firstWord ? normalizeRelationshipKind(firstWord[1]) : "";
  if (candidateKind) { explicitKind = candidateKind; rest = firstWord[2]; }
  const match = rest.match(new RegExp(`^(${aliasPattern}(?:\\.(?:${sidePattern}))?)\\s+(--\\|>|\\.\\.\\|>|-->|\\.\\.>|o--|\\*--|--|->)\\s+(${aliasPattern}(?:\\.(?:${sidePattern}))?)(?:\\s*:\\s*(.+))?$`, "i"));
  if (!match) return null;
  const source = parseEndpoint(match[1]);
  const target = parseEndpoint(match[3]);
  if (!source || !target) return null;
  const rawLabel = (match[4] || "").trim();
  const label = rawLabel.startsWith('"') ? unquote(rawLabel) : rawLabel;
  return { line: lineNumber, kind: explicitKind || relationshipOperators[match[2]], authoredAlias: "", label, sourceAlias: source.alias, sourceSide: source.side, targetAlias: target.alias, targetSide: target.side };
}

function inferDiagramType(elements) {
  const kinds = new Set(elements.map(element => element.kind));
  if (["activity", "activityObject", "activityFrame", "decision", "merge", "forkJoin", "swimlane", "interruptibleRegion", "signalSend", "signalReceive", "guard", "start", "end"].some(kind => kinds.has(kind))) return "activity";
  if (["state", "initialState", "finalState"].some(kind => kinds.has(kind))) return "state";
  if (["actor", "useCase", "boundary", "control", "entity"].some(kind => kinds.has(kind))) return "useCase";
  if (["class", "abstractClass", "enumeration", "dataType", "object"].some(kind => kinds.has(kind))) return "class";
  if (["deploymentNode", "artifact"].some(kind => kinds.has(kind))) return "deployment";
  return "component";
}

export function parseArchitectureDsl(source: string, existingDiagram = null) {
  const lines = String(source || "").split(/\r?\n/);
  const firstContent = lines.findIndex(line => line.trim() && !isComment(line));
  if (firstContent < 0) throw new ArchitectureDslError("Expected a UML diagram declaration", 1);
  const header = lines[firstContent].trim().match(new RegExp(`^(?:uml|diagram)(?:\\s+(${identifierPattern}))?\\s+("(?:\\\\.|[^"\\\\])*")\\s*\\{$`, "i"));
  if (!header) throw new ArchitectureDslError('Expected: diagram "Diagram name" {', firstContent + 1);
  const diagram = {
    id: existingDiagram?.id || crypto.randomUUID(),
    type: header[1] || existingDiagram?.type || "component",
    name: unquote(header[2]),
    modelElementIds: [],
    elements: [],
    relationships: [],
    view: structuredClone(existingDiagram?.view || { viewport: { x: 0, y: 0, zoom: 1 }, style: { theme: "asasbits", grid: true, layoutMode: "left-right" }, nodes: {}, edges: {} }),
    validationStatus: "unchecked",
    revision: (existingDiagram?.revision || 0) + 1,
    source: String(source || "")
  };
  const aliases = new Map<string, string>();
  const relationshipRows = [];
  let closed = false;
  for (let index = firstContent + 1; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line || isComment(line)) continue;
    if (line === "}") { closed = true; break; }
    const parsedElement = parseElement(lines, index, existingDiagram, diagram.elements.length);
    if (parsedElement) {
      const alias = parsedElement.element.taggedValues.alias;
      if (aliases.has(alias.toLowerCase())) throw new ArchitectureDslError(`Duplicate element alias ${alias}`, index + 1);
      aliases.set(alias.toLowerCase(), parsedElement.element.id);
      diagram.elements.push(parsedElement.element);
      index = parsedElement.end;
      continue;
    }
    const relationship = parseRelationship(line, index + 1);
    if (relationship) { relationshipRows.push(relationship); continue; }
    throw new ArchitectureDslError("Expected a UML entity or relationship declaration", index + 1);
  }
  if (!closed) throw new ArchitectureDslError("Diagram is missing a closing brace", lines.length);
  if (!header[1]) diagram.type = inferDiagramType(diagram.elements);
  diagram.modelElementIds = diagram.elements.map(element => element.id);
  const existingRelationships = existingDiagram?.relationships || [];
  for (const row of relationshipRows) {
    const sourceId = aliases.get(row.sourceAlias.toLowerCase());
    const targetId = aliases.get(row.targetAlias.toLowerCase());
    if (!sourceId) throw new ArchitectureDslError(`Unknown source element ${row.sourceAlias}`, row.line);
    if (!targetId) throw new ArchitectureDslError(`Unknown target element ${row.targetAlias}`, row.line);
    const relationship = createRelationship(row.kind, sourceId, targetId, row.label);
    const prior = existingRelationships.find(rel => row.authoredAlias ? String(rel.taggedValues?.alias || "").toLowerCase() === row.authoredAlias.toLowerCase() : rel.kind === row.kind && rel.source === sourceId && rel.target === targetId);
    if (prior?.id) relationship.id = prior.id;
    relationship.taggedValues = { ...(prior?.taggedValues || {}), alias: row.authoredAlias || prior?.taggedValues?.alias || `R${diagram.relationships.length + 1}` };
    relationship.route = structuredClone(prior?.route || relationship.route);
    if (row.sourceSide) relationship.route.sourceSide = row.sourceSide;
    if (row.targetSide) relationship.route.targetSide = row.targetSide;
    diagram.relationships.push(relationship);
  }
  return diagram;
}

export function serializeArchitectureDsl(diagram) {
  const aliasById = new Map<string, string>();
  const usedAliases = new Set<string>();
  const elementAlias = (element, index) => {
    const base = String(element.taggedValues?.alias || `E${index + 1}`).replace(/[^A-Za-z0-9_-]/g, "_");
    const root = /^[A-Za-z]/.test(base) ? base : `E_${base}`;
    let alias = root;
    for (let suffix = 2; usedAliases.has(alias.toLowerCase()); suffix++) alias = `${root}_${suffix}`;
    usedAliases.add(alias.toLowerCase());
    aliasById.set(element.id, alias);
    return alias;
  };
  const elementAliases = (diagram?.elements || []).map(elementAlias);
  const lines = [`diagram ${quote(diagram?.name || "System architecture")} {`];
  (diagram?.elements || []).forEach((element, index) => {
    const alias = elementAliases[index];
    const properties = element.properties || {};
    const propertyLines = [];
    if (element.stereotype && element.stereotype !== element.kind) propertyLines.push(`<<${element.stereotype}>>`);
    (properties.attributes || []).forEach(value => propertyLines.push(value));
    (properties.operations || []).forEach(value => propertyLines.push(value));
    if (properties.documentation) propertyLines.push(`doc ${quote(properties.documentation)}`);
    if (properties.body && properties.body !== properties.documentation) propertyLines.push(`body ${quote(properties.body)}`);
    const declaration = `  ${sourceElementKind(element.kind)} ${quote(element.name)} as ${alias}`;
    if (!propertyLines.length) lines.push(declaration);
    else lines.push(`${declaration} {`, ...propertyLines.map(line => `    ${line}`), "  }");
  });
  (diagram?.relationships || []).forEach(relationship => {
    const source = aliasById.get(relationship.source);
    const target = aliasById.get(relationship.target);
    if (!source || !target) return;
    const operator = ({ association: "--", dependency: "..>", generalization: "--|>", realization: "..|>", aggregation: "o--", composition: "*--" })[relationship.kind] || "->";
    const prefix = ["association", "dependency", "generalization", "realization", "aggregation", "composition"].includes(relationship.kind) ? "" : `${sourceRelationshipKind(relationship.kind)} `;
    lines.push(`  ${prefix}${source} ${operator} ${target}${relationship.label ? ` : ${quote(relationship.label)}` : ""}`);
  });
  lines.push("}");
  return lines.join("\n");
}
