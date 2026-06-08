# Robotic Cell Engineering Practicum

This course gives a new engineer a realistic, hands-on introduction to the work performed when designing, integrating, commissioning, and releasing an industrial robotic cell.

The exercise uses an automated carton-palletizing cell and the completed Praxis Studio project:

[`examples/palletizing-cell.praxis.json`](examples/palletizing-cell.praxis.json)

Allow **11 to 15 hours** for the complete practicum. The goal is not to memorize forms. The goal is to practice the engineering reasoning, cross-functional communication, traceability, and evidence expected on a real robotics project.

For interview preparation, complete this course first and then use the [`Critical Systems Lifecycle Interview Practicum`](lifecycle-interview-practicum.md). It adds timed answers, management pressure, configuration mismatch, failed validation, field incidents, review boards, and challenging follow-up questions.

## Learning Outcomes

After completing the practicum, a learner should be able to:

1. Define a robotic application boundary and intended use.
2. distinguish robot-manufacturer responsibilities from integrator and end-user responsibilities.
3. Identify hazards across production, setup, recovery, maintenance, and change activities.
4. Convert risk controls into architecture decisions and testable requirements.
5. Perform practical FMEA and introductory FMEDA work.
6. Define safety functions, safe states, reset behavior, and validation evidence.
7. Build a commissioning and validation plan.
8. Assess the impact of production changes on previous safety evidence.
9. Explain why compliance evidence must emerge from engineering work rather than being assembled only at project end.
10. Capture multidisciplinary review input in Engineering notes and promote mature findings into controlled analyses.
11. Manage portable projects and independent browser tabs without mixing project context.

## Current Standards Context

Use the standards purchased and adopted by your organization. As of June 2026:

- [ISO 10218-1:2025](https://www.iso.org/standard/73933.html) addresses industrial robots.
- [ISO 10218-2:2025](https://www.iso.org/standard/73934.html) addresses industrial robot applications and robot cells, including integration, commissioning, operation, maintenance, and decommissioning.
- [ISO/TS 15066:2016](https://www.iso.org/standard/62996.html) remains published for collaborative industrial robot systems, although replacement work is underway.
- [IEC 61508](https://assets.iec.ch/public/acos/IEC%2061508%20%26%20Functional%20Safety-2022.pdf) provides a generic functional-safety lifecycle framework.

This training does not reproduce standards requirements and does not establish compliance. Clause references in the example are prompts for competent review, not declarations of conformity.

## Scenario

A food-distribution company is automating end-of-line palletizing. Sealed cartons arrive on an infeed conveyor. A six-axis industrial robot picks each carton using a vacuum gripper and places it on a pallet.

The cell includes:

- Six-axis robot and controller
- Cell PLC and operator HMI
- Safety PLC
- Perimeter guarding and interlocked access gate
- Safety laser scanner at the pallet-transfer opening
- Infeed conveyor
- Vacuum gripper and pneumatic supply
- Emergency-stop devices
- Forklift access for pallet exchange

The initial product is a 12 kg carton. Production later proposes a 20 kg carton and a faster palletizing recipe. This change becomes the final assessment.

## Project Roles

Work through the course while switching perspectives:

| Role | Typical responsibility |
| --- | --- |
| Systems engineer | Boundary, interfaces, requirements, traceability |
| Mechanical engineer | Layout, guarding, tooling, retained energy |
| Controls engineer | PLC, robot, recipes, diagnostics, recovery |
| Functional-safety engineer | Safety functions, architecture, lifecycle, validation strategy |
| Commissioning engineer | As-built checks, I/O, faults, site conditions |
| Production engineer | Throughput, operability, change requests |
| Maintenance technician | Isolation, access, troubleshooting, replacement |
| Independent validator | Objective tests and evidence review |

On a real project, these responsibilities may be distributed differently. The important lesson is that no single discipline sees the whole risk picture alone.

## Setup

1. Start Praxis Studio with `bun server.js`.
2. Open `http://localhost:8080`.
3. Select **File > Open**.
4. Open `training/examples/palletizing-cell.praxis.json`.
5. Confirm that **Palletizing Cell Training Project** appears in the workspace selector.
6. Open **Engineering workflow** and review the six phases.
7. Select **File > Save** to create a portable checkpoint before editing.

Do not edit the original example file. Save your working project under a new name outside the repository when you want to retain your exercise results.

### Workspace Handling Drill

1. Select **Open in new tab** and confirm that the palletizing project opens there.
2. In the new tab, open **Architecture**. In the original tab, keep **Engineering workflow** open.
3. Confirm that navigation in one tab does not switch the active view in the other.
4. Select **Close workspace** in the new tab. Confirm that the original tab remains open and the stored project is still available.

Use **Delete** only when you intend to remove stored project data. Praxis Studio prevents duplicate project names and reactivates an already imported project instead of creating a redundant copy.

## Module 0: Engineering Notes And Review Capture

**Estimated time:** 45 minutes

Engineering notes is the working area for incomplete reasoning, meeting observations, calculations, figures, and structured brainstorming. It is not a substitute for a controlled FMEA, requirement, or validation record.

### Exercise 0.1: Review The Seeded Workshop Note

Open **Engineering notes**.

1. Review the seeded system-boundary note and assumptions table.
2. Add the heading `Kickoff review actions`.
3. Record one action for mechanical, controls, production, and maintenance.
4. Insert a link to **Engineering workflow**.
5. Insert an equation or calculation relevant to the project, such as `moment = carton_mass * horizontal_offset`.
6. Confirm that the save status returns to **All changes saved**.

### Exercise 0.2: Edit A Live Table

Select a cell in the assumptions table. Use **Table options** to:

1. Insert a row below.
2. Insert a column to the right.
3. Name the new column `Due date`.
4. Remove the added column after discussing whether due dates belong in the note or the controlled action system.

The menu remains disabled until a table cell is selected. The **Insert** and **Remove** groups reduce accidental structural changes during a live review.

### Exercise 0.3: Capture Versus Control

For each item below, decide where it belongs:

| Information | Working location | Controlled destination |
| --- | --- | --- |
| Unconfirmed operator observation | Engineering notes | Operational situation or hazard after review |
| Candidate conveyor failure | FMEA draft | FMEA worksheet after cleanup |
| Proposed test acceptance limit | Engineering notes | Safety requirement or validation plan after approval |
| Review completion evidence | Engineering workflow | Workflow activity evidence |

Do not import a draft merely because the fields are complete. Confirm technical meaning, identifiers, ownership, and traceability first.

## Module 1: Project Definition And Boundary

**Estimated time:** 60 minutes

### Industry Situation

Projects often begin with a layout and a production-rate target. Important safety assumptions may remain implicit:

- Who clears jams?
- Can a person enter through the pallet opening?
- Who owns forklift traffic?
- What happens after loss of power or air?
- Which changes can production make without engineering review?

### Exercise 1.1: Read The Architecture

Open **Architecture**.

1. Render the diagram.
2. Identify the functional-control path from HMI to robot.
3. Identify the safety-control path from scanner or gate to robot controller.
4. Identify three non-electrical interfaces that affect safety.

Expected examples include the robot-to-gripper mechanical interface, pneumatic energy to the gripper, carton transfer from conveyor, and pallet/forklift interaction.

### Exercise 1.2: Challenge The Boundary

Open the workflow activity **Define system purpose and boundary**.

Record answers in its evidence field:

1. Is the forklift inside the machine boundary, an external actor, or both depending on the task?
2. Who supplies and validates the pallet?
3. Does the cell include upstream carton quality?
4. Who controls compressed-air isolation?
5. Is remote access to the PLC or robot possible?

There is no universal answer. The engineering objective is to make ownership and interface assumptions explicit.

### Deliverable

Update the architecture or workflow evidence with:

- Intended use
- Foreseeable misuse
- System boundary
- External interfaces
- User groups
- Lifecycle phases

### Review Gate

Do not mark the workflow activity complete until another person can understand what is and is not included in the project.

## Module 2: Task-Based Risk Assessment

**Estimated time:** 90 minutes

### Exercise 2.1: Inspect Operating Situations

Open **Operational situations**. Review the eight seeded situations.

For each situation, identify:

- Person exposed
- Task objective
- Expected machine state
- Energy sources
- Access route
- Reasonably foreseeable mistake or shortcut

Create one additional situation:

| Field | Suggested value |
| --- | --- |
| Identifier | `OS-09` |
| Name | `Sensor alignment and troubleshooting` |
| Description | `A technician observes live scanner or interlock diagnostics while adjusting or replacing a device.` |

### Exercise 2.2: Hazard Workshop

Open **Hazard catalogue**. For each hazard, ask:

1. What is the source of harm?
2. Which tasks expose a person?
3. What sequence creates the hazardous event?
4. Can the hazard be eliminated through design?
5. Which assumptions need site evidence?

Add a hazard associated with sharp damaged cartons, broken pallets, or housekeeping. This demonstrates that robot projects include application and environment hazards, not only robot motion.

Use **Engineering notes** during the discussion:

1. Insert a table with `Observation`, `Potential harm`, `Situation`, `Decision`, and `Owner`.
2. Add at least four raw stakeholder observations.
3. Link the note to **Hazard catalogue** and **Operational situations**.
4. Keep uncertain statements in the note until the team agrees they are suitable catalogue entries.

### Exercise 2.3: Build A Hazardous-Event Narrative

Write a short event sequence for `H-04 Access through pallet opening`:

1. Production condition
2. Trigger
3. Failed or bypassed protection
4. Person exposure
5. Potential harm

Example structure:

> A completed pallet is removed. Muting remains active longer than intended. A person walks through the opening. The robot receives a production command and moves toward the pallet station.

### Deliverable

Update workflow activity **Perform task-based hazard analysis** with the risk workshop date, participants, and unresolved questions.

## Module 3: Safety Functions And Safe States

**Estimated time:** 90 minutes

### Exercise 3.1: Review Seeded Safety Functions

Open **AMR SIL assessment**. The worksheet name is historically AMR-focused, but use it here as an early risk-graph exercise for the cell.

Review:

- Protective stop on safeguarded-space access
- Safe limited speed and enabling control during teaching
- Person detection at the pallet opening

For each function, identify:

- Initiating condition
- Logic
- Final element
- Safe state
- Reset behavior
- Operating modes
- Fault response
- Validation evidence

### Exercise 3.2: Challenge The Risk Inputs

For `SIL-CELL-03`, explain:

1. Why exposure may be `F1` or `F2`.
2. Whether a person could avoid robot motion after entering.
3. How pallet-opening geometry changes avoidance.
4. Why risk-graph output is an estimate rather than proof of achieved integrity.

Do not change a classification merely to obtain a preferred result.

### Exercise 3.3: Add A Restart-Inhibit Function

Create a new assessment:

| Field | Value |
| --- | --- |
| Identifier | `SIL-CELL-04` |
| Safety function | `Prevention of unexpected restart` |
| Hazard | `H-02` |
| Situation | `OS-07` |
| Hazardous event | `Power returns while a person remains near or inside the cell and automatic motion restarts.` |
| Safe state | `Hazardous motion inhibited until deliberate reset` |
| Evidence | `Power-interruption and reset validation VT-03` |

Choose and justify C/F/P/W values.

## Module 4: Safety-Oriented Architecture

**Estimated time:** 75 minutes

### Exercise 4.1: Trace A Protective Stop

Trace this chain:

```text
Person enters field
→ scanner detects intrusion
→ safety PLC evaluates input
→ robot controller executes safe stop
→ restart remains inhibited
```

For each arrow, identify:

- Signal type
- Possible failure
- Diagnostic
- Timing assumption
- Evidence source

### Exercise 4.2: Independence Review

Discuss these questions:

1. Does the standard PLC control any safety decision?
2. Can an HMI recipe modify scanner fields or safety parameters?
3. Do safety and standard control share power, network, or software tools?
4. Can a single maintenance action defeat multiple channels?
5. Is reset visible from every access point?

Record conclusions in workflow activity **Design safeguarding and access control**.

### Exercise 4.3: Design Before Safeguarding

Propose one inherently safer design change before adding or strengthening a safeguard. Examples:

- Move the pallet exchange outside robot reach.
- Reduce the robot working envelope.
- Lower the maximum carton release height.
- Remove the need for manual jam access.
- Eliminate a pinch point through conveyor redesign.

Estimate the effect on usability, throughput, cost, and residual risk.

## Module 5: FMEA And FMEDA

**Estimated time:** 120 minutes

### Exercise 5.1: Review FMEA Quality

Open **FMEA worksheet**. Review the six rows.

A useful failure mode describes how an item fails, not merely the hazard:

- Good: `Gate opened but interlock reports closed`
- Weak: `Operator gets injured`

For each seeded row, check:

- Component-level failure mode
- Local or system effect
- Hazard and situation
- Ratings
- Action
- Owner
- Verification reference

### Exercise 5.2: Promote The Seeded Workshop Draft

Open **Engineering notes** and review the seeded FMEA draft for unexpected conveyor start during jam recovery.

1. Confirm that `CONV`, `H-05`, and `OS-03` are valid identifiers.
2. Select **Clean up table**.
3. Resolve any reported validation issue.
4. Select **Import cleaned rows**.
5. Open **FMEA worksheet** and confirm that the row appears once and the draft no longer remains in Engineering notes.

Discuss why cleanup can normalize ratings and trim text but cannot establish that the engineering conclusion is correct.

### Exercise 5.3: Add A Conveyor Sensor Failure

Add an FMEA row for a carton position sensor that remains occupied or clear.

The recommended action must change the design rather than only adding a warning.

### Exercise 5.4: Review FMEDA Assumptions

Open **FMEDA worksheet**.

1. Recalculate the scanner `λDU` expression manually.
2. Explain what diagnostic coverage means in this model.
3. Identify where common-cause failure is not fully represented.
4. Identify which input values require supplier evidence.
5. Select **Sync λDU to quantitative safety** and inspect the result.

The seeded values are educational assumptions, not approved component data.

### Exercise 5.5: Quantitative Sensitivity

Open **Quantitative safety**.

Change one parameter at a time:

- Diagnostic coverage
- Common-cause beta
- Channel count
- Proof-test interval

Record which assumptions dominate the result. Restore the original project afterward if needed.

## Module 6: Requirements Engineering

**Estimated time:** 90 minutes

### Exercise 6.1: Requirement Review

Open **Safety requirements** and classify each seeded requirement:

- Functional behavior
- Integrity or diagnostic behavior
- Mode behavior
- Reset/restart behavior
- Installation constraint
- Verification method
- Process or change-control requirement

### Exercise 6.2: Improve Weak Requirements

Rewrite:

1. `The robot shall stop safely.`
2. `The scanner shall always work.`
3. `The pallet opening shall be safe.`
4. `Only trained people may change recipes.`

A stronger requirement identifies observable behavior, conditions, allocation, and verification.

### Exercise 6.3: Add A Conveyor Recovery Requirement

Add:

| Field | Suggested content |
| --- | --- |
| Identifier | `SR-08` |
| Source hazard | `H-05` |
| Component | `CONV` |
| Requirement | Conveyor motion during jam recovery requires a defined mode, deliberate hold-to-run command, and prevention of robot automatic motion. |
| Verification | Recovery-mode functional test with gate open and simulated carton jam |

Refine the wording so it matches your proposed architecture.

## Module 7: Commissioning And Validation

**Estimated time:** 120 minutes

### Exercise 7.1: Build An As-Built Checklist

Create a checklist covering:

- Device model and safety rating
- Wiring channel and terminal
- Safety PLC checksum
- Robot safety-parameter checksum
- Scanner field-set checksum
- Guard position and fasteners
- Reset-device location
- Emergency-stop coverage
- Pneumatic dump and pressure indication
- Software and recipe version

### Exercise 7.2: Write Validation Tests

Open **Lifecycle assurance**. Review seeded records `VT-01`, `VT-05`, `EV-05`, and `DEV-02`, then create V&V records for `SR-01` through `SR-07`. Define:

- Preconditions
- Test equipment
- Action
- Expected result
- Acceptance limit
- Evidence recorded
- Tester and witness

Set the configuration or approved baseline used for every execution. A test may be marked **Passed** only after recording its actual result and linking approved evidence. Use the traceability matrix to confirm which requirements remain uncovered.

Include realistic variations:

- Maximum payload
- Maximum speed
- Lowest expected friction
- Different approach directions
- Broken-wire or discrepancy fault
- Power and air interruption
- Reset while an access point is open
- Person-sized and pallet-sized test objects

### Exercise 7.3: Handle A Failed Test

Assume `VT-02` finds that a small person can enter beside a pallet while muting remains active.

1. Do not mark the requirement verified.
2. Add an **Issue or deviation** record linked from the failed V&V record.
3. Identify immediate production controls.
4. Propose design corrections.
5. Update the risk assessment and validation scope.
6. Determine which evidence is invalidated.
7. Close the deviation only after adding the disposition and approved closure evidence.

This is normal engineering work. A failed test is useful evidence when handled transparently.

## Module 8: Production Change Impact

**Estimated time:** 75 minutes

### Change Request

Production requests:

- Increase carton mass from 12 kg to 20 kg.
- Increase robot speed by 15%.
- Change the pallet pattern.
- Use a taller pallet.
- Deploy the recipe on night shift immediately.

### Exercise 8.1: Impact Assessment

Open seeded change `CR-01` in **Lifecycle assurance**. Identify impacts on:

- Robot payload and stopping behavior
- Gripper vacuum margin
- Dropped-load severity
- Pallet stability
- Robot reach and collision points
- Protective-field assumptions
- FMEA ratings
- Safety requirements
- Validation tests
- Operator and maintenance instructions

### Exercise 8.2: Release Decision

Choose one:

- Approve
- Approve with restrictions
- Reject pending evidence

Write the decision, rationale, required actions, owners, regression scope, target baseline, and approval evidence in `CR-01`. Record the corresponding decision in workflow activity **Control changes after release**.

A realistic answer should reject immediate unrestricted release until relevant engineering evidence is updated.

### Exercise 8.3: Baseline, Review, And Safety Argument

1. Review approved baseline `BL-01` and identify what would become obsolete after the recipe change.
2. Add a release review with independent participants, entry criteria, decision, actions, and evidence.
3. Update hazard ownership, controls, residual-risk rationale, and closure evidence in the hazard log.
4. Add or refine safety-case claims and link approved evidence.
5. Check release readiness. Explain every remaining gap instead of changing statuses to make the dashboard green.

## Capstone: Junior Robotics Engineer Handover

**Estimated time:** 2 to 3 hours

Prepare a project handover containing:

1. Updated architecture.
2. At least nine operational situations.
3. At least nine hazards.
4. Four safety-function assessments.
5. Eight safety requirements.
6. Eight FMEA rows.
7. Reviewed FMEDA assumptions.
8. Evidence-backed V&V records for all requirements.
9. Controlled evidence, deviations, reviews, interfaces, and hazard-log updates.
10. Completed workflow evidence and valid predecessor gates for finished activities.
11. A change-impact decision and updated baseline plan for the heavy-carton recipe.
12. A structured safety argument with supported and unsupported claims clearly distinguished.
13. An Engineering notes decision log with assumptions, stakeholder actions, calculations, and artifact links.
14. At least one FMEA draft cleaned and promoted without creating a duplicate record.
15. Exported `.praxis.json` project that reopens successfully.

## Peer Review Questions

The reviewer should ask:

1. What is the most important unresolved safety assumption?
2. Which control eliminates risk by design?
3. Which control depends on correct software configuration?
4. Which safety function has the weakest evidence?
5. Can a person bypass or defeat multiple controls through one action?
6. What happens after power, air, or communications return?
7. Which production changes require revalidation?
8. Are all completed workflow gates supported by evidence?
9. Which supplier claims have been independently checked?
10. What would prevent release today?
11. Which statements remain raw notes, and which have been promoted into controlled records?
12. Can each completed workflow status be defended with evidence rather than activity alone?

## Robotics Interview Drill

Answer each question in 90 seconds, then ask a reviewer to challenge one assumption:

1. Why is a robot declaration or component certificate insufficient for the integrated cell?
2. How do you determine whether an operation is collaborative, safeguarded, or prohibited?
3. How do stopping time, separation distance, payload, tooling, and floor conditions interact?
4. What is the safe state after loss and restoration of power or compressed air?
5. How do you validate muting without creating an access path for a person?
6. What failures can defeat both channels of an interlock or scanner function?
7. How do you control safety PLC, robot parameter, scanner field, and recipe versions?
8. When is a production recipe change safety relevant?
9. How do you validate maintenance and jam-recovery tasks?
10. What would make you refuse cell release?

Use the answer structure in [`lifecycle-interview-answer-key.md`](lifecycle-interview-answer-key.md). Do not answer only with a standard number; explain the design decision, evidence, configuration, and remaining uncertainty.

## Completion Standard

The learner has completed the practicum when they can:

- Explain their design and safety reasoning without relying on worksheet labels.
- Trace hazards through architecture, functions, failures, requirements, and evidence.
- Identify uncertainty and avoid presenting assumptions as facts.
- Distinguish completion of a form from completion of engineering work.
- Defend a release or no-release decision using recorded evidence.

## Instructor Notes

For a coached course:

- Run design reviews after Modules 2, 4, 6, and 7.
- Use Module 0 to demonstrate the difference between collaborative capture and approved engineering records.
- Assign different learners the systems, mechanical, controls, validation, and production roles.
- Introduce one surprise fault or change request during commissioning.
- Reward clear assumptions and justified no-release decisions.
- Do not reward high SIL values or large document counts by themselves.
