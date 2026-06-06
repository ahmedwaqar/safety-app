const STORAGE_KEY = "safeguard-cobot-workspace-v1";
const WORKSPACES_KEY = "safeguard-workspaces-v1";
const ACTIVE_WORKSPACE_KEY = "safeguard-active-workspace-v1";
const PROJECT_FORMAT = "safeguard-safety-workspace";
const PROJECT_VERSION = 1;

const seed = {
  plantuml: `@startuml
title Collaborative robot cell
component "Robot controller" as CTRL
component "Cobot arm" as ARM
component "Safety PLC" as PLC
component "Area scanner" as SCAN
component "Emergency stop" as ESTOP
component "End effector" as TOOL
component "Operator HMI" as HMI

PLC --> CTRL : safe stop
SCAN --> PLC : protective field
ESTOP --> PLC : emergency stop
CTRL --> ARM : motion command
ARM --> TOOL : mechanical interface
HMI --> CTRL : task selection
@enduml`,
  components: [
    { id: "CTRL", name: "Robot controller" }, { id: "ARM", name: "Cobot arm" },
    { id: "PLC", name: "Safety PLC" }, { id: "SCAN", name: "Area scanner" },
    { id: "ESTOP", name: "Emergency stop" }, { id: "TOOL", name: "End effector" },
    { id: "HMI", name: "Operator HMI" }
  ],
  hazards: [
    { id: "H-01", name: "Unexpected robot motion", category: "Control system", description: "Uncommanded or incorrectly commanded movement creates a collision or crushing exposure." },
    { id: "H-02", name: "Tool-related injury", category: "Mechanical", description: "Contact with the end effector, workpiece, or released material causes harm." },
    { id: "H-03", name: "Loss of protective stop", category: "Control system", description: "The robot does not enter or maintain a safe state when a protective function is demanded." },
    { id: "H-04", name: "Electrical exposure", category: "Electrical", description: "Accessible energized parts create an electric shock or thermal injury risk." }
  ],
  situations: [
    { id: "OS-01", name: "Collaborative production", category: "Normal operation", description: "Operator and cobot share a workspace while the cobot performs its nominal task." },
    { id: "OS-02", name: "Teaching and setup", category: "Setup", description: "Integrator or trained operator configures poses and validates the task at reduced speed." },
    { id: "OS-03", name: "Jam recovery", category: "Intervention", description: "Operator enters the cell to remove a blocked or incorrectly positioned workpiece." },
    { id: "OS-04", name: "Maintenance", category: "Maintenance", description: "Technician inspects, repairs, or replaces robot-cell equipment." }
  ],
  requirements: [
    { id: "SR-01", text: "The safety PLC shall initiate a protective stop when a person enters the configured scanner protective field.", hazard: "H-03", component: "PLC", verification: "Validation test VT-01", status: "Verified" },
    { id: "SR-02", text: "The robot controller shall limit tool-center-point speed to 250 mm/s while teaching mode is active.", hazard: "H-01", component: "CTRL", verification: "Functional test VT-02", status: "Verified" },
    { id: "SR-03", text: "The end effector shall retain the workpiece following loss of primary power.", hazard: "H-02", component: "TOOL", verification: "Load retention test VT-03", status: "Planned" },
    { id: "SR-04", text: "The emergency-stop function shall achieve a stop category appropriate to the cell risk assessment.", hazard: "H-03", component: "ESTOP", verification: "Stop-time measurement VT-04", status: "Draft" }
  ],
  safetyGoals: [
    { id: "SG-01", text: "Prevent unintended robot motion when a person is present in the collaborative workspace.", asil: "ASIL D", safeState: "Controlled stop", ftti: "100 ms" },
    { id: "SG-02", text: "Prevent release of the workpiece during robot motion.", asil: "ASIL B", safeState: "Retain workpiece and stop motion", ftti: "200 ms" }
  ],
  hara: [
    { id: crypto.randomUUID(), eventId: "HE-01", hazard: "H-01", situation: "OS-01", malfunction: "The robot controller issues an unintended motion command while the operator shares the workspace.", consequence: "Collision or crushing injury to the operator.", severity: "S3", exposure: "E4", controllability: "C3", safetyGoal: "SG-01" },
    { id: crypto.randomUUID(), eventId: "HE-02", hazard: "H-02", situation: "OS-01", malfunction: "The end effector loses workpiece retention while the cobot is moving.", consequence: "The released workpiece strikes the operator.", severity: "S2", exposure: "E3", controllability: "C3", safetyGoal: "SG-02" }
  ],
  silAssessments: [
    { id: crypto.randomUUID(), assessmentId: "SIL-01", safetyFunction: "Protective stop on obstacle detection", hazard: "H-03", situation: "OS-01", hazardousEvent: "The AMR continues moving after a person enters its travel path, creating a collision or crushing hazard.", consequence: "C3", frequency: "F2", avoidance: "P2", demand: "W3", safeState: "Controlled protective stop", evidence: "Stopping-distance and protective-field validation" }
  ],
  quantitative: {
    safetyFunction: "Protective stop on obstacle detection",
    targetSil: "SIL 2",
    mode: "continuous",
    architecture: "1oo1",
    components: [
      { id: crypto.randomUUID(), component: "SCAN", role: "Obstacle detection", lambdaTotal: 2e-6, dangerousFraction: 0.4, diagnosticCoverage: 0.9, proofTestHours: 8760, channels: 1, beta: 0.05 },
      { id: crypto.randomUUID(), component: "PLC", role: "Safety logic", lambdaTotal: 1e-6, dangerousFraction: 0.3, diagnosticCoverage: 0.95, proofTestHours: 8760, channels: 1, beta: 0.05 },
      { id: crypto.randomUUID(), component: "CTRL", role: "Safe stop execution", lambdaTotal: 1.5e-6, dangerousFraction: 0.35, diagnosticCoverage: 0.9, proofTestHours: 8760, channels: 1, beta: 0.05 }
    ]
  },
  fmeda: {
    constants: [
      { symbol: "lambda_scanner", value: 2e-6, description: "Safety scanner total failure rate" },
      { symbol: "frac_safe", value: 0.35, description: "Scanner safe-failure fraction" },
      { symbol: "frac_dangerous", value: 0.4, description: "Scanner dangerous-failure fraction" },
      { symbol: "dc_scanner", value: 0.9, description: "Scanner diagnostic coverage" }
    ],
    rows: [
      { id: crypto.randomUUID(), component: "SCAN", failureMode: "Scanner output frozen occupied", localEffect: "Protective field reports an obstacle continuously", endEffect: "AMR enters a safe stop", classification: "safe", diagnostic: "Operator observation and scanner diagnostics", expression: "lambda_scanner * frac_safe" },
      { id: crypto.randomUUID(), component: "SCAN", failureMode: "Scanner output frozen clear detected by timeout", localEffect: "Protective-field intrusion may be missed until diagnostic response", endEffect: "Diagnostic initiates safe stop", classification: "dangerous_detected", diagnostic: "Cross-check and timeout monitor", expression: "lambda_scanner * frac_dangerous * dc_scanner" },
      { id: crypto.randomUUID(), component: "SCAN", failureMode: "Scanner output frozen clear not detected", localEffect: "Protective-field intrusion is not reported", endEffect: "Protective stop may fail on demand", classification: "dangerous_undetected", diagnostic: "Residual failure after scanner diagnostics", expression: "lambda_scanner * frac_dangerous * (1 - dc_scanner)" }
    ]
  },
  customColumns: [{ key: "owner", label: "Owner" }],
  fmea: [
    { id: crypto.randomUUID(), component: "SCAN", failureMode: "Protective field not detected", effect: "Robot continues moving while operator enters shared workspace", hazard: "H-03", situation: "OS-01", severity: 9, occurrence: 2, detection: 3, action: "Add cyclic diagnostic monitoring", custom: { owner: "Controls" } },
    { id: crypto.randomUUID(), component: "TOOL", failureMode: "Workpiece released during motion", effect: "Released part may strike the nearby operator", hazard: "H-02", situation: "OS-01", severity: 7, occurrence: 3, detection: 4, action: "Verify retention after loss of power", custom: { owner: "Mechanical" } },
    { id: crypto.randomUUID(), component: "CTRL", failureMode: "Incorrect speed limit applied", effect: "Contact energy exceeds collaborative operation limit", hazard: "H-01", situation: "OS-02", severity: 8, occurrence: 2, detection: 3, action: "Validate mode-specific speed monitoring", custom: { owner: "Controls" } },
    { id: crypto.randomUUID(), component: "ESTOP", failureMode: "Emergency-stop contact fails open", effect: "Emergency stop demand does not reach safety PLC", hazard: "H-03", situation: "OS-03", severity: 9, occurrence: 1, detection: 2, action: "Use dual-channel monitored circuit", custom: { owner: "Electrical" } }
  ]
};
function blankWorkspace() {
  return {
    plantuml: "@startuml\n@enduml", components: [], hazards: [], situations: [], requirements: [], safetyGoals: [], hara: [], silAssessments: [],
    quantitative: { safetyFunction: "", targetSil: "SIL 1", mode: "continuous", architecture: "1oo1", components: [] },
    fmeda: { constants: [], rows: [] }, customColumns: [], fmea: []
  };
}

