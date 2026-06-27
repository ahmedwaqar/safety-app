import { createElement, createRelationship, UML_ELEMENT_KINDS, UML_RELATIONSHIP_KINDS } from "./uml-core.js";

const identifierPattern = "[A-Za-z][A-Za-z0-9_.-]*";
const aliasPattern = "[A-Za-z][A-Za-z0-9_-]*";
const sidePattern = "top|right|bottom|left";
const elementAliases = { node: "deploymentNode", usecase: "useCase", abstractclass: "abstractClass", datatype: "dataType" };
const relationshipAliases = { interface: "interfaceConnector" };

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

function defaultPosition(index: number) {
  return { x: 120 + (index % 3) * 280, y: 120 + Math.floor(index / 3) * 180 };
}

function existingElementByAlias(diagram, alias: string) {
  return diagram?.elements?.find(element => String(element.taggedValues?.alias || "").toLowerCase() === alias.toLowerCase());
}

function parseElement(lines: string[], start: number, existingDiagram, placementIndex: number) {
  const raw = lines[start].trim();
  const match = raw.match(new RegExp(`^(${identifierPattern})\\s+(${aliasPattern})\\s+("(?:\\\\.|[^"\\\\])*")(?:\\s+at\\s+(-?\\d+(?:\\.\\d+)?)\\s*,\\s*(-?\\d+(?:\\.\\d+)?))?(?:\\s+size\\s+(\\d+(?:\\.\\d+)?)\\s*,\\s*(\\d+(?:\\.\\d+)?))?\\s*(\\{)?$`, "i"));
  if (!match) return null;
  const kind = normalizeElementKind(match[1]);
  if (!kind || kind === "interfaceConnector") return null;
  const alias = match[2];
  const prior = existingElementByAlias(existingDiagram, alias);
  const fallback = defaultPosition(placementIndex);
  const x = match[4] === undefined ? prior?.view?.x ?? fallback.x : Number(match[4]);
  const y = match[5] === undefined ? prior?.view?.y ?? fallback.y : Number(match[5]);
  const element = createElement(kind, unquote(match[3]), x, y, match[6] === undefined ? prior?.view?.width : Number(match[6]), match[7] === undefined ? prior?.view?.height : Number(match[7]));
  if (prior?.id) element.id = prior.id;
  element.taggedValues.alias = alias;
  if (!match[8]) return { element, end: start };

  element.properties.attributes = [];
  element.properties.operations = [];
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#")) continue;
    if (line === "}") return { element, end: index };
    const property = line.match(/^(stereotype|attribute|operation|documentation|body)\s+("(?:\\.|[^"\\])*")$/i);
    const textScale = line.match(/^textScale\s+(\d+(?:\.\d+)?)$/i);
    if (property) {
      const value = unquote(property[2]);
      const key = property[1].toLowerCase();
      if (key === "stereotype") element.stereotype = value;
      else if (key === "attribute") element.properties.attributes.push(value);
      else if (key === "operation") element.properties.operations.push(value);
      else element.properties[key] = value;
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

export function parseArchitectureDsl(source: string, existingDiagram = null) {
  const lines = String(source || "").split(/\r?\n/);
  const firstContent = lines.findIndex(line => line.trim() && !line.trim().startsWith("#"));
  if (firstContent < 0) throw new ArchitectureDslError("Expected a UML diagram declaration", 1);
  const header = lines[firstContent].trim().match(new RegExp(`^uml\\s+(${identifierPattern})\\s+("(?:\\\\.|[^"\\\\])*")\\s*\\{$`, "i"));
  if (!header) throw new ArchitectureDslError('Expected: uml <type> "Diagram name" {', firstContent + 1);
  const diagram = {
    id: existingDiagram?.id || crypto.randomUUID(),
    type: header[1],
    name: unquote(header[2]),
    modelElementIds: [],
    elements: [],
    relationships: [],
    view: structuredClone(existingDiagram?.view || { viewport: { x: 0, y: 0, zoom: 1 }, style: { theme: "praxis", grid: true, layoutMode: "left-right" }, nodes: {}, edges: {} }),
    validationStatus: "unchecked",
    revision: (existingDiagram?.revision || 0) + 1,
    source: String(source || "")
  };
  const aliases = new Map<string, string>();
  const relationshipRows: Array<{ line: number; match: RegExpMatchArray; kind: string }> = [];
  let closed = false;
  for (let index = firstContent + 1; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#")) continue;
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
    const relationship = line.match(new RegExp(`^(${identifierPattern})\\s+(${aliasPattern})\\s+("(?:\\\\.|[^"\\\\])*")\\s+from\\s+(${aliasPattern})(?:\\.(${sidePattern}))?\\s+to\\s+(${aliasPattern})(?:\\.(${sidePattern}))?$`, "i"));
    const kind = relationship ? normalizeRelationshipKind(relationship[1]) : "";
    if (relationship && kind) {
      relationshipRows.push({ line: index + 1, match: relationship, kind });
      continue;
    }
    throw new ArchitectureDslError("Expected a UML entity or relationship declaration", index + 1);
  }
  if (!closed) throw new ArchitectureDslError("Diagram is missing a closing brace", lines.length);
  diagram.modelElementIds = diagram.elements.map(element => element.id);
  const existingRelationships = new Map<string, any>((existingDiagram?.relationships || []).map(rel => [String(rel.taggedValues?.alias || "").toLowerCase(), rel]));
  for (const row of relationshipRows) {
    const [, , alias, label, sourceAlias, sourceSide = "", targetAlias, targetSide = ""] = row.match;
    const sourceId = aliases.get(sourceAlias.toLowerCase());
    const targetId = aliases.get(targetAlias.toLowerCase());
    if (!sourceId) throw new ArchitectureDslError(`Unknown source element ${sourceAlias}`, row.line);
    if (!targetId) throw new ArchitectureDslError(`Unknown target element ${targetAlias}`, row.line);
    const relationship = createRelationship(row.kind, sourceId, targetId, unquote(label));
    const prior = existingRelationships.get(alias.toLowerCase());
    if (prior?.id) relationship.id = prior.id;
    relationship.taggedValues = { ...(prior?.taggedValues || {}), alias };
    relationship.route.sourceSide = sourceSide.toLowerCase();
    relationship.route.targetSide = targetSide.toLowerCase();
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
  const lines = [`uml ${diagram?.type || "component"} ${quote(diagram?.name || "System architecture")} {`];
  (diagram?.elements || []).forEach((element, index) => {
    const alias = elementAliases[index];
    const view = element.view || { x: 0, y: 0, width: 180, height: 92 };
    const properties = element.properties || {};
    const propertyLines = [];
    if (element.stereotype && element.stereotype !== element.kind) propertyLines.push(`stereotype ${quote(element.stereotype)}`);
    (properties.attributes || []).forEach(value => propertyLines.push(`attribute ${quote(value)}`));
    (properties.operations || []).forEach(value => propertyLines.push(`operation ${quote(value)}`));
    if (properties.documentation) propertyLines.push(`documentation ${quote(properties.documentation)}`);
    if (properties.body && properties.body !== properties.documentation) propertyLines.push(`body ${quote(properties.body)}`);
    if (Number(element.view?.style?.textScale || 1) !== 1) propertyLines.push(`textScale ${Number(element.view.style.textScale)}`);
    const declaration = `  ${sourceElementKind(element.kind)} ${alias} ${quote(element.name)} at ${Number(view.x)}, ${Number(view.y)} size ${Number(view.width)}, ${Number(view.height)}`;
    if (!propertyLines.length) lines.push(declaration);
    else lines.push(`${declaration} {`, ...propertyLines.map(line => `    ${line}`), "  }");
  });
  (diagram?.relationships || []).forEach((relationship, index) => {
    const alias = String(relationship.taggedValues?.alias || `R${index + 1}`).replace(/[^A-Za-z0-9_-]/g, "_");
    const source = aliasById.get(relationship.source);
    const target = aliasById.get(relationship.target);
    if (!source || !target) return;
    const sourceEndpoint = `${source}${relationship.route?.sourceSide ? `.${relationship.route.sourceSide}` : ""}`;
    const targetEndpoint = `${target}${relationship.route?.targetSide ? `.${relationship.route.targetSide}` : ""}`;
    lines.push(`  ${sourceRelationshipKind(relationship.kind)} ${alias} ${quote(relationship.label || "")} from ${sourceEndpoint} to ${targetEndpoint}`);
  });
  lines.push("}");
  return lines.join("\n");
}
