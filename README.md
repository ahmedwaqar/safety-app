# Praxis Studio

Praxis Studio helps engineers do good engineering before asking them to produce safety paperwork. It provides a structured workspace for defining the system, understanding how it will be used, exploring architecture, making design decisions, and recording the reasoning and evidence behind those decisions.

As the engineering workflow develops, Praxis Studio helps the team identify the points where a decision could introduce, increase, or reduce risk. Engineers can place safety checkpoints at those points, define what must be reviewed before work proceeds, and connect each checkpoint to the appropriate analysis, requirement, owner, and verification evidence. Safety becomes an integrated outcome of disciplined, traceable engineering rather than a separate activity added near the end.

Architecture, operational context, hazards, integrity assessments, FMEA records, and requirements remain together in one traceable project, helping teams develop critical systems with greater clarity, confidence, and assurance.

The initial browser workspace ships with an example cobot-cell safety case so the workflow is visible immediately after startup. Deleting the final browser workspace creates a blank replacement.

## Feature Snapshot

| Workspace | Capabilities |
| --- | --- |
| Overview | Safety-case metrics, residual-risk summary, high-priority failure modes, analysis coverage, and architecture components in scope |
| Engineering workflow | Configure development phases and activities, insert safety checkpoints, define gate criteria, record evidence, assign owners, and launch linked analyses |
| Architecture | Paste PlantUML source, render an SVG diagram locally, and import component aliases as reusable references |
| Operational situations | Catalogue normal operation, setup, intervention, maintenance, and other relevant operating contexts |
| Hazard catalogue | Maintain reusable hazards and view linked analysis references |
| AMR SIL assessment | Estimate a target Safety Integrity Level for AMR safety functions with a transparent C/F/P/W risk graph |
| Quantitative safety | Connect reliability inputs to architecture components, calculate residual dangerous failure rates, estimate PFH or PFDavg, and review redundancy needs |
| FMEDA worksheet | Classify architecture-linked hardware failure modes, evaluate symbolic failure-rate expressions, and roll up λS, λDD, λDU, DC, and SFF |
| ISO 26262 HARA | Create hazardous events, classify severity (`S0`-`S3`), exposure (`E0`-`E4`), and controllability (`C0`-`C3`), then derive ASIL automatically |
| Safety goals | Define top-level safety objectives with ASIL, safe state, FTTI, and hazardous-event traceability |
| FMEA worksheet | Record component failure modes, effects, linked hazards and situations, recommended actions, and automatic RPN scoring |
| Custom FMEA templates | Add and remove organization-specific worksheet columns |
| Safety requirements | Define mitigations, allocate them to architecture components, link source hazards, and track verification status |
| Workspace data | Switch and delete local projects, and save or open portable project files on disk |
| Input guidance | Open contextual help for rating scales, failure-rate units, bounded fractions, FMEDA symbols, and project-file handling |

## Requirements