let workspaceRegistry;
let state = load();
let diagramUrl;
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const esc = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
const itemBy = (group, id) => state[group].find(item => item.id === id);
const rpn = row => Number(row.severity) * Number(row.occurrence) * Number(row.detection);
const riskClass = score => score >= 100 ? "high" : score >= 40 ? "medium" : "low";
const asilClass = asil => `asil-${asil.replace("ASIL ", "").toLowerCase()}`;

function migrateWorkspace(workspace, defaults = blankWorkspace()) {
  for (const [key, value] of Object.entries(defaults)) workspace[key] ??= structuredClone(value);
  return workspace;
}
function validateNumber(value, label, { min = -Infinity, max = Infinity, integer = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) throw new Error(`${label} must be ${integer ? "an integer " : ""}between ${min} and ${max}.`);
  return number;
}
function requireValue(value, label) { const text = String(value ?? "").trim(); if (!text) throw new Error(`${label} is required.`); return text; }
function requireIdentifier(value, label) { const text = requireValue(value, label); if (!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(text)) throw new Error(`${label} must start with a letter and use only letters, numbers, ".", "_" or "-".`); return text; }
function requireSymbol(value, label) { const text = requireValue(value, label); if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) throw new Error(`${label} must use letters, numbers, or "_" and cannot start with a number.`); return text; }
function requireEnum(value, label, allowed) { if (!allowed.includes(value)) throw new Error(`${label} must be one of: ${allowed.join(", ")}.`); return value; }
function sameIdentifier(left, right) { return String(left ?? "").trim().toLowerCase() === String(right ?? "").trim().toLowerCase(); }
function requireUniqueIdentifier(items, value, label, { field = "id", ignoreField, ignoreValue } = {}) {
  if (items.some(item => sameIdentifier(item[field], value) && (!ignoreField || !sameIdentifier(item[ignoreField], ignoreValue)))) throw new Error(`${label} "${value}" already exists.`);
  return value;
}
function validateIdentifierCollection(items, field, label) {
  const seen = new Set();
  items?.forEach(item => {
    const identifier = requireIdentifier(item[field], label);
    const normalized = identifier.toLowerCase();
    if (seen.has(normalized)) throw new Error(`${label} "${identifier}" is duplicated.`);
    seen.add(normalized);
  });
}
function validateWorkspaceData(data) {
  if (!data || typeof data !== "object") throw new Error("Workspace data must be a JSON object.");
  for (const key of ["components", "hazards", "situations", "requirements", "safetyGoals", "hara", "silAssessments", "fmea"]) if (data[key] !== undefined && !Array.isArray(data[key])) throw new Error(`Workspace field "${key}" must be an array.`);
  if (data.quantitative !== undefined && (!data.quantitative || typeof data.quantitative !== "object" || !Array.isArray(data.quantitative.components))) throw new Error('Workspace field "quantitative.components" must be an array.');
  if (data.fmeda !== undefined && (!data.fmeda || typeof data.fmeda !== "object" || !Array.isArray(data.fmeda.constants) || !Array.isArray(data.fmeda.rows))) throw new Error('Workspace FMEDA fields must be arrays.');
  validateIdentifierCollection(data.components, "id", "Component identifier");
  validateIdentifierCollection(data.hazards, "id", "Hazard identifier");
  validateIdentifierCollection(data.situations, "id", "Situation identifier");
  validateIdentifierCollection(data.requirements, "id", "Requirement identifier");
  validateIdentifierCollection(data.safetyGoals, "id", "Safety-goal identifier");
  validateIdentifierCollection(data.hara, "eventId", "Hazardous-event identifier");
  validateIdentifierCollection(data.silAssessments, "assessmentId", "SIL-assessment identifier");
  data.fmea?.forEach(row => { validateNumber(row.severity, "FMEA severity", { min: 1, max: 10, integer: true }); validateNumber(row.occurrence, "FMEA occurrence", { min: 1, max: 10, integer: true }); validateNumber(row.detection, "FMEA detection", { min: 1, max: 10, integer: true }); });
  data.hara?.forEach(row => { requireEnum(row.severity, "HARA severity", ["S0", "S1", "S2", "S3"]); requireEnum(row.exposure, "HARA exposure", ["E0", "E1", "E2", "E3", "E4"]); requireEnum(row.controllability, "HARA controllability", ["C0", "C1", "C2", "C3"]); });
  data.silAssessments?.forEach(row => { requireEnum(row.consequence, "SIL consequence", ["C1", "C2", "C3", "C4"]); requireEnum(row.frequency, "SIL frequency", ["F1", "F2"]); requireEnum(row.avoidance, "SIL avoidance", ["P1", "P2"]); requireEnum(row.demand, "SIL demand", ["W1", "W2", "W3"]); });
  if (data.quantitative) { requireEnum(data.quantitative.targetSil, "Target SIL", ["SIL 1", "SIL 2", "SIL 3", "SIL 4"]); requireEnum(data.quantitative.mode, "Quantitative mode", ["continuous", "low"]); requireEnum(data.quantitative.architecture, "Quantitative architecture", ["1oo1", "1oo2"]); }
  data.quantitative?.components?.forEach(row => { validateNumber(row.lambdaTotal, "Total failure rate", { min: 0 }); validateNumber(row.dangerousFraction, "Dangerous fraction", { min: 0, max: 1 }); validateNumber(row.diagnosticCoverage, "Diagnostic coverage", { min: 0, max: 1 }); validateNumber(row.proofTestHours, "Proof-test interval", { min: Number.EPSILON }); validateNumber(row.channels, "Channels", { min: 1, max: 2, integer: true }); validateNumber(row.beta, "Common-cause beta", { min: 0, max: 1 }); });
  data.fmeda?.constants?.forEach(item => { requireSymbol(item.symbol, "FMEDA symbol"); validateNumber(item.value, "FMEDA constant", { min: 0 }); });
  data.fmeda?.rows?.forEach(row => requireEnum(row.classification, "FMEDA classification", ["safe", "dangerous_detected", "dangerous_undetected", "no_effect"]));
  return migrateWorkspace(data);
}
function handleFormError(error) { alert(error.message); }
function workspaceId() { return `workspace-${crypto.randomUUID()}`; }
function load() {
  const storedRegistry = localStorage.getItem(WORKSPACES_KEY);
  workspaceRegistry = storedRegistry ? JSON.parse(storedRegistry) : { version: PROJECT_VERSION, workspaces: [] };
  if (!workspaceRegistry.workspaces.length) {
    const legacy = localStorage.getItem(STORAGE_KEY);
    workspaceRegistry.workspaces.push({ id: workspaceId(), name: "Cobot safety case", updatedAt: new Date().toISOString(), data: migrateWorkspace(legacy ? JSON.parse(legacy) : structuredClone(seed), seed) });
  }
  let activeId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  if (!workspaceRegistry.workspaces.some(workspace => workspace.id === activeId)) activeId = workspaceRegistry.workspaces[0].id;
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, activeId);
  persistRegistry();
  return migrateWorkspace(structuredClone(activeWorkspace().data));
}
function activeWorkspace() {
  const activeId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  return workspaceRegistry.workspaces.find(workspace => workspace.id === activeId) || workspaceRegistry.workspaces[0];
}
function persistRegistry() { localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaceRegistry)); }
function persistState() {
  const workspace = activeWorkspace(); workspace.data = structuredClone(state); workspace.updatedAt = new Date().toISOString();
  persistRegistry(); localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function save() { persistState(); renderAll(); }
function switchWorkspace(id) {
  if (!workspaceRegistry.workspaces.some(workspace => workspace.id === id)) return;
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id); state = migrateWorkspace(structuredClone(activeWorkspace().data)); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll();
}
function createWorkspace(name, data = blankWorkspace()) {
  const workspace = { id: workspaceId(), name: requireValue(name, "Workspace name"), updatedAt: new Date().toISOString(), data: validateWorkspaceData(structuredClone(data)) };
  workspaceRegistry.workspaces.push(workspace); persistRegistry(); switchWorkspace(workspace.id);
}
function deleteActiveWorkspace() {
  const workspace = activeWorkspace();
  if (!confirm(`Delete workspace "${workspace.name}" from this browser? Select Save first if you need to reopen it later.`)) return;
  workspaceRegistry.workspaces = workspaceRegistry.workspaces.filter(item => item.id !== workspace.id);
  if (!workspaceRegistry.workspaces.length) workspaceRegistry.workspaces.push({ id: workspaceId(), name: "Untitled workspace", updatedAt: new Date().toISOString(), data: blankWorkspace() });
  persistRegistry(); switchWorkspace(workspaceRegistry.workspaces[0].id);
}
function projectEnvelope(workspace = activeWorkspace()) {
  return { format: PROJECT_FORMAT, version: PROJECT_VERSION, exportedAt: new Date().toISOString(), workspace: { name: workspace.name, data: structuredClone(state) } };
}
function parseProject(text) {
  const parsed = JSON.parse(text);
  const data = parsed.format === PROJECT_FORMAT ? parsed.workspace?.data : parsed;
  const name = parsed.format === PROJECT_FORMAT ? parsed.workspace?.name : "Imported safety workspace";
  if (!data || !Array.isArray(data.components) || !Array.isArray(data.hazards) || !Array.isArray(data.fmea)) throw new Error("The JSON file is not a valid Safeguard workspace.");
  return { name: name || "Imported safety workspace", data: validateWorkspaceData(data) };
}
function options(items, selected = "", optional = false) {
  return `${optional ? '<option value="">Not linked</option>' : ""}${items.map(x => `<option value="${esc(x.id)}" ${x.id === selected ? "selected" : ""}>${esc(x.id)} · ${esc(x.name)}</option>`).join("")}`;
}
function named(group, id) { return itemBy(group, id)?.name || "Not linked"; }
function deriveAsil(severity, exposure, controllability) {
  if (severity === "S0" || exposure === "E0" || controllability === "C0") return "QM";
  const table = {
    S1: { E1: ["QM", "QM", "QM"], E2: ["QM", "QM", "QM"], E3: ["QM", "QM", "ASIL A"], E4: ["QM", "ASIL A", "ASIL B"] },
    S2: { E1: ["QM", "QM", "QM"], E2: ["QM", "QM", "ASIL A"], E3: ["QM", "ASIL A", "ASIL B"], E4: ["ASIL A", "ASIL B", "ASIL C"] },
    S3: { E1: ["QM", "QM", "ASIL A"], E2: ["QM", "ASIL A", "ASIL B"], E3: ["ASIL A", "ASIL B", "ASIL C"], E4: ["ASIL B", "ASIL C", "ASIL D"] }
  };
  return table[severity]?.[exposure]?.[Number(controllability.slice(1)) - 1] || "QM";
}
function deriveSil(consequence, frequency, avoidance, demand) {
  const riskWeight = Number(consequence.slice(1)) + Number(frequency.slice(1)) + Number(avoidance.slice(1)) - 3;
  const demandShift = Number(demand.slice(1)) - 2;
  const level = Math.max(0, Math.min(4, riskWeight + demandShift));
  return level ? `SIL ${level}` : "No SIL";
}
function silClass(sil) { return sil === "No SIL" ? "asil-qm" : `sil-${sil.slice(-1)}`; }
const silBands = {
  continuous: { "SIL 1": [1e-6, 1e-5], "SIL 2": [1e-7, 1e-6], "SIL 3": [1e-8, 1e-7], "SIL 4": [1e-9, 1e-8] },
  low: { "SIL 1": [1e-2, 1e-1], "SIL 2": [1e-3, 1e-2], "SIL 3": [1e-4, 1e-3], "SIL 4": [1e-5, 1e-4] }
};
const plantumlCompletions = [
  ["@startuml", "@startuml\n$0\n@enduml", "diagram wrapper"],
  ["@enduml", "@enduml", "diagram wrapper"],
  ["title", "title $0", "diagram title"],
  ["component", 'component "$0" as ALIAS', "component"],
  ["node", 'node "$0" as ALIAS', "node"],
  ["database", 'database "$0" as ALIAS', "database"],
  ["queue", 'queue "$0" as ALIAS', "queue"],
  ["cloud", 'cloud "$0" as ALIAS', "cloud"],
  ["rectangle", 'rectangle "$0" as ALIAS', "rectangle"],
  ["artifact", 'artifact "$0" as ALIAS', "artifact"],
  ["package", 'package "$0" {\n}', "package"],
  ["frame", 'frame "$0" {\n}', "frame"],
  ["actor", 'actor "$0" as ALIAS', "actor"],
  ["interface", 'interface "$0" as ALIAS', "interface"],
  ["note", "note right of ALIAS\n  $0\nend note", "note"],
  ["skinparam", "skinparam $0", "styling"],
  ["left to right direction", "left to right direction", "layout"],
  ["hide stereotype", "hide stereotype", "styling"],
  ["legend", "legend\n  $0\nendlegend", "legend"]
].map(([label, insert, detail]) => ({ label, insert, detail }));
let plantumlMatches = [];
let plantumlCompletionIndex = 0;
let plantumlCompletionRange;

