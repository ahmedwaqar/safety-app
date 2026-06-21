// Application configuration and persisted project formats.

// Note: fault-tree-help.ts imported inline (defined in same bundle)
const STORAGE_KEY = "safeguard-cobot-workspace-v1";
const WORKSPACES_KEY = "safeguard-workspaces-v1";
const ACTIVE_WORKSPACE_KEY = "safeguard-active-workspace-v1";
const TAB_WORKSPACES_KEY = "praxis-open-workspaces-v1";
const PROJECT_FORMAT = "praxis-studio-workspace";
const LEGACY_PROJECT_FORMAT = "safeguard-safety-workspace";
const PROJECT_VERSION = 1;

// Engineering workflow feature: reusable phases and safety-checkpoint defaults.
function engineeringWorkflowTemplate() {
  const phases = [
    { id: crypto.randomUUID(), name: "Define", purpose: "Establish purpose, boundaries, stakeholders, lifecycle, and applicable obligations." },
    { id: crypto.randomUUID(), name: "Explore", purpose: "Understand operating contexts, hazards, misuse, assumptions, and unacceptable outcomes." },
    { id: crypto.randomUUID(), name: "Architect", purpose: "Develop system structure, interfaces, safety functions, and risk-reduction strategies." },
    { id: crypto.randomUUID(), name: "Specify", purpose: "Derive requirements, allocations, acceptance criteria, and verification methods." },
    { id: crypto.randomUUID(), name: "Verify and assure", purpose: "Confirm implementation, validate assumptions, close risks, and assemble evidence." }
  ];
  const activity = (phase, title, objective, safetyCheckpoint, analysis, completionCriteria) => ({
    id: crypto.randomUUID(), phaseId: phases[phase].id, title, objective, owner: "", inputs: "", outputs: "", safetyCheckpoint, analysis, standardReference: "", completionCriteria, evidence: "", status: "Not started"
  });
  return {
    phases,
    activities: [
      activity(0, "Define system purpose and boundary", "Agree what the system must achieve, what is inside its boundary, and which lifecycle stages are in scope.", "Could an omitted interface, operating mode, person, or lifecycle activity introduce unacceptable risk?", "architecture", "System purpose, boundary, interfaces, stakeholders, and lifecycle scope are reviewed."),
      activity(1, "Identify operating situations and hazards", "Explore normal operation, degraded modes, foreseeable misuse, maintenance, and environmental conditions.", "Which combinations of system behavior and operating context could cause harm?", "hazards", "Relevant operating situations and hazards are recorded with supporting assumptions."),
      activity(2, "Select risk-reduction architecture", "Compare design alternatives and allocate safety functions before detailed implementation.", "Can the hazard be eliminated by design? Are safety mechanisms independent and capable of reaching a safe state?", "fmea", "Architecture decisions address identified hazards and record rejected alternatives."),
      activity(3, "Derive verifiable requirements", "Translate design decisions and risk controls into allocated, testable requirements.", "Does every risk control have measurable behavior, timing, integrity, and verification criteria?", "requirements", "Requirements trace to hazards, architecture, and planned verification evidence."),
      activity(4, "Review evidence and residual risk", "Confirm analyses, tests, assumptions, and traceability support release decisions.", "Are any hazards uncontrolled, assumptions unvalidated, requirements unverified, or changes not impact-assessed?", "requirements", "Open safety concerns are resolved or explicitly accepted by authorized reviewers.")
    ]
  };
}

// Starter project data. New blank projects use blankWorkspace() instead.
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
  assurance: {
    tests: [
      { id: "VT-01", title: "Protective-field stop validation", type: "Validation", requirement: "SR-01", objective: "Demonstrate that entry into the protective field initiates the required stop.", method: "Enter each configured field at representative approach speeds and measure the response.", expected: "Protective stop is initiated within the accepted stopping-distance envelope.", actual: "All challenged field positions initiated the protective stop.", configuration: "Cobot cell baseline B1", owner: "Validation engineer", independence: "Independent", status: "Passed", evidence: "EV-01", deviation: "" },
      { id: "VT-03", title: "Loss-of-power retention test", type: "Validation", requirement: "SR-03", objective: "Confirm workpiece retention after primary power loss.", method: "Interrupt primary power at representative payload and pose.", expected: "The workpiece remains retained without creating a secondary hazard.", actual: "", configuration: "Prototype configuration", owner: "Mechanical test engineer", independence: "Peer reviewed", status: "Ready", evidence: "", deviation: "" }
    ],
    evidence: [
      { id: "EV-01", title: "Protective stop validation report", kind: "Test report", reference: "reports/VT-01.pdf", version: "1.0", owner: "Validation engineer", status: "Approved", description: "Signed results and stopping-time measurements for VT-01." }
    ],
    deviations: [],
    changes: [],
    baselines: [
      { id: "BL-01", title: "Cobot cell baseline B1", version: "1.0", scope: "Architecture, hazards, requirements, and validation configuration", status: "Approved", approver: "Chief engineer", date: "2026-01-15", inventory: "Initial example baseline" }
    ],
    reviews: [
      { id: "RV-01", title: "Concept safety review", type: "Safety review", scope: "Hazards, architecture, and safety requirements", owner: "Safety lead", participants: "Systems, controls, mechanical, validation", decision: "Approved with actions", status: "Complete", evidence: "EV-01" }
    ],
    interfaces: [
      { id: "IF-01", title: "Scanner to safety PLC", source: "SCAN", target: "PLC", description: "Dual-channel protective-field state and diagnostic status.", owner: "Controls engineer", failureResponse: "Initiate safe stop on invalid or inconsistent interface state.", status: "Verified" }
    ],
    ram: [
      { id: "RAM-01", title: "Protective-stop availability", measure: "Operational availability", target: "≥ 99.9% during scheduled production", method: "Operational event and downtime monitoring", owner: "RAM engineer", status: "Monitoring" }
    ],
    claims: [
      { id: "CL-01", title: "Personnel are protected from unexpected robot motion", argument: "Hazards are controlled by protective-field detection, safety logic, and validated stopping performance.", evidence: "EV-01", owner: "Safety lead", status: "Supported" }
    ],
    audit: []
  },
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
  faultTree: {
    dsl: `fault_tree "Loss of protective stop" {
  top: TOP

  gate TOP {
    type: OR
    label: "Protective stop unavailable"
    children: [SCAN_FAIL, PLC_FAIL, CTRL_FAIL]
    layer: Layer 1
  }

  gate SCAN_FAIL {
    type: AND
    label: "Scanner channel fails dangerously"
    children: [SCAN_BLIND, SCAN_DIAG_MISSED]
    layer: Layer 1
  }

  basic SCAN_BLIND {
    label: "Scanner protective field not detected"
    component: SCAN
    layer: Layer 2
  }

  basic SCAN_DIAG_MISSED {
    label: "Scanner diagnostic does not detect blind state"
    component: SCAN
    layer: Layer 2
  }

  basic PLC_FAIL {
    label: "Safety PLC does not command safe stop"
    component: PLC
    layer: Layer 2
  }

  basic CTRL_FAIL {
    label: "Robot controller ignores safe-stop command"
    component: CTRL
    layer: Layer 3
  }
}`,
    activeLayer: "All", layerCount: 3
  },
  notepad: {
    html: "<h3>Engineering notes</h3><p>Capture raw stakeholder observations, calculations, assumptions, and early analysis ideas here.</p>",
    brainstormType: "fmea",
    brainstormRows: [
      { kind: "fmea", component: "SCAN", failureMode: "Scanner muted during setup", effect: "Protective field may not stop robot", hazard: "H-03", situation: "OS-02", severity: "9", occurrence: "2", detection: "4", action: "Review setup-mode muting logic" },
      { kind: "hara", eventId: "HE-DRAFT", hazard: "H-01", situation: "OS-03", malfunction: "Unexpected motion during jam recovery", consequence: "Operator hand caught near tooling", severity: "S3", exposure: "E3", controllability: "C2", safetyGoal: "SG-01" }
    ]
  },
  workflow: engineeringWorkflowTemplate(),
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
    fmeda: { constants: [], rows: [] }, faultTree: { dsl: defaultFaultTreeDsl(), activeLayer: "All", layerCount: 3 }, notepad: { html: "", brainstormType: "fmea", brainstormRows: [] }, workflow: engineeringWorkflowTemplate(), customColumns: [], fmea: [],
    assurance: { tests: [], evidence: [], deviations: [], changes: [], baselines: [], reviews: [], interfaces: [], ram: [], claims: [], audit: [] }
  };
}

// Shared application context. Feature code reads the active state and commits
// changes through save() so storage and rendering stay outside feature logic.
let workspaceRegistry;
let state = load();
let diagramUrl;
let serverSyncReady = false;
let activeNotepadCell: HTMLTableCellElement | null = null;
let notepadSaveTimer: ReturnType<typeof setTimeout>;
let notepadStatusTimer: ReturnType<typeof setTimeout>;
let notepadDirty = false;
let faultTreeZoom = 1;
let faultTreeSearch = "";
let faultTreeCutSetLimit = 25;

// Shared DOM and presentation helpers.
const $ = <T extends Element = any>(selector: string, parent: ParentNode = document): T => parent.querySelector(selector) as T;
const $$ = <T extends Element = HTMLElement>(selector: string, parent: ParentNode = document): T[] => [...parent.querySelectorAll<T>(selector)];
const esc = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
type FeatureRecord = Record<string, any>;
type UniqueIdentifierOptions = { field?: string; ignoreField?: string; ignoreValue?: string };
type FmedaTotals = Record<"safe" | "dangerous_detected" | "dangerous_undetected" | "no_effect" | "total", number> & {
  diagnosticCoverage: number;
  safeFailureFraction: number;
};
type FaultTreeNode = { id: string; kind: "top" | "gate" | "basic"; gate?: string; label: string; children: string[]; component?: string; layer: string; line: number };
type FaultTreeModel = { top: string; nodes: Map<string, FaultTreeNode>; layers: string[]; warnings: string[] };
const eventElement = (event: Event): Element => event.target as Element;
const formValues = (form: HTMLFormElement): Record<string, string> => Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value)]));
const itemBy = (group, id) => state[group].find(item => item.id === id);
const rpn = row => Number(row.severity) * Number(row.occurrence) * Number(row.detection);
const riskClass = score => score >= 100 ? "high" : score >= 40 ? "medium" : "low";
const asilClass = asil => `asil-${asil.replace("ASIL ", "").toLowerCase()}`;

