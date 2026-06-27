export const UML_ELEMENT_KINDS = [
  "class", "abstractClass", "enumeration", "dataType", "object",
  "package", "component", "port", "interfaceConnector",
  "deploymentNode", "artifact", "subsystem", "actor", "useCase", "boundary", "control",
  "entity", "lifeline", "activation", "frame", "message", "activity",
  "activityObject", "activityFrame", "interruptibleRegion", "signalSend",
  "signalReceive", "guard", "decision", "merge", "start", "end",
  "initialState", "finalState", "state", "forkJoin", "swimlane", "note",
  "constraint"
];

export const UML_PALETTE_GROUPS = [
  { name: "Structural", kinds: ["class", "abstractClass", "enumeration", "dataType", "object", "package", "component", "subsystem", "port", "deploymentNode", "artifact"] },
  { name: "Use Case", kinds: ["actor", "useCase", "boundary", "control", "entity"] },
  { name: "Sequence", kinds: ["lifeline", "activation", "frame", "message"] },
  { name: "Activity", kinds: ["start", "activity", "activityObject", "decision", "merge", "forkJoin", "swimlane", "interruptibleRegion", "signalSend", "signalReceive", "guard", "activityFrame", "end"] },
  { name: "State", kinds: ["initialState", "state", "finalState"] },
  { name: "Annotation", kinds: ["note", "constraint"] }
];

export const UML_RELATIONSHIP_KINDS = [
  "association", "dependency", "generalization", "realization", "aggregation",
  "composition", "include", "extend", "message", "controlFlow", "objectFlow",
  "interruptFlow", "interfaceConnector", "delegation"
];

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;

const DEFAULT_SHAPES = {
  actor: [132, 128],
  useCase: [190, 94],
  boundary: [150, 110],
  control: [150, 110],
  entity: [150, 110],
  lifeline: [170, 300],
  activation: [34, 190],
  frame: [280, 190],
  message: [160, 48],
  activity: [190, 78],
  activityObject: [170, 70],
  activityFrame: [360, 260],
  interruptibleRegion: [300, 210],
  signalSend: [150, 78],
  signalReceive: [150, 78],
  guard: [170, 58],
  decision: [110, 90],
  merge: [110, 90],
  start: [58, 58],
  end: [70, 70],
  initialState: [58, 58],
  finalState: [70, 70],
  state: [190, 84],
  forkJoin: [190, 24],
  swimlane: [260, 320],
  package: [220, 130],
  component: [220, 104],
  subsystem: [300, 190],
  port: [44, 44],
  interfaceConnector: [150, 72],
  deploymentNode: [230, 130],
  artifact: [180, 110],
  note: [180, 110],
  constraint: [170, 74],
  object: [190, 86]
};

const DEFAULT_STEREOTYPES = {
  enumeration: "enumeration",
  dataType: "dataType",
  component: "component",
  subsystem: "subsystem",
  boundary: "boundary",
  control: "control",
  entity: "entity",
  artifact: "artifact"
};

export function createElement(kind, name, x, y, width, height) {
  const [defaultWidth, defaultHeight] = DEFAULT_SHAPES[kind] || [180, 92];
  return {
    id: id("el"),
    kind,
    name,
    stereotype: DEFAULT_STEREOTYPES[kind] || "",
    taggedValues: {},
    properties: {
      attributes: ["class", "abstractClass", "object"].includes(kind) ? ["+ id: UUID"] : kind === "enumeration" ? ["Ready", "Faulted", "Stopped"] : [],
      operations: ["class", "abstractClass"].includes(kind) ? ["+ validate(): Result"] : [],
      visibility: "public",
      multiplicity: "",
      documentation: "",
      body: ""
    },
    validation: [],
    view: { x, y, width: width || defaultWidth, height: height || defaultHeight, z: 1, collapsed: false, style: { textScale: 1 } }
  };
}

export function createRelationship(kind, source, target, label = "") {
  return {
    id: id("rel"),
    kind,
    source,
    target,
    label,
    endpoints: { sourceMultiplicity: "", targetMultiplicity: "", navigable: true, ownership: "none" },
    route: { points: [], labelOffset: { x: 0, y: -8 }, sourceSide: "", targetSide: "" },
    validation: []
  };
}

export function validateDiagram(diagram) {
  const warnings = [];
  if (!diagram) return { status: "error", warnings: [{ message: "Missing diagram" }] };
  const ids = new Set((diagram.elements || []).map((e) => e.id));
  for (const element of diagram.elements || []) {
    if (!UML_ELEMENT_KINDS.includes(element.kind)) warnings.push({ elementId: element.id, message: `Unsupported UML element kind: ${element.kind}` });
    if (!element.name?.trim()) warnings.push({ elementId: element.id, message: "UML element should have a name" });
    if (diagram.type === "sequence" && !["lifeline", "activation", "message", "frame", "note", "constraint"].includes(element.kind)) warnings.push({ elementId: element.id, message: "Sequence diagrams should use lifelines, activations, messages, frames, and notes" });
    if (diagram.type === "component" && !["component", "subsystem", "port", "interfaceConnector", "package", "artifact", "note", "constraint"].includes(element.kind)) warnings.push({ elementId: element.id, message: "Component diagrams should use components, subsystems, ports, interface connectors, packages, artifacts, notes, and constraints" });
    if (diagram.type === "activity" && !["start", "end", "activity", "activityObject", "activityFrame", "interruptibleRegion", "signalSend", "signalReceive", "guard", "decision", "merge", "forkJoin", "swimlane", "note", "constraint"].includes(element.kind)) warnings.push({ elementId: element.id, message: "Activity diagrams should use actions, objects, decisions, merges, fork/join bars, swimlanes, regions, signals, guards, notes, and start/end nodes" });
    if (diagram.type === "component" && element.kind === "component" && !element.stereotype && !element.view?.style?.showComponentIcon) warnings.push({ elementId: element.id, message: "Component shapes should include a <<component>> stereotype or component icon" });
  }
  for (const rel of diagram.relationships || []) {
    if (!UML_RELATIONSHIP_KINDS.includes(rel.kind)) warnings.push({ relationshipId: rel.id, message: `Unsupported relationship kind: ${rel.kind}` });
    if (!ids.has(rel.source) || !ids.has(rel.target)) warnings.push({ relationshipId: rel.id, message: "Relationship endpoint is missing from the diagram" });
    if (rel.kind === "generalization" && rel.source === rel.target) warnings.push({ relationshipId: rel.id, message: "Generalization cannot target itself" });
  }
  return { status: warnings.length ? "warning" : "valid", warnings };
}