function currentPlantumlToken(editor = $("#plantuml-source")) {
  const beforeCursor = editor.value.slice(0, editor.selectionStart);
  const match = beforeCursor.match(/(?:^|\s)([@A-Za-z][A-Za-z ]*)$/);
  if (!match) return null;
  const text = match[1];
  return { text, start: editor.selectionStart - text.length, end: editor.selectionStart };
}
function closePlantumlCompletions() {
  const editor = $("#plantuml-source"); const menu = $("#plantuml-completions");
  plantumlMatches = []; plantumlCompletionRange = null; menu.hidden = true; menu.replaceChildren();
  editor.setAttribute("aria-expanded", "false"); editor.removeAttribute("aria-activedescendant");
}
function renderPlantumlCompletions() {
  const editor = $("#plantuml-source"); const menu = $("#plantuml-completions"); const token = currentPlantumlToken(editor);
  if (!token?.text) return closePlantumlCompletions();
  const query = token.text.toLowerCase();
  plantumlMatches = plantumlCompletions.filter(item => item.label.startsWith(query)).slice(0, 7);
  if (!plantumlMatches.length) return closePlantumlCompletions();
  plantumlCompletionRange = token; plantumlCompletionIndex = Math.min(plantumlCompletionIndex, plantumlMatches.length - 1);
  menu.innerHTML = plantumlMatches.map((item, index) => `<button type="button" class="completion-item ${index === plantumlCompletionIndex ? "active" : ""}" id="plantuml-completion-${index}" role="option" aria-selected="${index === plantumlCompletionIndex}" data-completion-index="${index}"><strong>${esc(item.label)}</strong><span>${esc(item.detail)}</span></button>`).join("");
  menu.hidden = false; editor.setAttribute("aria-expanded", "true"); editor.setAttribute("aria-activedescendant", `plantuml-completion-${plantumlCompletionIndex}`);
}
function insertPlantumlCompletion(index = plantumlCompletionIndex) {
  const editor = $("#plantuml-source"); const item = plantumlMatches[index];
  if (!item || !plantumlCompletionRange) return;
  const marker = item.insert.indexOf("$0"); const inserted = item.insert.replace("$0", "");
  editor.setRangeText(inserted, plantumlCompletionRange.start, plantumlCompletionRange.end, "end");
  const cursor = plantumlCompletionRange.start + (marker === -1 ? inserted.length : marker);
  editor.setSelectionRange(cursor, cursor); editor.focus(); closePlantumlCompletions();
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}
function componentRates(row) {
  const lambdaDangerous = Number(row.lambdaTotal) * Number(row.dangerousFraction);
  const singleResidual = lambdaDangerous * (1 - Number(row.diagnosticCoverage));
  const beta = Number(row.beta);
  const residualDangerous = Number(row.channels) === 2 ? beta * singleResidual + (1 - beta) * singleResidual * singleResidual * 24 : singleResidual;
  return { lambdaDangerous, residualDangerous, pfdavg: residualDangerous * Number(row.proofTestHours) / 2 };
}
function quantitativeTotals() {
  return state.quantitative.components.reduce((total, row) => {
    const rates = componentRates(row);
    total.lambdaTotal += Number(row.lambdaTotal); total.lambdaDangerous += rates.lambdaDangerous; total.residualDangerous += rates.residualDangerous; total.pfdavg += rates.pfdavg;
    return total;
  }, { lambdaTotal: 0, lambdaDangerous: 0, residualDangerous: 0, pfdavg: 0 });
}
function scientific(value) { return Number(value).toExponential(2); }
function quantitativeValue(totals = quantitativeTotals()) { return state.quantitative.mode === "low" ? totals.pfdavg : totals.residualDangerous; }
function quantitativeMeetsTarget(value = quantitativeValue()) {
  const band = silBands[state.quantitative.mode][state.quantitative.targetSil];
  return value < band[1];
}
function evaluateExpression(expression) {
  const symbols = Object.fromEntries(state.fmeda.constants.map(item => [item.symbol, Number(item.value)]));
  const tokens = expression.match(/[A-Za-z_][A-Za-z0-9_]*|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[()+\-*/]/gi) || [];
  if (tokens.join("").toLowerCase() !== expression.replace(/\s+/g, "").toLowerCase()) throw new Error("Expression contains unsupported characters.");
  let index = 0;
  function parseExpression() {
    let value = parseTerm();
    while (tokens[index] === "+" || tokens[index] === "-") { const operator = tokens[index++]; const right = parseTerm(); value = operator === "+" ? value + right : value - right; }
    return value;
  }
  function parseTerm() {
    let value = parseFactor();
    while (tokens[index] === "*" || tokens[index] === "/") { const operator = tokens[index++]; const right = parseFactor(); if (operator === "/" && right === 0) throw new Error("Division by zero is not allowed."); value = operator === "*" ? value * right : value / right; }
    return value;
  }
  function parseFactor() {
    const token = tokens[index++];
    if (token === "-") return -parseFactor();
    if (token === "(") { const value = parseExpression(); if (tokens[index++] !== ")") throw new Error("Missing closing parenthesis."); return value; }
    if (/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token || "")) return Number(token);
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token || "")) { if (!(token in symbols)) throw new Error(`Unknown symbol: ${token}`); return symbols[token]; }
    throw new Error("Expected a number, symbol, or parenthesis.");
  }
  const result = parseExpression();
  if (index !== tokens.length) throw new Error("Expression could not be fully parsed.");
  if (!Number.isFinite(result) || result < 0) throw new Error("Expression must evaluate to a non-negative finite rate.");
  return result;
}
function fmedaTotals() {
  const totals = { safe: 0, dangerous_detected: 0, dangerous_undetected: 0, no_effect: 0, total: 0 };
  state.fmeda.rows.forEach(row => { const rate = evaluateExpression(row.expression); totals[row.classification] += rate; totals.total += rate; });
  totals.diagnosticCoverage = totals.dangerous_detected + totals.dangerous_undetected ? totals.dangerous_detected / (totals.dangerous_detected + totals.dangerous_undetected) : 0;
  totals.safeFailureFraction = totals.total ? (totals.safe + totals.dangerous_detected) / totals.total : 0;
  return totals;
}
function goalBy(id) { return state.safetyGoals.find(goal => goal.id === id); }

