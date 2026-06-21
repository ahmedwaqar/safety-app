# Fault Tree Analysis guide

The fault-tree workspace is a **qualitative modelling aid** for safety engineering. It supports reviewable Boolean structure, deterministic rendering, minimal-cut-set reduction for coherent trees, layers, architecture references, and DSL/CSV/JSON export. It does not by itself establish ISO 61025 or ISO 26262 compliance, calculate a safety target, prove independence, or replace an approved FTA toolchain.

## Use it well

1. Start from one bounded, observable top event: for example, “unintended steering torque reaches road wheels while LKA is active”, not “LKA fails”.
2. Record the operating situation, ODD, mission time, exposure, and the vehicle state outside the tree. FTA is only one argument in the safety case.
3. Decompose *causes*, not design blocks. A basic event should be a credible failure condition, with its failure mode and assumptions available in FMEDA/FMEA or a linked work product.
4. Model dependencies explicitly. Shared power, time source, configuration, data path, calibration process, environmental susceptibility, and systematic causes can defeat apparent redundancy. A shared cause is a basic event; do not hide it in an independence assumption.
5. Trace top event ↔ hazardous event/safety goal ↔ functional/technical safety requirement ↔ architecture ↔ verification evidence. Review the model independently at the applicable ASIL.

## Gates and qualitative analysis

| Gate | Meaning | Qualitative cut sets |
| --- | --- | --- |
| `OR` | One or more inputs causes the output | Supported |
| `AND` | All inputs are required | Supported |
| `KOFN:k/n` | At least k of n inputs are required | Supported; `n` must equal the number of children |
| `NOT`, `NAND`, `NOR`, `XOR` | Non-monotonic Boolean logic | Rendered, but not a valid complete minimal-cut-set result in this workspace |

Use `AND`, `OR`, and voting gates for the normal fault-tree path. If a negation or exclusive state is genuinely required, model the state/condition clearly and use a dedicated Boolean or probabilistic analysis; do not present the displayed cut sets as the top-event result.

The editor rejects missing nodes, duplicate IDs, cycles, invalid K-of-N declarations, and invalid NOT-gate arity. It warns when a non-NOT gate has a single input or a voting gate merely duplicates OR/AND.

The renderer evaluates the DSL continuously whenever the source changes. It reports parser errors in the diagram panel and lists review findings for unreachable nodes, configured layers, and basic events whose architecture component is no longer defined.

## Current DSL

```text
fault_tree "AEB: collision with detected pedestrian" {
  top: TOP

  gate TOP {
    type: AND
    label: "Hazard not recognized and braking not delivered"
    children: [NOT_RECOGNIZED, BRAKE_NOT_DELIVERED]
    layer: Layer 1
  }

  gate NOT_RECOGNIZED {
    type: KOFN:2/3
    label: "Two sensing channels fail dangerously"
    children: [CAMERA_DF, RADAR_DF, LIDAR_DF]
    layer: Layer 1
  }

  basic CAMERA_DF {
    label: "Camera channel dangerous failure"
    component: CAMERA
    layer: Layer 2
  }
}
```

Every property occupies its own line. IDs may contain letters, digits, `_`, `.`, and `-`, but must start with a letter. `component` is an architecture reference; it does not prove allocation or independence.

Set the layer count in the editor, then assign each node to `Layer 1`, `Layer 2`, and so on. The layer selector provides focused review of that layer, while the full view retains the complete top-down tree.

Layer views are a non-destructive review aid over one canonical DSL model: start in **All layers**, enter gates and basic events with their layer assignments, then filter the rendered diagram. Switching the filter never replaces or discards the source. For genuinely separate subsystem trees, use a named intermediate event and a controlled interface/transfer convention rather than maintaining unrelated copies of the same top-event logic.

## Architecture starter generator

Define the architecture in PlantUML; its component declarations automatically populate **Components defined in architecture**. Then use **Generate starter from architecture** to start architecture rendering and produce an editable two-layer starter tree. It recognizes common component names and proposes three malfunctioning behaviours for each:

- sensing/perception: no output, dangerous invalid output, stale output;
- control/compute: unavailable execution, dangerous incorrect output, timing/watchdog failure;
- actuation: failure to actuate, unintended actuation, failure to reach the safe state;
- communication: loss, corrupted/inconsistent data, stale data;
- power: loss, out-of-tolerance output, protection/monitoring failure.

These are prompts for analysis, not a completed FMEA, FMEDA, or safety case. Remove inapplicable events; add function-specific modes, diagnostics, demand conditions, common causes, and a specific top event before review.

Use the **+**, **−**, and **Reset zoom** controls above the rendered tree to inspect dense branches without losing the top-down review structure.

## Review checklist

- Is the top event a hazardous malfunction in a stated operational context?
- Are basic events truly basic at the chosen analysis boundary, and are external assumptions visible?
- Are events mutually distinct? Reuse the same basic-event ID for the same physical cause; do not duplicate it under multiple branches.
- Do gates match the actual failure logic, including diagnostics, detection latency, and safe-state response?
- Has each claimed independent path been challenged for common cause and systematic coupling?
- Are cut sets physically plausible, reviewed, and connected to design actions or verification cases?
- If quantified elsewhere: are rate source, failure mode, diagnostic coverage, mission time, repair/proof-test interval, beta/common-cause model, and independence assumptions controlled?
- Has the tree been configuration-managed and independently reviewed as part of the safety case?

## Qualitative review aids

The analysis panel groups minimal cut sets by order, identifies order-1 single-point failures, and lists basic events that recur most often in the displayed cut sets. That participation value is a structural screening aid, not a probability-based importance measure. Use the layer/entity filters and 10/25/50/100/all row selector to keep large reviews focused. Common-cause dependencies, systematic faults, and probabilities still require explicit modelling and, where appropriate, reviewed quantitative analysis.

## Scope and references

Use ISO 61025 for FTA method vocabulary and ISO 26262:2018—particularly the concept, system, hardware, supporting-process, and ASIL-oriented analysis parts—for automotive lifecycle, traceability, confirmation, and analysis context. For automated driving, distinguish functional-safety malfunctions from intended-functionality/performance limitations and define the ODD and fallback/minimal-risk concept.

The ready-to-load automotive examples are:

- `training/adas-lane-keeping.ft`
- `training/adas-pedestrian-detection.ft`
- `training/adas-sensor-fusion.ft`

They are interview-quality learning models, not production safety cases or calibrated quantitative models.