// Validation and migration boundary for stored and imported project data.
function migrateWorkspace(workspace, defaults = blankWorkspace()) {
  for (const [key, value] of Object.entries(defaults)) workspace[key] ??= structuredClone(value);
  for (const [key, value] of Object.entries(defaults.assurance)) workspace.assurance[key] ??= structuredClone(value);
  workspace.hazards.forEach(hazard => {
    hazard.status ??= "Open"; hazard.owner ??= ""; hazard.control ??= ""; hazard.residualRisk ??= ""; hazard.closureEvidence ??= "";
  });
  workspace.workflow.activities.forEach(activity => activity.predecessor ??= "");
  workspace.faultTree.activeLayer ??= "All";
  workspace.faultTree.layerCount = Number.isInteger(workspace.faultTree.layerCount) && workspace.faultTree.layerCount >= 1 && workspace.faultTree.layerCount <= 12 ? workspace.faultTree.layerCount : 3;
  workspace.faultTree.dsl ??= defaultFaultTreeDsl();
  workspace.notepad.brainstormRows.forEach(row => row.id ??= crypto.randomUUID());
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
function requireUniqueIdentifier(items, value, label, { field = "id", ignoreField, ignoreValue }: UniqueIdentifierOptions = {}) {
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
  if (data.faultTree !== undefined && (!data.faultTree || typeof data.faultTree !== "object" || typeof data.faultTree.dsl !== "string")) throw new Error("Workspace fault tree DSL must be text.");
  if (data.notepad !== undefined && (!data.notepad || typeof data.notepad !== "object" || !Array.isArray(data.notepad.brainstormRows))) throw new Error("Workspace notepad brainstorming rows must be an array.");
  if (data.workflow !== undefined && (!data.workflow || typeof data.workflow !== "object" || !Array.isArray(data.workflow.phases) || !Array.isArray(data.workflow.activities))) throw new Error("Workspace workflow phases and activities must be arrays.");
  if (data.assurance !== undefined && (!data.assurance || typeof data.assurance !== "object" || ["tests", "evidence", "deviations", "changes", "baselines", "reviews", "interfaces", "ram", "claims", "audit"].some(key => !Array.isArray(data.assurance[key])))) throw new Error("Workspace lifecycle assurance fields must be arrays.");
  validateIdentifierCollection(data.components, "id", "Component identifier");
  validateIdentifierCollection(data.hazards, "id", "Hazard identifier");
  validateIdentifierCollection(data.situations, "id", "Situation identifier");
  validateIdentifierCollection(data.requirements, "id", "Requirement identifier");
  validateIdentifierCollection(data.safetyGoals, "id", "Safety-goal identifier");
  validateIdentifierCollection(data.hara, "eventId", "Hazardous-event identifier");
  validateIdentifierCollection(data.silAssessments, "assessmentId", "SIL-assessment identifier");
  if (data.assurance) {
    for (const [key, label] of [["tests", "Test"], ["evidence", "Evidence"], ["deviations", "Deviation"], ["changes", "Change"], ["baselines", "Baseline"], ["reviews", "Review"], ["interfaces", "Interface"], ["ram", "RAM objective"], ["claims", "Claim"]]) validateIdentifierCollection(data.assurance[key], "id", `${label} identifier`);
  }
  data.fmea?.forEach(row => { validateNumber(row.severity, "FMEA severity", { min: 1, max: 10, integer: true }); validateNumber(row.occurrence, "FMEA occurrence", { min: 1, max: 10, integer: true }); validateNumber(row.detection, "FMEA detection", { min: 1, max: 10, integer: true }); });
  data.hara?.forEach(row => { requireEnum(row.severity, "HARA severity", ["S0", "S1", "S2", "S3"]); requireEnum(row.exposure, "HARA exposure", ["E0", "E1", "E2", "E3", "E4"]); requireEnum(row.controllability, "HARA controllability", ["C0", "C1", "C2", "C3"]); });
  data.silAssessments?.forEach(row => { requireEnum(row.consequence, "SIL consequence", ["C1", "C2", "C3", "C4"]); requireEnum(row.frequency, "SIL frequency", ["F1", "F2"]); requireEnum(row.avoidance, "SIL avoidance", ["P1", "P2"]); requireEnum(row.demand, "SIL demand", ["W1", "W2", "W3"]); });
  if (data.quantitative) { requireEnum(data.quantitative.targetSil, "Target SIL", ["SIL 1", "SIL 2", "SIL 3", "SIL 4"]); requireEnum(data.quantitative.mode, "Quantitative mode", ["continuous", "low"]); requireEnum(data.quantitative.architecture, "Quantitative architecture", ["1oo1", "1oo2"]); }
  data.quantitative?.components?.forEach(row => { validateNumber(row.lambdaTotal, "Total failure rate", { min: 0 }); validateNumber(row.dangerousFraction, "Dangerous fraction", { min: 0, max: 1 }); validateNumber(row.diagnosticCoverage, "Diagnostic coverage", { min: 0, max: 1 }); validateNumber(row.proofTestHours, "Proof-test interval", { min: Number.EPSILON }); validateNumber(row.channels, "Channels", { min: 1, max: 2, integer: true }); validateNumber(row.beta, "Common-cause beta", { min: 0, max: 1 }); });
  data.fmeda?.constants?.forEach(item => { requireSymbol(item.symbol, "FMEDA symbol"); validateNumber(item.value, "FMEDA constant", { min: 0 }); });
  data.fmeda?.rows?.forEach(row => requireEnum(row.classification, "FMEDA classification", ["safe", "dangerous_detected", "dangerous_undetected", "no_effect"]));
  if (data.notepad?.brainstormType) requireEnum(data.notepad.brainstormType, "Notepad brainstorm type", ["fmea", "hara"]);
  data.workflow?.activities?.forEach(activity => requireEnum(activity.status, "Workflow activity status", ["Not started", "In progress", "Complete"]));
  return migrateWorkspace(data);
}
function handleFormError(error) { alert(error.message); }

// Workspace feature: lifecycle, browser persistence, and portable project files.
const VIEW_NAMES = ["overview", "notepad", "workflow", "architecture", "situations", "hazards", "sil", "quantitative", "fmeda", "fault-tree", "hara", "fmea", "requirements", "assurance"];
function workspaceId() { return `workspace-${crypto.randomUUID()}`; }
function requestedWorkspaceId() { return new URLSearchParams(location.search).get("workspace"); }
function requestedView() {
  const view = new URLSearchParams(location.search).get("view");
  return VIEW_NAMES.includes(view) ? view : "overview";
}
function activeView() {
  return document.querySelector<HTMLElement>("#main-nav .nav-item.active")?.dataset.view || "overview";
}
function updateBrowserLocation(workspace, view, mode = "replace") {
  if (location.protocol === "file:") return;
  const url = new URL(location.href);
  url.searchParams.set("workspace", workspace);
  url.searchParams.set("view", view);
  history[mode === "push" ? "pushState" : "replaceState"]({ workspace, view }, "", url);
}
function activeWorkspaceId() { return sessionStorage.getItem(ACTIVE_WORKSPACE_KEY) || localStorage.getItem(ACTIVE_WORKSPACE_KEY); }
function setActiveWorkspaceId(id, historyMode: string | false = "replace") {
  sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  if (historyMode) updateBrowserLocation(id, activeView(), historyMode);
}
function tabWorkspaceIds() {
  const available = new Set(workspaceRegistry.workspaces.map(workspace => workspace.id));
  const stored = sessionStorage.getItem(TAB_WORKSPACES_KEY);
  let ids = stored ? JSON.parse(stored) : [];
  if (!stored) {
    const requested = requestedWorkspaceId();
    ids = requested && available.has(requested) ? [requested] : workspaceRegistry.workspaces.map(workspace => workspace.id);
  }
  ids = ids.filter(id => available.has(id));
  sessionStorage.setItem(TAB_WORKSPACES_KEY, JSON.stringify(ids));
  return ids;
}
function setTabWorkspaceIds(ids) {
  const unique = [...new Set(ids)];
  sessionStorage.setItem(TAB_WORKSPACES_KEY, JSON.stringify(unique));
  return unique;
}
function openWorkspaceInTab(id) {
  if (!workspaceRegistry.workspaces.some(workspace => workspace.id === id)) return;
  setTabWorkspaceIds([...tabWorkspaceIds(), id]);
}
function tabWorkspaces() {
  const openIds = new Set(tabWorkspaceIds());
  return workspaceRegistry.workspaces.filter(workspace => openIds.has(workspace.id));
}
function refreshWorkspaceRegistry() {
  const stored = localStorage.getItem(WORKSPACES_KEY);
  if (stored) workspaceRegistry = JSON.parse(stored);
  workspaceRegistry.closedWorkspaces ??= [];
}
function load() {
  const storedRegistry = localStorage.getItem(WORKSPACES_KEY);
  workspaceRegistry = storedRegistry ? JSON.parse(storedRegistry) : { version: PROJECT_VERSION, workspaces: [], closedWorkspaces: [] };
  workspaceRegistry.closedWorkspaces ??= [];
  if (!workspaceRegistry.workspaces.length) {
    const legacy = localStorage.getItem(STORAGE_KEY);
    workspaceRegistry.workspaces.push({ id: workspaceId(), name: "Cobot safety case", updatedAt: new Date().toISOString(), data: migrateWorkspace(legacy ? JSON.parse(legacy) : structuredClone(seed), seed) });
  }
  let activeId = requestedWorkspaceId() || activeWorkspaceId();
  if (!workspaceRegistry.workspaces.some(workspace => workspace.id === activeId)) activeId = workspaceRegistry.workspaces[0].id;
  openWorkspaceInTab(activeId);
  setActiveWorkspaceId(activeId);
  persistRegistry();
  return migrateWorkspace(structuredClone(activeWorkspace().data));
}
function activeWorkspace() {
  const activeId = activeWorkspaceId();
  return workspaceRegistry.workspaces.find(workspace => workspace.id === activeId) || workspaceRegistry.workspaces[0];
}
function syncRegistryToServer() {
  if (!serverSyncReady || !["http:", "https:"].includes(location.protocol)) return;
  fetch("/api/projects", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(workspaceRegistry) }).catch(() => {});
}
async function hydrateRegistryFromServer() {
  if (!["http:", "https:"].includes(location.protocol)) return;
  try {
    const response = await fetch("/api/projects");
    if (!response.ok) throw new Error("Project service is unavailable.");
    const remote = await response.json();
    if (Array.isArray(remote.workspaces) && remote.workspaces.length) {
      refreshWorkspaceRegistry();
      const merged = new Map<string, FeatureRecord>(workspaceRegistry.workspaces.map(workspace => [workspace.id, workspace]));
      for (const workspace of remote.workspaces as FeatureRecord[]) {
        const local = merged.get(workspace.id);
        if (!local || String(workspace.updatedAt) > String(local.updatedAt)) merged.set(workspace.id, workspace);
      }
      workspaceRegistry.workspaces = [...merged.values()];
      workspaceRegistry.closedWorkspaces = Array.isArray(remote.closedWorkspaces) ? remote.closedWorkspaces : workspaceRegistry.closedWorkspaces;
      const activeId = activeWorkspaceId();
      if (!workspaceRegistry.workspaces.some(workspace => workspace.id === activeId)) {
        openWorkspaceInTab(workspaceRegistry.workspaces[0].id);
        setActiveWorkspaceId(workspaceRegistry.workspaces[0].id);
        state = migrateWorkspace(structuredClone(activeWorkspace().data));
      }
    }
  } catch {
    // Browser storage remains the offline fallback when the project service is unavailable.
  } finally {
    serverSyncReady = true;
    persistRegistry();
    renderAll();
  }
}
function persistRegistry() {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaceRegistry));
  syncRegistryToServer();
}
function persistState() {
  const activeId = activeWorkspaceId();
  refreshWorkspaceRegistry();
  const workspace = workspaceRegistry.workspaces.find(item => item.id === activeId);
  if (!workspace) return;
  workspace.data = structuredClone(state); workspace.updatedAt = new Date().toISOString();
  persistRegistry(); localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function save() { persistState(); renderAll(); }
function switchWorkspace(id, historyMode: string | false = "push") {
  if (notepadDirty) saveNotepad();
  refreshWorkspaceRegistry();
  if (!workspaceRegistry.workspaces.some(workspace => workspace.id === id)) return;
  openWorkspaceInTab(id);
  setActiveWorkspaceId(id, historyMode); state = migrateWorkspace(structuredClone(activeWorkspace().data)); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll();
}
function createWorkspace(name, data = blankWorkspace()) {
  refreshWorkspaceRegistry();
  const workspaceName = requireUniqueIdentifier([...workspaceRegistry.workspaces, ...workspaceRegistry.closedWorkspaces], requireValue(name, "Workspace name"), "Project name", { field: "name" });
  const workspace = { id: workspaceId(), name: workspaceName, updatedAt: new Date().toISOString(), data: validateWorkspaceData(structuredClone(data)) };
  workspaceRegistry.workspaces.push(workspace); persistRegistry(); switchWorkspace(workspace.id);
}
function createNewWorkspace() {
  const name = prompt("Name the new workspace:");
  if (name === null) return;
  try { createWorkspace(name); }
  catch (error) { alert(error.message); }
}
function matchingWorkspace(items, project) {
  return items.find(workspace => (project.id && workspace.id === project.id) || sameIdentifier(workspace.name, project.name));
}
function blankWorkspaceRecord() {
  const existing = [...workspaceRegistry.workspaces, ...workspaceRegistry.closedWorkspaces];
  let name = "Untitled workspace";
  for (let suffix = 2; existing.some(workspace => sameIdentifier(workspace.name, name)); suffix++) name = `Untitled workspace ${suffix}`;
  return { id: workspaceId(), name, updatedAt: new Date().toISOString(), data: blankWorkspace() };
}
function openProject(project) {
  refreshWorkspaceRegistry();
  const open = matchingWorkspace(workspaceRegistry.workspaces, project);
  if (open) {
    const alreadyOpen = tabWorkspaceIds().includes(open.id);
    openWorkspaceInTab(open.id);
    switchWorkspace(open.id);
    alert(alreadyOpen ? `Workspace "${open.name}" is already open in this tab.` : `Workspace "${open.name}" opened in this tab.`);
    return;
  }
  const closed = matchingWorkspace(workspaceRegistry.closedWorkspaces, project);
  if (closed) {
    workspaceRegistry.closedWorkspaces = workspaceRegistry.closedWorkspaces.filter(workspace => workspace.id !== closed.id);
    const index = Math.min(closed.closedIndex ?? workspaceRegistry.workspaces.length, workspaceRegistry.workspaces.length);
    delete closed.closedIndex;
    workspaceRegistry.workspaces.splice(index, 0, closed);
    persistRegistry(); openWorkspaceInTab(closed.id); switchWorkspace(closed.id);
    alert(`Workspace "${closed.name}" reopened.`);
    return;
  }
  const workspace = { id: project.id || workspaceId(), name: requireValue(project.name, "Workspace name"), updatedAt: new Date().toISOString(), data: validateWorkspaceData(structuredClone(project.data)) };
  workspaceRegistry.workspaces.push(workspace); persistRegistry(); openWorkspaceInTab(workspace.id); switchWorkspace(workspace.id);
  alert(`Workspace "${workspace.name}" opened.`);
}
function deleteActiveWorkspace() {
  refreshWorkspaceRegistry();
  const workspace = activeWorkspace();
  if (!confirm(`Delete workspace "${workspace.name}" from this browser? Select Save first if you need to reopen it later.`)) return;
  workspaceRegistry.workspaces = workspaceRegistry.workspaces.filter(item => item.id !== workspace.id);
  setTabWorkspaceIds(tabWorkspaceIds().filter(id => id !== workspace.id));
  if (!workspaceRegistry.workspaces.length) workspaceRegistry.workspaces.push(blankWorkspaceRecord());
  const next = tabWorkspaces()[0] || workspaceRegistry.workspaces[0];
  openWorkspaceInTab(next.id); persistRegistry(); switchWorkspace(next.id);
}
function openActiveWorkspaceInNewTab() {
  persistState();
  const url = new URL(location.href);
  url.searchParams.set("workspace", activeWorkspace().id);
  window.open(url, "_blank", "noopener");
}
function closeActiveWorkspace() {
  persistState();
  refreshWorkspaceRegistry();
  const workspace = activeWorkspace();
  const remaining = setTabWorkspaceIds(tabWorkspaceIds().filter(id => id !== workspace.id));
  let next = workspaceRegistry.workspaces.find(item => remaining.includes(item.id));
  if (!next) {
    next = workspaceRegistry.workspaces.find(item => item.id !== workspace.id);
    if (!next) {
      next = blankWorkspaceRecord();
      workspaceRegistry.workspaces.push(next);
      persistRegistry();
    }
    openWorkspaceInTab(next.id);
  }
  switchWorkspace(next.id);
}
function projectEnvelope(workspace = activeWorkspace()) {
  return { format: PROJECT_FORMAT, version: PROJECT_VERSION, exportedAt: new Date().toISOString(), workspace: { id: workspace.id, name: workspace.name, data: structuredClone(state) } };
}
function parseProject(text) {
  const parsed = JSON.parse(text);
  const hasEnvelope = [PROJECT_FORMAT, LEGACY_PROJECT_FORMAT].includes(parsed.format);
  const data = hasEnvelope ? parsed.workspace?.data : parsed;
  const name = hasEnvelope ? parsed.workspace?.name : "Imported safety workspace";
  if (!data || !Array.isArray(data.components) || !Array.isArray(data.hazards) || !Array.isArray(data.fmea)) throw new Error("The JSON file is not a valid Praxis Studio workspace.");
  return { id: hasEnvelope ? parsed.workspace?.id : undefined, name: name || "Imported safety workspace", data: validateWorkspaceData(data) };
}

// Cross-feature lookup helpers used to preserve traceability in the UI.
function options(items, selected = "", optional = false) {
  return `${optional ? '<option value="">Not linked</option>' : ""}${items.map(x => `<option value="${esc(x.id)}" ${x.id === selected ? "selected" : ""}>${esc(x.id)} · ${esc(x.name)}</option>`).join("")}`;
}
function named(group, id) { return itemBy(group, id)?.name || "Not linked"; }

// HARA and SIL features: deterministic risk classification rules.
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

// Architecture feature: PlantUML editor completion state and behavior.
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

// Fault-tree DSL editor completion: templates keep the structured syntax discoverable.
const faultTreeCompletions = [
  ["fault_tree", 'fault_tree "$0" {\n  top: TOP\n\n  gate TOP {\n    type: OR\n    label: "Top event"\n    children: [EVENT_ID]\n    layer: Layer 1\n  }\n}', "new fault tree"],
  ["top", "top: $0", "select top event"],
  ["gate", "gate $0 {\n  type: OR\n  label: \"Intermediate event\"\n  children: [EVENT_ID]\n  layer: Layer 1\n}", "intermediate gate"],
  ["basic", "basic $0 {\n  label: \"Basic failure event\"\n  component: COMPONENT_ID\n  layer: Layer 2\n}", "basic event"],
  ["AND", "type: AND", "all inputs required"],
  ["OR", "type: OR", "any input causes output"],
  ["NOT", "type: NOT", "single inverted input"],
  ["label", 'label: "$0"', "event description"],
  ["children", "children: [$0]", "input event IDs"],
  ["component", "component: $0", "architecture component ID"],
  ["layer", "layer: Layer $0", "numbered review layer"]
].map(([label, insert, detail]) => ({ label, insert, detail }));
let faultTreeMatches = [];
let faultTreeCompletionIndex = 0;
let faultTreeCompletionRange;
function currentFaultTreeToken(editor = $("#fault-tree-source")) {
  const beforeCursor = editor.value.slice(0, editor.selectionStart);
  const match = beforeCursor.match(/(?:^|\s)([A-Za-z_][A-Za-z_]*)$/);
  if (!match) return null;
  const text = match[1];
  return { text, start: editor.selectionStart - text.length, end: editor.selectionStart };
}
function closeFaultTreeCompletions() {
  const editor = $("#fault-tree-source"); const menu = $("#fault-tree-completions");
  faultTreeMatches = []; faultTreeCompletionRange = null; menu.hidden = true; menu.replaceChildren();
  editor.setAttribute("aria-expanded", "false"); editor.removeAttribute("aria-activedescendant");
}
function renderFaultTreeCompletions() {
  const editor = $("#fault-tree-source"); const menu = $("#fault-tree-completions"); const token = currentFaultTreeToken(editor);
  if (!token?.text) return closeFaultTreeCompletions();
  const query = token.text.toLowerCase();
  faultTreeMatches = faultTreeCompletions.filter(item => item.label.toLowerCase().startsWith(query)).slice(0, 7);
  if (!faultTreeMatches.length) return closeFaultTreeCompletions();
  faultTreeCompletionRange = token; faultTreeCompletionIndex = Math.min(faultTreeCompletionIndex, faultTreeMatches.length - 1);
  menu.innerHTML = faultTreeMatches.map((item, index) => `<button type="button" class="completion-item ${index === faultTreeCompletionIndex ? "active" : ""}" id="fault-tree-completion-${index}" role="option" aria-selected="${index === faultTreeCompletionIndex}" data-fault-tree-completion-index="${index}"><strong>${esc(item.label)}</strong><span>${esc(item.detail)}</span></button>`).join("");
  menu.hidden = false; editor.setAttribute("aria-expanded", "true"); editor.setAttribute("aria-activedescendant", `fault-tree-completion-${faultTreeCompletionIndex}`);
}
function insertFaultTreeCompletion(index = faultTreeCompletionIndex) {
  const editor = $("#fault-tree-source"); const item = faultTreeMatches[index];
  if (!item || !faultTreeCompletionRange) return;
  const lineStart = editor.value.lastIndexOf("\n", faultTreeCompletionRange.start - 1) + 1;
  const indent = editor.value.slice(lineStart, faultTreeCompletionRange.start).match(/^\s*/)?.[0] || "";
  const marker = item.insert.indexOf("$0");
  const inserted = item.insert.replace("$0", "").replace(/\n/g, `\n${indent}`);
  editor.setRangeText(inserted, faultTreeCompletionRange.start, faultTreeCompletionRange.end, "end");
  const cursor = faultTreeCompletionRange.start + (marker === -1 ? inserted.length : marker);
  editor.setSelectionRange(cursor, cursor); editor.focus(); closeFaultTreeCompletions();
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

// Quantitative safety feature: component and safety-function calculations.
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

// FMEDA feature: restricted expression evaluator and aggregate calculations.
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
  const totals: FmedaTotals = { safe: 0, dangerous_detected: 0, dangerous_undetected: 0, no_effect: 0, total: 0, diagnosticCoverage: 0, safeFailureFraction: 0 };
  state.fmeda.rows.forEach(row => { const rate = evaluateExpression(row.expression); totals[row.classification] += rate; totals.total += rate; });
  totals.diagnosticCoverage = totals.dangerous_detected + totals.dangerous_undetected ? totals.dangerous_detected / (totals.dangerous_detected + totals.dangerous_undetected) : 0;
  totals.safeFailureFraction = totals.total ? (totals.safe + totals.dangerous_detected) / totals.total : 0;
  return totals;
}
function goalBy(id) { return state.safetyGoals.find(goal => goal.id === id); }

// Fault tree analysis feature: DSL parsing, diagram layout, and qualitative cut sets.
const faultTreeGateTypes = new Set(["AND", "OR", "NAND", "NOR", "XOR", "NOT"]);
function configuredFaultTreeLayers() {
  const count = Math.max(1, Math.min(12, Number(state.faultTree.layerCount) || 3));
  return Array.from({ length: count }, (_, index) => `Layer ${index + 1}`);
}
function validateFaultTreeGate(id: string, gate: string, children: string[], warnings: string[]) {
  const count = children.length;
  if (new Set(children.map(child => child.toLowerCase())).size !== count) throw new Error(`Gate "${id}" contains the same input more than once.`);
  if (gate === "NOT" && count !== 1) throw new Error(`NOT gate "${id}" must have exactly one child.`);
  if (gate !== "NOT" && !gate.startsWith("KOFN:") && count === 1) warnings.push(`Gate "${id}" has one child; remove the gate or add the intended independent inputs.`);
  const match = gate.match(/^KOFN:(\d+)\/(\d+)$/i);
  if (!match) return;
  const k = Number(match[1]); const n = Number(match[2]);
  if (!Number.isSafeInteger(k) || !Number.isSafeInteger(n) || k < 1 || n < 2 || k > n) {
    throw new Error(`K-of-N gate "${id}" must satisfy 1 ≤ K ≤ N and N ≥ 2.`);
  }
  if (count !== n) throw new Error(`K-of-N gate "${id}" declares N=${n} but has ${count} children.`);
  if (k === 1) warnings.push(`K-of-N gate "${id}" is 1-of-${n}; use OR unless voting terminology is required.`);
  if (k === n) warnings.push(`K-of-N gate "${id}" is ${n}-of-${n}; use AND unless voting terminology is required.`);
}
function defaultFaultTreeDsl() {
  return `fault_tree "Top event" {
  top: TOP

  gate TOP {
    type: OR
    label: "System-level fault"
    children: [COMPONENT_FAILURE]
    layer: Layer 1
  }

  basic COMPONENT_FAILURE {
    label: "Architecture component failure"
    layer: Layer 1
  }
}`;
}
function tokenizeFaultTreeLine(line) {
  return [...line.matchAll(/"[^"]*"|->|\S+/g)].map(match => match[0]);
}
function cleanFaultTreeText(value) {
  return String(value || "").replace(/^"|"$/g, "");
}
function splitFaultTreeList(value) {
  return String(value || "").replace(/^\[|\]$/g, "").split(",").map(item => item.trim()).filter(Boolean);
}
function parseFaultTreeProperties(body, lineOffset) {
  const properties: Record<string, string> = {};
  body.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+)$/);
    if (!match) throw new Error(`Fault tree property expected on line ${lineOffset + index + 1}.`);
    properties[match[1]] = match[2].trim().replace(/,$/, "");
  });
  return properties;
}
function completeFaultTreeModel(top: string, nodes: Map<string, FaultTreeNode>, warnings: string[]): FaultTreeModel {
  if (!top) throw new Error("Fault tree DSL must declare a top event.");
  if (!nodes.has(top)) throw new Error(`Top event "${top}" is not defined.`);
  const topNode = nodes.get(top)!;
  topNode.kind = topNode.kind === "basic" ? "basic" : "top";
  for (const node of nodes.values()) node.children.forEach(child => { if (!nodes.has(child)) throw new Error(`Gate "${node.id}" references missing child "${child}".`); });
  const visiting = new Set<string>(); const visited = new Set<string>();
  function visit(id) {
    if (visiting.has(id)) throw new Error(`Fault tree contains a cycle at "${id}".`);
    if (visited.has(id)) return;
    visiting.add(id); nodes.get(id)!.children.forEach(visit); visiting.delete(id); visited.add(id);
  }
  visit(top);
  for (const node of nodes.values()) if (!visited.has(node.id)) warnings.push(`Node ${node.id} is not connected to the top event.`);
  return { top, nodes, layers: ["All", ...[...new Set([...nodes.values()].map(node => node.layer))]], warnings };
}
function parseStructuredFaultTreeDsl(dsl) {
  const root = dsl.match(/^\s*fault_tree\s+"([^"]+)"\s*\{([\s\S]*)\}\s*$/);
  if (!root) throw new Error('Structured fault tree DSL must start with: fault_tree "Title" {');
  const title = root[1];
  const body = root[2];
  const nodes = new Map<string, FaultTreeNode>();
  const warnings: string[] = [];
  let top = "";
  const blockPattern = /^\s*(gate|basic)\s+([A-Za-z][A-Za-z0-9_.-]*)\s*\{([\s\S]*?)^\s*\}/gim;
  const blockRanges: Array<[number, number]> = [];
  for (const match of body.matchAll(blockPattern)) {
    const kind = match[1].toLowerCase();
    const id = requireIdentifier(match[2], `Fault tree node identifier`);
    if (nodes.has(id)) throw new Error(`Fault tree node "${id}" is defined more than once.`);
    const line = body.slice(0, match.index).split(/\r?\n/).length + 1;
    const props = parseFaultTreeProperties(match[3], line);
    if (kind === "gate") {
      const gate = requireValue(props.type, `Gate type for ${id}`).toUpperCase();
      if (!faultTreeGateTypes.has(gate) && !/^KOFN:\d+\/\d+$/i.test(gate)) throw new Error(`Unsupported fault tree gate "${gate}".`);
      const children = splitFaultTreeList(requireValue(props.children, `Children for gate ${id}`)).map(child => requireIdentifier(child, `Child identifier for gate ${id}`));
      if (!children.length) throw new Error(`Gate "${id}" must have at least one child.`);
      validateFaultTreeGate(id, gate, children, warnings);
      nodes.set(id, { id, kind: "gate", gate, label: cleanFaultTreeText(props.label || id), children, layer: cleanFaultTreeText(props.layer || "Logic"), line });
    } else {
      nodes.set(id, { id, kind: "basic", label: cleanFaultTreeText(props.label || id), children: [], component: props.component ? cleanFaultTreeText(props.component) : "", layer: cleanFaultTreeText(props.layer || "Events"), line });
    }
    blockRanges.push([match.index!, match.index! + match[0].length]);
  }
  const headerBody = blockRanges.reduce((text, [start, end]) => `${text.slice(0, start)}${" ".repeat(end - start)}${text.slice(end)}`, body);
  headerBody.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;
    const match = line.match(/^top\s*:\s*([A-Za-z][A-Za-z0-9_.-]*)$/i);
    if (!match) throw new Error(`Unexpected fault tree statement on line ${index + 2}. Use top:, gate blocks, or basic blocks.`);
    top = requireIdentifier(match[1], "Fault tree top event");
  });
  if (!top && title) warnings.push(`Fault tree title "${title}" is descriptive; add top: <id> to select the analyzed event.`);
  return completeFaultTreeModel(top, nodes, warnings);
}
function parseLegacyFaultTreeDsl(dsl = state.faultTree.dsl): FaultTreeModel {
  const nodes = new Map<string, FaultTreeNode>();
  const warnings: string[] = [];
  let top = "";
  dsl.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;
    const tokens = tokenizeFaultTreeLine(line);
    const keyword = tokens.shift()?.toUpperCase();
    if (keyword === "TOP") {
      top = requireIdentifier(tokens[0], `Fault tree top event on line ${index + 1}`);
      const label = cleanFaultTreeText(tokens.slice(1).join(" ")) || top;
      const existing = nodes.get(top);
      nodes.set(top, { id: top, kind: existing?.kind || "top", gate: existing?.gate || "OR", label, children: existing?.children || [], component: existing?.component, layer: existing?.layer || "System", line: index + 1 });
      return;
    }
    if (keyword === "BASIC") {
      const id = requireIdentifier(tokens.shift(), `Basic event identifier on line ${index + 1}`);
      if (nodes.has(id)) throw new Error(`Fault tree node "${id}" is defined more than once.`);
      const labelParts = [];
      const attrs: Record<string, string> = {};
      tokens.forEach(token => token.includes("=") ? attrs[token.split("=")[0]] = token.split("=").slice(1).join("=") : labelParts.push(token));
      nodes.set(id, { id, kind: "basic", label: cleanFaultTreeText(labelParts.join(" ")) || id, children: [], component: attrs.component, layer: attrs.layer || "Events", line: index + 1 });
      return;
    }
    if (keyword === "GATE") {
      const id = requireIdentifier(tokens.shift(), `Gate identifier on line ${index + 1}`);
      const gate = requireValue(tokens.shift(), `Gate type on line ${index + 1}`).toUpperCase();
      if (!faultTreeGateTypes.has(gate) && !/^KOFN:\d+\/\d+$/i.test(gate)) throw new Error(`Unsupported fault tree gate "${gate}".`);
      if (nodes.has(id) && nodes.get(id)!.children.length) throw new Error(`Fault tree node "${id}" is defined more than once.`);
      const arrow = tokens.indexOf("->");
      if (arrow < 0) throw new Error(`Gate "${id}" must declare children with ->.`);
      const label = cleanFaultTreeText(tokens.slice(0, arrow).join(" ")) || id;
      const children = tokens.slice(arrow + 1).map(child => requireIdentifier(child, `Child identifier for gate ${id}`));
      if (!children.length) throw new Error(`Gate "${id}" must have at least one child.`);
      validateFaultTreeGate(id, gate, children, warnings);
      nodes.set(id, { id, kind: id === top ? "top" : "gate", gate, label, children, layer: "Logic", line: index + 1 });
      return;
    }
    throw new Error(`Unknown fault tree DSL keyword "${keyword}" on line ${index + 1}.`);
  });
  return completeFaultTreeModel(top, nodes, warnings);
}
function parseFaultTreeDsl(dsl = state.faultTree.dsl): FaultTreeModel {
  return /^\s*fault_tree\b/i.test(dsl) ? parseStructuredFaultTreeDsl(dsl) : parseLegacyFaultTreeDsl(dsl);
}
function combineCutSets(left: string[][], right: string[][]) {
  const combined: string[][] = [];
  left.forEach(a => right.forEach(b => combined.push([...new Set([...a, ...b])].sort())));
  return minimizeCutSets(combined);
}
function minimizeCutSets(sets: string[][]) {
  const unique = [...new Map(sets.map(set => [set.join("|"), set])).values()];
  return unique.filter(set => !unique.some(other => other !== set && other.every(item => set.includes(item))));
}
function combinations<T>(items: T[], count: number): T[][] {
  if (count <= 0) return [[]];
  if (items.length < count) return [];
  if (items.length === count) return [items];
  const [first, ...rest] = items;
  return combinations(rest, count - 1).map(combo => [first, ...combo]).concat(combinations(rest, count));
}
function faultTreeCutSets(model: FaultTreeModel, id = model.top): { sets: string[][]; nonCoherent: boolean } {
  const node = model.nodes.get(id)!;
  if (node.kind === "basic") return { sets: [[node.id]], nonCoherent: false };
  const analyses = node.children.map(child => faultTreeCutSets(model, child));
  const childSets: string[][] = analyses.flatMap(analysis => analysis.sets);
  let sets: string[][] = childSets;
  let nonCoherent = analyses.some(analysis => analysis.nonCoherent);
  if (node.gate === "AND") sets = analyses.reduce((memo, analysis) => combineCutSets(memo, analysis.sets), [[]]);
  else if (node.gate === "OR") sets = childSets;
  else if (node.gate?.startsWith("KOFN:")) {
    const [, kText] = node.gate.match(/^KOFN:(\d+)\/\d+$/i) || [];
    sets = combinations(analyses, Number(kText)).flatMap(group => group.reduce((memo, analysis) => combineCutSets(memo, analysis.sets), [[]]));
  } else {
    sets = [];
    nonCoherent = true;
  }
  return { sets: minimizeCutSets(sets), nonCoherent };
}
function componentsFromPlantUml(source: string) {
  const components: Array<{ id: string; name: string }> = []; const seen = new Set<string>();
  const pattern = /^\s*(?:component|node|database|queue|cloud|rectangle|artifact|package|frame)\s+(?:"([^"]+)"|([^\s{]+))(?:\s+as\s+([A-Za-z0-9_.-]+))?/gim;
  for (const match of String(source || "").matchAll(pattern)) {
    const name = match[1] || match[2]; const id = match[3] || name.replace(/\W+/g, "_").toUpperCase();
    if (!seen.has(id.toLowerCase())) { components.push({ id, name }); seen.add(id.toLowerCase()); }
  }
  return components;
}
function starterFailureModes(component: { id: string; name: string }) {
  const text = `${component.id} ${component.name}`.toLowerCase();
  if (/(camera|radar|lidar|sensor|scanner|gnss|locali[sz]|perception)/.test(text)) return [
    ["NO_OUTPUT", "no output or loss of data"], ["INVALID_OUTPUT", "dangerous invalid or implausible output"], ["STALE_OUTPUT", "stale output accepted as current"]
  ];
  if (/(plc|ecu|controller|compute|processor|cpu|software|fusion|logic)/.test(text)) return [
    ["UNAVAILABLE", "unavailable or halted execution"], ["INCORRECT_OUTPUT", "dangerous incorrect command or decision"], ["TIMING_FAILURE", "timing or watchdog failure"]
  ];
  if (/(brake|steer|motor|arm|actuator|drive|relay|valve|tool)/.test(text)) return [
    ["FAIL_TO_ACTUATE", "fails to execute the demanded action"], ["UNINTENDED_ACTUATION", "unintended actuation or motion"], ["SAFE_STATE_NOT_REACHED", "fails to reach or maintain the safe state"]
  ];
  if (/(can|ethernet|network|bus|gateway|communication|comm)/.test(text)) return [
    ["LOSS_OF_COMMUNICATION", "loss of communication"], ["CORRUPTED_DATA", "corrupted or inconsistent data accepted"], ["STALE_DATA", "stale message accepted as current"]
  ];
  if (/(power|battery|supply|voltage|ground)/.test(text)) return [
    ["LOSS_OF_POWER", "loss of required power"], ["OUT_OF_TOLERANCE", "out-of-tolerance supply output"], ["PROTECTION_FAILURE", "protection or monitoring failure"]
  ];
  if (/(hmi|display|operator|button|switch|pedal)/.test(text)) return [
    ["UNINTENDED_COMMAND", "unintended command"], ["COMMAND_UNAVAILABLE", "required command unavailable"], ["INCORRECT_INDICATION", "incorrect or missing mode indication"]
  ];
  return [["UNAVAILABLE", "unavailable or no output"], ["INCORRECT_OUTPUT", "dangerous incorrect output"], ["TIMING_OR_INTERFACE", "timing or interface failure"]];
}
function faultTreeFromArchitectureDsl() {
  const components = state.components;
  if (!components.length) return defaultFaultTreeDsl();
  const componentId = (component: { id: string }) => String(component.id).replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
  const groups = components.map(component => `${componentId(component)}_MALFUNCTION`);
  return `fault_tree "Architecture-derived malfunctioning behaviour starter" {
  # Starter only: refine the top event, operational context, dependencies, and safety mechanisms.
  top: TOP

  gate TOP {
    type: OR
    label: "Any selected component malfunction contributes to the top event"
    children: [${groups.join(", ")}]
    layer: Layer 1
  }

${components.map(component => {
  const id = componentId(component); const modes = starterFailureModes(component); const children = modes.map(([suffix]) => `${id}_${suffix}`);
  return `  gate ${id}_MALFUNCTION {
    type: OR
    label: "${component.name} malfunctioning behaviour"
    children: [${children.join(", ")}]
    layer: Layer 1
  }

${modes.map(([suffix, label]) => `  basic ${id}_${suffix} {
    label: "${component.name}: ${label}"
    component: ${component.id}
    layer: Layer 2
  }`).join("\n\n")}`;
}).join("\n\n")}
}`;
}