function showView(name) {
  $$(".view").forEach(view => view.classList.remove("active"));
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === name));
  $(`#${name}-view`).classList.add("active");
  $("#page-title").textContent = ({ fmea: "FMEA worksheet", fmeda: "FMEDA worksheet", hara: "ISO 26262 HARA", sil: "AMR SIL assessment", quantitative: "Quantitative safety", hazards: "Hazard catalogue", situations: "Operational situations", requirements: "Safety requirements", architecture: "Architecture" })[name] || "Overview";
  $("#add-fmea-row-btn").hidden = name !== "fmea";
}

function renderMetrics() {
  const sum = state.fmea.reduce((total, row) => total + rpn(row), 0);
  $("#hero-score").textContent = sum;
  const metrics = [
    [state.fmea.length, "Failure modes", "≡"], [state.hazards.length, "Hazards catalogued", "◇"],
    [state.requirements.length, "Safety requirements", "✓"], [state.components.length, "Architecture components", "⌘"]
  ];
  $("#metrics").innerHTML = metrics.map(([count, label, icon]) => `<div class="metric"><div class="metric-top"><strong>${count}</strong><span class="metric-icon">${icon}</span></div><p>${label}</p></div>`).join("");
  $("#priority-list").innerHTML = [...state.fmea].sort((a, b) => rpn(b) - rpn(a)).slice(0, 4).map(row => {
    const score = rpn(row);
    return `<div class="priority-row"><div><strong>${esc(row.failureMode)}</strong><span>${esc(named("components", row.component))}</span></div><div class="risk-bar"><i style="width:${Math.min(score / 1.3, 100)}%"></i></div><div class="score"><strong>${score}</strong><span>RPN</span></div></div>`;
  }).join("");
  const linkedHazards = new Set(state.fmea.map(x => x.hazard).filter(Boolean)).size;
  const verified = state.requirements.filter(x => x.status === "Verified").length;
  const coverage = [
    ["Hazards linked to FMEA", state.hazards.length ? Math.round(linkedHazards / state.hazards.length * 100) : 0],
    ["Requirements verified", state.requirements.length ? Math.round(verified / state.requirements.length * 100) : 0],
    ["Components analyzed", state.components.length ? Math.round(new Set(state.fmea.map(x => x.component)).size / state.components.length * 100) : 0]
  ];
  $("#coverage-list").innerHTML = coverage.map(([label, value]) => `<div class="coverage-row"><div class="coverage-label"><span>${label}</span><strong>${value}%</strong></div><div class="coverage-track"><i style="width:${value}%"></i></div></div>`).join("");
  $("#overview-components").innerHTML = state.components.map(x => `<span class="component-chip">${esc(x.name)}</span>`).join("");
}

function renderFmea() {
  const query = $("#fmea-search").value.toLowerCase();
  const filtered = state.fmea.filter(row => Object.values(row).join(" ").toLowerCase().includes(query) || named("hazards", row.hazard).toLowerCase().includes(query));
  $("#fmea-count").textContent = filtered.length;
  $("#fmea-head").innerHTML = `<tr><th>Component</th><th>Failure mode</th><th>Potential effect</th><th>Reference</th><th>S</th><th>O</th><th>D</th><th>RPN</th>${state.customColumns.map(x => `<th>${esc(x.label)}</th>`).join("")}<th></th></tr>`;
  $("#fmea-body").innerHTML = filtered.map(row => `<tr>
    <td><strong>${esc(row.component)}</strong><span class="subtext">${esc(named("components", row.component))}</span></td>
    <td><strong>${esc(row.failureMode)}</strong><span class="subtext">${esc(row.action || "No recommended action")}</span></td>
    <td>${esc(row.effect)}</td>
    <td><strong>${esc(row.hazard || "—")}</strong><span class="subtext">${esc(named("hazards", row.hazard))}<br>${esc(named("situations", row.situation))}</span></td>
    <td>${row.severity}</td><td>${row.occurrence}</td><td>${row.detection}</td>
    <td><span class="risk-score ${riskClass(rpn(row))}">${rpn(row)}</span></td>
    ${state.customColumns.map(x => `<td>${esc(row.custom?.[x.key] || "—")}</td>`).join("")}
    <td><div class="row-actions"><button class="mini-btn" title="Edit" data-edit-row="${row.id}">✎</button><button class="mini-btn" title="Delete" data-delete-row="${row.id}">×</button></div></td>
  </tr>`).join("");
}

function renderCatalog(group) {
  $(`#${group}-grid`).innerHTML = state[group].map(item => {
    const links = group === "hazards" ? state.fmea.filter(x => x.hazard === item.id).length + state.requirements.filter(x => x.hazard === item.id).length + state.hara.filter(x => x.hazard === item.id).length + state.silAssessments.filter(x => x.hazard === item.id).length : state.fmea.filter(x => x.situation === item.id).length + state.hara.filter(x => x.situation === item.id).length + state.silAssessments.filter(x => x.situation === item.id).length;
    return `<article class="catalog-card"><div class="catalog-card-top"><span class="catalog-id">${esc(item.id)}</span><span class="category">${esc(item.category)}</span></div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><div class="catalog-footer"><span>${links} linked reference${links === 1 ? "" : "s"}</span><button class="mini-btn" data-delete-catalog="${group}:${item.id}" title="Delete">×</button></div></article>`;
  }).join("");
}

function renderSil() {
  $("#sil-count").textContent = state.silAssessments.length;
  $("#sil-summary").innerHTML = ["No SIL", "SIL 1", "SIL 2", "SIL 3", "SIL 4"].map(sil => `<div class="hara-stat"><strong>${state.silAssessments.filter(row => deriveSil(row.consequence, row.frequency, row.avoidance, row.demand) === sil).length}</strong><span>${sil} functions</span></div>`).join("");
  $("#sil-body").innerHTML = state.silAssessments.map(row => {
    const sil = deriveSil(row.consequence, row.frequency, row.avoidance, row.demand);
    return `<tr>
      <td><strong>${esc(row.assessmentId)} · ${esc(row.safetyFunction)}</strong><span class="subtext">${esc(row.hazardousEvent)}</span></td>
      <td><strong>${esc(row.hazard)} · ${esc(named("hazards", row.hazard))}</strong><span class="subtext">${esc(row.situation)} · ${esc(named("situations", row.situation))}</span></td>
      <td><strong>${esc(row.consequence)} / ${esc(row.frequency)} / ${esc(row.avoidance)} / ${esc(row.demand)}</strong></td>
      <td><span class="asil ${silClass(sil)}">${esc(sil)}</span></td><td>${esc(row.safeState || "TBD")}</td><td>${esc(row.evidence || "TBD")}</td>
      <td><div class="row-actions"><button class="mini-btn" title="Edit" data-edit-sil="${row.id}">✎</button><button class="mini-btn" title="Delete" data-delete-sil="${row.id}">×</button></div></td>
    </tr>`;
  }).join("");
}

