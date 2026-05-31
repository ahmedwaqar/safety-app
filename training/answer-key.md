# AMR Robot Safety Training Answer Key

Use this guide after the learner completes the exercises. Several tasks allow more than one valid answer. Evaluate the reasoning and traceability, not only the selected classification.

## Checkpoint 1

1. Examples: operators, maintenance technicians, visitors, forklift drivers, loading-station staff.
2. A blind intersection affects whether people or vehicles can detect and avoid a collision. The geometry can change exposure and avoidance assumptions.
3. `Safety scanner failure` is a failure mode. A resulting hazard could be collision or crushing caused by continued AMR movement.

## Student Task 1: Example Hazards

Valid additions include:

| Identifier | Hazard | Relevant situations |
| --- | --- | --- |
| `H-AMR-02` | Payload falls or shifts during movement | Shared-aisle travel, docking, jam recovery |
| `H-AMR-03` | Battery electrical or thermal hazard | Charging, maintenance |
| `H-AMR-04` | Unexpected AMR movement during recovery | Jam recovery, maintenance |

## Student Task 2: Example Reasoning

One defensible answer for speed limitation in a constrained loading area:

| Input | Selection | Example rationale |
| --- | --- | --- |
| Consequence | `C2` | A collision at an unsafe speed could cause serious injury. |
| Exposure | `F2` | Operators work in the area throughout a shift. |
| Avoidance | `P1` | Reduced speed and visibility may allow avoidance under some conditions. |
| Demand | `W2` | Entry into the loading zone is expected, but unsafe overspeed is not continuously demanded. |

With the app's training risk graph:

```text
Target SIL estimate: SIL 2
```

The learner may choose different values if the assumptions are documented and technically coherent.

## Student Task 3: Example Changes

- Improve avoidance: reduce travel speed, improve visibility, add warning indicators, or redesign the crossing.
- Reduce exposure: separate pedestrian routes with barriers or restrict access while the AMR is moving.
- A reassessment may reduce the estimate if the selected `F` or `P` category changes. A design change should not automatically change a category unless evidence supports the new selection.

## Student Task 4: Example Requirements

1. Instead of `The AMR shall stop quickly`:

   `The AMR shall stop before the defined hazard boundary when a test target enters the protective field during automatic travel at maximum rated speed and payload.`

2. Instead of `The AMR shall be safe at intersections`:

   `The AMR shall limit speed to the validated intersection speed before entering the configured blind-intersection zone.`

3. Instead of `The battery shall not cause problems`:

   `The charging controller shall inhibit traction motion while the AMR is connected to the charging interface.`

## Capstone Review Guidance

A good submission:

- Models sensors, control, drive, payload, and charging components.
- Includes non-nominal situations such as recovery and maintenance.
- Separates hazards from component failure modes.
- Assigns SIL estimates to specific safety functions.
- Uses measurable safety requirements.
- Includes verification evidence such as stopping-distance tests, protective-field validation, speed-zone tests, brake tests, or charging-interlock tests.

## Knowledge Check

1. SIL expresses an integrity requirement for a safety function, not a general quality rating for the complete robot.
2. A hazard is a potential source of harm. A hazardous event is a hazard occurring in a particular operational situation.
3. Examples: aisle width, blind corners, pedestrian crossings, floor condition, lighting, access control, speed zones, and charging-station placement.
4. Example evidence: stopping-distance test results across defined speeds, payloads, floor conditions, approach angles, and protective-field configurations.
5. During jam recovery, people may enter the AMR path or interact directly with the payload and vehicle. Exposure and safeguards differ from normal travel.
6. RPN helps prioritize failure modes using severity, occurrence, and detection ratings.
7. It cannot be verified objectively. A requirement should define observable, testable behaviour.
8. No. The app provides a documented engineering estimate. Applicable standards, accepted methods, evidence, and competent review are still required.

## FMEDA Follow-Up

### Task 1: Complete The Scanner Allocation

```text
Unallocated fraction = 1 - 0.35 - 0.4 = 0.25
```

A suitable constant is:

```text
frac_no_effect = 0.25
```

The row expression is:

```text
lambda_scanner * frac_no_effect
```

No-effect classifications require justification because the same physical failure may affect another safety function or operating condition.

### Task 2: Improve Diagnostic Coverage

With `dc_scanner = 0.95`:

```text
λDD = 2e-6 * 0.4 * 0.95 = 7.6e-7 / h
λDU = 2e-6 * 0.4 * (1 - 0.95) = 4e-8 / h
```

The residual dangerous rate is halved, but compliance still depends on architecture, common-cause analysis, systematic capability, validation, and applicable constraints.

### Task 3: Missing Analysis

Valid answers include:

- Confirm source failure-rate data and operating environment.
- Validate diagnostic response time and effectiveness.
- Analyze dependent and common-cause failures.
- Evaluate hardware fault tolerance and architectural constraints.
- Review proof-test assumptions.
- Demonstrate systematic capability.
- Validate the complete safety function under realistic payload, floor, speed, and route conditions.

### Task 4: Architecture Review

One possible answer:

- Add an independent protective sensing channel with separate processing.
- Consider contamination or environmental obstruction as a common-cause failure.
- Use diverse sensing principles, separate power paths, independent diagnostics, or physical separation where justified.
- A second sensor does not automatically solve the problem because shared power, software, mounting location, environment, or design errors may defeat both channels.

### FMEDA Knowledge Check

1. `λDD` failures are dangerous but detected by diagnostics. `λDU` failures are dangerous and remain undetected.
2. `λDU` contributes to the residual probability that the safety function is unavailable or fails dangerously.
3. Diagnostic coverage measures the detected fraction of dangerous failures.
4. SFF includes safe failures and detected dangerous failures relative to the total considered failure rate.
5. Descriptions and sources make assumptions auditable and maintainable.
6. No. It is an engineering worksheet that supports, but does not replace, competent analysis and review.