export function applyAutoLayout(diagram, mode = "layered") {
  const next = structuredClone(diagram);
  const elements = next.elements || [];
  const incoming = new Map(elements.map((el) => [el.id, 0]));
  const outgoing = new Map(elements.map((el) => [el.id, 0]));
  for (const rel of next.relationships || []) {
    incoming.set(rel.target, (incoming.get(rel.target) || 0) + 1);
    outgoing.set(rel.source, (outgoing.get(rel.source) || 0) + 1);
  }
  const ordered = [...elements].sort((a, b) => (incoming.get(a.id) || 0) - (incoming.get(b.id) || 0) || a.name.localeCompare(b.name));
  const placeGrid = (cols, gapX, gapY, startX = 120, startY = 120) => ordered.forEach((el, i) => {
    el.view.x = startX + (i % cols) * gapX;
    el.view.y = startY + Math.floor(i / cols) * gapY;
    el.view.z = i + 1;
  });
  if (["layered", "layered-tb", "hierarchical"].includes(mode)) {
    const layers = buildLayers(ordered, next.relationships || []);
    layers.forEach((layer, row) => layer.forEach((el, col) => {
      el.view.x = 120 + col * 280;
      el.view.y = 110 + row * 185;
      el.view.z = row * 100 + col;
    }));
  } else if (["left-right", "layered-lr", "service-flow"].includes(mode)) {
    const layers = buildLayers(ordered, next.relationships || []);
    layers.forEach((layer, col) => layer.forEach((el, row) => {
      el.view.x = 120 + col * 300;
      el.view.y = 110 + row * 170;
      el.view.z = col * 100 + row;
    }));
  } else if (mode === "c4-nested") {
    const containers = ordered.filter((el) => ["package", "subsystem", "component", "deploymentNode"].includes(el.kind));
    const leaves = ordered.filter((el) => !containers.includes(el));
    containers.forEach((el, i) => {
      el.view.x = 80 + (i % 2) * 470;
      el.view.y = 80 + Math.floor(i / 2) * 330;
      el.view.width = Math.max(el.view.width, 390);
      el.view.height = Math.max(el.view.height, 250);
      el.view.z = i;
    });
    leaves.forEach((el, i) => {
      const parent = containers[i % Math.max(1, containers.length)];
      el.view.x = parent ? parent.view.x + 35 + (i % 2) * 180 : 140 + (i % 3) * 230;
      el.view.y = parent ? parent.view.y + 72 + Math.floor(i / 2) * 105 : 140 + Math.floor(i / 3) * 150;
      el.view.z = 100 + i;
    });
  } else if (mode === "radial") {
    const hub = ordered.reduce((best, el) => ((incoming.get(el.id) || 0) + (outgoing.get(el.id) || 0)) > ((incoming.get(best.id) || 0) + (outgoing.get(best.id) || 0)) ? el : best, ordered[0]);
    const cx = 520;
    const cy = 360;
    if (hub) {
      hub.view.x = cx - hub.view.width / 2;
      hub.view.y = cy - hub.view.height / 2;
    }
    ordered.filter((el) => el !== hub).forEach((el, i, arr) => {
      const angle = (Math.PI * 2 * i) / Math.max(1, arr.length);
      const radius = arr.length > 8 ? 360 : 280;
      el.view.x = Math.round(cx + Math.cos(angle) * radius - el.view.width / 2);
      el.view.y = Math.round(cy + Math.sin(angle) * radius - el.view.height / 2);
      el.view.z = i + 1;
    });
  } else if (mode === "organic") {
    ordered.forEach((el, i) => {
      const band = i % 5;
      el.view.x = 120 + band * 230 + (Math.floor(i / 5) % 2) * 70;
      el.view.y = 110 + Math.floor(i / 5) * 180 + (band % 2) * 45;
      el.view.z = i + 1;
    });
  } else if (mode === "matrix") {
    placeGrid(Math.ceil(Math.sqrt(Math.max(1, ordered.length))), 250, 165, 100, 100);
  } else {
    placeGrid(mode === "compact" ? 3 : 2, mode === "compact" ? 220 : 270, mode === "compact" ? 150 : 190);
  }
  next.relationships.forEach((rel) => {
    rel.route = { points: [], labelOffset: { x: 0, y: -10 } };
  });
  next.view.style.layoutMode = mode;
  next.revision = (next.revision || 0) + 1;
  return next;
}