function renderQuantitative() {
  const quant = state.quantitative; const totals = quantitativeTotals(); const result = quantitativeValue(totals); const band = silBands[quant.mode][quant.targetSil]; const meets = quantitativeMeetsTarget(result);
  $("#quant-function").value = quant.safetyFunction; $("#quant-target").value = quant.targetSil; $("#quant-mode").value = quant.mode; $("#quant-architecture").value = quant.architecture;
  $("#quant-count").textContent = quant.components.length;
  $("#quant-results").innerHTML = [
    ["λ total", scientific(totals.lambdaTotal), "Combined random failure rate / h"],
    ["λ dangerous", scientific(totals.lambdaDangerous), "Before diagnostic coverage / h"],
    ["λ residual dangerous", scientific(totals.residualDangerous), "Residual dangerous failure rate / h"],
    [quant.mode === "low" ? "PFDavg" : "PFH", scientific(result), quant.mode === "low" ? "Average probability of failure on demand" : "Probability of dangerous failure per hour"]
  ].map(([label, value, note]) => `<div class="quant-result"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
  const highIntegrity = Number(quant.targetSil.slice(-1)) >= 3;
  const redundant = quant.architecture === "1oo2" || quant.components.some(row => Number(row.channels) === 2);
  const recommendation = !meets ? "The random-hardware estimate does not meet the selected target band. Review diagnostics, component rates, proof-test interval, and redundant architecture options." : highIntegrity && !redundant ? "The numerical estimate is within the selected band, but the high target SIL needs an explicit redundant-architecture review. Evaluate hardware fault tolerance, safe failure fraction, independence, and common-cause failures." : "The numerical estimate is within the selected target band. Continue with architectural constraints, common-cause analysis, systematic capability, and validation evidence.";
  $("#quant-guidance").innerHTML = `<div class="card-header"><div><p class="eyebrow">Architecture guidance</p><h3>${meets ? "Target band check passed" : "Target band check needs attention"}</h3></div><span class="status ${meets ? "verified" : "draft"}">${esc(quant.targetSil)}</span></div><p>${esc(recommendation)}</p><span class="requirement-meta">Selected band: ${scientific(band[0])} ≤ ${quant.mode === "low" ? "PFDavg" : "PFH"} &lt; ${scientific(band[1])} · Architecture: ${esc(quant.architecture)}</span>`;
  $("#quant-body").innerHTML = quant.components.map(row => {
    const rates = componentRates(row);
    return `<tr><td><strong>${esc(row.component)} · ${esc(named("components", row.component))}</strong><span class="subtext">${esc(row.role)}</span></td><td>${scientific(row.lambdaTotal)}</td><td>${Number(row.dangerousFraction).toFixed(2)}</td><td>${scientific(rates.lambdaDangerous)}</td><td>${(Number(row.diagnosticCoverage) * 100).toFixed(1)}%</td><td>${scientific(rates.residualDangerous)}</td><td>${Number(row.proofTestHours).toLocaleString()} h</td><td>${Number(row.channels) === 2 ? `2 · β ${Number(row.beta).toFixed(2)}` : "1"}</td><td><div class="row-actions"><button class="mini-btn" title="Edit" data-edit-quant="${row.id}">✎</button><button class="mini-btn" title="Delete" data-delete-quant="${row.id}">×</button></div></td></tr>`;
  }).join("");
}

function renderFmeda() {
  const labels = { safe: "Safe · λS", dangerous_detected: "Dangerous detected · λDD", dangerous_undetected: "Dangerous undetected · λDU", no_effect: "No effect · λNE" };
  $("#constant-list").innerHTML = state.fmeda.constants.map(item => `<div class="constant-entry"><div><strong>${esc(item.symbol)}</strong><span>${esc(item.description)}</span></div><code>${scientific(item.value)}</code><button class="mini-btn" title="Delete" data-delete-constant="${esc(item.symbol)}">×</button></div>`).join("");
  let totals;
  try { totals = fmedaTotals(); } catch (error) { totals = { safe: 0, dangerous_detected: 0, dangerous_undetected: 0, total: 0, diagnosticCoverage: 0, safeFailureFraction: 0 }; }
  $("#fmeda-count").textContent = state.fmeda.rows.length;
  $("#fmeda-summary").innerHTML = [
    ["λS", scientific(totals.safe), "Safe failures / h"], ["λDD", scientific(totals.dangerous_detected), "Detected dangerous / h"], ["λDU", scientific(totals.dangerous_undetected), "Undetected dangerous / h"],
    ["DC", `${(totals.diagnosticCoverage * 100).toFixed(1)}%`, "Dangerous detected / dangerous total"], ["SFF", `${(totals.safeFailureFraction * 100).toFixed(1)}%`, "(λS + λDD) / λ total"]
  ].map(([label, value, note]) => `<div class="fmeda-summary-row"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
  $("#fmeda-body").innerHTML = state.fmeda.rows.map(row => {
    let value; let error = "";
    try { value = scientific(evaluateExpression(row.expression)); } catch (issue) { value = "Invalid"; error = issue.message; }
    return `<tr><td><strong>${esc(row.component)} · ${esc(named("components", row.component))}</strong></td><td>${esc(row.failureMode)}</td><td>${esc(row.localEffect)}</td><td>${esc(row.endEffect)}</td><td><span class="category">${esc(labels[row.classification])}</span></td><td>${esc(row.diagnostic || "—")}</td><td><code>${esc(row.expression)}</code>${error ? `<span class="subtext">${esc(error)}</span>` : ""}</td><td><strong>${esc(value)}</strong></td><td><div class="row-actions"><button class="mini-btn" title="Edit" data-edit-fmeda="${row.id}">✎</button><button class="mini-btn" title="Delete" data-delete-fmeda="${row.id}">×</button></div></td></tr>`;
  }).join("");
}

function renderHara() {
  $("#hara-count").textContent = state.hara.length;
  $("#hara-summary").innerHTML = ["QM", "ASIL A", "ASIL B", "ASIL C", "ASIL D"].map(asil => `<div class="hara-stat"><strong>${state.hara.filter(row => deriveAsil(row.severity, row.exposure, row.controllability) === asil).length}</strong><span>${asil} events</span></div>`).join("");
  $("#hara-body").innerHTML = state.hara.map(row => {
    const asil = deriveAsil(row.severity, row.exposure, row.controllability);
    return `<tr>
      <td><strong>${esc(row.eventId)}</strong><span class="subtext">${esc(row.consequence)}</span></td>
      <td><strong>${esc(row.hazard)} · ${esc(named("hazards", row.hazard))}</strong><span class="subtext">${esc(row.situation)} · ${esc(named("situations", row.situation))}</span></td>
      <td>${esc(row.malfunction)}</td><td>${esc(row.severity)}</td><td>${esc(row.exposure)}</td><td>${esc(row.controllability)}</td>
      <td><span class="asil ${asilClass(asil)}">${esc(asil)}</span></td><td>${esc(row.safetyGoal || "—")}<span class="subtext">${esc(goalBy(row.safetyGoal)?.text || "Not linked")}</span></td>
      <td><div class="row-actions"><button class="mini-btn" title="Edit" data-edit-hara="${row.id}">✎</button><button class="mini-btn" title="Delete" data-delete-hara="${row.id}">×</button></div></td>
    </tr>`;
  }).join("");
  $("#goal-list").innerHTML = state.safetyGoals.map(goal => {
    const links = state.hara.filter(row => row.safetyGoal === goal.id);
    return `<article class="requirement"><span class="requirement-id">${esc(goal.id)}</span><div><p>${esc(goal.text)}</p><span class="requirement-meta">Safe state: ${esc(goal.safeState || "TBD")} &nbsp; / &nbsp; FTTI: ${esc(goal.ftti || "TBD")}</span><div class="goal-links">${links.length ? `Hazardous events: ${links.map(row => esc(row.eventId)).join(", ")}` : "No hazardous events linked"}</div></div><div class="req-side"><span class="asil ${asilClass(goal.asil)}">${esc(goal.asil)}</span><div class="row-actions"><button class="mini-btn" title="Edit" data-edit-goal="${esc(goal.id)}">✎</button><button class="mini-btn" title="Delete" data-delete-goal="${esc(goal.id)}">×</button></div></div></article>`;
  }).join("");
}

function renderRequirements() {
  $("#requirement-list").innerHTML = state.requirements.map(req => `<article class="requirement">
    <span class="requirement-id">${esc(req.id)}</span>
    <div><p>${esc(req.text)}</p><span class="requirement-meta">Source: ${esc(req.hazard)} · ${esc(named("hazards", req.hazard))} &nbsp; / &nbsp; Allocation: ${esc(named("components", req.component))}</span></div>
    <div class="req-side"><span class="status ${req.status.toLowerCase()}">${esc(req.status)}</span><span class="requirement-meta">${esc(req.verification || "Verification TBD")}</span></div>
  </article>`).join("");
}

function renderArchitecture() {
  $("#plantuml-source").value = state.plantuml;
  $("#component-count").textContent = state.components.length;
  $("#component-list").innerHTML = state.components.map(x => `<div class="component-item"><strong>${esc(x.name)}</strong><span>${esc(x.id)}</span></div>`).join("");
}
function renderWorkspaceControls() {
  const active = activeWorkspace();
  $("#workspace-select").innerHTML = workspaceRegistry.workspaces.map(workspace => `<option value="${esc(workspace.id)}" ${workspace.id === active.id ? "selected" : ""}>${esc(workspace.name)}</option>`).join("");
}
function renderAll() { renderWorkspaceControls(); renderMetrics(); renderFmea(); renderCatalog("hazards"); renderCatalog("situations"); renderRequirements(); renderHara(); renderSil(); renderQuantitative(); renderFmeda(); renderArchitecture(); }

function fillRowForm(row = {}) {
  const form = $("#row-form");
  form.reset();
  $("#row-dialog-title").textContent = row.id ? "Edit failure mode" : "Add failure mode";
  form.elements.id.value = row.id || "";
  form.elements.component.innerHTML = options(state.components, row.component);
  form.elements.hazard.innerHTML = options(state.hazards, row.hazard, true);
  form.elements.situation.innerHTML = options(state.situations, row.situation, true);
  ["failureMode", "effect", "severity", "occurrence", "detection", "action"].forEach(key => { if (row[key] !== undefined) form.elements[key].value = row[key]; });
  $("#custom-row-fields").innerHTML = state.customColumns.map(column => `<label><span>${esc(column.label)}</span><input name="custom_${esc(column.key)}" value="${esc(row.custom?.[column.key] || "")}" /></label>`).join("");
  $("#row-dialog").showModal();
}

function openCatalog(group) {
  $("#catalog-form").reset();
  $("#catalog-form").elements.catalog.value = group;
  $("#catalog-title").textContent = group === "hazards" ? "Add hazard" : "Add operational situation";
  $("#category-field").style.display = group === "hazards" ? "" : "none";
  $("#catalog-dialog").showModal();
}
function renderColumns() {
  $("#column-list").innerHTML = state.customColumns.length ? state.customColumns.map(x => `<div class="column-entry"><span>${esc(x.label)}</span><button type="button" class="remove-column" data-delete-column="${x.key}">Remove</button></div>`).join("") : `<p class="dialog-copy">No additional columns yet.</p>`;
}
function fillHaraForm(row = {}) {
  const form = $("#hara-form"); form.reset();
  $("#hara-dialog-title").textContent = row.id ? "Edit hazardous event" : "Add hazardous event";
  form.elements.id.value = row.id || "";
  form.elements.hazard.innerHTML = options(state.hazards, row.hazard);
  form.elements.situation.innerHTML = options(state.situations, row.situation);
  form.elements.safetyGoal.innerHTML = options(state.safetyGoals.map(goal => ({ id: goal.id, name: goal.text })), row.safetyGoal, true);
  ["eventId", "malfunction", "consequence", "severity", "exposure", "controllability"].forEach(key => { if (row[key] !== undefined) form.elements[key].value = row[key]; });
  updateAsilPreview(); $("#hara-dialog").showModal();
}
function fillGoalForm(goal = {}) {
  const form = $("#goal-form"); form.reset();
  $("#goal-dialog-title").textContent = goal.id ? "Edit safety goal" : "Add safety goal";
  form.elements.originalId.value = goal.id || "";
  ["id", "text", "asil", "safeState", "ftti"].forEach(key => { if (goal[key] !== undefined) form.elements[key].value = goal[key]; });
  $("#goal-dialog").showModal();
}
function updateAsilPreview() {
  const form = $("#hara-form");
  $("#asil-preview").textContent = deriveAsil(form.elements.severity.value, form.elements.exposure.value, form.elements.controllability.value);
}
function fillSilForm(row = {}) {
  const form = $("#sil-form"); form.reset();
  $("#sil-dialog-title").textContent = row.id ? "Edit SIL assessment" : "Add SIL assessment";
  form.elements.id.value = row.id || "";
  form.elements.hazard.innerHTML = options(state.hazards, row.hazard);
  form.elements.situation.innerHTML = options(state.situations, row.situation);
  ["assessmentId", "safetyFunction", "hazardousEvent", "consequence", "frequency", "avoidance", "demand", "safeState", "evidence"].forEach(key => { if (row[key] !== undefined) form.elements[key].value = row[key]; });
  updateSilPreview(); $("#sil-dialog").showModal();
}
function updateSilPreview() {
  const form = $("#sil-form");
  $("#sil-preview").textContent = deriveSil(form.elements.consequence.value, form.elements.frequency.value, form.elements.avoidance.value, form.elements.demand.value);
}
function fillQuantitativeForm(row = {}) {
  const form = $("#quant-component-form"); form.reset();
  $("#quant-component-title").textContent = row.id ? "Edit component rate" : "Add component rate";
  form.elements.id.value = row.id || ""; form.elements.component.innerHTML = options(state.components, row.component);
  ["role", "lambdaTotal", "dangerousFraction", "diagnosticCoverage", "proofTestHours", "channels", "beta"].forEach(key => { if (row[key] !== undefined) form.elements[key].value = row[key]; });
  $("#quant-component-dialog").showModal();
}
function fillFmedaForm(row = {}) {
  const form = $("#fmeda-form"); form.reset();
  $("#fmeda-dialog-title").textContent = row.id ? "Edit FMEDA failure mode" : "Add FMEDA failure mode";
  form.elements.id.value = row.id || ""; form.elements.component.innerHTML = options(state.components, row.component);
  ["failureMode", "localEffect", "endEffect", "classification", "diagnostic", "expression"].forEach(key => { if (row[key] !== undefined) form.elements[key].value = row[key]; });
  updateExpressionPreview(); $("#fmeda-dialog").showModal();
}
function updateExpressionPreview() {
  try { $("#expression-preview").textContent = scientific(evaluateExpression($("#fmeda-form").elements.expression.value)); $("#expression-error").textContent = ""; }
  catch (error) { $("#expression-preview").textContent = "Invalid"; $("#expression-error").textContent = error.message; }
}
function closeWorkspaceMenu() {
  $("#workspace-menu").hidden = true; $("#workspace-menu-btn").setAttribute("aria-expanded", "false");
}

$("#main-nav").addEventListener("click", event => { const button = event.target.closest("[data-view]"); if (button) showView(button.dataset.view); });
$("#workspace-select").addEventListener("change", event => switchWorkspace(event.target.value));
$("#workspace-menu-btn").addEventListener("click", () => {
  const menu = $("#workspace-menu"); menu.hidden = !menu.hidden;
  $("#workspace-menu-btn").setAttribute("aria-expanded", String(!menu.hidden));
});
$("#workspace-menu").addEventListener("click", event => { if (event.target.closest("button")) closeWorkspaceMenu(); });
document.addEventListener("click", event => { if (!event.target.closest(".workspace-menu-wrap")) closeWorkspaceMenu(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeWorkspaceMenu(); });
$("#delete-workspace-btn").addEventListener("click", deleteActiveWorkspace);
$("#help-btn").addEventListener("click", () => $("#help-dialog").showModal());
$("#import-workspace-btn").addEventListener("click", () => $("#workspace-file-input").click());
$("#workspace-file-input").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try { const project = parseProject(await file.text()); createWorkspace(project.name, project.data); alert(`Workspace "${project.name}" opened.`); }
  catch (error) { alert(error.message); }
  finally { event.target.value = ""; }
});
document.addEventListener("click", event => {
  const close = event.target.closest("[data-close-dialog]"); if (close) close.closest("dialog").close();
  const go = event.target.closest("[data-go]"); if (go) showView(go.dataset.go);
  if (event.target.closest("[data-open-row]")) fillRowForm();
  const catalog = event.target.closest("[data-open-catalog]"); if (catalog) openCatalog(catalog.dataset.openCatalog);
  const edit = event.target.closest("[data-edit-row]"); if (edit) fillRowForm(state.fmea.find(x => x.id === edit.dataset.editRow));
  const remove = event.target.closest("[data-delete-row]"); if (remove && confirm("Delete this failure mode?")) { state.fmea = state.fmea.filter(x => x.id !== remove.dataset.deleteRow); save(); }
  const removeCatalog = event.target.closest("[data-delete-catalog]");
  if (removeCatalog) {
    const [group, id] = removeCatalog.dataset.deleteCatalog.split(":");
    const linked = group === "hazards" ? state.fmea.some(x => x.hazard === id) || state.requirements.some(x => x.hazard === id) || state.hara.some(x => x.hazard === id) || state.silAssessments.some(x => x.hazard === id) : state.fmea.some(x => x.situation === id) || state.hara.some(x => x.situation === id) || state.silAssessments.some(x => x.situation === id);
    if (linked) alert("This catalogue entry is referenced by the analysis and cannot be deleted.");
    else if (confirm("Delete this catalogue entry?")) { state[group] = state[group].filter(x => x.id !== id); save(); }
  }
  const removeColumn = event.target.closest("[data-delete-column]");
  if (removeColumn) { state.customColumns = state.customColumns.filter(x => x.key !== removeColumn.dataset.deleteColumn); save(); renderColumns(); }
  const editHara = event.target.closest("[data-edit-hara]"); if (editHara) fillHaraForm(state.hara.find(x => x.id === editHara.dataset.editHara));
  const removeHara = event.target.closest("[data-delete-hara]"); if (removeHara && confirm("Delete this hazardous event?")) { state.hara = state.hara.filter(x => x.id !== removeHara.dataset.deleteHara); save(); }
  const editGoal = event.target.closest("[data-edit-goal]"); if (editGoal) fillGoalForm(goalBy(editGoal.dataset.editGoal));
  const removeGoal = event.target.closest("[data-delete-goal]");
  if (removeGoal) {
    if (state.hara.some(row => row.safetyGoal === removeGoal.dataset.deleteGoal)) alert("This safety goal is referenced by a hazardous event and cannot be deleted.");
    else if (confirm("Delete this safety goal?")) { state.safetyGoals = state.safetyGoals.filter(goal => goal.id !== removeGoal.dataset.deleteGoal); save(); }
  }
  const editSil = event.target.closest("[data-edit-sil]"); if (editSil) fillSilForm(state.silAssessments.find(x => x.id === editSil.dataset.editSil));
  const removeSil = event.target.closest("[data-delete-sil]"); if (removeSil && confirm("Delete this SIL assessment?")) { state.silAssessments = state.silAssessments.filter(x => x.id !== removeSil.dataset.deleteSil); save(); }
  const editQuant = event.target.closest("[data-edit-quant]"); if (editQuant) fillQuantitativeForm(state.quantitative.components.find(x => x.id === editQuant.dataset.editQuant));
  const removeQuant = event.target.closest("[data-delete-quant]"); if (removeQuant && confirm("Delete this component rate?")) { state.quantitative.components = state.quantitative.components.filter(x => x.id !== removeQuant.dataset.deleteQuant); save(); }
  const editFmeda = event.target.closest("[data-edit-fmeda]"); if (editFmeda) fillFmedaForm(state.fmeda.rows.find(x => x.id === editFmeda.dataset.editFmeda));
  const removeFmeda = event.target.closest("[data-delete-fmeda]"); if (removeFmeda && confirm("Delete this FMEDA row?")) { state.fmeda.rows = state.fmeda.rows.filter(x => x.id !== removeFmeda.dataset.deleteFmeda); save(); }
  const removeConstant = event.target.closest("[data-delete-constant]");
  if (removeConstant) {
    const symbol = removeConstant.dataset.deleteConstant; const used = state.fmeda.rows.some(row => new RegExp(`\\b${symbol}\\b`).test(row.expression));
    if (used) alert("This constant is referenced by an FMEDA expression and cannot be deleted."); else if (confirm("Delete this constant?")) { state.fmeda.constants = state.fmeda.constants.filter(item => item.symbol !== symbol); save(); }
  }
});