// Notepad feature: rich notes plus structured stakeholder brainstorming.
const brainstormColumns = {
  fmea: [
    ["component", "Component"], ["failureMode", "Failure mode"], ["effect", "Potential effect"], ["hazard", "Hazard ID"], ["situation", "Situation ID"],
    ["severity", "S"], ["occurrence", "O"], ["detection", "D"], ["action", "Recommended action"]
  ],
  hara: [
    ["eventId", "Event ID"], ["hazard", "Hazard ID"], ["situation", "Situation ID"], ["malfunction", "Malfunctioning behaviour"],
    ["consequence", "Consequence"], ["severity", "S"], ["exposure", "E"], ["controllability", "C"], ["safetyGoal", "Safety goal"]
  ]
};
const notepadArtifacts = [
  ["Architecture", "architecture"],
  ["Operational situations", "situations"],
  ["Hazard catalogue", "hazards"],
  ["ISO 26262 HARA", "hara"],
  ["AMR SIL assessment", "sil"],
  ["Quantitative safety", "quantitative"],
  ["FMEDA worksheet", "fmeda"],
  ["Fault tree analysis", "fault-tree"],
  ["FMEA worksheet", "fmea"],
  ["Safety requirements", "requirements"],
  ["Engineering workflow", "workflow"],
  ["Lifecycle assurance", "assurance"]
];
function resolveNotepadArtifact(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return notepadArtifacts.find(([label, view]) => normalized === label.toLowerCase() || normalized === view);
}
function normalizeNotepadFontSizes(root) {
  root.querySelectorAll("font[size]").forEach(element => {
    const replacement = document.createElement("span");
    replacement.className = element.getAttribute("size") === "7" ? "note-text-xlarge" : "note-text-large";
    replacement.append(...element.childNodes);
    element.replaceWith(replacement);
  });
}
function sanitizeRichHtml(html) {
  const documentFragment = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
  normalizeNotepadFontSizes(documentFragment);
  const allowedTags = new Set(["A", "B", "BLOCKQUOTE", "BR", "CODE", "EM", "FIGCAPTION", "FIGURE", "H2", "H3", "HR", "I", "IMG", "LI", "OL", "P", "PRE", "SPAN", "STRONG", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "U", "UL"]);
  for (const element of [...documentFragment.querySelectorAll("*")]) {
    if (!allowedTags.has(element.tagName)) { element.replaceWith(...element.childNodes); continue; }
    for (const attribute of [...element.attributes]) {
      const allowedClass = attribute.name === "class" && ["note-text-large", "note-text-xlarge"].includes(attribute.value);
      const allowed = allowedClass || attribute.name === "href" || attribute.name === "src" || attribute.name === "alt" || attribute.name === "data-notepad-artifact" || attribute.name === "data-go";
      const unsafeSource = attribute.name === "src" && !attribute.value.startsWith("data:image/");
      const unsafeLink = attribute.name === "href" && !/^(#|https?:|mailto:)/i.test(attribute.value);
      if (!allowed || unsafeSource || unsafeLink) element.removeAttribute(attribute.name);
    }
  }
  return documentFragment.innerHTML;
}
function saveNotepad() {
  clearTimeout(notepadSaveTimer);
  state.notepad.html = sanitizeRichHtml($("#notepad-editor").innerHTML);
  persistState();
  setNotepadSaveState(false);
}
function setNotepadSaveState(dirty: boolean) {
  clearTimeout(notepadStatusTimer);
  notepadDirty = dirty;
  const status = $("#notepad-save-status");
  status.textContent = dirty ? "Unsaved changes · save before closing" : "All changes saved";
  status.classList.toggle("dirty", dirty);
  $("#notepad-save-btn").classList.toggle("attention", dirty);
  if (!dirty) {
    notepadStatusTimer = setTimeout(() => {
      if (!notepadDirty) status.textContent = "";
    }, 1800);
  }
}
function scheduleNotepadSave() {
  clearTimeout(notepadSaveTimer);
  setNotepadSaveState(true);
  notepadSaveTimer = setTimeout(() => {
    saveNotepad();
  }, 400);
}
function insertNotepadHtml(html) {
  const editor = $("#notepad-editor");
  editor.focus();
  const template = document.createElement("template");
  template.innerHTML = html;
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (range && editor.contains(range.commonAncestorContainer)) {
    range.deleteContents();
    range.insertNode(template.content);
    selection?.collapseToEnd();
  } else editor.append(template.content);
  saveNotepad();
}
function selectNotepadCell(cell: HTMLTableCellElement | null) {
  activeNotepadCell?.classList.remove("notepad-cell-selected");
  activeNotepadCell = cell;
  activeNotepadCell?.classList.add("notepad-cell-selected");
  updateNotepadTableControls();
}
function updateNotepadTableControls() {
  const available = Boolean(activeNotepadCell?.isConnected);
  $("#notepad-table-action").disabled = !available;
  $("#notepad-table-status").textContent = available
    ? `Selected row ${(activeNotepadCell!.parentElement as HTMLTableRowElement).rowIndex + 1}, column ${activeNotepadCell!.cellIndex + 1}`
    : "Select a table cell to edit its structure";
}
function createNotepadCell(row: HTMLTableRowElement, index: number) {
  const tag = row.parentElement?.tagName === "THEAD" || row.cells[0]?.tagName === "TH" ? "th" : "td";
  const cell = document.createElement(tag) as HTMLTableCellElement;
  cell.innerHTML = "<br>";
  row.insertBefore(cell, row.cells[index] || null);
  return cell;
}
function editNotepadTable(action: string) {
  const cell = activeNotepadCell;
  const table = cell?.closest("table");
  const row = cell?.parentElement as HTMLTableRowElement | null;
  if (!cell || !table || !row) return;
  const column = cell.cellIndex;
  if (action === "row-above" || action === "row-below") {
    const body = table.tBodies[0] || table.createTBody();
    const bodyRow = row.parentElement === body ? row : body.rows[0];
    const index = bodyRow ? bodyRow.sectionRowIndex + (action === "row-below" ? 1 : 0) : 0;
    const newRow = body.insertRow(index);
    const width = Math.max(1, table.rows[0]?.cells.length || 1);
    for (let i = 0; i < width; i++) createNotepadCell(newRow, i);
    selectNotepadCell(newRow.cells[Math.min(column, width - 1)]);
  } else if (action === "column-left" || action === "column-right") {
    const index = column + (action === "column-right" ? 1 : 0);
    let selected: HTMLTableCellElement | null = null;
    [...table.rows].forEach(currentRow => {
      const newCell = createNotepadCell(currentRow, index);
      if (currentRow === row) selected = newCell;
    });
    selectNotepadCell(selected);
  } else if (action === "delete-row") {
    const nextRow = (row.nextElementSibling || row.previousElementSibling) as HTMLTableRowElement | null;
    const next = nextRow?.cells[column] || null;
    row.remove();
    if (!table.rows.length) table.remove();
    selectNotepadCell(next);
  } else if (action === "delete-column") {
    if (row.cells.length <= 1) return;
    [...table.rows].forEach(currentRow => currentRow.cells[column]?.remove());
    selectNotepadCell(row.cells[Math.min(column, row.cells.length - 1)] || null);
  } else if (action === "delete-table") {
    table.remove();
    selectNotepadCell(null);
  }
  saveNotepad();
}
function currentBrainstormRows() {
  return state.notepad.brainstormRows.filter(row => row.kind === state.notepad.brainstormType);
}
function blankBrainstormRow(kind = state.notepad.brainstormType) {
  return kind === "hara"
    ? { id: crypto.randomUUID(), kind, eventId: "", hazard: "", situation: "", malfunction: "", consequence: "", severity: "S0", exposure: "E0", controllability: "C0", safetyGoal: "" }
    : { id: crypto.randomUUID(), kind, component: "", failureMode: "", effect: "", hazard: "", situation: "", severity: "1", occurrence: "1", detection: "1", action: "" };
}
function cleanupBrainstormRows() {
  const kind = state.notepad.brainstormType;
  const columns = brainstormColumns[kind];
  const rows = currentBrainstormRows().filter(row => columns.some(([field]) => String(row[field] || "").trim()));
  rows.forEach(row => {
    columns.forEach(([field]) => row[field] = String(row[field] || "").trim());
    if (kind === "fmea") {
      ["severity", "occurrence", "detection"].forEach(field => row[field] = String(Math.max(1, Math.min(10, Math.round(Number(row[field]) || 1)))));
    } else {
      if (!["S0", "S1", "S2", "S3"].includes(row.severity)) row.severity = "S0";
      if (!["E0", "E1", "E2", "E3", "E4"].includes(row.exposure)) row.exposure = "E0";
      if (!["C0", "C1", "C2", "C3"].includes(row.controllability)) row.controllability = "C0";
    }
  });
  state.notepad.brainstormRows = [...state.notepad.brainstormRows.filter(row => row.kind !== kind), ...rows];
  save();
  const invalid = rows.filter(row => brainstormRowErrors(row).length).length;
  $("#brainstorm-status").textContent = `${rows.length} draft row${rows.length === 1 ? "" : "s"} cleaned. ${invalid ? `${invalid} still need valid references or required values.` : "Rows are ready to import."}`;
}
function brainstormRowErrors(row) {
  const errors = [];
  if (row.kind === "fmea") {
    if (!state.components.some(item => sameIdentifier(item.id, row.component))) errors.push("component");
    if (!row.failureMode) errors.push("failure mode");
    if (!row.effect) errors.push("effect");
    if (row.hazard && !state.hazards.some(item => sameIdentifier(item.id, row.hazard))) errors.push("hazard");
    if (row.situation && !state.situations.some(item => sameIdentifier(item.id, row.situation))) errors.push("situation");
  } else {
    if (!row.eventId || state.hara.some(item => sameIdentifier(item.eventId, row.eventId))) errors.push("unique event ID");
    if (!state.hazards.some(item => sameIdentifier(item.id, row.hazard))) errors.push("hazard");
    if (!state.situations.some(item => sameIdentifier(item.id, row.situation))) errors.push("situation");
    if (!row.malfunction) errors.push("malfunction");
    if (!row.consequence) errors.push("consequence");
    if (row.safetyGoal && !state.safetyGoals.some(item => sameIdentifier(item.id, row.safetyGoal))) errors.push("safety goal");
  }
  return errors;
}
function importBrainstormRows() {
  cleanupBrainstormRows();
  const kind = state.notepad.brainstormType;
  const rows = currentBrainstormRows();
  const valid = rows.filter(row => !brainstormRowErrors(row).length);
  if (kind === "fmea") {
    valid.forEach(row => state.fmea.push({
      id: crypto.randomUUID(), component: row.component, failureMode: row.failureMode, effect: row.effect, hazard: row.hazard,
      situation: row.situation, severity: Number(row.severity), occurrence: Number(row.occurrence), detection: Number(row.detection), action: row.action, custom: {}
    }));
  } else {
    valid.forEach(row => state.hara.push({
      id: crypto.randomUUID(), eventId: row.eventId, hazard: row.hazard, situation: row.situation, malfunction: row.malfunction,
      consequence: row.consequence, severity: row.severity, exposure: row.exposure, controllability: row.controllability, safetyGoal: row.safetyGoal
    }));
  }
  const importedIds = new Set(valid.map(row => row.id));
  state.notepad.brainstormRows = state.notepad.brainstormRows.filter(row => !importedIds.has(row.id));
  save();
  $("#brainstorm-status").textContent = `${valid.length} cleaned ${kind.toUpperCase()} row${valid.length === 1 ? "" : "s"} imported. ${rows.length - valid.length} draft row${rows.length - valid.length === 1 ? "" : "s"} retained for correction.`;
}

// Lifecycle assurance feature: controlled records, derived traceability, and
// readiness checks spanning requirements, hazards, tests, evidence, and change.
const assuranceSchemas = {
  tests: [
    ["id", "Identifier", "text", "e.g. VT-05"], ["title", "Title", "text", "Test or analysis title"], ["type", "Type", "select", ["Verification", "Validation"]],
    ["requirement", "Requirement", "requirements"], ["objective", "Objective", "textarea"], ["method", "Method / procedure", "textarea"],
    ["expected", "Expected result / acceptance criteria", "textarea"], ["actual", "Actual result", "textarea"], ["configuration", "Configuration / baseline", "text"],
    ["owner", "Owner", "text"], ["independence", "Independence", "select", ["None", "Peer reviewed", "Independent"]],
    ["status", "Status", "select", ["Draft", "Ready", "Passed", "Failed", "Blocked"]], ["evidence", "Evidence", "evidence"], ["deviation", "Deviation", "deviations"]
  ],
  evidence: [
    ["id", "Identifier", "text", "e.g. EV-05"], ["title", "Title", "text"], ["kind", "Evidence type", "select", ["Test report", "Review record", "Analysis", "Certificate", "Model", "Calculation", "Operational record"]],
    ["reference", "Reference or URI", "text"], ["version", "Version", "text"], ["owner", "Owner", "text"],
    ["status", "Status", "select", ["Draft", "In review", "Approved", "Obsolete"]], ["description", "Description", "textarea"]
  ],
  deviations: [
    ["id", "Identifier", "text", "e.g. DEV-01"], ["title", "Issue or deviation", "text"], ["source", "Source record", "text", "Test, review, audit, or field event"],
    ["severity", "Severity", "select", ["Low", "Medium", "High", "Critical"]], ["owner", "Owner", "text"], ["disposition", "Disposition / corrective action", "textarea"],
    ["dueDate", "Due date", "date"], ["status", "Status", "select", ["Open", "Investigating", "Corrective action", "Closed"]], ["closureEvidence", "Closure evidence", "evidence"]
  ],
  changes: [
    ["id", "Identifier", "text", "e.g. CR-01"], ["title", "Change", "text"], ["reason", "Reason", "textarea"], ["affectedArtifacts", "Affected artifacts", "text", "IDs separated by commas"],
    ["safetyImpact", "Safety / RAM impact", "textarea"], ["verificationImpact", "Required regression or V&V", "textarea"], ["owner", "Owner", "text"],
    ["decision", "Decision", "select", ["Proposed", "Approved", "Rejected", "Implemented"]], ["baseline", "Target baseline", "baselines"], ["evidence", "Approval evidence", "evidence"]
  ],
  baselines: [
    ["id", "Identifier", "text", "e.g. BL-02"], ["title", "Baseline name", "text"], ["version", "Version", "text"], ["scope", "Controlled scope", "textarea"],
    ["status", "Status", "select", ["Draft", "In review", "Approved", "Superseded"]], ["approver", "Approver", "text"], ["date", "Baseline date", "date"], ["inventory", "Configuration inventory", "textarea"]
  ],
  reviews: [
    ["id", "Identifier", "text", "e.g. RV-02"], ["title", "Review", "text"], ["type", "Review type", "select", ["Design review", "Safety review", "V&V review", "RAM review", "Release review", "Audit"]],
    ["scope", "Scope and entry criteria", "textarea"], ["owner", "Chair / owner", "text"], ["participants", "Participants and independence", "text"],
    ["decision", "Decision and actions", "textarea"], ["status", "Status", "select", ["Planned", "In progress", "Complete", "Blocked"]], ["evidence", "Review evidence", "evidence"]
  ],
  interfaces: [
    ["id", "Identifier", "text", "e.g. IF-02"], ["title", "Interface", "text"], ["source", "Source component", "components"], ["target", "Target component", "components"],
    ["description", "Data, energy, or mechanical contract", "textarea"], ["owner", "Interface owner", "text"], ["failureResponse", "Failure detection and response", "textarea"],
    ["status", "Status", "select", ["Draft", "Agreed", "Verified"]]
  ],
  ram: [
    ["id", "Identifier", "text", "e.g. RAM-02"], ["title", "RAM objective", "text"], ["measure", "Measure", "select", ["Reliability", "Availability", "Maintainability", "Operational availability", "Failure rate", "Restoration time"]],
    ["target", "Quantified target", "text"], ["method", "Demonstration / monitoring method", "textarea"], ["owner", "Owner", "text"],
    ["status", "Status", "select", ["Draft", "Allocated", "Demonstrated", "Monitoring", "Not met"]]
  ],
  claims: [
    ["id", "Identifier", "text", "e.g. CL-02"], ["title", "Claim", "text"], ["parentClaim", "Parent claim", "claims"], ["argument", "Argument / rationale", "textarea"], ["evidence", "Supporting evidence", "evidence"],
    ["owner", "Claim owner", "text"], ["status", "Status", "select", ["Draft", "Needs evidence", "Supported", "Rejected"]]
  ],
  hazard: [
    ["id", "Hazard", "hazards"], ["owner", "Owner", "text"], ["control", "Implemented control", "textarea"], ["residualRisk", "Residual risk and acceptance rationale", "textarea"],
    ["closureEvidence", "Closure evidence", "evidence"], ["status", "Status", "select", ["Open", "Controlled", "Accepted", "Closed"]]
  ]
};
const assuranceLabels = { tests: "V&V", evidence: "Evidence", deviations: "Deviations", changes: "Changes", baselines: "Baselines", reviews: "Reviews", interfaces: "Interfaces", ram: "RAM objectives", claims: "Safety-case claims" };
function assuranceItems(kind) { return kind === "hazard" ? state.hazards : state.assurance[kind]; }
function assuranceOptions(kind, selected = "") {
  const source = kind === "requirements" ? state.requirements : kind === "components" ? state.components : kind === "hazards" ? state.hazards : state.assurance[kind];
  return `<option value="">Not linked</option>${source.map(item => `<option value="${esc(item.id)}" ${item.id === selected ? "selected" : ""}>${esc(item.id)} · ${esc(item.title || item.text || item.name || "")}</option>`).join("")}`;
}
function assuranceStatusClass(status = "") {
  if (["Passed", "Approved", "Complete", "Closed", "Verified", "Demonstrated", "Monitoring", "Supported", "Accepted"].includes(status)) return "verified";
  if (["Ready", "In review", "In progress", "Investigating", "Corrective action", "Allocated", "Agreed", "Controlled", "Proposed"].includes(status)) return "planned";
  return "draft";
}
function auditAssurance(action, kind, id, detail = "") {
  state.assurance.audit.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, kind, record: id, detail });
  state.assurance.audit = state.assurance.audit.slice(0, 100);
}
function approvedEvidence(id) { return state.assurance.evidence.some(item => item.id === id && item.status === "Approved"); }
function testCoverage(requirementId) {
  const tests = state.assurance.tests.filter(test => test.requirement === requirementId);
  const passed = tests.filter(test => test.status === "Passed" && approvedEvidence(test.evidence));
  return { tests, passed, covered: passed.length > 0 };
}
function hazardClosureReady(hazard) {
  return Boolean(String(hazard.control || "").trim() && String(hazard.residualRisk || "").trim() && approvedEvidence(hazard.closureEvidence));
}
function lifecycleReadiness() {
  const requirementsCovered = state.requirements.filter(requirement => testCoverage(requirement.id).covered).length;
  const hazardsClosed = state.hazards.filter(hazard => hazard.status === "Closed" && hazardClosureReady(hazard)).length;
  const openDeviations = state.assurance.deviations.filter(item => item.status !== "Closed").length;
  const supportedClaims = state.assurance.claims.filter(item => item.status === "Supported" && approvedEvidence(item.evidence)).length;
  return { requirementsCovered, hazardsClosed, openDeviations, supportedClaims };
}
function renderAssurance() {
  const readiness = lifecycleReadiness();
  const totalRecords = Object.keys(assuranceLabels).reduce((total, key) => total + state.assurance[key].length, 0);
  $("#assurance-summary").innerHTML = [
    [readiness.requirementsCovered, `Covered requirements / ${state.requirements.length}`],
    [readiness.hazardsClosed, `Closed hazards / ${state.hazards.length}`],
    [readiness.openDeviations, "Open deviations"],
    [state.assurance.baselines.filter(item => item.status === "Approved").length, "Approved baselines"],
    [readiness.supportedClaims, `Supported claims / ${state.assurance.claims.length}`]
  ].map(([value, label]) => `<div class="workflow-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
  const releaseReady = state.requirements.length > 0 && readiness.requirementsCovered === state.requirements.length && readiness.openDeviations === 0 && state.hazards.every(hazard => hazard.status === "Closed" && hazardClosureReady(hazard)) && state.assurance.claims.every(claim => claim.status === "Supported" && approvedEvidence(claim.evidence));
  $("#assurance-health").innerHTML = `<div class="card-header"><div><p class="eyebrow">Release readiness</p><h3>${releaseReady ? "Lifecycle evidence supports release review" : "Lifecycle closure is incomplete"}</h3></div><span class="status ${releaseReady ? "verified" : "planned"}">${releaseReady ? "Ready" : "Action required"}</span></div><p>${totalRecords} controlled lifecycle records. Release readiness requires every requirement to have a passed V&amp;V record with approved evidence, every hazard to have justified closure, no open deviations, and every safety-case claim to be supported.</p>`;
  $("#traceability-body").innerHTML = state.requirements.map(requirement => {
    const coverage = testCoverage(requirement.id);
    return `<tr><td><strong>${esc(requirement.id)}</strong><span class="subtext">${esc(requirement.text)}</span></td><td>${esc(requirement.hazard || "—")}</td><td>${esc(requirement.component || "—")}</td><td>${coverage.tests.map(test => `${esc(test.id)} · ${esc(test.status)}`).join("<br>") || "No V&V record"}</td><td>${coverage.tests.map(test => esc(test.evidence || "—")).join("<br>") || "—"}</td><td><span class="status ${coverage.covered ? "verified" : "draft"}">${coverage.covered ? "Covered" : "Gap"}</span></td></tr>`;
  }).join("");
  $("#hazard-log-body").innerHTML = state.hazards.map(hazard => `<tr><td><strong>${esc(hazard.id)} · ${esc(hazard.name)}</strong></td><td>${esc(hazard.owner || "Unassigned")}</td><td>${esc(hazard.control || "Not recorded")}</td><td>${esc(hazard.residualRisk || "Not assessed")}</td><td><span class="status ${hazard.status === "Closed" && hazardClosureReady(hazard) ? "verified" : assuranceStatusClass(hazard.status)}">${esc(hazard.status)}${hazard.status === "Closed" && !hazardClosureReady(hazard) ? " · incomplete" : ""}</span></td><td><button class="mini-btn" title="Update hazard lifecycle" data-edit-assurance="hazard:${esc(hazard.id)}">✎</button></td></tr>`).join("");
  $("#assurance-board").innerHTML = Object.entries(assuranceLabels).map(([kind, label]) => `<section class="assurance-record-group"><div class="assurance-group-header"><div><p class="eyebrow">${esc(label)}</p><h3>${state.assurance[kind].length} record${state.assurance[kind].length === 1 ? "" : "s"}</h3></div><button class="button secondary small" data-add-assurance="${kind}">Add</button></div><div class="assurance-record-list">${state.assurance[kind].length ? state.assurance[kind].map(record => `<article class="assurance-record"><div><strong>${esc(record.id)} · ${esc(record.title)}</strong><p>${esc(record.objective || record.description || record.reason || record.scope || record.argument || record.target || record.failureResponse || record.decision || "")}</p><span>${esc(record.owner || record.approver || "")}${record.requirement ? ` · ${esc(record.requirement)}` : ""}${record.evidence ? ` · ${esc(record.evidence)}` : ""}</span></div><div class="assurance-record-actions"><span class="status ${assuranceStatusClass(record.status || record.decision)}">${esc(record.status || record.decision || "Recorded")}</span><div class="row-actions"><button class="mini-btn" title="Edit" data-edit-assurance="${kind}:${esc(record.id)}">✎</button><button class="mini-btn" title="Delete" data-delete-assurance="${kind}:${esc(record.id)}">×</button></div></div></article>`).join("") : '<p class="workflow-empty">No controlled records yet.</p>'}</div></section>`).join("");
  $("#assurance-audit").innerHTML = state.assurance.audit.length ? state.assurance.audit.slice(0, 20).map(entry => `<div class="audit-entry"><time>${esc(new Date(entry.timestamp).toLocaleString())}</time><strong>${esc(entry.action)} ${esc(assuranceLabels[entry.kind] || entry.kind)}</strong><span>${esc(entry.record)}${entry.detail ? ` · ${esc(entry.detail)}` : ""}</span></div>`).join("") : '<p class="workflow-empty">Lifecycle record changes will appear here.</p>';
}
function assuranceFieldHtml(field, record) {
  const [name, label, kind, values] = field;
  const value = record[name] || "";
  let control;
  if (kind === "textarea") control = `<textarea name="${name}">${esc(value)}</textarea>`;
  else if (kind === "select") control = `<select name="${name}">${values.map(option => `<option ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>`;
  else if (["requirements", "components", "hazards", "evidence", "deviations", "baselines", "claims"].includes(kind)) control = `<select name="${name}">${assuranceOptions(kind, value)}</select>`;
  else control = `<input type="${kind === "date" ? "date" : "text"}" name="${name}" value="${esc(value)}" placeholder="${esc(values || "")}" />`;
  return `<label class="${kind === "textarea" ? "wide" : ""}"><span>${esc(label)}</span>${control}</label>`;
}
function fillAssuranceForm(kind = "tests", record: FeatureRecord = {}) {
  const form = $("#assurance-form"); form.reset();
  form.elements.recordType.value = kind; form.elements.recordId.value = record.id || "";
  $("#assurance-record-type").disabled = kind === "hazard" || Boolean(record.id);
  $("#assurance-dialog-title").textContent = record.id ? `Edit ${kind === "hazard" ? "hazard lifecycle" : assuranceLabels[kind]}` : `Add ${assuranceLabels[kind]}`;
  $("#assurance-fields").innerHTML = assuranceSchemas[kind].map(field => assuranceFieldHtml(field, record)).join("");
  if (record.id) $("#assurance-fields").querySelector("[name=id]")?.setAttribute("readonly", "");
  $("#assurance-dialog").showModal();
}

// Application shell: navigation is independent of individual feature renderers.
function showView(name, historyMode: string | false = "push") {
  if (!VIEW_NAMES.includes(name)) name = "overview";
  const previous = activeView();
  $$(".view").forEach(view => view.classList.remove("active"));
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === name));
  $(`#${name}-view`).classList.add("active");
  $("#page-title").textContent = ({ notepad: "Engineering notes", workflow: "Engineering workflow", fmea: "FMEA worksheet", fmeda: "FMEDA worksheet", "fault-tree": "Fault tree analysis", hara: "ISO 26262 HARA", sil: "AMR SIL assessment", quantitative: "Quantitative safety", hazards: "Hazard catalogue", situations: "Operational situations", requirements: "Safety requirements", assurance: "Lifecycle assurance", architecture: "Architecture" })[name] || "Overview";
  $("#add-fmea-row-btn").hidden = name !== "fmea";
  if (historyMode && (historyMode === "replace" || previous !== name)) updateBrowserLocation(activeWorkspace().id, name, historyMode);
}

function renderNotepad() {
  const editor = $("#notepad-editor");
  if (document.activeElement !== editor) {
    editor.innerHTML = sanitizeRichHtml(state.notepad.html || "");
    selectNotepadCell(null);
  }
  $("#brainstorm-type").value = state.notepad.brainstormType;
  const columns = brainstormColumns[state.notepad.brainstormType];
  $("#brainstorm-head").innerHTML = `<tr>${columns.map(([, label]) => `<th>${esc(label)}</th>`).join("")}<th></th></tr>`;
  $("#brainstorm-body").innerHTML = currentBrainstormRows().map(row => `<tr data-brainstorm-row="${row.id}">
    ${columns.map(([field]) => `<td><input value="${esc(row[field] || "")}" data-brainstorm-field="${field}" /></td>`).join("")}
    <td><button class="mini-btn" type="button" data-delete-brainstorm="${row.id}" title="Delete">×</button></td>
  </tr>`).join("");
}

// Overview feature.
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

// FMEA feature.
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

// Hazard and operational-situation catalogue feature.
function renderCatalog(group) {
  $(`#${group}-grid`).innerHTML = state[group].map(item => {
    const links = group === "hazards" ? state.fmea.filter(x => x.hazard === item.id).length + state.requirements.filter(x => x.hazard === item.id).length + state.hara.filter(x => x.hazard === item.id).length + state.silAssessments.filter(x => x.hazard === item.id).length : state.fmea.filter(x => x.situation === item.id).length + state.hara.filter(x => x.situation === item.id).length + state.silAssessments.filter(x => x.situation === item.id).length;
    return `<article class="catalog-card"><div class="catalog-card-top"><span class="catalog-id">${esc(item.id)}</span><span class="category">${esc(item.category)}</span></div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><div class="catalog-footer"><span>${links} linked reference${links === 1 ? "" : "s"}</span><button class="mini-btn" data-delete-catalog="${group}:${item.id}" title="Delete">×</button></div></article>`;
  }).join("");
}

// AMR SIL assessment feature.
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

// Quantitative safety feature.
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

// FMEDA feature.
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

function renderFaultTreeLineNumbers(errorLine?: number) {
  const source = $("#fault-tree-source") as HTMLTextAreaElement;
  const gutter = $("#fault-tree-line-numbers") as HTMLElement;
  const lineCount = Math.max(1, source.value.split(/\r?\n/).length);
  gutter.innerHTML = Array.from({ length: lineCount }, (_, index) => `<span${index + 1 === errorLine ? ' class="error"' : ""}>${index + 1}</span>`).join("");
  gutter.style.width = `${Math.max(3, String(lineCount).length + 1.4)}ch`;
  gutter.scrollTop = source.scrollTop;
}
function renderFaultTree() {
  const editor = $("#fault-tree-source") as HTMLTextAreaElement;
  if (document.activeElement !== editor) editor.value = state.faultTree.dsl;
  const status = $("#fault-tree-status");
  const canvas = $("#fault-tree-canvas");
  const analysis = $("#fault-tree-analysis");
  const layers = $("#fault-tree-layer") as HTMLSelectElement;
  const layerCount = $("#fault-tree-layer-count") as HTMLInputElement;
  renderFaultTreeLineNumbers();
  try {
    function getGateSvg(gate) {
      const t = String(gate || "").toUpperCase();
      if (t.startsWith("KOFN")) return `<svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="4" width="30" height="16" rx="3" fill="none" stroke="currentColor"/><text x="6" y="16" font-size="10" fill="currentColor">${esc(t)}</text></svg>`;
      if (t === "AND") return `<svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 4 H18 A12 12 0 0 1 18 20 H0 Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
      if (t === "OR") return `<svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 4 Q12 12 0 20 Q18 12 36 12 Q18 12 0 4 Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
      if (t === "NOT") return `<svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 4 L28 12 L2 20 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="32" cy="12" r="2" fill="none" stroke="currentColor"/></svg>`;
      if (t === "NAND") return `<svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 4 H18 A12 12 0 0 1 18 20 H0 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="28" cy="12" r="2" fill="none" stroke="currentColor"/></svg>`;
      if (t === "NOR") return `<svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 4 Q12 12 0 20 Q18 12 36 12 Q18 12 0 4 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="34" cy="12" r="2" fill="none" stroke="currentColor"/></svg>`;
      if (t === "XOR") return `<svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 4 Q12 12 2 20" fill="none" stroke="currentColor" stroke-width="1"/><path d="M0 4 Q12 12 0 20 Q18 12 36 12 Q18 12 0 4 Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
      return `<svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="30" height="16" rx="3" fill="none" stroke="currentColor"/></svg>`;
    }
    const model = parseFaultTreeDsl(editor.value || state.faultTree.dsl);
    const cut = faultTreeCutSets(model);
    const searchInput = $("#fault-tree-search") as HTMLInputElement;
    searchInput.value = faultTreeSearch;
    const query = faultTreeSearch.trim().toLowerCase();
    const matchesNode = (node: FaultTreeNode) => !query || [node.id, node.label, node.component, node.layer].some(value => String(value || "").toLowerCase().includes(query));
    const configuredLayers = configuredFaultTreeLayers();
    layerCount.value = String(state.faultTree.layerCount);
    if (!["All", ...configuredLayers].includes(state.faultTree.activeLayer)) state.faultTree.activeLayer = "All";
    layers.innerHTML = ["All", ...configuredLayers].map(layer => `<option value="${esc(layer)}" ${layer === state.faultTree.activeLayer ? "selected" : ""}>${layer === "All" ? "All layers" : esc(layer)}</option>`).join("");
    status.className = "render-status success"; status.textContent = `${model.nodes.size} nodes · ${cut.sets.length} minimal cut set${cut.sets.length === 1 ? "" : "s"}`;
    const rootIds = state.faultTree.activeLayer === "All" ? [model.top] : [...model.nodes.values()]
      .filter(node => node.layer === state.faultTree.activeLayer)
      .filter(node => node.id === model.top || ![...model.nodes.values()].some(parent => parent.layer === state.faultTree.activeLayer && parent.children.includes(node.id)))
      .map(node => node.id);
    type LayoutBranch = { id: string; depth: number; children: LayoutBranch[]; x: number; y: number };
    const matchesBranch = (id: string): boolean => {
      const node = model.nodes.get(id)!;
      return matchesNode(node) || node.children.some(matchesBranch);
    };
    const visible = (id: string) => (state.faultTree.activeLayer === "All" || model.nodes.get(id)?.layer === state.faultTree.activeLayer) && matchesBranch(id);
    function branchFor(id: string, depth = 0): LayoutBranch | null {
      if (!visible(id)) return null;
      const node = model.nodes.get(id)!;
      return { id, depth, children: node.children.map(child => branchFor(child, depth + 1)).filter(Boolean) as LayoutBranch[], x: 0, y: 0 };
    }
    const branches = rootIds.map(id => branchFor(id)).filter(Boolean) as LayoutBranch[];
    let cursor = 140; let maxDepth = 0;
    function place(branch: LayoutBranch) {
      maxDepth = Math.max(maxDepth, branch.depth);
      if (!branch.children.length) { branch.x = cursor; cursor += 250; }
      else { branch.children.forEach(place); branch.x = (branch.children[0].x + branch.children[branch.children.length - 1].x) / 2; }
      branch.y = 34 + branch.depth * 176;
    }
    branches.forEach(branch => { place(branch); cursor += 80; });
    function drawConnectors(branch: LayoutBranch): string {
      const paths = branch.children.map(child => {
        const joinY = branch.y + 132 + Math.max(20, (child.y - branch.y - 132) / 2);
        return `<path d="M ${branch.x} ${branch.y + 132} V ${joinY} H ${child.x} V ${child.y}"/>${drawConnectors(child)}`;
      });
      return paths.join("");
    }
    function drawNode(branch: LayoutBranch): string {
      const node = model.nodes.get(branch.id)!;
      const gate = node.kind === "basic" ? "BASIC EVENT" : node.gate || "GATE";
      return `<article class="fault-node ${node.kind} ${matchesNode(node) && query ? "search-match" : ""}" style="left:${branch.x}px;top:${branch.y}px">
        <div class="fault-node-card"><span class="fault-gate">${getGateSvg(gate)}</span><span class="fault-gate-label">${esc(gate)}</span><strong>${esc(node.id)}</strong><p>${esc(node.label)}</p>${node.component ? `<small>Component: ${esc(node.component)} · ${esc(named("components", node.component))}</small>` : ""}<small>${esc(node.layer)}</small></div>
      </article>${branch.children.map(drawNode).join("")}`;
    }
    if (!branches.length) canvas.innerHTML = `<p class="standards-note">No nodes are assigned to ${esc(state.faultTree.activeLayer)}. Add or move nodes with the builder.</p>`;
    else {
      const width = Math.max(760, cursor + 120); const height = Math.max(250, 190 + maxDepth * 176);
      const zoomedWidth = Math.ceil(width * faultTreeZoom); const zoomedHeight = Math.ceil(height * faultTreeZoom);
      canvas.innerHTML = `<div class="fault-tree-viewport" style="width:${zoomedWidth}px;height:${zoomedHeight}px"><div class="fault-tree-layout" style="width:${width}px;height:${height}px;transform:scale(${faultTreeZoom})"><svg class="fault-tree-connectors" width="${width}" height="${height}" aria-hidden="true">${branches.map(drawConnectors).join("")}</svg>${branches.map(drawNode).join("")}</div></div>`;
    }
    $("#fault-tree-zoom-value").textContent = `${Math.round(faultTreeZoom * 100)}%`;
    const selectedCuts = query ? cut.sets.filter(set => set.some(id => matchesNode(model.nodes.get(id)!))) : cut.sets;
    const orderCounts = new Map<number, number>(); const participation = new Map<string, { count: number; score: number }>();
    selectedCuts.forEach(set => {
      orderCounts.set(set.length, (orderCounts.get(set.length) || 0) + 1);
      set.forEach(id => { const item = participation.get(id) || { count: 0, score: 0 }; item.count += 1; item.score += 1 / set.length; participation.set(id, item); });
    });
    const singletonCuts = selectedCuts.filter(set => set.length === 1);
    const priorityEvents = [...participation.entries()].sort(([, left], [, right]) => right.score - left.score || right.count - left.count).slice(0, 5);
    const visibleCuts = faultTreeCutSetLimit === 0 ? selectedCuts : selectedCuts.slice(0, faultTreeCutSetLimit);
    const cutRows = visibleCuts.map((set, index) => `<tr><td>${index + 1}</td><td>${set.map(id => `<code>${esc(id)}</code>`).join(" + ")}</td><td>${set.map(id => esc(model.nodes.get(id)?.label || id)).join("; ")}</td></tr>`).join("");
    const orderSummary = [...orderCounts.entries()].sort(([left], [right]) => left - right).map(([order, count]) => `${count} × order ${order}`).join(" · ") || "No coherent cut sets";
    analysis.innerHTML = `<div class="fault-analysis-grid">
      <section><h3>Qualitative result</h3><p>${cut.nonCoherent ? "Non-coherent gates such as NOT, NAND, NOR, or XOR are present. Minimal cut sets are not valid for the complete top event; use a dedicated Boolean/probabilistic analysis." : `Minimal cut sets are reduced so supersets are removed. ${selectedCuts.length}${query ? ` of ${cut.sets.length}` : ""} cut sets shown by the current filter.`}</p><p class="subtext">Order profile: ${esc(orderSummary)}.</p></section>
      <section><h3>Review priorities</h3><p>${singletonCuts.length ? `${singletonCuts.length} single-point failure${singletonCuts.length === 1 ? "" : "s"} identified: ${singletonCuts.map(set => esc(set[0])).join(", ")}.` : "No order-1 minimal cut sets in the current result."}</p><p class="subtext">Top-event participation: ${priorityEvents.length ? priorityEvents.map(([id, item]) => `${esc(id)} (${item.count})`).join(", ") : "No events to rank."}</p></section>
    </div><div class="fault-cut-controls"><label>Visible rows <select id="fault-tree-cutset-limit"><option value="10" ${faultTreeCutSetLimit === 10 ? "selected" : ""}>10</option><option value="25" ${faultTreeCutSetLimit === 25 ? "selected" : ""}>25</option><option value="50" ${faultTreeCutSetLimit === 50 ? "selected" : ""}>50</option><option value="100" ${faultTreeCutSetLimit === 100 ? "selected" : ""}>100</option><option value="0" ${faultTreeCutSetLimit === 0 ? "selected" : ""}>All</option></select></label><span>${visibleCuts.length} of ${selectedCuts.length} cut sets visible</span></div><div class="table-scroll"><table class="fault-cut-table"><thead><tr><th>#</th><th>Minimal cut set</th><th>Basic event descriptions</th></tr></thead><tbody>${cutRows || '<tr><td colspan="3">No coherent cut sets available for this top event.</td></tr>'}</tbody></table></div>`;
  } catch (error) {
    const line = Number(String(error.message || "").match(/line\s+(\d+)/i)?.[1]);
    renderFaultTreeLineNumbers(Number.isFinite(line) ? line : undefined);
    status.className = "render-status error"; status.textContent = "FTA model error";
    canvas.innerHTML = `<p>${esc(error.message)}</p>`;
    analysis.innerHTML = `<p class="standards-note">${esc(error.message)}</p>`;
  }
}

// ISO 26262 HARA and safety-goal feature.
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

// Safety requirements feature.
function renderRequirements() {
  $("#requirement-list").innerHTML = state.requirements.map(req => {
    const coverage = testCoverage(req.id);
    const status = coverage.covered ? "Verified" : req.status === "Verified" ? "Planned" : req.status;
    return `<article class="requirement">
    <span class="requirement-id">${esc(req.id)}</span>
    <div><p>${esc(req.text)}</p><span class="requirement-meta">Source: ${esc(req.hazard)} · ${esc(named("hazards", req.hazard))} &nbsp; / &nbsp; Allocation: ${esc(named("components", req.component))}</span></div>
    <div class="req-side"><span class="status ${status.toLowerCase()}">${esc(status)}</span><span class="requirement-meta">${coverage.covered ? `${coverage.passed.length} passed V&V record(s)` : esc(req.verification || "Verification TBD")}</span><div class="row-actions"><button class="mini-btn" title="Edit" data-edit-requirement="${esc(req.id)}">✎</button><button class="mini-btn" title="Delete" data-delete-requirement="${esc(req.id)}">×</button></div></div>
  </article>`;
  }).join("");
}

// Engineering workflow and safety-checkpoint feature.
function workflowGateReady(activity, visited = new Set()) {
  if (visited.has(activity.id)) return false;
  visited.add(activity.id);
  const predecessor = activity.predecessor ? state.workflow.activities.find(item => item.id === activity.predecessor) : null;
  return activity.status === "Complete" && (!predecessor || workflowGateReady(predecessor, visited)) && (!activity.safetyCheckpoint || String(activity.evidence || "").trim()) && String(activity.completionCriteria || "").trim();
}
function renderWorkflow() {
  const activities = state.workflow.activities;
  const completed = activities.filter(activity => activity.status === "Complete").length;
  const safetyChecks = activities.filter(activity => String(activity.safetyCheckpoint || "").trim()).length;
  const ready = activities.filter(activity => workflowGateReady(activity)).length;
  const gaps = activities.filter(activity => activity.status === "Complete" && !workflowGateReady(activity)).length;
  $("#workflow-summary").innerHTML = [
    [state.workflow.phases.length, "Engineering phases"], [activities.length, "Activities"], [safetyChecks, "Safety checkpoints"], [ready, "Gates ready"]
  ].map(([value, label]) => `<div class="workflow-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
  const percent = activities.length ? Math.round(completed / activities.length * 100) : 0;
  $("#workflow-guidance").innerHTML = `<div class="card-header"><div><p class="eyebrow">Workflow health</p><h3>${percent}% complete · ${gaps} gate gap${gaps === 1 ? "" : "s"}</h3></div><span class="status ${gaps ? "planned" : completed === activities.length && activities.length ? "verified" : "draft"}">${gaps ? "Needs evidence" : "On track"}</span></div><p>Complete an activity only when its engineering output and completion criteria are satisfied. A completed safety checkpoint also needs recorded evidence before its gate is ready.</p>`;
  $("#workflow-board").innerHTML = state.workflow.phases.map((phase, phaseIndex) => {
    const phaseActivities = activities.filter(activity => activity.phaseId === phase.id);
    const phaseReady = phaseActivities.length && phaseActivities.every(activity => workflowGateReady(activity));
    return `<section class="workflow-phase">
      <div class="workflow-phase-header"><div><p class="eyebrow">Phase ${phaseIndex + 1}</p><h3>${esc(phase.name)}</h3><p>${esc(phase.purpose)}</p></div><div class="workflow-phase-actions"><span class="status ${phaseReady ? "verified" : "draft"}">${phaseReady ? "Gate ready" : `${phaseActivities.filter(activity => activity.status === "Complete").length}/${phaseActivities.length} complete`}</span><button class="mini-btn" title="Delete phase" data-delete-workflow-phase="${phase.id}">×</button></div></div>
      <div class="workflow-activity-list">${phaseActivities.length ? phaseActivities.map(activity => {
        const ready = workflowGateReady(activity);
        const statusClass = activity.status === "Complete" ? "verified" : activity.status === "In progress" ? "planned" : "draft";
        const predecessor = state.workflow.activities.find(item => item.id === activity.predecessor);
        return `<article class="workflow-activity">
          <input class="workflow-check" type="checkbox" title="Mark complete" data-toggle-workflow-activity="${activity.id}" ${activity.status === "Complete" ? "checked" : ""} />
          <div class="workflow-activity-content">
            <div class="workflow-activity-heading">
              <div><h3>${esc(activity.title)}</h3><div class="workflow-objective"><strong>Objective</strong><p>${esc(activity.objective)}</p></div></div>
              <div class="workflow-meta">
                <span class="status ${statusClass}">${esc(activity.status)}</span>
                ${activity.owner ? `<span class="workflow-chip owner"><b>Owner</b>${esc(activity.owner)}</span>` : ""}
                ${activity.analysis ? `<span class="workflow-chip analysis"><b>Analysis</b>${esc(activity.analysis.toUpperCase())}</span>` : ""}
                ${activity.standardReference ? `<span class="workflow-chip standard"><b>Standard</b>${esc(activity.standardReference)}</span>` : ""}
                ${activity.predecessor ? `<span class="workflow-chip predecessor"><b>After</b>${esc(predecessor?.title || "Missing gate")}</span>` : ""}
              </div>
            </div>
            <div class="workflow-flow">
              <section class="workflow-data inputs"><strong>Inputs</strong><p>${esc(activity.inputs || "No inputs recorded")}</p></section>
              <span class="workflow-flow-arrow" aria-hidden="true">→</span>
              <section class="workflow-data outputs"><strong>Outputs</strong><p>${esc(activity.outputs || "No outputs recorded")}</p></section>
            </div>
            <div class="workflow-assurance-grid">
              <div class="workflow-checkpoint"><strong>Safety checkpoint</strong><p>${esc(activity.safetyCheckpoint || "No checkpoint defined. Review whether this decision can affect risk.")}</p></div>
              <div class="workflow-evidence ${activity.status === "Complete" && !ready ? "missing" : ""}"><strong>${ready ? "Gate evidence ready" : "Gate requirements"}</strong><p>${esc(activity.evidence || activity.completionCriteria || "Add completion criteria and evidence.")}</p></div>
            </div>
            <div class="workflow-row-actions">${activity.analysis ? `<button class="button secondary small" data-open-workflow-analysis="${activity.analysis}">Open ${esc(activity.analysis)} analysis</button>` : ""}<div class="row-actions"><button class="mini-btn" title="Edit" data-edit-workflow-activity="${activity.id}">✎</button><button class="mini-btn" title="Delete" data-delete-workflow-activity="${activity.id}">×</button></div></div>
          </div>
        </article>`;
      }).join("") : '<p class="workflow-empty">No activities in this phase yet.</p>'}</div>
    </section>`;
  }).join("");
}

// Architecture feature.
function renderArchitecture() {
  $("#plantuml-source").value = state.plantuml;
  state.components = componentsFromPlantUml(state.plantuml);
  $("#component-count").textContent = state.components.length;
  $("#component-list").innerHTML = state.components.length ? state.components.map(x => `<div class="component-item"><strong>${esc(x.name)}</strong><span>${esc(x.id)}</span></div>`).join("") : `<p class="dialog-copy">Add PlantUML component declarations to define reusable architecture components.</p>`;
}
// Builder UI: populate builder selects and handle insertion of DSL snippets
function renderFaultTreeBuilder() {
  const snippetTypeSel = $("#fault-tree-snippet-type") as HTMLSelectElement;
  const gateTypeSel = $("#fault-tree-builder-gate-type") as HTMLSelectElement;
  const layerSel = $("#fault-tree-builder-layer") as HTMLSelectElement;
  const compSel = $("#fault-tree-builder-component") as HTMLSelectElement;
  const inputsSel = $("#fault-tree-builder-inputs") as HTMLSelectElement;
  const outputInput = $("#fault-tree-builder-output") as HTMLInputElement;
  const labelInput = $("#fault-tree-builder-label") as HTMLInputElement;
  const validationDiv = $("#fault-tree-builder-validation") as HTMLDivElement;
  const componentHint = $("#fault-tree-component-hint");
  const inputsLabel = $("#fault-tree-inputs-label");
  const inputsHint = $("#fault-tree-inputs-hint");
  const basicFields = [...document.querySelectorAll(".fault-tree-basic-field")] as HTMLElement[];
  const gateFields = [...document.querySelectorAll(".fault-tree-gate-fields")] as HTMLElement[];
  const insertBtn = $("#fault-tree-insert-btn") as HTMLButtonElement;
  // populate components
  compSel.innerHTML = state.components.length ? `<option value="">No component selected</option>${state.components.map(c => `<option value="${esc(c.id)}">${esc(c.id)} — ${esc(c.name)}</option>`).join("")}` : `<option value="">No imported components</option>`;
  compSel.disabled = !state.components.length;
  componentHint.textContent = state.components.length ? "Defined in System architecture." : "Define components in System architecture to link this event.";
  // toggle K/N settings visibility based on gate type
  function updateInputSelectionMode() {
    const singleInput = gateTypeSel.value === "NOT";
    inputsSel.multiple = !singleInput;
    inputsLabel.textContent = singleInput ? "Select one event or nested gate" : "Select events or nested gates";
    inputsHint.textContent = singleInput ? "NOT gates accept exactly one input." : gateTypeSel.value === "AND" || gateTypeSel.value === "OR" ? "Hold Ctrl/Cmd to select multiple inputs." : "Select the inputs used by this gate.";
    if (singleInput && inputsSel.selectedOptions.length > 1) [...inputsSel.options].forEach((option, index) => option.selected = index === 0 && option.selected);
  }
  function updateBuilderMode() {
    const isBasic = snippetTypeSel.value === "basic";
    const isGate = !isBasic;
    basicFields.forEach(field => field.hidden = !isBasic);
    gateFields.forEach(field => field.hidden = !isGate);
    gateTypeSel.disabled = !isGate;
    inputsSel.disabled = !isGate;
    (document.querySelector("#fault-tree-builder-new-input") as HTMLInputElement).disabled = !isGate;
    (document.querySelector("#fault-tree-builder-add-input") as HTMLButtonElement).disabled = !isGate;
    insertBtn.textContent = isBasic ? "Add basic event" : snippetTypeSel.value === "top" ? "Create top event" : "Add nested gate";
    const help = $("#fault-tree-builder-mode-help");
    help.textContent = isBasic ? "A terminal failure event linked to a component." : snippetTypeSel.value === "top" ? "The root gate for this fault tree." : "Combine existing event IDs into intermediate logic.";
    if (!outputInput.value || outputInput.dataset.mode !== snippetTypeSel.value) {
      outputInput.value = makeUniqueId(isBasic ? "BE" : snippetTypeSel.value === "top" ? "TOP" : "G");
      outputInput.dataset.mode = snippetTypeSel.value;
    }
    updateInputSelectionMode();
  }
  if (!snippetTypeSel.dataset.builderAttached) {
    snippetTypeSel.addEventListener("change", updateBuilderMode);
    gateTypeSel.addEventListener('change', updateInputSelectionMode);
    snippetTypeSel.dataset.builderAttached = "1";
  }
  // helper to show validation messages inline
  function showValidation(message: string, type: 'error' | 'warning' = 'error'){
    validationDiv.className = `fault-tree-validation ${type}`;
    const icon = type === 'error' ? '⚠' : 'ⓘ';
    validationDiv.innerHTML = `<strong>${icon}</strong> ${message}`;
  }
  function clearValidation(){
    validationDiv.className = 'fault-tree-validation';
    validationDiv.innerHTML = '';
  }
  
  // derive model nodes for input suggestions
  let model;
  try { model = parseFaultTreeDsl($("#fault-tree-source").value || state.faultTree.dsl); } catch (e) { model = { top: "", nodes: new Map(), layers: ["All"], warnings: [] }; }
  layerSel.innerHTML = configuredFaultTreeLayers().map(layer => `<option value="${esc(layer)}">${esc(layer)}</option>`).join("");
  // persist custom, freeform event names so they survive re-renders
  state.faultTree.customInputs = state.faultTree.customInputs || [];
  const customInputs: string[] = state.faultTree.customInputs || [];
  // helper to refresh the inputs multi-select combining model nodes and custom inputs
  function updateInputsOptions(){
    const nodes = model && model.nodes ? [...model.nodes.values()] : [];
    const basics = nodes.filter(node => node.kind === "basic");
    const gates = nodes.filter(node => node.kind !== "basic");
    const custom = customInputs.filter(id => !model.nodes?.has(id));
    const options = (items: any[]) => items.map(item => `<option value="${esc(item.id || item)}">${esc(item.id || item)}${item.label ? ` — ${esc(item.label)}` : ""}${item.layer ? ` [${esc(item.layer)}]` : ""}</option>`).join("");
    inputsSel.innerHTML = [
      basics.length ? `<optgroup label="Basic events">${options(basics)}</optgroup>` : "",
      gates.length ? `<optgroup label="Nested gates">${options(gates)}</optgroup>` : "",
      custom.length ? `<optgroup label="Placeholders to define">${options(custom)}</optgroup>` : ""
    ].join("") || `<option disabled>No events available — add a basic event first.</option>`;
  }
  updateInputsOptions();
  // helper: create a unique id not colliding with existing nodes
  const existingIds = new Set(model.nodes ? [...model.nodes.keys()] : []);
  function makeUniqueId(base = 'G'){
    base = String(base).replace(/[^A-Za-z0-9_]/g, '') || 'G';
    if (!existingIds.has(base)) return base;
    for(let i=1;i<10000;i++){
      const cand = `${base}${i}`;
      if(!existingIds.has(cand)) return cand;
    }
    return `${base}${Math.floor(Math.random()*90000)}`;
  }
  updateBuilderMode();
  if (!insertBtn) return;
  // wire the freeform input add button and enter key
  const newInputField = $("#fault-tree-builder-new-input") as HTMLInputElement | null;
  const addInputBtn = $("#fault-tree-builder-add-input") as HTMLButtonElement | null;
  function addCustomInput(valueRaw: string){
    const v = String(valueRaw || "").trim();
    if(!v) return;
    // normalise to identifier-like token
    const token = v.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_\-]/g, '');
    if(!token) return;
    if(!customInputs.includes(token)){
      customInputs.push(token);
      state.faultTree.customInputs = customInputs;
      persistState();
    }
    updateInputsOptions();
    // select the newly added option
    const opt = Array.from(inputsSel.options).find(o => o.value === token) as HTMLOptionElement | undefined;
    if(opt){ opt.selected = true; inputsSel.focus(); }
    if(newInputField) newInputField.value = "";
  }
  if(newInputField){
    newInputField.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){
        e.preventDefault(); addCustomInput(newInputField.value);
      }
    });
  }
  if(addInputBtn){ addInputBtn.addEventListener('click', () => addCustomInput(newInputField ? newInputField.value : '')); }

  if (!insertBtn.dataset.builderAttached) {
    insertBtn.addEventListener("click", () => {
      const snippetType = ($("#fault-tree-snippet-type") as HTMLSelectElement).value;
      const gateType = ($("#fault-tree-builder-gate-type") as HTMLSelectElement).value;
      const layer = layerSel.value || "Logic";
      const component = compSel.value || "";
      let output = (outputInput.value || makeUniqueId('G')).trim();
      // auto-fill label with output if needed
      const label = (labelInput.value || output).trim();
      // validate output id
      if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(output)){
        showValidation('Invalid output ID. Use letters, numbers, underscore; start with letter or underscore.');
        outputInput.focus();
        return;
      }
      if(existingIds.has(output)){
        showValidation(`Output ID '${output}' already exists. Gates and events must have unique IDs.`);
        outputInput.focus();
        return;
      }
      const selectedInputs = Array.from(inputsSel.selectedOptions).map(o => o.value).filter(Boolean);
      if (selectedInputs.includes(output)) {
        showValidation(`Output ID '${output}' cannot also be an input. Choose a different output ID to avoid a self-reference.`);
        outputInput.focus();
        return;
      }
      // validate selected inputs for gates
      if(snippetType !== 'basic'){
        // NOT gate requires exactly 1 input
        if(gateType === 'NOT'){
          if(selectedInputs.length !== 1){
            showValidation('NOT gate requires exactly 1 input. Please select one input (uncheck others if selected).');
            return;
          }
        }
        // Other gates require at least 2 inputs for meaningful logic
        else if(selectedInputs.length < 2){
          showValidation(`${gateType} gate requires at least 2 inputs. You selected ${selectedInputs.length}. Use Ctrl/Cmd+Click to select multiple events.`, 'error');
          return;
        }
        
      }
      clearValidation();
      const editor = $("#fault-tree-source") as HTMLTextAreaElement;
      let snippet = "";
      if (snippetType === "basic") {
        snippet = `\nbasic ${output} {\n  label: "${label}"${component ? `\n  component: ${component}` : ""}\n  layer: ${layer}\n}\n`;
      } else if (snippetType === "top") {
        snippet = `\nfault_tree "${label}" {\n  top: ${output}\n\n  gate ${output} {\n    type: ${gateType}\n    label: "${label}"\n    children: [${selectedInputs.join(", ")}]\n    layer: ${layer}\n  }\n}\n`;
      } else {
        snippet = `\n  gate ${output} {\n    type: ${gateType}\n    label: "${label}"\n    children: [${selectedInputs.join(", ")}]\n    layer: ${layer}\n  }\n`;
      }
      // Keep snippets inside a structured tree; users should not need to place the cursor precisely.
      if (snippetType !== "top" && /^\s*fault_tree\b/i.test(editor.value)) {
        const closingBrace = editor.value.lastIndexOf("}");
        editor.value = closingBrace >= 0 ? `${editor.value.slice(0, closingBrace)}${snippet}${editor.value.slice(closingBrace)}` : `${editor.value}\n${snippet}`;
      } else if (snippetType === "top") {
        editor.value = snippet;
      } else {
        editor.value = `${editor.value}\n${snippet}`;
      }
      editor.focus();
      persistState();
      // update model caches and builder lists so new id becomes available immediately
      try{
        model = parseFaultTreeDsl(editor.value || state.faultTree.dsl);
        existingIds.add(output);
        updateInputsOptions();
      }catch(e){}
      if (snippetType === "basic") {
        labelInput.value = "";
        outputInput.value = makeUniqueId("BE");
      }
      renderFaultTree();
    });
    insertBtn.dataset.builderAttached = "1";
  }
}

function renderWorkspaceControls() {
  const active = activeWorkspace();
  $("#workspace-select").innerHTML = tabWorkspaces().map(workspace => `<option value="${esc(workspace.id)}" ${workspace.id === active.id ? "selected" : ""}>${esc(workspace.name)}</option>`).join("");
  document.title = `${active.name} | Praxis Studio`;
}

// Feature registry: new features can join the application shell without adding
// another direct dependency to renderAll().
const FEATURE_RENDERERS = [
  renderWorkspaceControls,
  renderMetrics,
  renderNotepad,
  renderWorkflow,
  renderFmea,
  () => renderCatalog("hazards"),
  () => renderCatalog("situations"),
  renderRequirements,
  renderAssurance,
  renderHara,
  renderSil,
  renderQuantitative,
  renderFmeda,
  renderFaultTreeBuilder,
  renderFaultTree,
  renderArchitecture
];
function renderAll() { FEATURE_RENDERERS.forEach(render => render()); }

// Feature dialog adapters. They translate feature state into form controls.
function fillRowForm(row: FeatureRecord = {}) {
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
function fillWorkflowActivityForm(activity: FeatureRecord = {}) {
  const form = $("#workflow-activity-form"); form.reset();
  $("#workflow-activity-title").textContent = activity.id ? "Edit activity" : "Add activity";
  form.elements.id.value = activity.id || "";
  form.elements.phaseId.innerHTML = state.workflow.phases.map(phase => `<option value="${esc(phase.id)}">${esc(phase.name)}</option>`).join("");
  form.elements.predecessor.innerHTML = `<option value="">No predecessor</option>${state.workflow.activities.filter(item => item.id !== activity.id).map(item => `<option value="${esc(item.id)}">${esc(item.title)}</option>`).join("")}`;
  ["phaseId", "owner", "predecessor", "title", "objective", "inputs", "outputs", "safetyCheckpoint", "analysis", "status", "standardReference", "completionCriteria", "evidence"].forEach(key => { if (activity[key] !== undefined) form.elements[key].value = activity[key]; });
  $("#workflow-activity-dialog").showModal();
}

function openCatalog(group) {
  $("#catalog-form").reset();
  $("#catalog-form").elements.catalog.value = group;
  $("#catalog-title").textContent = group === "hazards" ? "Add hazard" : "Add operational situation";
  $("#category-field").style.display = group === "hazards" ? "" : "none";
  $("#catalog-dialog").showModal();
}
function fillRequirementForm(requirement: FeatureRecord = {}) {
  const form = $("#requirement-form"); form.reset();
  $("#requirement-dialog-title").textContent = requirement.id ? "Edit requirement" : "Add requirement";
  form.elements.originalId.value = requirement.id || "";
  form.elements.hazard.innerHTML = options(state.hazards, requirement.hazard);
  form.elements.component.innerHTML = options(state.components, requirement.component);
  ["id", "status", "text", "verification"].forEach(key => { if (requirement[key] !== undefined) form.elements[key].value = requirement[key]; });
  $("#requirement-dialog").showModal();
}
function renderColumns() {
  $("#column-list").innerHTML = state.customColumns.length ? state.customColumns.map(x => `<div class="column-entry"><span>${esc(x.label)}</span><button type="button" class="remove-column" data-delete-column="${x.key}">Remove</button></div>`).join("") : `<p class="dialog-copy">No additional columns yet.</p>`;
}
function fillHaraForm(row: FeatureRecord = {}) {
  const form = $("#hara-form"); form.reset();
  $("#hara-dialog-title").textContent = row.id ? "Edit hazardous event" : "Add hazardous event";
  form.elements.id.value = row.id || "";
  form.elements.hazard.innerHTML = options(state.hazards, row.hazard);
  form.elements.situation.innerHTML = options(state.situations, row.situation);
  form.elements.safetyGoal.innerHTML = options(state.safetyGoals.map(goal => ({ id: goal.id, name: goal.text })), row.safetyGoal, true);
  ["eventId", "malfunction", "consequence", "severity", "exposure", "controllability"].forEach(key => { if (row[key] !== undefined) form.elements[key].value = row[key]; });
  updateAsilPreview(); $("#hara-dialog").showModal();
}
function fillGoalForm(goal: FeatureRecord = {}) {
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
function fillSilForm(row: FeatureRecord = {}) {
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
function fillQuantitativeForm(row: FeatureRecord = {}) {
  const form = $("#quant-component-form"); form.reset();
  $("#quant-component-title").textContent = row.id ? "Edit component rate" : "Add component rate";
  form.elements.id.value = row.id || ""; form.elements.component.innerHTML = options(state.components, row.component);
  ["role", "lambdaTotal", "dangerousFraction", "diagnosticCoverage", "proofTestHours", "channels", "beta"].forEach(key => { if (row[key] !== undefined) form.elements[key].value = row[key]; });
  $("#quant-component-dialog").showModal();
}
function fillFmedaForm(row: FeatureRecord = {}) {
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

// Application shell and workspace events.
$("#main-nav").addEventListener("click", event => { const button = eventElement(event).closest<HTMLElement>("[data-view]"); if (button) showView(button.dataset.view); });
$("#workspace-select").addEventListener("change", event => switchWorkspace(event.target.value));
window.addEventListener("popstate", () => {
  refreshWorkspaceRegistry();
  const workspace = workspaceRegistry.workspaces.find(item => item.id === requestedWorkspaceId());
  if (workspace && workspace.id !== activeWorkspaceId()) switchWorkspace(workspace.id, false);
  showView(requestedView(), false);
  if (!workspace) updateBrowserLocation(activeWorkspace().id, activeView(), "replace");
});
$("#workspace-menu-btn").addEventListener("click", () => {
  const menu = $("#workspace-menu"); menu.hidden = !menu.hidden;
  $("#workspace-menu-btn").setAttribute("aria-expanded", String(!menu.hidden));
});
$("#workspace-menu").addEventListener("click", event => { if (eventElement(event).closest("button")) closeWorkspaceMenu(); });
document.addEventListener("click", event => { if (!eventElement(event).closest(".workspace-menu-wrap")) closeWorkspaceMenu(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeWorkspaceMenu(); });
$("#new-workspace-btn").addEventListener("click", createNewWorkspace);
$("#delete-workspace-btn").addEventListener("click", deleteActiveWorkspace);
$("#open-workspace-tab-btn").addEventListener("click", openActiveWorkspaceInNewTab);
$("#close-workspace-btn").addEventListener("click", closeActiveWorkspace);

// Rich notepad and structured brainstorming events.
$("#notepad-toolbar").addEventListener("click", event => {
  const command = eventElement(event).closest<HTMLElement>("[data-command]")?.dataset.command;
  if (command) { $("#notepad-editor").focus(); document.execCommand(command); saveNotepad(); }
});
$("#notepad-save-btn").addEventListener("click", saveNotepad);
$("#notepad-editor").addEventListener("click", event => {
  const target = eventElement(event);
  selectNotepadCell(target.closest<HTMLTableCellElement>("td, th"));
  const artifact = target.closest<HTMLElement>("[data-notepad-artifact]");
  if (artifact) { event.preventDefault(); showView(artifact.dataset.notepadArtifact); }
});
$("#notepad-editor").addEventListener("input", scheduleNotepadSave);
window.addEventListener("beforeunload", event => {
  if (!notepadDirty) return;
  event.preventDefault();
  event.returnValue = "";
});
$("#notepad-table-action").addEventListener("change", event => {
  const menu = event.target as HTMLSelectElement;
  if (menu.value) editNotepadTable(menu.value);
  menu.value = "";
});
$("#notepad-heading-btn").addEventListener("click", () => { $("#notepad-editor").focus(); document.execCommand("formatBlock", false, "h3"); saveNotepad(); });
$("#notepad-font-size").addEventListener("change", event => {
  const menu = event.target as HTMLSelectElement;
  if (menu.value) {
    $("#notepad-editor").focus();
    document.execCommand("fontSize", false, menu.value);
    normalizeNotepadFontSizes($("#notepad-editor"));
    saveNotepad();
  }
  menu.value = "";
});
$("#notepad-math-btn").addEventListener("click", () => {
  const expression = prompt("Enter a mathematical expression or engineering equation:");
  if (expression) insertNotepadHtml(`<pre><code>${esc(expression)}</code></pre><p><br></p>`);
});
$("#notepad-table-btn").addEventListener("click", () => insertNotepadHtml("<table><thead><tr><th>Item</th><th>Value</th><th>Note</th></tr></thead><tbody><tr><td>Draft</td><td></td><td></td></tr><tr><td>Draft</td><td></td><td></td></tr></tbody></table><p><br></p>"));
$("#notepad-link-btn").addEventListener("click", () => {
  const artifact = prompt(`Link to artifact: ${notepadArtifacts.map(([label]) => label).join(", ")}`);
  const match = resolveNotepadArtifact(artifact);
  if (!match) return alert("Enter a valid artifact name.");
  const [label, view] = match;
  insertNotepadHtml(`<a href="#${view}" data-go="${view}" data-notepad-artifact="${view}">${esc(label)}</a>`);
});
$("#notepad-figure-btn").addEventListener("click", () => $("#notepad-figure-input").click());
$("#notepad-figure-input").addEventListener("change", event => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const caption = prompt("Figure caption:") || file.name;
    insertNotepadHtml(`<figure><img src="${esc(String(reader.result))}" alt="${esc(caption)}"><figcaption>${esc(caption)}</figcaption></figure><p><br></p>`);
    input.value = "";
  };
  reader.readAsDataURL(file);
});
$("#brainstorm-type").addEventListener("change", event => {
  state.notepad.brainstormType = (event.target as HTMLSelectElement).value;
  save();
});
$("#notepad-add-brainstorm-row-btn").addEventListener("click", () => {
  state.notepad.brainstormRows.push(blankBrainstormRow());
  save();
});
$("#brainstorm-clean-btn").addEventListener("click", cleanupBrainstormRows);
$("#brainstorm-import-btn").addEventListener("click", importBrainstormRows);

// Engineering workflow events.
$("#add-workflow-phase-btn").addEventListener("click", () => { $("#workflow-phase-form").reset(); $("#workflow-phase-dialog").showModal(); });
$("#add-workflow-activity-btn").addEventListener("click", () => {
  if (!state.workflow.phases.length) return alert("Add an engineering phase before creating an activity.");
  fillWorkflowActivityForm();
});
$("#add-assurance-btn").addEventListener("click", () => fillAssuranceForm("tests"));
$("#assurance-record-type").addEventListener("change", event => {
  const kind = (event.target as HTMLSelectElement).value;
  $("#assurance-form").elements.recordId.value = "";
  $("#assurance-dialog-title").textContent = `Add ${kind === "hazard" ? "hazard lifecycle update" : assuranceLabels[kind]}`;
  $("#assurance-fields").innerHTML = assuranceSchemas[kind].map(field => assuranceFieldHtml(field, {})).join("");
});
$("#help-btn").addEventListener("click", () => $("#help-dialog").showModal());

// Portable project import and cross-tab workspace synchronization.
$("#import-workspace-btn").addEventListener("click", () => $("#workspace-file-input").click());
$("#workspace-file-input").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try { openProject(parseProject(await file.text())); }
  catch (error) { alert(error.message); }
  finally { event.target.value = ""; }
});
window.addEventListener("storage", event => {
  if (event.key !== WORKSPACES_KEY) return;
  refreshWorkspaceRegistry();
  if (!workspaceRegistry.workspaces.some(workspace => workspace.id === activeWorkspaceId())) {
    const next = tabWorkspaces()[0] || workspaceRegistry.workspaces[0];
    openWorkspaceInTab(next.id);
    setActiveWorkspaceId(next.id);
    state = migrateWorkspace(structuredClone(activeWorkspace().data));
    renderAll();
  } else renderWorkspaceControls();
});

// Delegated feature actions. Data attributes keep rendered rows independent
// from event registration and avoid one listener per dynamic record.
document.addEventListener("click", event => {
  const target = eventElement(event);
  const removeBrainstorm = target.closest<HTMLElement>("[data-delete-brainstorm]");
  if (removeBrainstorm) {
    state.notepad.brainstormRows = state.notepad.brainstormRows.filter(row => row.id !== removeBrainstorm.dataset.deleteBrainstorm);
    save();
  }
  const close = target.closest("[data-close-dialog]"); if (close) close.closest<HTMLDialogElement>("dialog")?.close();
  const go = target.closest<HTMLElement>("[data-go]"); if (go) showView(go.dataset.go);
  const workflowAnalysis = target.closest<HTMLElement>("[data-open-workflow-analysis]"); if (workflowAnalysis) showView(workflowAnalysis.dataset.openWorkflowAnalysis);
  const addAssurance = target.closest<HTMLElement>("[data-add-assurance]"); if (addAssurance) fillAssuranceForm(addAssurance.dataset.addAssurance);
  const editAssurance = target.closest<HTMLElement>("[data-edit-assurance]");
  if (editAssurance) {
    const [kind, id] = editAssurance.dataset.editAssurance.split(":");
    fillAssuranceForm(kind, assuranceItems(kind).find(item => item.id === id));
  }
  const removeAssurance = target.closest<HTMLElement>("[data-delete-assurance]");
  if (removeAssurance) {
    const [kind, id] = removeAssurance.dataset.deleteAssurance.split(":");
    const record = state.assurance[kind].find(item => item.id === id);
    const linkedEvidence = kind === "evidence" && (state.assurance.tests.some(item => item.evidence === id) || state.assurance.deviations.some(item => item.closureEvidence === id) || state.assurance.changes.some(item => item.evidence === id) || state.assurance.reviews.some(item => item.evidence === id) || state.assurance.claims.some(item => item.evidence === id) || state.hazards.some(item => item.closureEvidence === id));
    const linkedRecord = kind === "deviations" && state.assurance.tests.some(item => item.deviation === id) || kind === "baselines" && state.assurance.changes.some(item => item.baseline === id) || kind === "claims" && state.assurance.claims.some(item => item.parentClaim === id);
    const controlled = kind === "evidence" && record?.status === "Approved" || kind === "baselines" && record?.status === "Approved" || kind === "reviews" && record?.status === "Complete" || kind === "tests" && ["Passed", "Failed"].includes(record?.status) || kind === "changes" && record?.decision === "Implemented";
    if (linkedEvidence || linkedRecord) alert("This lifecycle record is referenced and cannot be deleted.");
    else if (controlled) alert("Completed or approved lifecycle records cannot be deleted. Supersede or replace the controlled record instead.");
    else if (confirm(`Delete lifecycle record "${id}"?`)) { state.assurance[kind] = state.assurance[kind].filter(item => item.id !== id); auditAssurance("Deleted", kind, id); save(); }
  }
  const editWorkflow = target.closest<HTMLElement>("[data-edit-workflow-activity]"); if (editWorkflow) fillWorkflowActivityForm(state.workflow.activities.find(activity => activity.id === editWorkflow.dataset.editWorkflowActivity));
  const toggleWorkflow = target.closest<HTMLInputElement>("[data-toggle-workflow-activity]");
  if (toggleWorkflow) {
    const activity = state.workflow.activities.find(item => item.id === toggleWorkflow.dataset.toggleWorkflowActivity);
    if (activity) { activity.status = toggleWorkflow.checked ? "Complete" : "In progress"; save(); }
  }
  const removeWorkflow = target.closest<HTMLElement>("[data-delete-workflow-activity]");
  if (removeWorkflow && confirm("Delete this workflow activity?")) { state.workflow.activities = state.workflow.activities.filter(activity => activity.id !== removeWorkflow.dataset.deleteWorkflowActivity); save(); }
  const removeWorkflowPhase = target.closest<HTMLElement>("[data-delete-workflow-phase]");
  if (removeWorkflowPhase) {
    const used = state.workflow.activities.some(activity => activity.phaseId === removeWorkflowPhase.dataset.deleteWorkflowPhase);
    if (used) alert("Move or delete this phase's activities before deleting the phase.");
    else if (confirm("Delete this engineering phase?")) { state.workflow.phases = state.workflow.phases.filter(phase => phase.id !== removeWorkflowPhase.dataset.deleteWorkflowPhase); save(); }
  }
  if (target.closest("[data-open-row]")) fillRowForm();
  const catalog = target.closest<HTMLElement>("[data-open-catalog]"); if (catalog) openCatalog(catalog.dataset.openCatalog);
  const edit = target.closest<HTMLElement>("[data-edit-row]"); if (edit) fillRowForm(state.fmea.find(x => x.id === edit.dataset.editRow));
  const remove = target.closest<HTMLElement>("[data-delete-row]"); if (remove && confirm("Delete this failure mode?")) { state.fmea = state.fmea.filter(x => x.id !== remove.dataset.deleteRow); save(); }
  const editRequirement = target.closest<HTMLElement>("[data-edit-requirement]"); if (editRequirement) fillRequirementForm(state.requirements.find(item => item.id === editRequirement.dataset.editRequirement));
  const removeRequirement = target.closest<HTMLElement>("[data-delete-requirement]");
  if (removeRequirement) {
    const id = removeRequirement.dataset.deleteRequirement;
    if (state.assurance.tests.some(test => test.requirement === id)) alert("This requirement is referenced by V&V records and cannot be deleted.");
    else if (confirm(`Delete requirement "${id}"?`)) { state.requirements = state.requirements.filter(item => item.id !== id); save(); }
  }
  const removeCatalog = target.closest<HTMLElement>("[data-delete-catalog]");
  if (removeCatalog) {
    const [group, id] = removeCatalog.dataset.deleteCatalog.split(":");
    const linked = group === "hazards" ? state.fmea.some(x => x.hazard === id) || state.requirements.some(x => x.hazard === id) || state.hara.some(x => x.hazard === id) || state.silAssessments.some(x => x.hazard === id) : state.fmea.some(x => x.situation === id) || state.hara.some(x => x.situation === id) || state.silAssessments.some(x => x.situation === id);
    if (linked) alert("This catalogue entry is referenced by the analysis and cannot be deleted.");
    else if (confirm("Delete this catalogue entry?")) { state[group] = state[group].filter(x => x.id !== id); save(); }
  }
  const removeColumn = target.closest<HTMLElement>("[data-delete-column]");
  if (removeColumn) { state.customColumns = state.customColumns.filter(x => x.key !== removeColumn.dataset.deleteColumn); save(); renderColumns(); }
  const editHara = target.closest<HTMLElement>("[data-edit-hara]"); if (editHara) fillHaraForm(state.hara.find(x => x.id === editHara.dataset.editHara));
  const removeHara = target.closest<HTMLElement>("[data-delete-hara]"); if (removeHara && confirm("Delete this hazardous event?")) { state.hara = state.hara.filter(x => x.id !== removeHara.dataset.deleteHara); save(); }
  const editGoal = target.closest<HTMLElement>("[data-edit-goal]"); if (editGoal) fillGoalForm(goalBy(editGoal.dataset.editGoal));
  const removeGoal = target.closest<HTMLElement>("[data-delete-goal]");
  if (removeGoal) {
    if (state.hara.some(row => row.safetyGoal === removeGoal.dataset.deleteGoal)) alert("This safety goal is referenced by a hazardous event and cannot be deleted.");
    else if (confirm("Delete this safety goal?")) { state.safetyGoals = state.safetyGoals.filter(goal => goal.id !== removeGoal.dataset.deleteGoal); save(); }
  }
  const editSil = target.closest<HTMLElement>("[data-edit-sil]"); if (editSil) fillSilForm(state.silAssessments.find(x => x.id === editSil.dataset.editSil));
  const removeSil = target.closest<HTMLElement>("[data-delete-sil]"); if (removeSil && confirm("Delete this SIL assessment?")) { state.silAssessments = state.silAssessments.filter(x => x.id !== removeSil.dataset.deleteSil); save(); }
  const editQuant = target.closest<HTMLElement>("[data-edit-quant]"); if (editQuant) fillQuantitativeForm(state.quantitative.components.find(x => x.id === editQuant.dataset.editQuant));
  const removeQuant = target.closest<HTMLElement>("[data-delete-quant]"); if (removeQuant && confirm("Delete this component rate?")) { state.quantitative.components = state.quantitative.components.filter(x => x.id !== removeQuant.dataset.deleteQuant); save(); }
  const editFmeda = target.closest<HTMLElement>("[data-edit-fmeda]"); if (editFmeda) fillFmedaForm(state.fmeda.rows.find(x => x.id === editFmeda.dataset.editFmeda));
  const removeFmeda = target.closest<HTMLElement>("[data-delete-fmeda]"); if (removeFmeda && confirm("Delete this FMEDA row?")) { state.fmeda.rows = state.fmeda.rows.filter(x => x.id !== removeFmeda.dataset.deleteFmeda); save(); }
  const removeConstant = target.closest<HTMLElement>("[data-delete-constant]");
  if (removeConstant) {
    const symbol = removeConstant.dataset.deleteConstant; const used = state.fmeda.rows.some(row => new RegExp(`\\b${symbol}\\b`).test(row.expression));
    if (used) alert("This constant is referenced by an FMEDA expression and cannot be deleted."); else if (confirm("Delete this constant?")) { state.fmeda.constants = state.fmeda.constants.filter(item => item.symbol !== symbol); save(); }
  }
});
$("#brainstorm-body").addEventListener("input", event => {
  const input = event.target as HTMLInputElement;
  const rowId = input.closest<HTMLElement>("[data-brainstorm-row]")?.dataset.brainstormRow;
  const field = input.dataset.brainstormField;
  const row = state.notepad.brainstormRows.find(item => item.id === rowId);
  if (row && field) { row[field] = input.value; persistState(); }
});

// Engineering workflow forms.
$("#workflow-phase-form").addEventListener("submit", event => {
  event.preventDefault();
  const data = formValues(event.target as HTMLFormElement);
  try {
    data.name = requireUniqueIdentifier(state.workflow.phases, requireValue(data.name, "Phase name"), "Phase name", { field: "name" });
    data.purpose = requireValue(data.purpose, "Phase purpose");
  } catch (error) { return handleFormError(error); }
  state.workflow.phases.push({ id: crypto.randomUUID(), name: data.name, purpose: data.purpose });
  $("#workflow-phase-dialog").close(); save();
});
$("#workflow-activity-form").addEventListener("submit", event => {
  event.preventDefault();
  const data = formValues(event.target as HTMLFormElement);
  let activity;
  try {
    activity = {
      id: data.id || crypto.randomUUID(),
      phaseId: requireValue(data.phaseId, "Engineering phase"),
      title: requireValue(data.title, "Activity"),
      objective: requireValue(data.objective, "Objective"),
      owner: data.owner.trim(), inputs: data.inputs.trim(), outputs: data.outputs.trim(),
      predecessor: data.predecessor,
      safetyCheckpoint: data.safetyCheckpoint.trim(), analysis: data.analysis,
      standardReference: data.standardReference.trim(),
      completionCriteria: data.completionCriteria.trim(), evidence: data.evidence.trim(),
      status: requireEnum(data.status, "Activity status", ["Not started", "In progress", "Complete"])
    };
  } catch (error) { return handleFormError(error); }
  const existing = state.workflow.activities.find(item => item.id === data.id);
  if (activity.predecessor) {
    const visited = new Set([activity.id]);
    let predecessor = state.workflow.activities.find(item => item.id === activity.predecessor);
    while (predecessor) {
      if (visited.has(predecessor.id)) return handleFormError(new Error("Workflow dependencies cannot form a cycle."));
      visited.add(predecessor.id);
      predecessor = state.workflow.activities.find(item => item.id === predecessor.predecessor);
    }
  }
  if (existing) Object.assign(existing, activity); else state.workflow.activities.push(activity);
  $("#workflow-activity-dialog").close(); save();
});

// FMEA, catalogue, and requirements forms.
$("#row-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") { $("#row-dialog").close(); return; }
  const data = formValues(event.target as HTMLFormElement);
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
  const data = formValues(event.target as HTMLFormElement); const group = data.catalog;
  let id, name, description;
  try { id = requireUniqueIdentifier(state[group], requireIdentifier(data.id, "Identifier"), "Identifier"); name = requireValue(data.name, "Name"); description = requireValue(data.description, "Description"); } catch (error) { return handleFormError(error); }
  state[group].push({ id, name, description, category: group === "hazards" ? data.category : "Operational context" });
  $("#catalog-dialog").close(); save();
});
$("#add-requirement-btn").addEventListener("click", () => fillRequirementForm());
$("#requirement-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") { $("#requirement-dialog").close(); return; }
  const data = formValues(event.target as HTMLFormElement);
  try { data.id = requireUniqueIdentifier(state.requirements, requireIdentifier(data.id, "Requirement identifier"), "Requirement identifier", { ignoreField: "id", ignoreValue: data.originalId }); data.text = requireValue(data.text, "Requirement statement"); data.hazard = requireValue(data.hazard, "Source hazard"); data.component = requireValue(data.component, "Allocated component"); } catch (error) { return handleFormError(error); }
  const existing = state.requirements.find(item => item.id === data.originalId);
  const requirement = { id: data.id, text: data.text, hazard: data.hazard, component: data.component, verification: data.verification, status: data.status };
  if (existing) {
    Object.assign(existing, requirement);
    if (data.originalId !== data.id) state.assurance.tests.forEach(test => { if (test.requirement === data.originalId) test.requirement = data.id; });
  } else state.requirements.push(requirement);
  $("#requirement-dialog").close(); save();
});

$("#assurance-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const data = formValues(form);
  const kind = $("#assurance-record-type").value;
  const existingId = data.recordId;
  try {
    data.id = requireIdentifier(data.id, kind === "hazard" ? "Hazard identifier" : "Record identifier");
    if (kind !== "hazard") {
      data.id = requireUniqueIdentifier(state.assurance[kind], data.id, "Record identifier", { ignoreField: "id", ignoreValue: existingId });
      data.title = requireValue(data.title, "Title");
    }
    if (kind === "tests") {
      data.requirement = requireValue(data.requirement, "Linked requirement");
      data.objective = requireValue(data.objective, "Objective");
      data.expected = requireValue(data.expected, "Expected result");
      data.configuration = requireValue(data.configuration, "Configuration");
      if (data.status === "Passed" && (!data.actual.trim() || !approvedEvidence(data.evidence))) throw new Error("A passed V&V record needs an actual result and approved evidence.");
      if (data.status === "Failed" && !data.deviation) throw new Error("A failed V&V record must link an issue or deviation.");
    }
    if (kind === "evidence") {
      data.reference = requireValue(data.reference, "Evidence reference");
      data.version = requireValue(data.version, "Evidence version");
    }
    if (kind === "deviations" && data.status === "Closed" && (!data.disposition.trim() || !approvedEvidence(data.closureEvidence))) throw new Error("A closed deviation needs a disposition and approved closure evidence.");
    if (kind === "changes" && ["Approved", "Implemented"].includes(data.decision) && (!data.safetyImpact.trim() || !approvedEvidence(data.evidence))) throw new Error("An approved or implemented change needs an impact assessment and approved evidence.");
    if (kind === "baselines" && data.status === "Approved" && (!data.approver.trim() || !data.date)) throw new Error("An approved baseline needs an approver and baseline date.");
    if (kind === "reviews" && data.status === "Complete" && (!data.decision.trim() || !approvedEvidence(data.evidence))) throw new Error("A completed review needs a decision and approved review evidence.");
    if (kind === "interfaces" && data.status === "Verified" && !data.failureResponse.trim()) throw new Error("A verified interface needs a documented failure response.");
    if (kind === "ram" && data.status === "Demonstrated" && !data.method.trim()) throw new Error("A demonstrated RAM objective needs a demonstration method.");
    if (kind === "claims" && data.status === "Supported" && !approvedEvidence(data.evidence)) throw new Error("A supported safety-case claim needs approved evidence.");
    if (kind === "hazard" && data.status === "Closed" && (!data.control.trim() || !data.residualRisk.trim() || !approvedEvidence(data.closureEvidence))) throw new Error("A closed hazard needs a control, residual-risk rationale, and approved closure evidence.");
  } catch (error) { return handleFormError(error); }
  if (kind === "hazard") {
    const hazard = state.hazards.find(item => item.id === data.id);
    if (!hazard) return handleFormError(new Error("Select an existing hazard."));
    Object.assign(hazard, { owner: data.owner, control: data.control, residualRisk: data.residualRisk, closureEvidence: data.closureEvidence, status: data.status });
    auditAssurance("Updated", "hazard", hazard.id, hazard.status);
  } else {
    const record = Object.fromEntries(assuranceSchemas[kind].map(([name]) => [name, data[name] || ""]));
    const existing = state.assurance[kind].find(item => item.id === existingId);
    if (kind === "baselines" && record.status === "Approved") {
      record.inventory ||= `${state.components.length} components, ${state.hazards.length} hazards, ${state.requirements.length} requirements, ${state.workflow.activities.length} workflow activities, ${state.assurance.tests.length} V&V records`;
      record.snapshot = existing?.snapshot || structuredClone({
        plantuml: state.plantuml, components: state.components, hazards: state.hazards, situations: state.situations,
        requirements: state.requirements, safetyGoals: state.safetyGoals, hara: state.hara, silAssessments: state.silAssessments,
        quantitative: state.quantitative, fmeda: state.fmeda, workflow: state.workflow, fmea: state.fmea,
        assurance: Object.fromEntries(Object.entries(state.assurance).filter(([key]) => !["baselines", "audit"].includes(key)))
      });
    }
    if (existing) Object.assign(existing, record); else state.assurance[kind].push(record);
    auditAssurance(existing ? "Updated" : "Created", kind, record.id, record.status || record.decision || "");
  }
  $("#assurance-record-type").disabled = false;
  $("#assurance-dialog").close();
  save();
});
$("#template-btn").addEventListener("click", () => { renderColumns(); $("#template-dialog").showModal(); });
$("#add-column-btn").addEventListener("click", () => {
  const input = $("#new-column"); const label = input.value.trim(); if (!label) return;
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (!key || state.customColumns.some(x => x.key === key)) return alert("Use a unique column label.");
  state.customColumns.push({ key, label }); input.value = ""; save(); renderColumns();
});
$("#fmea-search").addEventListener("input", renderFmea);

// HARA and safety-goal forms.
$("#add-hara-btn").addEventListener("click", () => fillHaraForm());
$("#add-goal-btn").addEventListener("click", () => fillGoalForm());
$("#hara-form").addEventListener("change", updateAsilPreview);
$("#hara-form").addEventListener("submit", event => {
  event.preventDefault(); const data = formValues(event.target as HTMLFormElement);
  try { data.eventId = requireUniqueIdentifier(state.hara, requireIdentifier(data.eventId, "Hazardous-event identifier"), "Hazardous-event identifier", { field: "eventId", ignoreField: "id", ignoreValue: data.id }); data.hazard = requireValue(data.hazard, "Linked hazard"); data.situation = requireValue(data.situation, "Operational situation"); data.malfunction = requireValue(data.malfunction, "Malfunctioning behaviour"); data.consequence = requireValue(data.consequence, "Consequence"); } catch (error) { return handleFormError(error); }
  const existing = state.hara.find(row => row.id === data.id);
  const row = { id: data.id || crypto.randomUUID(), eventId: data.eventId, hazard: data.hazard, situation: data.situation, malfunction: data.malfunction, consequence: data.consequence, severity: data.severity, exposure: data.exposure, controllability: data.controllability, safetyGoal: data.safetyGoal };
  if (existing) Object.assign(existing, row); else state.hara.push(row);
  $("#hara-dialog").close(); save();
});
$("#goal-form").addEventListener("submit", event => {
  event.preventDefault(); const data = formValues(event.target as HTMLFormElement);
  try { data.id = requireUniqueIdentifier(state.safetyGoals, requireIdentifier(data.id, "Safety-goal identifier"), "Safety-goal identifier", { ignoreField: "id", ignoreValue: data.originalId }); data.text = requireValue(data.text, "Safety goal"); } catch (error) { return handleFormError(error); }
  const existing = goalBy(data.originalId);
  const goal = { id: data.id, text: data.text, asil: data.asil, safeState: data.safeState, ftti: data.ftti };
  if (existing) {
    Object.assign(existing, goal);
    if (data.originalId !== data.id) state.hara.forEach(row => { if (row.safetyGoal === data.originalId) row.safetyGoal = data.id; });
  } else state.safetyGoals.push(goal);
  $("#goal-dialog").close(); save();
});

// AMR SIL assessment form.
$("#add-sil-btn").addEventListener("click", () => fillSilForm());
$("#sil-form").addEventListener("change", updateSilPreview);
$("#sil-form").addEventListener("submit", event => {
  event.preventDefault(); const data = formValues(event.target as HTMLFormElement);
  try { data.assessmentId = requireUniqueIdentifier(state.silAssessments, requireIdentifier(data.assessmentId, "SIL-assessment identifier"), "SIL-assessment identifier", { field: "assessmentId", ignoreField: "id", ignoreValue: data.id }); data.safetyFunction = requireValue(data.safetyFunction, "Safety function"); data.hazard = requireValue(data.hazard, "Linked hazard"); data.situation = requireValue(data.situation, "Operational situation"); data.hazardousEvent = requireValue(data.hazardousEvent, "Hazardous event"); } catch (error) { return handleFormError(error); }
  const existing = state.silAssessments.find(row => row.id === data.id);
  const row = { id: data.id || crypto.randomUUID(), assessmentId: data.assessmentId, safetyFunction: data.safetyFunction, hazard: data.hazard, situation: data.situation, hazardousEvent: data.hazardousEvent, consequence: data.consequence, frequency: data.frequency, avoidance: data.avoidance, demand: data.demand, safeState: data.safeState, evidence: data.evidence };
  if (existing) Object.assign(existing, row); else state.silAssessments.push(row);
  $("#sil-dialog").close(); save();
});

// Quantitative safety form.
$("#add-quant-component-btn").addEventListener("click", () => fillQuantitativeForm());
["quant-function", "quant-target", "quant-mode", "quant-architecture"].forEach(id => $(`#${id}`).addEventListener("change", event => {
  const keys = { "quant-function": "safetyFunction", "quant-target": "targetSil", "quant-mode": "mode", "quant-architecture": "architecture" };
  state.quantitative[keys[id]] = event.target.value; save();
}));
$("#quant-function").addEventListener("input", event => { state.quantitative.safetyFunction = event.target.value; persistState(); });
$("#quant-component-form").addEventListener("submit", event => {
  event.preventDefault(); const data = formValues(event.target as HTMLFormElement);
  const existing = state.quantitative.components.find(row => row.id === data.id);
  let row;
  try { row = { id: data.id || crypto.randomUUID(), component: requireValue(data.component, "Architecture component"), role: requireValue(data.role, "Component role"), lambdaTotal: validateNumber(data.lambdaTotal, "Total failure rate", { min: 0 }), dangerousFraction: validateNumber(data.dangerousFraction, "Dangerous fraction", { min: 0, max: 1 }), diagnosticCoverage: validateNumber(data.diagnosticCoverage, "Diagnostic coverage", { min: 0, max: 1 }), proofTestHours: validateNumber(data.proofTestHours, "Proof-test interval", { min: Number.EPSILON }), channels: validateNumber(data.channels, "Channels", { min: 1, max: 2, integer: true }), beta: validateNumber(data.beta, "Common-cause beta", { min: 0, max: 1 }) }; } catch (error) { return handleFormError(error); }
  if (existing) Object.assign(existing, row); else state.quantitative.components.push(row);
  $("#quant-component-dialog").close(); save();
});

// FMEDA constants, rows, and handoff to quantitative safety.
$("#add-constant-btn").addEventListener("click", () => { $("#constant-form").reset(); $("#constant-dialog").showModal(); });
$("#constant-form").addEventListener("submit", event => {
  event.preventDefault(); const data = formValues(event.target as HTMLFormElement);
  let value;
  try { data.symbol = requireSymbol(data.symbol, "Symbol"); data.description = requireValue(data.description, "Description"); value = validateNumber(data.value, "Constant value", { min: 0 }); } catch (error) { return handleFormError(error); }
  if (state.fmeda.constants.some(item => item.symbol === data.symbol)) return alert("That symbolic constant already exists.");
  state.fmeda.constants.push({ symbol: data.symbol, value, description: data.description }); $("#constant-dialog").close(); save();
});
$("#add-fmeda-btn").addEventListener("click", () => fillFmedaForm());
$("#fmeda-form").elements.expression.addEventListener("input", updateExpressionPreview);
$("#fmeda-form").addEventListener("submit", event => {
  event.preventDefault(); const data = formValues(event.target as HTMLFormElement);
  try { data.component = requireValue(data.component, "Architecture component"); data.failureMode = requireValue(data.failureMode, "Failure mode"); data.localEffect = requireValue(data.localEffect, "Local effect"); data.endEffect = requireValue(data.endEffect, "End effect"); data.expression = requireValue(data.expression, "Failure-rate expression"); evaluateExpression(data.expression); } catch (error) { $("#expression-error").textContent = error.message; return; }
  const existing = state.fmeda.rows.find(row => row.id === data.id);
  const row = { id: data.id || crypto.randomUUID(), component: data.component, failureMode: data.failureMode, localEffect: data.localEffect, endEffect: data.endEffect, classification: data.classification, diagnostic: data.diagnostic, expression: data.expression };
  if (existing) Object.assign(existing, row); else state.fmeda.rows.push(row);
  $("#fmeda-dialog").close(); save();
});

// Architecture editor completion, import, and local rendering.
$("#plantuml-source").addEventListener("input", () => {
  plantumlCompletionIndex = 0;
  state.plantuml = ($("#plantuml-source") as HTMLTextAreaElement).value;
  state.components = componentsFromPlantUml(state.plantuml);
  $("#component-count").textContent = String(state.components.length);
  $("#component-list").innerHTML = state.components.length ? state.components.map(component => `<div class="component-item"><strong>${esc(component.name)}</strong><span>${esc(component.id)}</span></div>`).join("") : `<p class="dialog-copy">Add PlantUML component declarations to define reusable architecture components.</p>`;
  persistState();
  renderPlantumlCompletions();
});
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
  const item = eventElement(event).closest<HTMLElement>("[data-completion-index]");
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

// Fault tree DSL editor and architecture handoff.
$("#fault-tree-source").addEventListener("input", event => {
  state.faultTree.dsl = (event.target as HTMLTextAreaElement).value;
  persistState();
  renderFaultTree();
  renderFaultTreeCompletions();
});
$("#fault-tree-source").addEventListener("keydown", event => {
  if ($("#fault-tree-completions").hidden) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    faultTreeCompletionIndex = (faultTreeCompletionIndex + (event.key === "ArrowDown" ? 1 : -1) + faultTreeMatches.length) % faultTreeMatches.length;
    renderFaultTreeCompletions();
  } else if (event.key === "Enter" || event.key === "Tab") {
    event.preventDefault(); insertFaultTreeCompletion();
  } else if (event.key === "Escape") {
    event.preventDefault(); closeFaultTreeCompletions();
  }
});
$("#fault-tree-completions").addEventListener("mousedown", event => {
  const item = eventElement(event).closest<HTMLElement>("[data-fault-tree-completion-index]");
  if (item) { event.preventDefault(); insertFaultTreeCompletion(Number(item.dataset.faultTreeCompletionIndex)); }
});
$("#fault-tree-source").addEventListener("blur", () => setTimeout(closeFaultTreeCompletions));
$("#fault-tree-source").addEventListener("scroll", () => {
  ($("#fault-tree-line-numbers") as HTMLElement).scrollTop = ($("#fault-tree-source") as HTMLTextAreaElement).scrollTop;
});
$("#fault-tree-help-btn").addEventListener("click", () => {
  let modal = document.getElementById('fault-tree-help-modal') as HTMLDivElement;
  if(!modal){
    // Create help content inline (no external dependency)
    modal = document.createElement('div');
    modal.id = 'fault-tree-help-modal';
    modal.style.cssText = `display:none;position:fixed;z-index:9999;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.6)`;
    modal.innerHTML = `<div style="background:white;margin:5% auto;padding:20px;border-radius:8px;width:90%;max-width:900px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.2)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:3px solid #2563eb;padding-bottom:10px"><h2 style="margin:0;font-size:22px;color:#1e40af">Fault Tree Analysis Guide</h2><button style="background:none;border:none;font-size:24px;cursor:pointer;color:#666" onclick="document.getElementById('fault-tree-help-modal').style.display='none'">✕</button></div><div style="color:#333;line-height:1.6"><h3 style="color:#2563eb;margin-top:0">What this workspace does</h3><p>FTA is a deductive method for showing how basic events combine into a defined top event. This workspace validates structure and derives qualitative minimal cut sets for coherent AND/OR/K-of-N trees; it does not establish compliance, independence, or a quantified safety target.</p><h3 style="color:#2563eb">Gate selection</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px"><div style="border:1px solid #ddd;padding:10px;background:#f9f9f9"><strong style="color:#1e40af">AND / OR</strong><br><small>Use for coherent causal logic and qualitative cut sets.</small></div><div style="border:1px solid #ddd;padding:10px;background:#f9f9f9"><strong style="color:#1e40af">K-of-N</strong><br><small>Use voting logic; N must match the number of inputs.</small></div><div style="border:1px solid #ddd;padding:10px;background:#f9f9f9"><strong style="color:#1e40af">NOT / NAND / NOR / XOR</strong><br><small>Rendered but non-coherent: use dedicated Boolean/probabilistic analysis.</small></div><div style="border:1px solid #ddd;padding:10px;background:#f9f9f9"><strong style="color:#1e40af">Common cause</strong><br><small>Model shared power, time, calibration, configuration, and systematic causes explicitly.</small></div></div><h3 style="color:#2563eb">Review before relying on a result</h3><ul><li>State the top event, vehicle state, ODD/operational situation, and analysis boundary.</li><li>Challenge independence and diagnostic timing; a redundant block diagram is not evidence.</li><li>Trace each finding to requirements, design actions, and verification evidence.</li></ul></div></div>`;
    document.body.appendChild(modal);
  }
  modal.style.display = 'block';
  modal.addEventListener('click', (e) => {
    if(e.target === modal) modal.style.display = 'none';
  });
});
$("#fault-tree-export-btn").addEventListener("click", () => {
  const dsl = ($("#fault-tree-source") as HTMLTextAreaElement).value;
  if(!dsl.trim()) return alert("No fault tree to export. Create or load a fault tree first.");
  const model = parseFaultTreeDsl(dsl);
  
  // Create export menu
  const menu = document.createElement('div');
  menu.style.cssText = `position:fixed;top:200px;left:50%;transform:translateX(-50%);background:white;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.2);z-index:9999;min-width:200px`;
  menu.innerHTML = `
    <button style="display:block;width:100%;padding:10px;border:none;background:none;text-align:left;cursor:pointer;border-bottom:1px solid #eee" id="export-dsl">📄 Export DSL (.ft)</button>
    <button style="display:block;width:100%;padding:10px;border:none;background:none;text-align:left;cursor:pointer;border-bottom:1px solid #eee" id="export-cutsets">📊 Export Cut Sets (.csv)</button>
    <button style="display:block;width:100%;padding:10px;border:none;background:none;text-align:left;cursor:pointer" id="export-json">📋 Export as JSON</button>
  `;
  document.body.appendChild(menu);
  
  // Export DSL
  document.getElementById("export-dsl").addEventListener("click", () => {
    const fileName = (model.top || "fault-tree").toLowerCase() + ".ft";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([dsl], { type: "text/plain" }));
    link.download = fileName;
    link.click();
    document.body.removeChild(menu);
  });
  
  // Export Cut Sets
  document.getElementById("export-cutsets").addEventListener("click", () => {
    const result = faultTreeCutSets(model, model.top);
    if (result.nonCoherent) return alert("Cut-set CSV is unavailable for a tree with NOT, NAND, NOR, or XOR gates. Use a dedicated Boolean/probabilistic analysis.");
    const cutSets = result.sets;
    let csv = "Order,Cut Set,Event IDs\n";
    const byOrder = {};
    cutSets.forEach(cs => {
      const order = cs.length;
      if(!byOrder[order]) byOrder[order] = [];
      byOrder[order].push(cs);
    });
    Object.keys(byOrder).sort((a,b) => parseInt(a) - parseInt(b)).forEach(order => {
      byOrder[order].forEach(cs => {
        csv += `${order},"${cs.join(', ')}","${cs.join("; ")}"\n`;
      });
    });
    const fileName = (model.top || "cut-sets").toLowerCase() + ".csv";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = fileName;
    link.click();
    document.body.removeChild(menu);
  });
  
  // Export JSON
  document.getElementById("export-json").addEventListener("click", () => {
    const json = JSON.stringify({ model: { ...model, nodes: [...model.nodes.values()] }, qualitativeAnalysis: faultTreeCutSets(model, model.top) }, null, 2);
    const fileName = (model.top || "fault-tree").toLowerCase() + ".json";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    link.download = fileName;
    link.click();
    document.body.removeChild(menu);
  });
  
  // Close menu on Escape
  const closeMenu = (e) => {
    if(e.key === "Escape") { document.body.removeChild(menu); document.removeEventListener("keydown", closeMenu); }
  };
  document.addEventListener("keydown", closeMenu);
});
$("#fault-tree-save-btn").addEventListener("click", () => {
  try {
    state.faultTree.dsl = ($("#fault-tree-source") as HTMLTextAreaElement).value;
    parseFaultTreeDsl(state.faultTree.dsl);
    save();
  } catch (error) { handleFormError(error); }
});
$("#fault-tree-generate-btn").addEventListener("click", () => {
  const source = ($("#plantuml-source") as HTMLTextAreaElement).value || state.plantuml;
  const imported = componentsFromPlantUml(source);
  if (imported.length) {
    state.plantuml = source;
    state.components = imported;
  }
  if (!state.components.length) return alert("No architecture components found. Add PlantUML component declarations in System architecture, then generate the starter tree.");
  state.faultTree.dsl = faultTreeFromArchitectureDsl();
  state.faultTree.activeLayer = "All";
  state.faultTree.layerCount = Math.max(state.faultTree.layerCount || 3, 2);
  save();
  $("#render-btn").click();
  alert(`Architecture rendering started and ${state.components.length} components were expanded into starter malfunctioning behaviours. Refine the top event and remove inapplicable events before using the analysis.`);
});
$("#fault-tree-layer").addEventListener("change", event => {
  state.faultTree.activeLayer = (event.target as HTMLSelectElement).value;
  persistState();
  renderFaultTree();
});
$("#fault-tree-layer-count").addEventListener("change", event => {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isInteger(value) || value < 1 || value > 12) return alert("Layer count must be an integer between 1 and 12.");
  state.faultTree.layerCount = value;
  if (!configuredFaultTreeLayers().includes(state.faultTree.activeLayer)) state.faultTree.activeLayer = "All";
  save();
});
function adjustFaultTreeZoom(change: number) {
  faultTreeZoom = Math.max(0.5, Math.min(2.5, Math.round((faultTreeZoom + change) * 10) / 10));
  renderFaultTree();
}
$("#fault-tree-zoom-in").addEventListener("click", () => adjustFaultTreeZoom(0.1));
$("#fault-tree-zoom-out").addEventListener("click", () => adjustFaultTreeZoom(-0.1));
$("#fault-tree-zoom-reset").addEventListener("click", () => { faultTreeZoom = 1; renderFaultTree(); });
$("#fault-tree-search").addEventListener("input", event => { faultTreeSearch = (event.target as HTMLInputElement).value; renderFaultTree(); });
$("#fault-tree-analysis").addEventListener("change", event => {
  const target = event.target as HTMLSelectElement;
  if (target.id === "fault-tree-cutset-limit") { faultTreeCutSetLimit = Number(target.value); renderFaultTree(); }
});

$("#render-btn").addEventListener("click", async () => {
  const button = $("#render-btn"); const status = $("#render-status"); const preview = $("#diagram-preview");
  state.plantuml = $("#plantuml-source").value;
  state.components = componentsFromPlantUml(state.plantuml);
  persistState();
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

// Portable project export.
$("#export-btn").addEventListener("click", () => {
  state.plantuml = $("#plantuml-source").value; persistState();
  const project = projectEnvelope(); const slug = activeWorkspace().name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "safety-workspace";
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${slug}.praxis.json` });
  link.click(); URL.revokeObjectURL(link.href);
});

// Bootstrap after every feature has registered its renderer and events.
renderAll();
showView(requestedView(), "replace");
void hydrateRegistryFromServer();