function buildLayers(elements, relationships) {
  const byId = new Map(elements.map((el) => [el.id, el]));
  const rank = new Map(elements.map((el) => [el.id, 0]));
  for (let i = 0; i < elements.length; i++) {
    for (const rel of relationships) {
      if (byId.has(rel.source) && byId.has(rel.target)) {
        rank.set(rel.target, Math.max(rank.get(rel.target) || 0, (rank.get(rel.source) || 0) + 1));
      }
    }
  }
  const layers = [];
  for (const el of elements) {
    const index = Math.min(rank.get(el.id) || 0, 8);
    layers[index] ||= [];
    layers[index].push(el);
  }
  return layers.filter(Boolean);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function textLines(value) {
  return String(value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function truncateText(value, maxChars) {
  const text = String(value ?? "");
  if (maxChars < 4) return "";
  return text.length > maxChars ? `${text.slice(0, maxChars - 3)}...` : text;
}

function maxCharsFor(width, textScale = 1, charWidth = 7) {
  return Math.max(4, Math.floor(width / (charWidth * textScale)));
}

function textBlock(lines, { x, y, width, className = "member", anchor = "start", lineHeight = 17, maxLines = 4, textScale = 1 }) {
  const maxChars = maxCharsFor(width, textScale, className === "node-title" ? 8 : 7);
  return lines.slice(0, maxLines).map((line, i) => (
    `<text x="${x}" y="${y + i * lineHeight}" ${anchor === "middle" ? `text-anchor="middle"` : ""} class="${className}">${esc(truncateText(line, maxChars))}</text>`
  )).join("");
}

function bounds(diagram) {
  const els = diagram.elements || [];
  if (!els.length) return { minX: 0, minY: 0, width: 960, height: 640 };
  const minX = Math.min(...els.map((e) => e.view.x)) - 80;
  const minY = Math.min(...els.map((e) => e.view.y)) - 80;
  const maxX = Math.max(...els.map((e) => e.view.x + e.view.width)) + 120;
  const maxY = Math.max(...els.map((e) => e.view.y + e.view.height)) + 120;
  return { minX, minY, width: Math.max(960, maxX - minX), height: Math.max(640, maxY - minY) };
}

function center(el) {
  return { x: el.view.x + el.view.width / 2, y: el.view.y + el.view.height / 2 };
}

function boundaryPoint(el, toward) {
  const c = center(el);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (dx === 0 && dy === 0) return c;
  if (el.kind === "interfaceConnector") return sidePoint(el, dx >= 0 ? "right" : "left");
  const halfW = el.view.width / 2;
  const halfH = el.view.height / 2;
  const scale = Math.min(Math.abs(halfW / (dx || 0.0001)), Math.abs(halfH / (dy || 0.0001)));
  return {
    x: c.x + dx * scale,
    y: c.y + dy * scale
  };
}

function sidePoint(el, side) {
  const { x, y, width, height } = el.view;
  if (el.kind === "interfaceConnector") return { x: side === "right" ? x + width - 4 : x + 4, y: y + height / 2 };
  if (side === "top") return { x: x + width / 2, y };
  if (side === "right") return { x: x + width, y: y + height / 2 };
  if (side === "bottom") return { x: x + width / 2, y: y + height };
  if (side === "left") return { x, y: y + height / 2 };
  return center(el);
}

function sideToward(el, toward) {
  const c = center(el);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (el.kind === "interfaceConnector") return dx >= 0 ? "right" : "left";
  return Math.abs(dx / el.view.width) >= Math.abs(dy / el.view.height) ? (dx >= 0 ? "right" : "left") : (dy >= 0 ? "bottom" : "top");
}

const sideVector = side => ({ top: { x: 0, y: -1 }, right: { x: 1, y: 0 }, bottom: { x: 0, y: 1 }, left: { x: -1, y: 0 } })[side] || { x: 1, y: 0 };

function orthogonalPoints(start, end, sourceSide, targetSide) {
  const stub = 24;
  const sourceVector = sideVector(sourceSide);
  const targetVector = sideVector(targetSide);
  const sourceStub = { x: start.x + sourceVector.x * stub, y: start.y + sourceVector.y * stub };
  const targetStub = { x: end.x + targetVector.x * stub, y: end.y + targetVector.y * stub };
  let points;
  const sourceHorizontal = sourceVector.x !== 0;
  const targetHorizontal = targetVector.x !== 0;
  if (sourceSide === targetSide) {
    if (sourceHorizontal) {
      const outsideX = sourceSide === "right" ? Math.max(sourceStub.x, targetStub.x) + stub : Math.min(sourceStub.x, targetStub.x) - stub;
      points = [start, sourceStub, { x: outsideX, y: sourceStub.y }, { x: outsideX, y: targetStub.y }, targetStub, end];
    } else {
      const outsideY = sourceSide === "bottom" ? Math.max(sourceStub.y, targetStub.y) + stub : Math.min(sourceStub.y, targetStub.y) - stub;
      points = [start, sourceStub, { x: sourceStub.x, y: outsideY }, { x: targetStub.x, y: outsideY }, targetStub, end];
    }
  } else if (sourceHorizontal && targetHorizontal) {
    const midX = (sourceStub.x + targetStub.x) / 2;
    points = [start, sourceStub, { x: midX, y: sourceStub.y }, { x: midX, y: targetStub.y }, targetStub, end];
  } else if (!sourceHorizontal && !targetHorizontal) {
    const midY = (sourceStub.y + targetStub.y) / 2;
    points = [start, sourceStub, { x: sourceStub.x, y: midY }, { x: targetStub.x, y: midY }, targetStub, end];
  } else {
    points = sourceHorizontal
      ? [start, sourceStub, { x: targetStub.x, y: sourceStub.y }, targetStub, end]
      : [start, sourceStub, { x: sourceStub.x, y: targetStub.y }, targetStub, end];
  }
  return points.filter((point, index) => !index || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
}

function roundedPath(points, radius = 10) {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const beforeLength = Math.hypot(corner.x - previous.x, corner.y - previous.y);
    const afterLength = Math.hypot(next.x - corner.x, next.y - corner.y);
    const bend = Math.min(radius, beforeLength / 2, afterLength / 2);
    const before = { x: corner.x + (previous.x - corner.x) * bend / (beforeLength || 1), y: corner.y + (previous.y - corner.y) * bend / (beforeLength || 1) };
    const after = { x: corner.x + (next.x - corner.x) * bend / (afterLength || 1), y: corner.y + (next.y - corner.y) * bend / (afterLength || 1) };
    path += ` L ${before.x} ${before.y} Q ${corner.x} ${corner.y} ${after.x} ${after.y}`;
  }
  const end = points[points.length - 1];
  return `${path} L ${end.x} ${end.y}`;
}

function pathMidpoint(points) {
  const segments = points.slice(1).map((point, index) => ({ start: points[index], end: point, length: Math.hypot(point.x - points[index].x, point.y - points[index].y) }));
  const halfway = segments.reduce((sum, segment) => sum + segment.length, 0) / 2;
  let travelled = 0;
  for (const segment of segments) {
    if (travelled + segment.length >= halfway) {
      const ratio = (halfway - travelled) / (segment.length || 1);
      return { x: segment.start.x + (segment.end.x - segment.start.x) * ratio, y: segment.start.y + (segment.end.y - segment.start.y) * ratio };
    }
    travelled += segment.length;
  }
  return points[points.length - 1];
}

function pathMidpointGeometry(points) {
  const segments = points.slice(1).map((point, index) => ({ start: points[index], end: point, length: Math.hypot(point.x - points[index].x, point.y - points[index].y) }));
  const halfway = segments.reduce((sum, segment) => sum + segment.length, 0) / 2;
  let travelled = 0;
  for (const segment of segments) {
    if (travelled + segment.length >= halfway) {
      const ratio = (halfway - travelled) / (segment.length || 1);
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
        angle: Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x) * 180 / Math.PI
      };
    }
    travelled += segment.length;
  }
  const end = points[points.length - 1];
  return { x: end.x, y: end.y, angle: 0 };
}

function renderInterfaceAssembly(points) {
  const midpoint = pathMidpointGeometry(points);
  return `<g class="interface-assembly" transform="translate(${midpoint.x} ${midpoint.y}) rotate(${midpoint.angle})" pointer-events="none">
    <rect x="-32" y="-13" width="64" height="26" rx="5" fill="#fff"/>
    <line x1="-30" y1="0" x2="-16" y2="0" stroke="#3c4658" stroke-width="2"/>
    <circle cx="-8" cy="0" r="8" fill="#fff" stroke="#3c4658" stroke-width="2"/>
    <path d="M 8 -10 A 10 10 0 0 1 8 10" fill="none" stroke="#3c4658" stroke-width="2"/>
    <line x1="8" y1="0" x2="30" y2="0" stroke="#3c4658" stroke-width="2"/>
  </g>`;
}

function relationshipGeometry(rel, byId) {
  const source = byId.get(rel.source);
  const target = byId.get(rel.target);
  if (!source || !target) return null;
  const sourceSide = rel.route?.sourceSide || sideToward(source, center(target));
  const targetSide = rel.route?.targetSide || sideToward(target, center(source));
  const start = sidePoint(source, sourceSide);
  const end = sidePoint(target, targetSide);
  const points = orthogonalPoints(start, end, sourceSide, targetSide);
  return { start, end, sourceSide, targetSide, points, path: roundedPath(points) };
}

function renderRelationship(rel, byId) {
  const geometry = relationshipGeometry(rel, byId);
  if (!geometry) return "";
  const { start: a, end: b, points, path } = geometry;
  const dash = ["realization", "include", "extend", "objectFlow"].includes(rel.kind) ? `stroke-dasharray="7 6"` : rel.kind === "dependency" ? `stroke-dasharray="2 6" stroke-linecap="round"` : "";
  const relClass = rel.kind === "dependency" ? "uml-dependency" : rel.kind === "interfaceConnector" ? "uml-interface-link" : "";
  const midpoint = pathMidpoint(points);
  const interfaceMidpoint = rel.kind === "interfaceConnector" ? pathMidpointGeometry(points) : null;
  const interfaceAngle = interfaceMidpoint ? interfaceMidpoint.angle * Math.PI / 180 : 0;
  const interfaceLabelDistance = interfaceMidpoint && Math.abs(Math.sin(interfaceAngle)) > 0.7 ? 62 : 26;
  const labelX = interfaceMidpoint ? interfaceMidpoint.x + Math.sin(interfaceAngle) * interfaceLabelDistance : midpoint.x + (rel.route?.labelOffset?.x || 0);
  const labelY = interfaceMidpoint ? interfaceMidpoint.y - Math.cos(interfaceAngle) * interfaceLabelDistance : midpoint.y + (rel.route?.labelOffset?.y || -8);
  const cap = renderConnectorCap(rel.kind, points.at(-2) || a, b);
  const interrupt = rel.kind === "interruptFlow" ? renderInterruptZigZag(a, b) : "";
  const interfaceAssembly = rel.kind === "interfaceConnector" ? renderInterfaceAssembly(points) : "";
  return `<g class="uml-edge ${relClass}" data-id="${esc(rel.id)}">
    <path class="edge-hit" d="${path}" fill="none" stroke="transparent" stroke-width="16"/>
    <path class="edge-path" d="${path}" fill="none" stroke="#3c4658" stroke-width="2" stroke-linejoin="round" ${dash}/>
    ${interfaceAssembly}
    ${cap}
    ${interrupt}
    <rect class="edge-label-bg" x="${labelX - 48}" y="${labelY - 15}" width="96" height="22" rx="4" fill="#ffffff" opacity=".88"/>
    <text x="${labelX}" y="${labelY}" text-anchor="middle" class="edge-label">${esc(rel.label || (rel.kind === "interfaceConnector" ? "interface" : rel.kind))}</text>
  </g>`;
}

function renderConnectorCap(kind, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const point = (distance, spread) => ({
    x: end.x - ux * distance + px * spread,
    y: end.y - uy * distance + py * spread
  });
  const p1 = point(18, 8);
  const p2 = point(18, -8);
  if (["dependency", "include", "extend", "controlFlow", "objectFlow", "interruptFlow"].includes(kind)) {
    return `<path class="connector-cap open-arrow" d="M ${p1.x} ${p1.y} L ${end.x} ${end.y} L ${p2.x} ${p2.y}" fill="none" stroke="#3c4658" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (["generalization", "realization"].includes(kind)) {
    const base = point(20, 0);
    const t1 = point(22, 10);
    const t2 = point(22, -10);
    return `<path class="connector-cap hollow-triangle" d="M ${end.x} ${end.y} L ${t1.x} ${t1.y} L ${t2.x} ${t2.y} Z" fill="#fff" stroke="#3c4658" stroke-width="2" stroke-linejoin="round"/><line x1="${base.x}" y1="${base.y}" x2="${end.x}" y2="${end.y}" stroke="#3c4658" stroke-width="2" opacity="0"/>`;
  }
  if (["aggregation", "composition"].includes(kind)) {
    const d1 = point(12, 8);
    const d2 = point(24, 0);
    const d3 = point(12, -8);
    const fill = kind === "composition" ? "#3c4658" : "#fff";
    return `<path class="connector-cap ${kind}" d="M ${end.x} ${end.y} L ${d1.x} ${d1.y} L ${d2.x} ${d2.y} L ${d3.x} ${d3.y} Z" fill="${fill}" stroke="#3c4658" stroke-width="2" stroke-linejoin="round"/>`;
  }
  if (kind === "directionalAssociation" || kind === "message") {
    return `<path class="connector-cap open-arrow" d="M ${p1.x} ${p1.y} L ${end.x} ${end.y} L ${p2.x} ${p2.y}" fill="none" stroke="#3c4658" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return "";
}

function renderInterruptZigZag(start, end) {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  return `<path class="interrupt-zigzag" d="M ${midX - 18} ${midY - 10} L ${midX - 6} ${midY + 10} L ${midX + 6} ${midY - 10} L ${midX + 18} ${midY + 10}" fill="none" stroke="#b42318" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function renderElement(el) {
  const { x, y, width: w, height: h } = el.view;
  const name = esc(el.name);
  const stereo = el.stereotype ? `&laquo;${esc(el.stereotype)}&raquo;` : "";
  const textScale = Number(el.view?.style?.textScale || 1);
  const textVars = `--title-size:${Math.round(14 * textScale * 10) / 10}px;--member-size:${Math.round(12 * textScale * 10) / 10}px;--stereo-size:${Math.round(11 * textScale * 10) / 10}px`;
  const titleText = truncateText(el.name, maxCharsFor(w - 16, textScale, 8));
  const body = textLines(el.properties?.body || "");
  const centeredBody = (centerY, maxLines = 2) => textBlock(body.length ? body : [titleText], { x: w / 2, y: centerY, width: w - 18, className: "node-title", anchor: "middle", lineHeight: Math.max(15, 17 * textScale), maxLines, textScale });
  const drawCompartment = (top = 42) => {
    const attrs = el.properties?.attributes || [];
    const ops = el.properties?.operations || [];
    const lineHeight = Math.max(15, Math.round(17 * textScale));
    const available = Math.max(0, h - top - 18);
    const attrMax = Math.max(0, Math.min(attrs.length, Math.floor(available * 0.48 / lineHeight)));
    const divider = Math.min(h - 34, top + 14 + attrMax * lineHeight);
    const opMax = Math.max(0, Math.floor((h - divider - 14) / lineHeight));
    return `
      <line x1="0" y1="${top}" x2="${w}" y2="${top}" stroke="#233044" stroke-width="1.5"/>
      ${textBlock(attrs, { x: 12, y: top + lineHeight, width: w - 24, lineHeight, maxLines: attrMax, textScale })}
      <line x1="0" y1="${divider}" x2="${w}" y2="${divider}" stroke="#233044" stroke-width="1.2"/>
      ${textBlock(ops, { x: 12, y: divider + lineHeight, width: w - 24, lineHeight, maxLines: opMax, textScale })}
    `;
  };
  if (["class", "abstractClass", "enumeration", "dataType", "object"].includes(el.kind)) {
    const attrs = el.kind === "enumeration" ? (el.properties?.attributes || []) : null;
    const titleDecoration = el.kind === "object" ? "text-decoration:underline" : el.kind === "abstractClass" ? "font-style:italic" : "";
    const title = truncateText(name, maxCharsFor(w - 20, textScale, 8));
    const enumMax = Math.max(0, Math.floor((h - 56) / Math.max(15, 18 * textScale)));
    return `<g class="uml-node uml-${esc(el.kind)}" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="#ffffff" stroke="#233044" stroke-width="2"/>
      <rect x="0" y="0" width="${w}" height="42" rx="4" fill="#edf5ff" stroke="#233044" stroke-width="2"/>
      ${stereo ? `<text x="${w / 2}" y="16" text-anchor="middle" class="stereo">${stereo}</text>` : ""}
      <text x="${w / 2}" y="${stereo ? 33 : 27}" text-anchor="middle" class="node-title" style="${titleDecoration}">${title}</text>
      ${attrs ? `<line x1="0" y1="42" x2="${w}" y2="42" stroke="#233044" stroke-width="1.5"/>${textBlock(attrs, { x: 14, y: 64, width: w - 28, lineHeight: Math.max(15, 18 * textScale), maxLines: enumMax, textScale })}` : drawCompartment(42)}
    </g>`;
  }
  if (el.kind === "actor") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <circle cx="${w / 2}" cy="22" r="15" fill="#fff" stroke="#233044" stroke-width="2"/>
      <line x1="${w / 2}" y1="37" x2="${w / 2}" y2="72" stroke="#233044" stroke-width="2"/>
      <line x1="${w / 2 - 28}" y1="50" x2="${w / 2 + 28}" y2="50" stroke="#233044" stroke-width="2"/>
      <line x1="${w / 2}" y1="72" x2="${w / 2 - 26}" y2="102" stroke="#233044" stroke-width="2"/>
      <line x1="${w / 2}" y1="72" x2="${w / 2 + 26}" y2="102" stroke="#233044" stroke-width="2"/>
      <text x="${w / 2}" y="${h + 18}" text-anchor="middle" class="node-title">${titleText}</text>
    </g>`;
  }
  if (["boundary", "control", "entity"].includes(el.kind)) {
    const cy = 38;
    const icon = el.kind === "boundary"
      ? `<circle cx="${w / 2}" cy="${cy}" r="26" fill="#fff" stroke="#233044" stroke-width="2"/><line x1="${w / 2 - 42}" y1="${cy - 22}" x2="${w / 2 - 42}" y2="${cy + 22}" stroke="#233044" stroke-width="2"/><line x1="${w / 2 - 42}" y1="${cy}" x2="${w / 2 - 26}" y2="${cy}" stroke="#233044" stroke-width="2"/>`
      : el.kind === "control"
        ? `<circle cx="${w / 2}" cy="${cy}" r="28" fill="#fff" stroke="#233044" stroke-width="2"/><path d="M ${w / 2 + 10} ${cy - 28} L ${w / 2 + 24} ${cy - 42} M ${w / 2 + 10} ${cy - 28} L ${w / 2 + 27} ${cy - 26}" stroke="#233044" stroke-width="2" fill="none"/>`
        : `<circle cx="${w / 2}" cy="${cy}" r="28" fill="#fff" stroke="#233044" stroke-width="2"/><line x1="${w / 2 - 28}" y1="${cy + 20}" x2="${w / 2 + 28}" y2="${cy + 20}" stroke="#233044" stroke-width="2"/>`;
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      ${icon}
      <text x="${w / 2}" y="${h - 10}" text-anchor="middle" class="node-title">${titleText}</text>
    </g>`;
  }
  if (el.kind === "useCase") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 6}" ry="${h / 2 - 8}" fill="#fffefb" stroke="#233044" stroke-width="2"/>
      ${centeredBody(h / 2)}
    </g>`;
  }
  if (["decision", "merge"].includes(el.kind)) {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <polygon points="${w / 2},4 ${w - 6},${h / 2} ${w / 2},${h - 4} 6,${h / 2}" fill="#fff" stroke="#233044" stroke-width="2"/>
      ${centeredBody(h / 2)}
    </g>`;
  }
  if (["start", "initialState"].includes(el.kind)) {
    const r = Math.min(w, h) / 2 - 4;
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <circle cx="${w / 2}" cy="${h / 2}" r="${r}" fill="#233044" stroke="#233044" stroke-width="2"/>
    </g>`;
  }
  if (["end", "finalState"].includes(el.kind)) {
    const r = Math.min(w, h) / 2 - 6;
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <circle cx="${w / 2}" cy="${h / 2}" r="${r}" fill="#fff" stroke="#233044" stroke-width="2"/>
      <circle cx="${w / 2}" cy="${h / 2}" r="${r - 8}" fill="#233044"/>
    </g>`;
  }
  if (el.kind === "activity") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${Math.min(28, h / 2)}" fill="#fffefb" stroke="#233044" stroke-width="2"/>
      ${centeredBody(h / 2)}
    </g>`;
  }
  if (el.kind === "activityObject") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="0" fill="#ffffff" stroke="#233044" stroke-width="2"/>
      <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" class="node-title">${name}</text>
    </g>`;
  }
  if (el.kind === "guard") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="2" fill="#ffffff" stroke="#233044" stroke-width="2"/>
      <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" class="node-title">:${esc(truncateText(el.name, maxCharsFor(w - 20, textScale, 8)))}</text>
    </g>`;
  }
  if (el.kind === "interruptibleRegion") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="none" stroke="#7b8798" stroke-width="2" stroke-dasharray="8 6"/>
      ${textBlock(body.length ? body : [el.name], { x: 16, y: 28, width: w - 32, className: "node-title", lineHeight: Math.max(15, 17 * textScale), maxLines: Math.max(1, Math.floor((h - 24) / Math.max(15, 17 * textScale))), textScale })}
    </g>`;
  }
  if (el.kind === "activityFrame") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="none" stroke="#233044" stroke-width="2"/>
      <path d="M 0 0 H 124 L 146 28 H 0 Z" fill="#edf5ff" stroke="#233044" stroke-width="2"/>
      <text x="14" y="19" class="node-title">act ${esc(truncateText(el.name, maxCharsFor(120, textScale, 8)))}</text>
    </g>`;
  }
  if (["signalSend", "signalReceive"].includes(el.kind)) {
    const points = el.kind === "signalSend"
      ? `0,0 ${w - 28},0 ${w},${h / 2} ${w - 28},${h} 0,${h}`
      : `28,0 ${w},0 ${w},${h} 28,${h} 0,${h / 2}`;
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <polygon points="${points}" fill="#ffffff" stroke="#233044" stroke-width="2"/>
      ${centeredBody(h / 2)}
    </g>`;
  }
  if (el.kind === "state") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="18" fill="#ffffff" stroke="#233044" stroke-width="2"/>
      ${centeredBody(h / 2)}
    </g>`;
  }
  if (el.kind === "forkJoin") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="2" fill="#233044" stroke="#233044" stroke-width="2"/>
      <text x="${w / 2}" y="${h + 18}" text-anchor="middle" class="edge-label">${name}</text>
    </g>`;
  }
  if (el.kind === "swimlane") {
    const laneCount = Number(el.properties?.laneCount || 3);
    const laneWidth = w / laneCount;
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="#f8fafc" stroke="#7b8798" stroke-width="2"/>
      <rect x="0" y="0" width="${w}" height="38" fill="#e9eef6" stroke="#7b8798" stroke-width="1.5"/>
      ${Array.from({ length: laneCount - 1 }, (_, i) => `<line x1="${laneWidth * (i + 1)}" y1="38" x2="${laneWidth * (i + 1)}" y2="${h}" stroke="#b8c2d1" stroke-width="1.5"/>`).join("")}
      <text x="${w / 2}" y="25" text-anchor="middle" class="node-title">${titleText}</text>
    </g>`;
  }
  if (el.kind === "lifeline") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="46" rx="3" fill="#fff" stroke="#233044" stroke-width="2"/>
      <text x="${w / 2}" y="29" text-anchor="middle" class="node-title">${titleText}</text>
      <line x1="${w / 2}" y1="46" x2="${w / 2}" y2="${h}" stroke="#697386" stroke-width="2" stroke-dasharray="8 7"/>
    </g>`;
  }
  if (el.kind === "activation") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="#ffffff" stroke="#233044" stroke-width="2"/>
      <text x="${w / 2}" y="${h + 18}" text-anchor="middle" class="edge-label">${titleText}</text>
    </g>`;
  }
  if (el.kind === "frame") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="2" fill="none" stroke="#233044" stroke-width="2"/>
      <path d="M 0 0 H 92 L 112 24 H 0 Z" fill="#edf5ff" stroke="#233044" stroke-width="2"/>
      <text x="14" y="17" class="node-title">${esc(truncateText(el.name, maxCharsFor(88, textScale, 8)))}</text>
    </g>`;
  }
  if (el.kind === "message") {
    const p1 = { x: w - 24, y: h / 2 - 8 };
    const p2 = { x: w - 24, y: h / 2 + 8 };
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <line x1="4" y1="${h / 2}" x2="${w - 8}" y2="${h / 2}" stroke="#233044" stroke-width="2"/>
      <path d="M ${p1.x} ${p1.y} L ${w - 8} ${h / 2} L ${p2.x} ${p2.y}" fill="none" stroke="#233044" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${w / 2}" y="${h / 2 - 8}" text-anchor="middle" class="edge-label">${titleText}</text>
    </g>`;
  }
  if (["component", "subsystem"].includes(el.kind)) {
    const isSubsystem = el.kind === "subsystem";
    const inner = (el.properties?.attributes || []).slice(0, 3);
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="${isSubsystem ? "#f8fafc" : "#fbfdff"}" stroke="#233044" stroke-width="2"/>
      <rect x="${w - 48}" y="16" width="28" height="22" fill="#fff" stroke="#233044" stroke-width="1.7"/>
      <rect x="${w - 58}" y="21" width="16" height="7" fill="#fff" stroke="#233044" stroke-width="1.4"/>
      <rect x="${w - 58}" y="31" width="16" height="7" fill="#fff" stroke="#233044" stroke-width="1.4"/>
      ${stereo ? `<text x="${w / 2}" y="24" text-anchor="middle" class="stereo">${stereo}</text>` : ""}
      <text x="${w / 2}" y="${stereo ? 46 : 36}" text-anchor="middle" class="node-title">${titleText}</text>
      ${isSubsystem ? `<line x1="0" y1="64" x2="${w}" y2="64" stroke="#8792a2" stroke-width="1.4"/>${textBlock(inner, { x: 18, y: 92, width: w - 36, lineHeight: 24, maxLines: Math.max(1, Math.floor((h - 82) / 24)), textScale })}` : ""}
    </g>`;
  }
  if (el.kind === "package") {
    const contained = Boolean(el.properties?.containsElements ?? (w > 260 || h > 170));
    const tabWidth = Math.max(92, Math.min(w * 0.42, name.length * 8 + 34));
    const tabHeight = 30;
    const label = contained
      ? `<text x="14" y="21" class="node-title">${esc(truncateText(el.name, maxCharsFor(tabWidth - 16, textScale, 8)))}</text>`
      : textBlock(body.length ? body : [el.name], { x: w / 2, y: h / 2 + 5, width: w - 24, className: "node-title", anchor: "middle", lineHeight: Math.max(15, 17 * textScale), maxLines: 2, textScale });
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <path d="M 0 ${tabHeight} H ${w} V ${h} H 0 Z" fill="#fffdf5" stroke="#233044" stroke-width="2"/>
      <path d="M 0 0 H ${tabWidth} L ${tabWidth + 18} ${tabHeight} H 0 Z" fill="#f8e7ae" stroke="#233044" stroke-width="2"/>
      ${label}
    </g>`;
  }
  if (el.kind === "deploymentNode") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <path d="M 18 0 H ${w} V ${h - 18} L ${w - 18} ${h} H 0 V 18 Z" fill="#fbfdff" stroke="#233044" stroke-width="2"/>
      <path d="M 18 0 L 0 18 H ${w - 18} L ${w} 0 Z M ${w - 18} 18 V ${h} M 0 18 H ${w - 18}" fill="none" stroke="#233044" stroke-width="1.5"/>
      ${centeredBody(h / 2 + 5)}
    </g>`;
  }
  if (el.kind === "artifact") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <path d="M 0 0 H ${w - 24} L ${w} 24 V ${h} H 0 Z" fill="#ffffff" stroke="#233044" stroke-width="2"/>
      <path d="M ${w - 24} 0 V 24 H ${w}" fill="none" stroke="#233044" stroke-width="1.5"/>
      ${stereo ? `<text x="${w / 2}" y="28" text-anchor="middle" class="stereo">${stereo}</text>` : ""}
      <text x="${w / 2}" y="${stereo ? 50 : h / 2 + 5}" text-anchor="middle" class="node-title">${titleText}</text>
    </g>`;
  }
  if (el.kind === "port") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="4" y="4" width="${w - 8}" height="${h - 8}" fill="#ffffff" stroke="#233044" stroke-width="2"/>
      <text x="${w / 2}" y="${h + 16}" text-anchor="middle" class="edge-label">${titleText}</text>
    </g>`;
  }
  if (el.kind === "interfaceConnector") {
    const cy = h / 2;
    const jointX = w / 2;
    const lollipopX = jointX - 8;
    const socketX = jointX + 8;
    return `<g class="uml-node uml-interface-connector" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <line class="interface-provider-stub" x1="4" y1="${cy}" x2="${lollipopX - 8}" y2="${cy}" stroke="#233044" stroke-width="2"/>
      <circle class="interface-lollipop" cx="${lollipopX}" cy="${cy}" r="8" fill="#fff" stroke="#233044" stroke-width="2"/>
      <path class="interface-socket" d="M ${socketX} ${cy - 10} A 10 10 0 0 1 ${socketX} ${cy + 10}" fill="none" stroke="#233044" stroke-width="2"/>
      <line class="interface-consumer-stub" x1="${socketX}" y1="${cy}" x2="${w - 4}" y2="${cy}" stroke="#233044" stroke-width="2"/>
      <text x="${w / 2}" y="${h + 16}" text-anchor="middle" class="edge-label">${titleText}</text>
    </g>`;
  }
  if (el.kind === "note") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <path d="M 0 0 H ${w - 24} L ${w} 24 V ${h} H 0 Z" fill="#fff8d6" stroke="#7a5d00" stroke-width="2"/>
      <path d="M ${w - 24} 0 V 24 H ${w}" fill="#f8e7ae" stroke="#7a5d00" stroke-width="1.5"/>
      ${textBlock(body.length ? body : [el.name], { x: 14, y: 32, width: w - 28, lineHeight: Math.max(15, 17 * textScale), maxLines: Math.max(1, Math.floor((h - 28) / Math.max(15, 17 * textScale))), textScale })}
    </g>`;
  }
  if (el.kind === "constraint") {
    return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="#ffffff" stroke="#233044" stroke-width="2" stroke-dasharray="7 5"/>
      <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" class="node-title">{${esc(truncateText(el.name, maxCharsFor(w - 28, textScale, 8)))}}</text>
    </g>`;
  }
  return `<g class="uml-node" style="${textVars}" data-id="${esc(el.id)}" transform="translate(${x} ${y})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="#ffffff" stroke="#233044" stroke-width="2"/>
    ${centeredBody(h / 2)}
  </g>`;
}

export function renderSvg(diagram, options = {}) {
  const box = options.viewport || bounds(diagram || { elements: [] });
  const byId = new Map((diagram.elements || []).map((e) => [e.id, e]));
  const metadata = options.includeMetadata ? `<metadata>${esc(JSON.stringify({ app: "UML Vector Studio", version: "0.1.0", diagramId: diagram.id, exportedAt: now(), source: diagram }))}</metadata>` : "";
  const selected = options.selectedId ? byId.get(options.selectedId) : null;
  const selectedRel = options.selectedRelationshipId ? (diagram.relationships || []).find((rel) => rel.id === options.selectedRelationshipId) : null;
  const selection = selected && !options.includeMetadata ? renderSelection(selected) : "";
  const relationshipSelection = selectedRel && !options.includeMetadata ? renderRelationshipSelection(selectedRel, byId) : "";
  const connectionPreview = options.connectionPreview && !options.includeMetadata ? renderConnectionPreview(options.connectionPreview, byId) : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}" viewBox="${box.minX} ${box.minY} ${box.width} ${box.height}" role="img" aria-label="${esc(diagram.name)}">
  <defs>
    <pattern id="editor-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 H 0 V 24" fill="none" stroke="#dfe6f1" stroke-width="1"/>
    </pattern>
    <style>
      .uml-node{cursor:move}.uml-edge{cursor:pointer}.edge-hit{pointer-events:stroke}.node-title{font-family:Inter,Arial,sans-serif;font-size:var(--title-size,14px);font-weight:700;fill:#172033}.member{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:var(--member-size,12px);fill:#172033}.stereo{font-family:Inter,Arial,sans-serif;font-size:var(--stereo-size,11px);fill:#516072}.edge-label{font-family:Inter,Arial,sans-serif;font-size:12px;fill:#334155}.selection-outline{fill:none;stroke:#1f6feb;stroke-width:2;stroke-dasharray:6 4;pointer-events:none}.selection-handle{fill:#fff;stroke:#1f6feb;stroke-width:2;pointer-events:none}.connection-handle,.edge-endpoint-handle{fill:#fff;stroke:#137c68;stroke-width:2;cursor:crosshair;pointer-events:all}.connection-handle:hover,.edge-endpoint-handle:hover{fill:#137c68;stroke:#fff}.connection-preview{pointer-events:none}.connection-target{fill:none;stroke:#137c68;stroke-width:3;stroke-dasharray:7 5;pointer-events:none}
    </style>
  </defs>
  ${metadata}
  <rect x="${box.minX}" y="${box.minY}" width="${box.width}" height="${box.height}" fill="#f8fafc"/>
  ${!options.includeMetadata ? `<rect x="${box.minX}" y="${box.minY}" width="${box.width}" height="${box.height}" fill="url(#editor-grid)"/>` : ""}
  ${(diagram.relationships || []).map((r) => renderRelationship(r, byId)).join("\n")}
  ${connectionPreview}
  ${(diagram.elements || []).map(renderElement).join("\n")}
  ${relationshipSelection}
  ${selection}
</svg>`;
}

