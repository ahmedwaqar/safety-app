# Safeguard Cobot Safety Studio

Safeguard is a lightweight web app for collaborative-robot and autonomous-mobile-robot (AMR) safety analysis. It keeps architecture, operational context, hazards, AMR SIL assessments, ISO 26262 hazard analysis and risk assessment (HARA), FMEA records, and safety requirements in one traceable browser workspace.

The app ships with an example cobot-cell safety case so the workflow is visible immediately after startup.

## Feature Snapshot

| Workspace | Capabilities |
| --- | --- |
| Overview | Safety-case metrics, residual-risk summary, high-priority failure modes, analysis coverage, and architecture components in scope |
| Architecture | Paste PlantUML source, render an SVG diagram locally, and import component aliases as reusable references |
| Operational situations | Catalogue normal operation, setup, intervention, maintenance, and other relevant operating contexts |
| Hazard catalogue | Maintain reusable hazards and view linked analysis references |
| AMR SIL assessment | Estimate a target Safety Integrity Level for AMR safety functions with a transparent C/F/P/W risk graph |
| ISO 26262 HARA | Create hazardous events, classify severity (`S0`-`S3`), exposure (`E0`-`E4`), and controllability (`C0`-`C3`), then derive ASIL automatically |
| Safety goals | Define top-level safety objectives with ASIL, safe state, FTTI, and hazardous-event traceability |
| FMEA worksheet | Record component failure modes, effects, linked hazards and situations, recommended actions, and automatic RPN scoring |
| Custom FMEA templates | Add and remove organization-specific worksheet columns |
| Safety requirements | Define mitigations, allocate them to architecture components, link source hazards, and track verification status |
| Workspace data | Persist locally in the browser, reset to the seeded example, or export the complete workspace as JSON |

## Requirements

- [Bun](https://bun.sh/) for the local server and browser test suite
- Java 17 or later for PlantUML rendering
- A modern browser
- Google Chrome for the automated interaction suite

The official PlantUML `v1.2026.4` JAR is attached at [`vendor/plantuml.jar`](vendor/plantuml.jar). Rendering is local: PlantUML source does not leave the machine.

## Beginner Training

New to AMR safety analysis? Start with the hands-on [`AMR Robot Safety Training`](training/README.md). It includes:

- Five beginner modules
- A runnable warehouse-AMR PlantUML example
- Working SIL, FMEA, and safety-requirement examples
- Student tasks and a capstone assessment
- A separate instructor answer key

## Start The App

Run:

```sh
bun server.js
```

Open:

```text
http://localhost:8080
```

Opening `index.html` directly still provides the analysis workspace, but diagram rendering requires the local server.

## Suggested Workflow

1. Open **Architecture**, paste or update the PlantUML model, and select **Render diagram**.
2. Select **Import components** so PlantUML aliases become available as references in the analysis.
3. Add the relevant **Operational situations**.
4. Maintain the reusable **Hazard catalogue**.
5. Use **ISO 26262 HARA** to create hazardous events and derive ASIL from S/E/C classifications.
6. For an AMR application, use **AMR SIL assessment** to estimate the target SIL for each safety function.
7. Add **Safety goals** for the classified hazardous events.
8. Use the **FMEA worksheet** to assess component-level failure modes and prioritize actions by risk priority number.
9. Add **Safety requirements**, linking each control to its source hazard and allocated architecture component.
10. Use the download button in the top bar to export `safeguard-cobot-analysis.json`.

## Using Each Workspace

### Architecture

Paste PlantUML into the editor and select:

- **Render diagram** to generate an SVG preview with the attached JAR.
- **Import components** to extract references for FMEA rows and safety requirements.

The importer recognizes `component`, `node`, `database`, `queue`, `cloud`, `rectangle`, `artifact`, `package`, and `frame` declarations.

### Operational Situations And Hazards

Use **Add situation** and **Add hazard** to maintain reusable catalogues. Catalogue entries that are already referenced by an analysis record cannot be deleted until those references are removed.

### ISO 26262 HARA

Use **Add hazardous event** to combine a hazard with an operational situation and describe:

- Malfunctioning behaviour
- Potential harm or consequence
- Severity, exposure, and controllability
- Linked safety goal

The app derives the Automotive Safety Integrity Level automatically. Add safety goals with **Add safety goal** and capture the safe state and fault tolerant time interval (FTTI).

ISO 26262 is intended for safety-related E/E systems installed in series-production road vehicles. This app supports HARA records and traceability; using it does not by itself establish standards compliance.

Reference: [ISO 26262-3:2018 - Road vehicles - Functional safety - Part 3: Concept phase](https://www.iso.org/standard/68385.html).

### AMR SIL Assessment

Use **Add SIL assessment** to estimate a target SIL for an AMR safety function. Each assessment records:

- Safety function, such as protective stop on obstacle detection
- Linked hazard and operational situation
- Hazardous event and potential consequence
- Consequence (`C1`-`C4`)
- Exposure frequency (`F1`-`F2`)
- Possibility of avoidance (`P1`-`P2`)
- Probability of the unwanted occurrence or demand (`W1`-`W3`)
- Safe state and validation evidence

The app uses the selected C/F/P/W values to display a transparent target estimate from **No SIL** through **SIL 4**. Treat the result as an engineering input for review, not an automatic compliance decision. The final required integrity level depends on the AMR type, safety function, operating zone, applicable machinery standards, and the organization's accepted risk-assessment method.

[ISO 3691-4:2023](https://www.iso.org/standard/83545.html) specifies safety requirements and verification means for driverless industrial trucks and explicitly includes autonomous mobile robots among its examples. For functional-safety lifecycle and SIL concepts, consult the applicable IEC 61508-family standard and competent functional-safety practitioners.

### FMEA Worksheet

Use **Add failure mode** to record:

- Architecture component
- Failure mode and potential effect
- Linked hazard and operational situation
- Severity, occurrence, and detection ratings
- Recommended risk-reduction action

The worksheet calculates the risk priority number:

```text
RPN = severity x occurrence x detection
```

Use **Customize template** to add organization-specific columns such as owner, review status, or evidence reference.

### Safety Requirements

Use **Add requirement** to specify the control statement, source hazard, allocated architecture component, verification status, and verification method.

## Data And Export

The workspace is stored in browser `localStorage` under:

```text
safeguard-cobot-workspace-v1
```

Use the top-bar download button to export all architecture, catalogue, AMR SIL, HARA, FMEA, safety-goal, and requirement records as JSON. **New analysis** resets the browser workspace to the seeded example.

## Test

Run the headless Chrome interaction suite:

```sh
bun tests/browser-smoke.js
```

The suite verifies navigation, dialogs, FMEA editing, custom columns, catalogue entries, requirements, safety goals, AMR SIL risk-graph boundaries, the complete ISO 26262 S/E/C matrix, workspace migration, PlantUML component import, diagram rendering, reset, and JSON export.

Compile-check the browser and server entry points:

```sh
bun build app.js --target=browser --outfile=/tmp/safeguard-app-check.js
bun build server.js --target=bun --outfile=/tmp/safeguard-server-check.js
```

## Project Layout

```text
index.html               Web-app structure and dialogs
styles.css               Responsive application styling
app.js                   Browser state, workflows, and traceability logic
server.js                Lightweight server and local PlantUML SVG endpoint
tests/browser-smoke.js   Headless Chrome interaction suite
vendor/plantuml.jar      Attached PlantUML renderer
vendor/README.md         PlantUML release and checksum details
```
