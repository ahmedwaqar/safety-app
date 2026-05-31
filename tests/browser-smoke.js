import { spawn } from "bun";
import { join } from "path";

const root = join(import.meta.dir, "..");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9333;
const profile = `/tmp/safeguard-chrome-${Date.now()}`;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".md": "text/markdown" };

const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/plantuml/render") {
      const source = await request.text();
      if (!source.includes("@startuml")) return new Response("Invalid PlantUML", { status: 400 });
      return new Response('<svg xmlns="http://www.w3.org/2000/svg"><text>Rendered test diagram</text></svg>', { headers: { "content-type": "image/svg+xml" } });
    }
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(join(root, path));
    if (!await file.exists()) return new Response("Not found", { status: 404 });
    return new Response(file, { headers: { "content-type": mime[path.slice(path.lastIndexOf("."))] || "application/octet-stream" } });
  }
});
const browser = spawn([chrome, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdout: "ignore", stderr: "ignore" });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function retry(action, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try { return await action(); } catch (error) { if (i === attempts - 1) throw error; await sleep(100); }
  }
}

let ws;
let sequence = 0;
const pending = new Map();
const browserErrors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const fill = (selector, value) => evaluate(`(() => { const field = document.querySelector(${JSON.stringify(selector)}); field.value = ${JSON.stringify(value)}; field.dispatchEvent(new Event("input", { bubbles: true })); field.dispatchEvent(new Event("change", { bubbles: true })); })()`);
const isOpen = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).open`);
const count = selector => evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
function test(name, action) {
  return action().then(() => console.log(`PASS ${name}`));
}

try {
  const tabs = await retry(async () => {
    const response = await fetch(`http://localhost:${debugPort}/json/list`);
    if (!response.ok) throw new Error("Chrome DevTools endpoint is not ready");
    return response.json();
  });
  const page = tabs.find(tab => tab.type === "page" && !tab.url.startsWith("chrome-extension://"));
  assert(page, "Chrome did not expose a test page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (!message.id) return;
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: `http://localhost:${server.port}` });
  await retry(async () => { assert(await evaluate("document.readyState") === "complete", "page did not load"); });
  await evaluate(`localStorage.clear(); location.reload()`);
  await retry(async () => { assert(await count("#metrics .metric") === 4, "app did not render"); });
  await evaluate(`window.alert = message => window.__lastAlert = message; window.confirm = () => true;`);

  await test("workspace manager creates, switches, and isolates local projects", async () => {
    const original = await evaluate(`document.querySelector("#workspace-select").value`);
    await click("#new-workspace-btn");
    assert(await isOpen("#workspace-dialog"), "new-workspace dialog did not open");
    await fill('#workspace-form [name="name"]', "Warehouse AMR project");
    await click("#workspace-dialog .dialog-actions .primary");
    assert(await count("#workspace-select option") === 2, "workspace was not created");
    assert(await evaluate(`document.querySelector("#workspace-select").selectedOptions[0].textContent`) === "Warehouse AMR project", "new workspace did not become active");
    assert(await evaluate(`document.querySelector("#component-count").textContent`) === "0", "new workspace did not start with blank architecture");
    assert(await count("#hazards-grid .catalog-card") === 0, "new workspace did not start with blank hazard catalogue");
    await evaluate(`state.hazards.push({ id: "H-ISOLATED", name: "Isolated workspace hazard", category: "Operational", description: "Test-only project data" }); save();`);
    await fill("#workspace-select", original);
    assert(!await evaluate(`document.querySelector("#hazards-grid").textContent.includes("H-ISOLATED")`), "workspace state leaked into original project");
    const second = await evaluate(`[...document.querySelectorAll("#workspace-select option")].find(x => x.textContent === "Warehouse AMR project").value`);
    await fill("#workspace-select", second);
    assert(await evaluate(`document.querySelector("#hazards-grid").textContent.includes("H-ISOLATED")`), "workspace switch did not restore project data");
    await fill("#workspace-select", original);
  });

  await test("save workspace preserves current PlantUML editor changes", async () => {
    await click('[data-view="architecture"]');
    await fill("#plantuml-source", "@startuml\ntitle Explicit save test\n@enduml");
    await click("#save-workspace-btn");
    assert(await evaluate(`document.querySelector("#save-workspace-btn").textContent`) === "Workspace saved", "save workspace button did not confirm the save");
    assert(await evaluate(`JSON.parse(localStorage.getItem("safeguard-workspaces-v1")).workspaces.find(workspace => workspace.id === localStorage.getItem("safeguard-active-workspace-v1")).data.plantuml.includes("Explicit save test")`), "save workspace did not preserve PlantUML editor text");
  });

  await test("portable JSON workspace file opens as a new project", async () => {
    const before = await count("#workspace-select option");
    await evaluate(`(() => {
      const envelope = projectEnvelope();
      envelope.workspace.name = "Imported AMR project";
      envelope.workspace.data.hazards.push({ id: "H-IMPORTED", name: "Imported JSON hazard", category: "Operational", description: "Portable project test" });
      const file = new File([JSON.stringify(envelope)], "imported.safeguard.json", { type: "application/json" });
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector("#workspace-file-input"); input.files = transfer.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await retry(async () => { assert(await count("#workspace-select option") === before + 1, "JSON workspace was not imported"); });
    assert(await evaluate(`document.querySelector("#workspace-select").selectedOptions[0].textContent`) === "Imported AMR project", "imported workspace did not become active");
    assert(await evaluate(`document.querySelector("#hazards-grid").textContent.includes("H-IMPORTED")`), "imported workspace data is missing");
  });

  await test("portable JSON import rejects invalid typed values", async () => {
    const before = await count("#workspace-select option");
    await evaluate(`(() => {
      const envelope = projectEnvelope();
      envelope.workspace.name = "Invalid imported project";
      envelope.workspace.data.quantitative.components[0].diagnosticCoverage = 2;
      const file = new File([JSON.stringify(envelope)], "invalid.safeguard.json", { type: "application/json" });
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector("#workspace-file-input"); input.files = transfer.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await retry(async () => { assert(await evaluate(`window.__lastAlert.includes("Diagnostic coverage")`), "invalid JSON did not report diagnostic-coverage error"); });
    assert(await count("#workspace-select option") === before, "invalid JSON workspace was imported");
  });

  await test("help option explains appropriate input values", async () => {
    await click("#help-btn");
    assert(await isOpen("#help-dialog"), "help dialog did not open");
    assert(await evaluate(`document.querySelector("#help-dialog").textContent.includes("Fractions, diagnostic coverage, and beta factors")`), "numeric input guidance is missing");
    await click("#help-dialog .dialog-actions .primary");
    assert(!await isOpen("#help-dialog"), "help dialog did not close");
  });

  await test("navigation buttons switch all application views", async () => {
    for (const view of ["fmea", "fmeda", "hara", "sil", "quantitative", "hazards", "situations", "requirements", "architecture", "overview"]) {
      await click(`[data-view="${view}"]`);
      assert(await evaluate(`document.querySelector("#${view}-view").classList.contains("active")`), `${view} view did not activate`);
    }
  });

  await test("overview shortcuts navigate to worksheets", async () => {
    await click('[data-go="fmea"]');
    assert(await evaluate(`document.querySelector("#fmea-view").classList.contains("active")`), "worksheet shortcut failed");
    await click('[data-view="overview"]');
    await click('[data-go="architecture"]');
    assert(await evaluate(`document.querySelector("#architecture-view").classList.contains("active")`), "architecture shortcut failed");
  });

  await test("empty add-row dialog dismisses with close and cancel", async () => {
    await click("[data-open-row]");
    assert(await isOpen("#row-dialog"), "row dialog did not open");
    await click("#row-dialog .dialog-close");
    assert(!await isOpen("#row-dialog"), "row dialog close button failed");
    await click("[data-open-row]");
    await click("#row-dialog [data-close-dialog].secondary");
    assert(!await isOpen("#row-dialog"), "row dialog cancel button failed");
  });

  await test("failure mode add, edit, search, and delete buttons work", async () => {
    const before = await count("#fmea-body tr");
    await click("[data-open-row]");
    await fill('#row-form [name="failureMode"]', "Test encoder failure");
    await fill('#row-form [name="effect"]', "Test-only motion effect");
    await click("#row-dialog .dialog-actions .primary");
    assert(await count("#fmea-body tr") === before + 1, "failure mode was not added");
    await click("#fmea-body tr:last-child [data-edit-row]");
    assert(await isOpen("#row-dialog"), "edit button did not open dialog");
    await fill('#row-form [name="failureMode"]', "Updated encoder failure");
    await click("#row-dialog .dialog-actions .primary");
    await fill("#fmea-search", "Updated encoder");
    assert(await count("#fmea-body tr") === 1, "search did not filter worksheet");
    await fill("#fmea-search", "");
    await click("#fmea-body tr:last-child [data-delete-row]");
    assert(await count("#fmea-body tr") === before, "failure mode was not deleted");
  });

  await test("typed numeric validation rejects invalid FMEA values", async () => {
    const before = await count("#fmea-body tr");
    await click("[data-open-row]");
    await fill('#row-form [name="failureMode"]', "Invalid rating test");
    await fill('#row-form [name="effect"]', "Should not save");
    await fill('#row-form [name="severity"]', "1.5");
    await evaluate(`document.querySelector("#row-form").dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }))`);
    assert(await count("#fmea-body tr") === before, "invalid decimal FMEA rating was saved");
    assert(await evaluate(`window.__lastAlert.includes("Severity must be an integer")`), "invalid FMEA rating did not report a useful error");
    await click("#row-dialog .dialog-close");
  });

  await test("custom template column add and remove buttons work", async () => {
    await click("#template-btn");
    await fill("#new-column", "Review note");
    await click("#add-column-btn");
    assert(await evaluate(`[...document.querySelectorAll("#column-list span")].some(x => x.textContent === "Review note")`), "template column was not added");
    await click('#column-list [data-delete-column="review_note"]');
    assert(!await evaluate(`[...document.querySelectorAll("#column-list span")].some(x => x.textContent === "Review note")`), "template column was not removed");
    await click("#template-dialog .dialog-actions .primary");
    assert(!await isOpen("#template-dialog"), "template dialog did not close");
  });

  await test("hazard catalogue add and close buttons work", async () => {
    await click('[data-view="hazards"]');
    const before = await count("#hazards-grid .catalog-card");
    await click('[data-open-catalog="hazards"]');
    await click("#catalog-dialog .dialog-close");
    assert(!await isOpen("#catalog-dialog"), "catalog close button failed");
    await click('[data-open-catalog="hazards"]');
    await fill('#catalog-form [name="id"]', "H-TEST");
    await fill('#catalog-form [name="name"]', "Test hazard");
    await fill('#catalog-form [name="description"]', "Test-only hazard entry");
    await click("#catalog-dialog .dialog-actions .primary");
    assert(await count("#hazards-grid .catalog-card") === before + 1, "hazard was not added");
    await click('[data-delete-catalog="hazards:H-TEST"]');
    assert(await count("#hazards-grid .catalog-card") === before, "hazard was not deleted");
  });

  await test("operational situation add button works", async () => {
    await click('[data-view="situations"]');
    const before = await count("#situations-grid .catalog-card");
    await click('[data-open-catalog="situations"]');
    await fill('#catalog-form [name="id"]', "OS-TEST");
    await fill('#catalog-form [name="name"]', "Test situation");
    await fill('#catalog-form [name="description"]', "Test-only situation entry");
    await click("#catalog-dialog .dialog-actions .primary");
    assert(await count("#situations-grid .catalog-card") === before + 1, "situation was not added");
  });

  await test("safety requirement add and cancel buttons work", async () => {
    await click('[data-view="requirements"]');
    const before = await count("#requirement-list .requirement");
    await click("#add-requirement-btn");
    await click("#requirement-dialog .dialog-actions .secondary");
    assert(!await isOpen("#requirement-dialog"), "requirement cancel button failed");
    await click("#add-requirement-btn");
    await fill('#requirement-form [name="id"]', "SR-TEST");
    await fill('#requirement-form [name="text"]', "The test system shall record a verification requirement.");
    await click("#requirement-dialog .dialog-actions .primary");
    assert(await count("#requirement-list .requirement") === before + 1, "requirement was not added");
  });

  await test("ISO 26262 safety goal add and delete buttons work", async () => {
    await click('[data-view="hara"]');
    const before = await count("#goal-list .requirement");
    await click("#add-goal-btn");
    assert(await isOpen("#goal-dialog"), "safety-goal dialog did not open");
    await click("#goal-dialog .dialog-close");
    assert(!await isOpen("#goal-dialog"), "safety-goal dialog close button failed");
    await click("#add-goal-btn");
    await fill('#goal-form [name="id"]', "SG-TEST");
    await fill('#goal-form [name="text"]', "Prevent the test hazardous behaviour.");
    await fill('#goal-form [name="asil"]', "ASIL D");
    await fill('#goal-form [name="safeState"]', "Test safe state");
    await fill('#goal-form [name="ftti"]', "50 ms");
    await click("#goal-dialog .dialog-actions .primary");
    assert(await count("#goal-list .requirement") === before + 1, "safety goal was not added");
  });

  await test("ISO 26262 HARA derives ASIL D and supports edit and delete", async () => {
    const before = await count("#hara-body tr");
    await click("#add-hara-btn");
    assert(await isOpen("#hara-dialog"), "HARA dialog did not open");
    await fill('#hara-form [name="eventId"]', "HE-TEST");
    await fill('#hara-form [name="malfunction"]', "Test controller applies unintended torque.");
    await fill('#hara-form [name="consequence"]', "Potential fatal collision.");
    await fill('#hara-form [name="severity"]', "S3");
    await fill('#hara-form [name="exposure"]', "E4");
    await fill('#hara-form [name="controllability"]', "C3");
    await fill('#hara-form [name="safetyGoal"]', "SG-TEST");
    assert(await evaluate(`document.querySelector("#asil-preview").textContent`) === "ASIL D", "ASIL preview did not derive ASIL D");
    await click("#hara-dialog .dialog-actions .primary");
    assert(await count("#hara-body tr") === before + 1, "hazardous event was not added");
    assert(await evaluate(`document.querySelector("#hara-body tr:last-child").textContent.includes("ASIL D")`), "saved hazardous event does not show ASIL D");
    assert(await evaluate(`document.querySelector("#goal-list").textContent.includes("HE-TEST")`), "safety goal does not trace hazardous event");
    await click("#hara-body tr:last-child [data-edit-hara]");
    await fill('#hara-form [name="consequence"]', "Updated test consequence.");
    await click("#hara-dialog .dialog-actions .primary");
    assert(await evaluate(`document.querySelector("#hara-body tr:last-child").textContent.includes("Updated test consequence")`), "hazardous event was not edited");
    await click("#hara-body tr:last-child [data-delete-hara]");
    assert(await count("#hara-body tr") === before, "hazardous event was not deleted");
    await click('[data-delete-goal="SG-TEST"]');
    assert(!await evaluate(`document.querySelector("#goal-list").textContent.includes("SG-TEST")`), "safety goal was not deleted");
  });

  await test("ISO 26262 S/E/C matrix derives every ASIL boundary", async () => {
    await click("#add-hara-btn");
    const expected = {
      S1: { E1: ["QM", "QM", "QM"], E2: ["QM", "QM", "QM"], E3: ["QM", "QM", "ASIL A"], E4: ["QM", "ASIL A", "ASIL B"] },
      S2: { E1: ["QM", "QM", "QM"], E2: ["QM", "QM", "ASIL A"], E3: ["QM", "ASIL A", "ASIL B"], E4: ["ASIL A", "ASIL B", "ASIL C"] },
      S3: { E1: ["QM", "QM", "ASIL A"], E2: ["QM", "ASIL A", "ASIL B"], E3: ["ASIL A", "ASIL B", "ASIL C"], E4: ["ASIL B", "ASIL C", "ASIL D"] }
    };
    for (const [severity, exposures] of Object.entries(expected)) {
      for (const [exposure, levels] of Object.entries(exposures)) {
        for (const [index, asil] of levels.entries()) {
          const controllability = `C${index + 1}`;
          const actual = await evaluate(`(() => {
            const form = document.querySelector("#hara-form");
            form.elements.severity.value = "${severity}";
            form.elements.exposure.value = "${exposure}";
            form.elements.controllability.value = "${controllability}";
            form.dispatchEvent(new Event("change", { bubbles: true }));
            return document.querySelector("#asil-preview").textContent;
          })()`);
          assert(actual === asil, `${severity}/${exposure}/${controllability} derived ${actual}, expected ${asil}`);
        }
      }
    }
    for (const [severity, exposure, controllability] of [["S0", "E4", "C3"], ["S3", "E0", "C3"], ["S3", "E4", "C0"]]) {
      const actual = await evaluate(`(() => {
        const form = document.querySelector("#hara-form");
        form.elements.severity.value = "${severity}";
        form.elements.exposure.value = "${exposure}";
        form.elements.controllability.value = "${controllability}";
        form.dispatchEvent(new Event("change", { bubbles: true }));
        return document.querySelector("#asil-preview").textContent;
      })()`);
      assert(actual === "QM", `${severity}/${exposure}/${controllability} should derive QM`);
    }
    await click("#hara-dialog .dialog-close");
  });

  await test("AMR SIL assessment derives SIL 4 and supports edit and delete", async () => {
    await click('[data-view="sil"]');
    const before = await count("#sil-body tr");
    await click("#add-sil-btn");
    assert(await isOpen("#sil-dialog"), "SIL dialog did not open");
    await click("#sil-dialog .dialog-close");
    assert(!await isOpen("#sil-dialog"), "SIL dialog close button failed");
    await click("#add-sil-btn");
    await fill('#sil-form [name="assessmentId"]', "SIL-TEST");
    await fill('#sil-form [name="safetyFunction"]', "Test AMR protective stop");
    await fill('#sil-form [name="hazardousEvent"]', "AMR fails to stop before collision.");
    await fill('#sil-form [name="consequence"]', "C4");
    await fill('#sil-form [name="frequency"]', "F2");
    await fill('#sil-form [name="avoidance"]', "P2");
    await fill('#sil-form [name="demand"]', "W3");
    assert(await evaluate(`document.querySelector("#sil-preview").textContent`) === "SIL 4", "SIL preview did not derive SIL 4");
    await click("#sil-dialog .dialog-actions .primary");
    assert(await count("#sil-body tr") === before + 1, "SIL assessment was not added");
    assert(await evaluate(`document.querySelector("#sil-body tr:last-child").textContent.includes("SIL 4")`), "saved SIL assessment does not show SIL 4");
    await click("#sil-body tr:last-child [data-edit-sil]");
    await fill('#sil-form [name="evidence"]', "Updated stopping-distance report");
    await click("#sil-dialog .dialog-actions .primary");
    assert(await evaluate(`document.querySelector("#sil-body tr:last-child").textContent.includes("Updated stopping-distance")`), "SIL assessment was not edited");
    await click("#sil-body tr:last-child [data-delete-sil]");
    assert(await count("#sil-body tr") === before, "SIL assessment was not deleted");
  });

  await test("AMR risk graph derives each target SIL boundary", async () => {
    await click("#add-sil-btn");
    for (const [consequence, frequency, avoidance, demand, expected] of [
      ["C1", "F1", "P1", "W1", "No SIL"],
      ["C1", "F1", "P2", "W2", "SIL 1"],
      ["C2", "F1", "P2", "W2", "SIL 2"],
      ["C3", "F1", "P2", "W2", "SIL 3"],
      ["C4", "F1", "P2", "W2", "SIL 4"],
      ["C4", "F2", "P2", "W3", "SIL 4"]
    ]) {
      const actual = await evaluate(`(() => {
        const form = document.querySelector("#sil-form");
        form.elements.consequence.value = "${consequence}";
        form.elements.frequency.value = "${frequency}";
        form.elements.avoidance.value = "${avoidance}";
        form.elements.demand.value = "${demand}";
        form.dispatchEvent(new Event("change", { bubbles: true }));
        return document.querySelector("#sil-preview").textContent;
      })()`);
      assert(actual === expected, `${consequence}/${frequency}/${avoidance}/${demand} derived ${actual}, expected ${expected}`);
    }
    await click("#sil-dialog .dialog-close");
  });

  await test("quantitative safety calculator derives PFH and PFDavg", async () => {
    await click('[data-view="quantitative"]');
    await evaluate(`state.quantitative.components = []; save();`);
    await click("#add-quant-component-btn");
    assert(await isOpen("#quant-component-dialog"), "quantitative component dialog did not open");
    await click("#quant-component-dialog .dialog-close");
    assert(!await isOpen("#quant-component-dialog"), "quantitative component dialog close button failed");
    await click("#add-quant-component-btn");
    await fill('#quant-component-form [name="role"]', "Test obstacle detection");
    await fill('#quant-component-form [name="lambdaTotal"]', "1e-6");
    await fill('#quant-component-form [name="dangerousFraction"]', "0.5");
    await fill('#quant-component-form [name="diagnosticCoverage"]', "0.8");
    await fill('#quant-component-form [name="proofTestHours"]', "8760");
    await click("#quant-component-dialog .dialog-actions .primary");
    assert(await count("#quant-body tr") === 1, "quantitative component was not added");
    assert(await evaluate(`document.querySelector("#quant-results").textContent.includes("1.00e-7")`), "PFH residual rate was not calculated");
    await fill("#quant-mode", "low");
    assert(await evaluate(`document.querySelector("#quant-results").textContent.includes("4.38e-4")`), "PFDavg was not calculated");
    await click("#quant-body [data-edit-quant]");
    await fill('#quant-component-form [name="channels"]', "2");
    await fill('#quant-component-form [name="beta"]', "0.05");
    await click("#quant-component-dialog .dialog-actions .primary");
    assert(await evaluate(`document.querySelector("#quant-body").textContent.includes("β 0.05")`), "redundant channel beta factor was not displayed");
    await click("#quant-body [data-delete-quant]");
    assert(await count("#quant-body tr") === 0, "quantitative component was not deleted");
  });

  await test("quantitative safety guidance flags high-SIL architecture review", async () => {
    await evaluate(`state.quantitative = structuredClone(seed.quantitative); save();`);
    await evaluate(`state.quantitative.components.forEach(row => { row.lambdaTotal = 1e-9; }); save();`);
    await fill("#quant-mode", "continuous");
    await fill("#quant-target", "SIL 3");
    await fill("#quant-architecture", "1oo1");
    assert(await evaluate(`document.querySelector("#quant-guidance").textContent.includes("redundant-architecture review")`), "high-SIL redundancy guidance is missing");
    await fill("#quant-architecture", "1oo2");
    assert(!await evaluate(`document.querySelector("#quant-guidance").textContent.includes("needs an explicit redundant-architecture review")`), "redundant architecture selection did not update guidance");
  });

  await test("FMEDA evaluates symbolic rates and rolls up diagnostics", async () => {
    await evaluate(`state.fmeda = structuredClone(seed.fmeda); save();`);
    await click('[data-view="fmeda"]');
    assert(await evaluate(`document.querySelector("#fmeda-summary").textContent.includes("8.00e-8")`), "seeded FMEDA λDU rollup is missing");
    assert(await evaluate(`document.querySelector("#fmeda-summary").textContent.includes("90.0%")`), "seeded FMEDA diagnostic coverage is missing");
    await click("#add-constant-btn");
    assert(await isOpen("#constant-dialog"), "constant dialog did not open");
    await fill('#constant-form [name="symbol"]', "lambda_brake");
    await fill('#constant-form [name="value"]', "4e-7");
    await fill('#constant-form [name="description"]', "Brake release failure rate");
    await click("#constant-dialog .dialog-actions .primary");
    assert(await evaluate(`document.querySelector("#constant-list").textContent.includes("lambda_brake")`), "symbolic constant was not added");
    await click("#add-fmeda-btn");
    assert(await isOpen("#fmeda-dialog"), "FMEDA dialog did not open");
    await click("#fmeda-dialog .dialog-close");
    assert(!await isOpen("#fmeda-dialog"), "FMEDA dialog close button failed");
    await click("#add-fmeda-btn");
    await fill('#fmeda-form [name="failureMode"]', "Brake does not release diagnostic stop");
    await fill('#fmeda-form [name="localEffect"]', "Brake state mismatch");
    await fill('#fmeda-form [name="endEffect"]', "AMR remains stopped");
    await fill('#fmeda-form [name="classification"]', "safe");
    await fill('#fmeda-form [name="expression"]', "lambda_brake * (1 + 0.5)");
    assert(await evaluate(`document.querySelector("#expression-preview").textContent`) === "6.00e-7", "symbolic expression preview is incorrect");
    await click("#fmeda-dialog .dialog-actions .primary");
    assert(await count("#fmeda-body tr") === 4, "FMEDA row was not added");
    await click("#fmeda-body tr:last-child [data-edit-fmeda]");
    await fill('#fmeda-form [name="expression"]', "unknown_symbol * 2");
    assert(await evaluate(`document.querySelector("#expression-preview").textContent`) === "Invalid", "unknown symbol was not rejected");
    await fill('#fmeda-form [name="expression"]', "lambda_brake");
    await click("#fmeda-dialog .dialog-actions .primary");
    await click("#fmeda-body tr:last-child [data-delete-fmeda]");
    assert(await count("#fmeda-body tr") === 3, "FMEDA row was not deleted");
    await click('[data-delete-constant="lambda_brake"]');
    assert(!await evaluate(`document.querySelector("#constant-list").textContent.includes("lambda_brake")`), "unused symbolic constant was not deleted");
  });

  await test("FMEDA λDU handoff updates quantitative safety", async () => {
    await click("#sync-fmeda-btn");
    await click('[data-view="quantitative"]');
    assert(await evaluate(`document.querySelector("#quant-body").textContent.includes("SCAN")`), "FMEDA handoff did not preserve architecture component");
    assert(await evaluate(`document.querySelector("#quant-body").textContent.includes("8.00e-8")`), "FMEDA handoff did not update scanner λDU rate");
  });

  await test("PlantUML import updates referenced components", async () => {
    await click('[data-view="architecture"]');
    await fill("#plantuml-source", '@startuml\ncomponent "Test controller" as TEST_CTRL\nnode "Test arm" as TEST_ARM\n@enduml');
    await click("#parse-btn");
    assert(await count("#component-list .component-item") === 2, "PlantUML import did not update components");
    assert(await evaluate(`document.querySelector("#component-list").textContent.includes("TEST_ARM")`), "PlantUML alias is missing");
  });

  await test("PlantUML editor autocompletes keywords and snippets", async () => {
    await fill("#plantuml-source", "comp");
    assert(!await evaluate(`document.querySelector("#plantuml-completions").hidden`), "PlantUML completion menu did not open");
    assert(await evaluate(`document.querySelector("#plantuml-completions").textContent.includes("component")`), "component completion is missing");
    await evaluate(`document.querySelector("#plantuml-source").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }))`);
    assert(await evaluate(`document.querySelector("#plantuml-source").value`) === 'component "" as ALIAS', "PlantUML snippet was not inserted");
    assert(await evaluate(`document.querySelector("#plantuml-source").selectionStart`) === 11, "PlantUML snippet cursor was not placed inside the component name");
    assert(await evaluate(`document.querySelector("#plantuml-completions").hidden`), "PlantUML completion menu did not close after insertion");
    await fill("#plantuml-source", '@startuml\ncomponent "Test controller" as TEST_CTRL\nnode "Test arm" as TEST_ARM\n@enduml');
  });

  await test("PlantUML render button displays generated diagram", async () => {
    await click("#render-btn");
    await retry(async () => { assert(await count("#diagram-preview img") === 1, "rendered diagram image did not appear"); });
    assert(await evaluate(`document.querySelector("#render-status").textContent`) === "Diagram rendered", "diagram render status did not report success");
    assert(await evaluate(`document.querySelector("#diagram-preview img").alt`) === "Rendered PlantUML architecture diagram", "rendered diagram alt text is missing");
  });

  await test("reset workspace clears all preloaded worksheet data", async () => {
    await click("#new-analysis-btn");
    assert(await evaluate(`document.querySelector("#component-count").textContent`) === "0", "reset did not clear architecture components");
    await click('[data-view="fmea"]');
    assert(await count("#fmea-body tr") === 0, "reset did not clear FMEA rows");
    assert(await count("#hara-body tr") === 0, "reset did not clear HARA rows");
    assert(await count("#sil-body tr") === 0, "reset did not clear SIL assessments");
    assert(await count("#quant-body tr") === 0, "reset did not clear quantitative components");
    assert(await count("#fmeda-body tr") === 0, "reset did not clear FMEDA rows");
  });

  await test("existing browser workspaces migrate to include new analysis data", async () => {
    await evaluate(`(() => { const workspace = JSON.parse(localStorage.getItem("safeguard-cobot-workspace-v1")); delete workspace.hara; delete workspace.safetyGoals; delete workspace.silAssessments; delete workspace.quantitative; delete workspace.fmeda; localStorage.removeItem("safeguard-workspaces-v1"); localStorage.removeItem("safeguard-active-workspace-v1"); localStorage.setItem("safeguard-cobot-workspace-v1", JSON.stringify(workspace)); location.reload(); })()`);
    await retry(async () => { assert(await count("#hara-body tr") === 2, "legacy workspace did not receive HARA seed data"); });
    assert(await count("#goal-list .requirement") === 2, "legacy workspace did not receive safety goals");
    assert(await count("#sil-body tr") === 1, "legacy workspace did not receive AMR SIL assessment data");
    assert(await count("#quant-body tr") === 3, "legacy workspace did not receive quantitative safety data");
    assert(await count("#fmeda-body tr") === 3, "legacy workspace did not receive FMEDA data");
  });

  await test("export button initiates JSON download", async () => {
    await evaluate(`HTMLAnchorElement.prototype.click = function () { window.__download = this.download; };`);
    await click("#export-btn");
    assert(await evaluate(`window.__download`) === "cobot-safety-case.safeguard.json", "export did not initiate expected portable JSON download");
    assert(await evaluate(`projectEnvelope().format`) === "safeguard-safety-workspace", "export envelope format is missing");
    assert(await evaluate(`projectEnvelope().version`) === 1, "export envelope version is missing");
  });

  assert(browserErrors.length === 0, `browser reported exceptions:\n${browserErrors.join("\n")}`);
  console.log("All browser smoke tests passed.");
} catch (error) {
  console.error(error.message);
  if (browserErrors.length) console.error(browserErrors.join("\n"));
  if (ws?.readyState === WebSocket.OPEN) {
    console.error("Loaded URL:", await evaluate("location.href"));
    console.error("Loaded scripts:", await evaluate(`[...document.scripts].map(x => x.src).join(", ")`));
  }
  process.exitCode = 1;
} finally {
  ws?.close();
  browser.kill();
  server.stop();
}
