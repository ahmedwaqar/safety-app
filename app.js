const STORAGE_KEY = "safeguard-cobot-workspace-v1";

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
  customColumns: [{ key: "owner", label: "Owner" }],
  fmea: [
    { id: crypto.randomUUID(), component: "SCAN", failureMode: "Protective field not detected", effect: "Robot continues moving while operator enters shared workspace", hazard: "H-03", situation: "OS-01", severity: 9, occurrence: 2, detection: 3, action: "Add cyclic diagnostic monitoring", custom: { owner: "Controls" } },
    { id: crypto.randomUUID(), component: "TOOL", failureMode: "Workpiece released during motion", effect: "Released part may strike the nearby operator", hazard: "H-02", situation: "OS-01", severity: 7, occurrence: 3, detection: 4, action: "Verify retention after loss of power", custom: { owner: "Mechanical" } },
    { id: crypto.randomUUID(), component: "CTRL", failureMode: "Incorrect speed limit applied", effect: "Contact energy exceeds collaborative operation limit", hazard: "H-01", situation: "OS-02", severity: 8, occurrence: 2, detection: 3, action: "Validate mode-specific speed monitoring", custom: { owner: "Controls" } },
    { id: crypto.randomUUID(), component: "ESTOP", failureMode: "Emergency-stop contact fails open", effect: "Emergency stop demand does not reach safety PLC", hazard: "H-03", situation: "OS-03", severity: 9, occurrence: 1, detection: 2, action: "Use dual-channel monitored circuit", custom: { owner: "Electrical" } }
  ]
};

let state = load();
let diagramUrl;
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const esc = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
const itemBy = (group, id) => state[group].find(item => item.id === id);
const rpn = row => Number(row.severity) * Number(row.occurrence) * Number(row.detection);
const riskClass = score => score >= 100 ? "high" : score >= 40 ? "medium" : "low";
const asilClass = asil => `asil-${asil.replace("ASIL ", "").toLowerCase()}`;

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const workspace = saved ? JSON.parse(saved) : structuredClone(seed);
  workspace.hara ??= structuredClone(seed.hara);
  workspace.safetyGoals ??= structuredClone(seed.safetyGoals);
  return workspace;
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll(); }
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
function goalBy(id) { return state.safetyGoals.find(goal => goal.id === id); }

function showView(name) {
  $$(".view").forEach(view => view.classList.remove("active"));
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === name));
  $(`#${name}-view`).classList.add("active");
  $("#page-title").textContent = ({ fmea: "FMEA worksheet", hara: "ISO 26262 HARA", hazards: "Hazard catalogue", situations: "Operational situations", requirements: "Safety requirements", architecture: "Architecture" })[name] || "Overview";
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
    const links = group === "hazards" ? state.fmea.filter(x => x.hazard === item.id).length + state.requirements.filter(x => x.hazard === item.id).length + state.hara.filter(x => x.hazard === item.id).length : state.fmea.filter(x => x.situation === item.id).length + state.hara.filter(x => x.situation === item.id).length;
    return `<article class="catalog-card"><div class="catalog-card-top"><span class="catalog-id">${esc(item.id)}</span><span class="category">${esc(item.category)}</span></div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><div class="catalog-footer"><span>${links} linked reference${links === 1 ? "" : "s"}</span><button class="mini-btn" data-delete-catalog="${group}:${item.id}" title="Delete">×</button></div></article>`;
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
function renderAll() { renderMetrics(); renderFmea(); renderCatalog("hazards"); renderCatalog("situations"); renderRequirements(); renderHara(); renderArchitecture(); }

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

$("#main-nav").addEventListener("click", event => { const button = event.target.closest("[data-view]"); if (button) showView(button.dataset.view); });
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
    const linked = group === "hazards" ? state.fmea.some(x => x.hazard === id) || state.requirements.some(x => x.hazard === id) || state.hara.some(x => x.hazard === id) : state.fmea.some(x => x.situation === id) || state.hara.some(x => x.situation === id);
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
});