function renderRelationshipSelection(rel, byId) {
  const geometry = relationshipGeometry(rel, byId);
  if (!geometry) return "";
  const { start: a, end: b, path } = geometry;
  return `<g class="uml-edge-selection" data-selected="${esc(rel.id)}">
    <path d="${path}" fill="none" stroke="#1f6feb" stroke-width="7" opacity=".18" pointer-events="none"/>
    <circle class="edge-endpoint-handle" data-relationship-id="${esc(rel.id)}" data-endpoint="source" cx="${a.x}" cy="${a.y}" r="7"/>
    <circle class="edge-endpoint-handle" data-relationship-id="${esc(rel.id)}" data-endpoint="target" cx="${b.x}" cy="${b.y}" r="7"/>
  </g>`;
}

function renderConnectionPreview(preview, byId) {
  const fixed = byId.get(preview.fixedElementId);
  if (!fixed) return "";
  const start = sidePoint(fixed, preview.fixedSide);
  const target = byId.get(preview.targetId);
  const end = target && preview.targetSide ? sidePoint(target, preview.targetSide) : preview.point || start;
  const targetSide = target && preview.targetSide ? preview.targetSide : sideToward({ kind: "preview", view: { x: end.x - 1, y: end.y - 1, width: 2, height: 2 } }, start);
  const path = roundedPath(orthogonalPoints(start, end, preview.fixedSide, targetSide));
  const targetOutline = target ? `<rect class="connection-target" x="${target.view.x - 5}" y="${target.view.y - 5}" width="${target.view.width + 10}" height="${target.view.height + 10}" rx="7"/>` : "";
  return `<g class="connection-preview">
    <path d="${path}" fill="none" stroke="#137c68" stroke-width="2.5" stroke-dasharray="8 5"/>
    <circle cx="${end.x}" cy="${end.y}" r="5" fill="#fff" stroke="#137c68" stroke-width="2"/>
    ${targetOutline}
  </g>`;
}

