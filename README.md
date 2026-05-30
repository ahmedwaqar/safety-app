# Safeguard Cobot FMEA

A lightweight, dependency-free web app for cobot safety analysis. It supports:

- FMEA worksheet with severity, occurrence, detection, and automatic RPN scoring
- ISO 26262 hazard analysis and risk assessment (HARA) with automatic ASIL derivation
- Safety goals with hazardous-event traceability, safe state, and FTTI fields
- Custom FMEA template columns
- Hazard and operational-situation catalogues
- Safety requirements with traceability and verification status
- PlantUML architecture import and component references
- Browser-local persistence and JSON export

## Run

Install Java 17 or later, then start the lightweight local server:

```sh
bun server.js
```

Then open `http://localhost:8080`.

Opening `index.html` directly still provides the analysis workspace, but PlantUML diagram rendering requires the local server.

## Test

Run the headless Chrome interaction suite:

```sh
bun tests/browser-smoke.js
```

The suite clicks through navigation, dialogs, FMEA editing, catalogue entries, custom columns, requirements, ISO 26262 HARA classification, safety goals, PlantUML import, reset, and export.

## ISO 26262 HARA

The **ISO 26262 HARA** workspace combines hazards with operational situations to create hazardous events. It records malfunctioning behaviour and potential harm, then derives the Automotive Safety Integrity Level from severity (`S0`–`S3`), exposure (`E0`–`E4`), and controllability (`C0`–`C3`). Safety goals can be traced back to classified hazardous events.

ISO 26262 is intended for safety-related E/E systems installed in series-production road vehicles. The app supports analysis records and traceability; using it does not by itself establish ISO 26262 compliance.

Reference: [ISO 26262-3:2018 — Road vehicles — Functional safety — Part 3: Concept phase](https://www.iso.org/standard/68385.html).

## PlantUML integration

Paste PlantUML source in the Architecture screen and select **Render diagram** to generate an SVG locally. Rendering uses the attached [`vendor/plantuml.jar`](vendor/plantuml.jar) through `server.js`; source code does not leave the machine.

Select **Import components** to extract references for the analysis. The parser recognizes common PlantUML declarations such as `component`, `node`, `database`, `queue`, `cloud`, `rectangle`, `artifact`, `package`, and `frame`. Imported aliases become available as references in FMEA rows and safety requirements.

Data is stored locally in browser `localStorage`. Use the download action in the top bar to export the complete analysis as JSON.