$("#row-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") { $("#row-dialog").close(); return; }
  const data = Object.fromEntries(new FormData(event.target));
  const existing = state.fmea.find(x => x.id === data.id);
  const row = { id: data.id || crypto.randomUUID(), component: data.component, failureMode: data.failureMode, effect: data.effect, hazard: data.hazard, situation: data.situation, severity: Number(data.severity), occurrence: Number(data.occurrence), detection: Number(data.detection), action: data.action, custom: {} };
  state.customColumns.forEach(x => row.custom[x.key] = data[`custom_${x.key}`] || "");
  if (existing) Object.assign(existing, row); else state.fmea.push(row);
  $("#row-dialog").close(); save();
});
$("#catalog-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") { $("#catalog-dialog").close(); return; }
  const data = Object.fromEntries(new FormData(event.target)); const group = data.catalog;
  if (state[group].some(x => x.id === data.id)) return alert("That identifier already exists.");
  state[group].push({ id: data.id, name: data.name, description: data.description, category: group === "hazards" ? data.category : "Operational context" });
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
  if (state.requirements.some(x => x.id === data.id)) return alert("That identifier already exists.");
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
  if (state.hara.some(row => row.eventId === data.eventId && row.id !== data.id)) return alert("That hazardous-event identifier already exists.");
  const existing = state.hara.find(row => row.id === data.id);
  const row = { id: data.id || crypto.randomUUID(), eventId: data.eventId, hazard: data.hazard, situation: data.situation, malfunction: data.malfunction, consequence: data.consequence, severity: data.severity, exposure: data.exposure, controllability: data.controllability, safetyGoal: data.safetyGoal };
  if (existing) Object.assign(existing, row); else state.hara.push(row);
  $("#hara-dialog").close(); save();
});
$("#goal-form").addEventListener("submit", event => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  if (state.safetyGoals.some(goal => goal.id === data.id && goal.id !== data.originalId)) return alert("That safety-goal identifier already exists.");
  const existing = goalBy(data.originalId);
  const goal = { id: data.id, text: data.text, asil: data.asil, safeState: data.safeState, ftti: data.ftti };
  if (existing) {
    Object.assign(existing, goal);
    if (data.originalId !== data.id) state.hara.forEach(row => { if (row.safetyGoal === data.originalId) row.safetyGoal = data.id; });
  } else state.safetyGoals.push(goal);
  $("#goal-dialog").close(); save();
});
$("#parse-btn").addEventListener("click", () => {
  state.plantuml = $("#plantuml-source").value;
  const components = []; const seen = new Set();
  const pattern = /^\s*(?:component|node|database|queue|cloud|rectangle|artifact|package|frame)\s+(?:"([^"]+)"|([^\s{]+))(?:\s+as\s+([A-Za-z0-9_.-]+))?/gim;
  for (const match of state.plantuml.matchAll(pattern)) {
    const name = match[1] || match[2]; const id = match[3] || name.replace(/\W+/g, "_").toUpperCase();
    if (!seen.has(id)) { components.push({ id, name }); seen.add(id); }
  }
  if (!components.length) return alert("No PlantUML components found. Use declarations such as: component \"Robot arm\" as ARM");
  state.components = components; save(); alert(`${components.length} architecture components imported.`);
});
$("#render-btn").addEventListener("click", async () => {
  const button = $("#render-btn"); const status = $("#render-status"); const preview = $("#diagram-preview");
  state.plantuml = $("#plantuml-source").value; localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "safeguard-cobot-analysis.json" });
  link.click(); URL.revokeObjectURL(link.href);
});
$("#new-analysis-btn").addEventListener("click", () => {
  if (confirm("Reset the workspace to the starter cobot safety analysis?")) { state = structuredClone(seed); save(); }
});

renderAll();