function renderSelection(el) {
  const { x, y, width: w, height: h } = el.view;
  const pad = 7;
  const left = x - pad;
  const top = y - pad;
  const right = x + w + pad;
  const bottom = y + h + pad;
  const points = [
    [left, top], [(left + right) / 2, top], [right, top],
    [right, (top + bottom) / 2], [right, bottom], [(left + right) / 2, bottom],
    [left, bottom], [left, (top + bottom) / 2]
  ];
  const connectionPoints = el.kind === "interfaceConnector" ? [
    [x + 4, y + h / 2, "left"], [x + w - 4, y + h / 2, "right"]
  ] : [
    [x + w / 2, y, "top"], [x + w, y + h / 2, "right"],
    [x + w / 2, y + h, "bottom"], [x, y + h / 2, "left"]
  ];
  return `<g class="uml-selection" data-selected="${esc(el.id)}">
    <rect class="selection-outline" x="${left}" y="${top}" width="${w + pad * 2}" height="${h + pad * 2}" rx="6"/>
    ${points.map(([cx, cy]) => `<rect class="selection-handle" x="${cx - 4}" y="${cy - 4}" width="8" height="8" rx="1.5"/>`).join("")}
    ${connectionPoints.map(([cx, cy, side]) => `<circle class="connection-handle" data-element-id="${esc(el.id)}" data-side="${side}" cx="${cx}" cy="${cy}" r="7"/>`).join("")}
  </g>`;
}