$("#row-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") { $("#row-dialog").close(); return; }
  const data = Object.fromEntries(new FormData(event.target));
  let row;
  try { row = { id: data.id || crypto.randomUUID(), component: requireValue(data.component, "Component"), failureMode: requireValue(data.failureMode, "Failure mode"), effect: requireValue(data.effect, "Potential effect"), hazard: data.hazard, situation: data.situation, severity: validateNumber(data.severity, "Severity", { min: 1, max: 10, integer: true }), occurrence: validateNumber(data.occurrence, "Occurrence", { min: 1, max: 10, integer: true }), detection: validateNumber(data.detection, "Detection", { min: 1, max: 10, integer: true }), action: data.action, custom: {} }; } catch (error) { return handleFormError(error); }
  const existing = state.fmea.find(x => x.id === data.id);
  state.customColumns.forEach(x => row.custom[x.key] = data[`custom_${x.key}`] || "");
  if (existing) Object.assign(existing, row); else state.fmea.push(row);
  $("#row-dialog").close(); save();
});
$("#catalog-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") { $("#catalog-dialog").close(); return; }
  const data = Object.fromEntries(new FormData(event.target)); const group = data.catalog;
  let id, name, description;
  try { id = requireUniqueIdentifier(state[group], requireIdentifier(data.id, "Identifier"), "Identifier"); name = requireValue(data.name, "Name"); description = requireValue(data.description, "Description"); } catch (error) { return handleFormError(error); }
  state[group].push({ id, name, description, category: group === "hazards" ? data.category : "Operational context" });
  $("#catalog-dialog").close(); save();
});
$("#add-requirement-btn").addEventListener("click", () => {
  const form = $("#requirement-form"); form.reset();
  form.elements.hazard.innerHTML = options(state.hazards); form.elements.component.innerHTML = options(state.components);
  $("#requirement-dialog").showModal();
});
$("#requirement-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") { $("#requirement-dialog").close(); return; }
  const data = Object.fromEntries(new FormData(event.target));
  try { data.id = requireUniqueIdentifier(state.requirements, requireIdentifier(data.id, "Requirement identifier"), "Requirement identifier"); data.text = requireValue(data.text, "Requirement statement"); data.hazard = requireValue(data.hazard, "Source hazard"); data.component = requireValue(data.component, "Allocated component"); } catch (error) { return handleFormError(error); }
  state.requirements.push(data); $("#requirement-dialog").close(); save();
});
$("#template-btn").addEventListener("click", () => { renderColumns(); $("#template-dialog").showModal(); });
$("#add-column-btn").addEventListener("click", () => {
  const input = $("#new-column"); const label = input.value.trim(); if (!label) return;
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (!key || state.customColumns.some(x => x.key === key)) return alert("Use a unique column label.");
  state.customColumns.push({ key, label }); input.value = ""; save(); renderColumns();
});
$("#fmea-search").addEventListener("input", renderFmea);
$("#add-hara-btn").addEventListener("click", () => fillHaraForm());
$("#add-goal-btn").addEventListener("click", () => fillGoalForm());
$("#hara-form").addEventListener("change", updateAsilPreview);
$("#hara-form").addEventListener("submit", event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  try { data.eventId = requireUniqueIdentifier(state.hara, requireIdentifier(data.eventId, "Hazardous-event identifier"), "Hazardous-event identifier", { field: "eventId", ignoreField: "id", ignoreValue: data.id }); data.hazard = requireValue(data.hazard, "Linked hazard"); data.situation = requireValue(data.situation, "Operational situation"); data.malfunction = requireValue(data.malfunction, "Malfunctioning behaviour"); data.consequence = requireValue(data.consequence, "Consequence"); } catch (error) { return handleFormError(error); }
  const existing = state.hara.find(row => row.id === data.id);
  const row = { id: data.id || crypto.randomUUID(), eventId: data.eventId, hazard: data.hazard, situation: data.situation, malfunction: data.malfunction, consequence: data.consequence, severity: data.severity, exposure: data.exposure, controllability: data.controllability, safetyGoal: data.safetyGoal };
  if (existing) Object.assign(existing, row); else state.hara.push(row);
  $("#hara-dialog").close(); save();
});
$("#goal-form").addEventListener("submit", event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  try { data.id = requireUniqueIdentifier(state.safetyGoals, requireIdentifier(data.id, "Safety-goal identifier"), "Safety-goal identifier", { ignoreField: "id", ignoreValue: data.originalId }); data.text = requireValue(data.text, "Safety goal"); } catch (error) { return handleFormError(error); }
  const existing = goalBy(data.originalId);
  const goal = { id: data.id, text: data.text, asil: data.asil, safeState: data.safeState, ftti: data.ftti };
  if (existing) {
    Object.assign(existing, goal);
    if (data.originalId !== data.id) state.hara.forEach(row => { if (row.safetyGoal === data.originalId) row.safetyGoal = data.id; });
  } else state.safetyGoals.push(goal);
  $("#goal-dialog").close(); save();
});
$("#add-sil-btn").addEventListener("click", () => fillSilForm());
$("#sil-form").addEventListener("change", updateSilPreview);
$("#sil-form").addEventListener("submit", event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  try { data.assessmentId = requireUniqueIdentifier(state.silAssessments, requireIdentifier(data.assessmentId, "SIL-assessment identifier"), "SIL-assessment identifier", { field: "assessmentId", ignoreField: "id", ignoreValue: data.id }); data.safetyFunction = requireValue(data.safetyFunction, "Safety function"); data.hazard = requireValue(data.hazard, "Linked hazard"); data.situation = requireValue(data.situation, "Operational situation"); data.hazardousEvent = requireValue(data.hazardousEvent, "Hazardous event"); } catch (error) { return handleFormError(error); }
  const existing = state.silAssessments.find(row => row.id === data.id);
  const row = { id: data.id || crypto.randomUUID(), assessmentId: data.assessmentId, safetyFunction: data.safetyFunction, hazard: data.hazard, situation: data.situation, hazardousEvent: data.hazardousEvent, consequence: data.consequence, frequency: data.frequency, avoidance: data.avoidance, demand: data.demand, safeState: data.safeState, evidence: data.evidence };
  if (existing) Object.assign(existing, row); else state.silAssessments.push(row);
  $("#sil-dialog").close(); save();
});
$("#add-quant-component-btn").addEventListener("click", () => fillQuantitativeForm());
["quant-function", "quant-target", "quant-mode", "quant-architecture"].forEach(id => $(`#${id}`).addEventListener("change", event => {
  const keys = { "quant-function": "safetyFunction", "quant-target": "targetSil", "quant-mode": "mode", "quant-architecture": "architecture" };
  state.quantitative[keys[id]] = event.target.value; save();
}));
$("#quant-function").addEventListener("input", event => { state.quantitative.safetyFunction = event.target.value; persistState(); });
$("#quant-component-form").addEventListener("submit", event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  const existing = state.quantitative.components.find(row => row.id === data.id);
  let row;
  try { row = { id: data.id || crypto.randomUUID(), component: requireValue(data.component, "Architecture component"), role: requireValue(data.role, "Component role"), lambdaTotal: validateNumber(data.lambdaTotal, "Total failure rate", { min: 0 }), dangerousFraction: validateNumber(data.dangerousFraction, "Dangerous fraction", { min: 0, max: 1 }), diagnosticCoverage: validateNumber(data.diagnosticCoverage, "Diagnostic coverage", { min: 0, max: 1 }), proofTestHours: validateNumber(data.proofTestHours, "Proof-test interval", { min: Number.EPSILON }), channels: validateNumber(data.channels, "Channels", { min: 1, max: 2, integer: true }), beta: validateNumber(data.beta, "Common-cause beta", { min: 0, max: 1 }) }; } catch (error) { return handleFormError(error); }
  if (existing) Object.assign(existing, row); else state.quantitative.components.push(row);
  $("#quant-component-dialog").close(); save();
});
$("#add-constant-btn").addEventListener("click", () => { $("#constant-form").reset(); $("#constant-dialog").showModal(); });
$("#constant-form").addEventListener("submit", event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  try { data.symbol = requireSymbol(data.symbol, "Symbol"); data.description = requireValue(data.description, "Description"); data.value = validateNumber(data.value, "Constant value", { min: 0 }); } catch (error) { return handleFormError(error); }
  if (state.fmeda.constants.some(item => item.symbol === data.symbol)) return alert("That symbolic constant already exists.");
  state.fmeda.constants.push({ symbol: data.symbol, value: data.value, description: data.description }); $("#constant-dialog").close(); save();
});
$("#add-fmeda-btn").addEventListener("click", () => fillFmedaForm());
$("#fmeda-form").elements.expression.addEventListener("input", updateExpressionPreview);
$("#fmeda-form").addEventListener("submit", event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  try { data.component = requireValue(data.component, "Architecture component"); data.failureMode = requireValue(data.failureMode, "Failure mode"); data.localEffect = requireValue(data.localEffect, "Local effect"); data.endEffect = requireValue(data.endEffect, "End effect"); data.expression = requireValue(data.expression, "Failure-rate expression"); evaluateExpression(data.expression); } catch (error) { $("#expression-error").textContent = error.message; return; }
  const existing = state.fmeda.rows.find(row => row.id === data.id);
  const row = { id: data.id || crypto.randomUUID(), component: data.component, failureMode: data.failureMode, localEffect: data.localEffect, endEffect: data.endEffect, classification: data.classification, diagnostic: data.diagnostic, expression: data.expression };
  if (existing) Object.assign(existing, row); else state.fmeda.rows.push(row);
  $("#fmeda-dialog").close(); save();
});
$("#plantuml-source").addEventListener("input", () => { plantumlCompletionIndex = 0; renderPlantumlCompletions(); });
$("#plantuml-source").addEventListener("keydown", event => {
  if ($("#plantuml-completions").hidden) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    plantumlCompletionIndex = (plantumlCompletionIndex + (event.key === "ArrowDown" ? 1 : -1) + plantumlMatches.length) % plantumlMatches.length;
    renderPlantumlCompletions();
  } else if (event.key === "Enter" || event.key === "Tab") {
    event.preventDefault(); insertPlantumlCompletion();
  } else if (event.key === "Escape") {
    event.preventDefault(); closePlantumlCompletions();
  }
});
$("#plantuml-completions").addEventListener("mousedown", event => {
  const item = event.target.closest("[data-completion-index]");
  if (item) { event.preventDefault(); insertPlantumlCompletion(Number(item.dataset.completionIndex)); }
});
$("#plantuml-source").addEventListener("blur", () => setTimeout(closePlantumlCompletions));
$("#sync-fmeda-btn").addEventListener("click", () => {
  const byComponent = new Map();
  state.fmeda.rows.filter(row => row.classification === "dangerous_undetected").forEach(row => byComponent.set(row.component, (byComponent.get(row.component) || 0) + evaluateExpression(row.expression)));
  for (const [component, rate] of byComponent) {
    const existing = state.quantitative.components.find(row => row.component === component);
    const update = { lambdaTotal: rate, dangerousFraction: 1, diagnosticCoverage: 0 };
    if (existing) Object.assign(existing, update); else state.quantitative.components.push({ id: crypto.randomUUID(), component, role: "FMEDA λDU handoff", ...update, proofTestHours: 8760, channels: 1, beta: 0.05 });
  }
  save(); alert(`${byComponent.size} FMEDA component rate${byComponent.size === 1 ? "" : "s"} synced to quantitative safety.`);
});
$("#parse-btn").addEventListener("click", () => {
  state.plantuml = $("#plantuml-source").value;
  const components = []; const seen = new Set();
  const pattern = /^\s*(?:component|node|database|queue|cloud|rectangle|artifact|package|frame)\s+(?:"([^"]+)"|([^\s{]+))(?:\s+as\s+([A-Za-z0-9_.-]+))?/gim;
  for (const match of state.plantuml.matchAll(pattern)) {
    const name = match[1] || match[2]; const id = match[3] || name.replace(/\W+/g, "_").toUpperCase();
    const normalizedId = id.toLowerCase();
    if (!seen.has(normalizedId)) { components.push({ id, name }); seen.add(normalizedId); }
  }
  if (!components.length) return alert("No PlantUML components found. Use declarations such as: component \"Robot arm\" as ARM");
  state.components = components; save(); alert(`${components.length} architecture components imported.`);
});
$("#render-btn").addEventListener("click", async () => {
  const button = $("#render-btn"); const status = $("#render-status"); const preview = $("#diagram-preview");
  state.plantuml = $("#plantuml-source").value; persistState();
  button.disabled = true; status.className = "render-status"; status.textContent = "Rendering...";
  try {
    const response = await fetch("/api/plantuml/render", { method: "POST", headers: { "content-type": "text/plain" }, body: state.plantuml });
    if (!response.ok) throw new Error(await response.text());
    if (diagramUrl) URL.revokeObjectURL(diagramUrl);
    diagramUrl = URL.createObjectURL(await response.blob());
    const image = new Image(); image.alt = "Rendered PlantUML architecture diagram"; image.src = diagramUrl;
    preview.replaceChildren(image);
    status.className = "render-status success"; status.textContent = "Diagram rendered";
  } catch (error) {
    const message = document.createElement("p"); message.textContent = error.message || "Unable to render diagram. Start the app with bun server.js.";
    preview.replaceChildren(message);
    status.className = "render-status error"; status.textContent = "Render failed";
  } finally {
    button.disabled = false;
  }
});
$("#export-btn").addEventListener("click", () => {
  state.plantuml = $("#plantuml-source").value; persistState();
  const project = projectEnvelope(); const slug = activeWorkspace().name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "safety-workspace";
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${slug}.safeguard.json` });
  link.click(); URL.revokeObjectURL(link.href);
});
renderAll();
