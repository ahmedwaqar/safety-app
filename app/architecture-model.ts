import { createElement, createRelationship } from "./uml-core.js";

const plantUmlElementPattern = /^\s*(?:component|node|database|queue|cloud|rectangle|artifact|package|frame)\s+(?:"([^"]+)"|([^\s{]+))(?:\s+as\s+([A-Za-z0-9_.-]+))?/gim;
const plantUmlRelationshipPattern = /^\s*([A-Za-z0-9_.-]+)\s+[-.]+[->]+\s+([A-Za-z0-9_.-]+)(?:\s*:\s*(.+))?$/gm;
const componentLikeKinds = new Set(["component", "subsystem", "deploymentNode", "artifact", "package"]);

export function architectureAlias(name = "") {
  const alias = String(name).trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
  return /^[A-Z]/.test(alias) ? alias : `C_${alias || "COMPONENT"}`;
}

function plantUmlKind(kind = "component") {
  return ({ deploymentNode: "node", interfaceConnector: "interface", useCase: "usecase", abstractClass: "abstractclass", dataType: "datatype" })[kind] || kind;
}

export function componentsFromPlantUml(source = "") {
  const components: Array<{ id: string; name: string }> = [];
  const seen = new Set<string>();
  for (const match of String(source || "").matchAll(plantUmlElementPattern)) {
    const name = match[1] || match[2];
    const id = match[3] || architectureAlias(name);
    if (!seen.has(id.toLowerCase())) {
      components.push({ id, name });
      seen.add(id.toLowerCase());
    }
  }
  return components;
}

export function architectureDiagramFromPlantUml(source = "@startuml\n@enduml", name = "System architecture") {
  const components = componentsFromPlantUml(source);
  const elements = components.map((component, index) => {
    const element = createElement("component", component.name, 120 + (index % 3) * 260, 120 + Math.floor(index / 3) * 165);
    element.taggedValues.alias = component.id;
    return element;
  });
  const byAlias = new Map(elements.map(element => [element.taggedValues.alias, element.id]));
  const relationships = [...String(source || "").matchAll(plantUmlRelationshipPattern)]
    .filter(match => byAlias.has(match[1]) && byAlias.has(match[2]))
    .map(match => createRelationship("dependency", byAlias.get(match[1]), byAlias.get(match[2]), match[3]?.trim() || "interface"));
  return {
    id: crypto.randomUUID(),
    type: "component",
    name,
    modelElementIds: elements.map(element => element.id),
    elements,
    relationships,
    view: { viewport: { x: 0, y: 0, zoom: 1 }, style: { theme: "asasbits", grid: true, layoutMode: "left-right" }, nodes: {}, edges: {} },
    validationStatus: "unchecked",
    revision: 1
  };
}

export function architectureWorkspaceFromPlantUml(source = "@startuml\n@enduml", name = "System architecture") {
  const diagram = architectureDiagramFromPlantUml(source, name);
  return { diagrams: [diagram], activeDiagramId: diagram.id };
}

export function normalizeLegacyInterfaceConnectors(diagram) {
  if (!diagram?.elements?.some(element => element.kind === "interfaceConnector")) return false;
  const removedElementIds = new Set<string>();
  const removedRelationshipIds = new Set<string>();
  const replacements = [];
  const byId = new Map(diagram.elements.map(element => [element.id, element]));
  for (const connector of diagram.elements.filter(element => element.kind === "interfaceConnector")) {
    const incident = diagram.relationships.filter(rel => rel.source === connector.id || rel.target === connector.id);
    if (incident.length !== 2) continue;
    const neighbor = rel => rel.source === connector.id ? rel.target : rel.source;
    const firstNeighbor = neighbor(incident[0]);
    const secondNeighbor = neighbor(incident[1]);
    if (firstNeighbor === secondNeighbor || !byId.has(firstNeighbor) || !byId.has(secondNeighbor)) continue;
    const incoming = incident.find(rel => rel.target === connector.id);
    const outgoing = incident.find(rel => rel.source === connector.id);
    const sourceRelationship = incoming || incident[0];
    const targetRelationship = outgoing || incident.find(rel => rel !== sourceRelationship)!;
    const source = neighbor(sourceRelationship);
    const target = neighbor(targetRelationship);
    const sourceSide = sourceRelationship.source === source ? sourceRelationship.route?.sourceSide : sourceRelationship.route?.targetSide;
    const targetSide = targetRelationship.target === target ? targetRelationship.route?.targetSide : targetRelationship.route?.sourceSide;
    const replacement = createRelationship("interfaceConnector", source, target, connector.name || sourceRelationship.label || targetRelationship.label || "interface");
    replacement.route.sourceSide = sourceSide || "";
    replacement.route.targetSide = targetSide || "";
    replacements.push(replacement);
    removedElementIds.add(connector.id);
    incident.forEach(rel => removedRelationshipIds.add(rel.id));
  }
  if (!replacements.length) return false;
  diagram.elements = diagram.elements.filter(element => !removedElementIds.has(element.id));
  diagram.modelElementIds = (diagram.modelElementIds || []).filter(id => !removedElementIds.has(id));
  diagram.relationships = diagram.relationships.filter(rel => !removedRelationshipIds.has(rel.id)).concat(replacements);
  diagram.revision = (diagram.revision || 0) + 1;
  return true;
}

export function architectureComponentsFromDiagram(diagram) {
  const components: Array<{ id: string; name: string }> = [];
  const seen = new Set<string>();
  for (const element of diagram?.elements || []) {
    if (!componentLikeKinds.has(element.kind)) continue;
    const id = element.taggedValues?.alias || architectureAlias(element.name);
    if (!seen.has(id.toLowerCase())) {
      components.push({ id, name: element.name });
      seen.add(id.toLowerCase());
    }
  }
  return components;
}

export function plantUmlFromArchitectureDiagram(diagram) {
  const byId = new Map((diagram?.elements || []).map(element => [element.id, element]));
  const alias = element => element?.taggedValues?.alias || architectureAlias(element?.name || "component");
  const lines = ["@startuml", `title ${diagram?.name || "System architecture"}`];
  for (const element of diagram?.elements || []) {
    if (element.kind === "note" || element.kind === "constraint") {
      lines.push(`note "${String(element.properties?.body || element.name).replace(/"/g, "'")}" as ${alias(element)}`);
      continue;
    }
    lines.push(`${plantUmlKind(element.kind)} "${String(element.name).replace(/"/g, "'")}" as ${alias(element)}`);
  }
  for (const rel of diagram?.relationships || []) {
    const source = byId.get(rel.source);
    const target = byId.get(rel.target);
    if (source && target) lines.push(`${alias(source)} --> ${alias(target)}${rel.label ? ` : ${rel.label}` : ""}`);
  }
  lines.push("@enduml");
  return lines.join("\n");
}