export function parseNotation(text, type = "class") {
  const elements = [];
  const relationships = [];
  const warnings = [];
  const byName = new Map();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith("@") || line.startsWith("'")) continue;
    const classMatch = line.match(/^(class|abstractclass|interface|interfaceconnector|enumeration|enum|datatype|object|activityobject|package|component|subsystem|node|artifact|actor|usecase|boundary|control|entity|lifeline|activation|frame|message|activity|activityframe|interruptibleregion|signalsend|signalreceive|guard|decision|merge|start|end|initialstate|finalstate|state|forkjoin|swimlane|note|constraint)\s+"?([^"{]+)"?/i);
    if (classMatch) {
      const kindMap = { usecase: "useCase", abstractclass: "abstractClass", interfaceconnector: "interfaceConnector", enum: "enumeration", datatype: "dataType", node: "deploymentNode", activityobject: "activityObject", activityframe: "activityFrame", interruptibleregion: "interruptibleRegion", signalsend: "signalSend", signalreceive: "signalReceive", initialstate: "initialState", finalstate: "finalState", forkjoin: "forkJoin" };
      const kind = kindMap[classMatch[1].toLowerCase()] || classMatch[1].toLowerCase();
      const el = createElement(kind, classMatch[2].trim(), 120 + elements.length * 230, 140 + (elements.length % 2) * 170);
      elements.push(el);
      byName.set(el.name, el.id);
      continue;
    }
    const relMatch = line.match(/^"?([^"<]+)"?\s+([.<|*o-]+)\s+"?([^":]+)"?(?:\s*:\s*(.+))?/);
    if (relMatch) {
      const sourceName = relMatch[1].trim();
      const targetName = relMatch[3].trim();
      for (const name of [sourceName, targetName]) {
        if (!byName.has(name)) {
          const el = createElement("class", name, 120 + elements.length * 230, 140 + (elements.length % 2) * 170);
          elements.push(el);
          byName.set(name, el.id);
        }
      }
      const token = relMatch[2];
      const kind = token.includes("<|") ? "generalization" : token.includes("..") ? "dependency" : token.includes("*") ? "composition" : token.includes("o") ? "aggregation" : "association";
      relationships.push(createRelationship(kind, byName.get(sourceName), byName.get(targetName), relMatch[4] || kind));
      continue;
    }
    warnings.push({ line, message: "Unsupported notation was skipped" });
  }
  const diagram = {
    id: id("dia"),
    type,
    name: "Imported UML Diagram",
    modelElementIds: elements.map((e) => e.id),
    elements,
    relationships,
    view: { viewport: { x: 0, y: 0, zoom: 1 }, style: { theme: "studio", grid: true }, nodes: {}, edges: {} },
    validationStatus: "unchecked",
    revision: 1
  };
  return { diagram, warnings: [...warnings, ...validateDiagram(diagram).warnings] };
}