- [Bun](https://bun.sh/) for the local server and browser test suite
- Java 17 or later for PlantUML rendering
- A modern browser
- Google Chrome for the automated interaction suite

The official PlantUML `v1.2026.4` JAR is attached at [`vendor/plantuml.jar`](vendor/plantuml.jar). Rendering is local: PlantUML source does not leave the machine.

## Beginner Training

For an industry-style learning path, use the [`Robotic Cell Engineering Practicum`](training/robotic-cell-practicum.md) with its completed [`palletizing-cell.praxis.json`](training/examples/palletizing-cell.praxis.json) project.

The shorter [`AMR Robot Safety Training`](training/README.md) remains available as an introductory course. Training assets include:

- Five beginner modules
- A runnable warehouse-AMR PlantUML example
- A detailed palletizing-cell project covering workflow, architecture, hazards, safety functions, FMEA, FMEDA, requirements, validation, and change impact
- Working SIL, FMEA, and safety-requirement examples
- Student tasks and a capstone assessment
- A separate instructor answer key

## Start The App

Run:

```sh
bun server.js
```

The server compiles the TypeScript browser source before starting. To build the browser artifact without starting the server, run:

```sh
bun run build
```

Open:

```text
http://localhost:8080
```

Opening `index.html` directly still provides the analysis workspace, but diagram rendering requires the local server.

## Suggested Workflow

1. Open **Engineering workflow** to plan phases, activities, safety checkpoints, gates, and evidence.
2. Open **Architecture**, paste or update the PlantUML model, and select **Render diagram**.
3. Select **Import components** so PlantUML aliases become available as references in the analysis.
4. Add the relevant **Operational situations**.
5. Maintain the reusable **Hazard catalogue**.
6. Use **ISO 26262 HARA** to create hazardous events and derive ASIL from S/E/C classifications.
7. For an AMR application, use **AMR SIL assessment** to estimate the target SIL for each safety function.
8. Add **Safety goals** for the classified hazardous events.
9. Use **Quantitative safety** to add component failure-rate assumptions and compare PFH or PFDavg with the target SIL.
10. Use the **FMEDA worksheet** to classify hardware failure modes and evaluate symbolic rate expressions.
11. Use the **FMEA worksheet** to assess component-level failure modes and prioritize actions by risk priority number.
12. Add **Safety requirements**, linking each control to its source hazard and allocated architecture component.
13. Use the top-bar controls to save the active project as a portable `.praxis.json` file.

## Using Each Workspace

### Engineering Workflow

The workflow starts with a generic critical-systems template covering definition, exploration, architecture, specification, verification, and assurance.

- Add phases and activities to reflect the project's development lifecycle.
- Add safety checkpoints where engineering decisions can introduce or reduce risk.
- Link activities to architecture, hazard analysis, FMEA, FMEDA, SIL, quantitative analysis, or requirements.
- Map activities to applicable standards clauses or internal assurance objectives.
- Define completion criteria and record evidence before treating a gate as ready.
- Use owners and activity status to make open engineering work visible.

Safety is treated as a continuous engineering lens rather than a single downstream review phase.

### Architecture

Paste PlantUML into the editor and select:

- Use the autocomplete menu while typing common PlantUML keywords. Select a snippet with `ArrowUp` / `ArrowDown` and insert it with `Enter` or `Tab`.
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

### Quantitative Safety Calculation

Use **Quantitative safety** for an early random-hardware estimate. Select a safety function, target SIL, and operating mode:

- **High-demand / continuous** calculates the probability of dangerous failure per hour (`PFH`).
- **Low-demand** calculates the average probability of failure on demand (`PFDavg`).

Add architecture-linked components and provide:

- Total failure rate `λ`
- Dangerous failure fraction
- Diagnostic coverage (`DC`)
- Proof-test interval (`T1`)
- One or two channels
- Common-cause beta factor for a simplified two-channel estimate

The app displays:

```text
λD = λ x dangerous fraction
λDU = λD x (1 - DC)
PFH ≈ sum of residual λDU values
PFDavg ≈ sum of residual λDU x T1 / 2
```

For two channels, the app combines an independent dual-channel term with a beta-factor common-cause term. This is useful for early architecture discussion, but it is not a complete FMEDA.

The guidance panel compares the numerical estimate with the selected target SIL and prompts a redundant-architecture review for higher-integrity designs. A valid safety case must also address hardware fault tolerance, safe failure fraction, common-cause failures, independence, systematic capability, proof-test effectiveness, and validation evidence.

[IEC 61508-1:2010](https://webstore.iec.ch/en/publication/5515) covers E/E/PE systems used to carry out safety functions. [IEC 61508-2:2010](https://webstore.iec.ch/en/publication/5516) specifies design and manufacture requirements for E/E/PE safety-related systems, including techniques and measures graded against SIL.

### FMEDA Worksheet

Use **FMEDA worksheet** for architecture-linked failure modes, effects, and diagnostic analysis. Classify each row as:

- Safe failure (`λS`)
- Dangerous detected failure (`λDD`)
- Dangerous undetected failure (`λDU`)
- No-effect failure (`λNE`)

Define named constants such as `lambda_scanner` and `dc_scanner`, then use them in symbolic expressions:

```text
lambda_scanner * frac_dangerous * (1 - dc_scanner)
```

The worksheet evaluates each expression without executing JavaScript and rolls up:

```text
DC = λDD / (λDD + λDU)
SFF = (λS + λDD) / λ total
```

Select **Sync λDU to quantitative safety** to copy architecture-component residual dangerous rates into the PFH/PFDavg calculator.

FMEDA quality depends on credible source data, failure-mode distributions, diagnostic assumptions, dependent-failure analysis, and expert review. The worksheet supports engineering analysis; it does not make a component or architecture compliant by itself.

Beginner lesson: [`training/fmeda-for-beginners.md`](training/fmeda-for-beginners.md).

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

## Workspaces And Portable Project Files

Praxis Studio supports multiple independent local workspaces. Use the top-bar workspace selector to switch projects and the **File** menu to:

- Select **New** to name and create a blank browser workspace
- Select **Open** to reopen a saved project file as a browser workspace
- Select **Open in new tab** to work with the active project alongside other projects
- Select **Save** to preserve the active project in browser storage and download `<workspace-name>.praxis.json`
- Select **Close workspace** to remove the project from the workspace selector without deleting its stored data; opening it again restores the existing project
- Select **Delete** to remove the active project from browser storage
- Select the **?** button to open input guidance

Portable project files use a versioned JSON envelope:

```json
{
  "format": "praxis-studio-workspace",
  "version": 1,
  "exportedAt": "2026-05-31T00:00:00.000Z",
  "workspace": {
    "name": "Warehouse AMR project",
    "data": {}
  }
}
```

The `data` object contains architecture, catalogues, AMR SIL assessments, quantitative safety inputs, FMEDA records, HARA records, FMEA rows, safety goals, and requirements. The JSON format is platform-independent and can be moved between browsers and operating systems.

Local workspace metadata is stored in browser `localStorage`, while each tab keeps its active-project selection in `sessionStorage`. Legacy Safeguard project files and storage keys remain supported for backward compatibility.

## Input Validation

Praxis Studio validates typed values before saving records and checks imported JSON project structure before opening a workspace.

Key rules:

- Identifiers start with a letter and use letters, numbers, `.`, `_`, or `-`.
- Identifiers must be unique within their record type; comparisons are case-insensitive.
- Project names must be unique; comparisons are case-insensitive.
- FMEA severity, occurrence, and detection ratings are integers from `1` to `10`.
- Failure rates are finite non-negative values in failures per hour.
- Dangerous fractions, diagnostic coverage, and beta factors are between `0` and `1`.
- Proof-test intervals are positive hours.
- FMEDA symbols use identifier syntax and symbolic expressions reject unknown names, unsupported characters, division by zero, and negative results.

Use the top-bar **?** button for contextual guidance when entering values.

## Test

Run the headless Chrome interaction suite:

```sh
bun tests/browser-smoke.js
```

The suite verifies workspace creation, switching, deletion, isolation, project-file save and open, navigation, dialogs, FMEA editing, FMEDA symbolic expressions and rollups, custom columns, catalogue entries, requirements, safety goals, AMR SIL risk-graph boundaries, quantitative PFH and PFDavg calculations, architecture guidance, the complete ISO 26262 S/E/C matrix, legacy migration, PlantUML component import, diagram rendering, and reset.

Compile-check the browser and server entry points:

```sh
bun run check
bun run build
bun build server.js --target=bun --outfile=/tmp/praxis-server-check.js
```

## Project Layout

```text
index.html               Web-app structure and dialogs
styles.css               Responsive application styling
app/
  praxis-studio.ts       Typed feature registry, browser state, workflows, and traceability source
  praxis-studio.browser.js
                         Generated browser artifact for direct index.html use
scripts/build-app.ts      Shared TypeScript-to-JavaScript browser build
server.js                Lightweight server and local PlantUML SVG endpoint
tests/browser-smoke.js   Headless Chrome interaction suite
vendor/plantuml.jar      Attached PlantUML renderer
vendor/README.md         PlantUML release and checksum details
```
