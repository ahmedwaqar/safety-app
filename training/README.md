# AMR Robot Safety Training

This beginner course introduces safety analysis for autonomous mobile robots (AMRs) used in industrial operating zones. It combines short lessons with hands-on work in Safeguard.

## Learning Objectives

After completing the course, a learner should be able to:

1. Explain the difference between a hazard, hazardous situation, hazardous event, safety function, and safety requirement.
2. Describe why the AMR operating zone is part of the safety analysis.
3. Build a basic AMR architecture model in PlantUML.
4. Catalogue operational situations and hazards.
5. Estimate a target SIL for an AMR safety function with the app's C/F/P/W risk graph.
6. Record a component-level failure mode in the FMEA worksheet.
7. Write a testable safety requirement and identify suitable validation evidence.

## Course Structure

| Module | Topic | Practical output |
| --- | --- | --- |
| 1 | AMR safety foundations | Identify system boundary and people at risk |
| 2 | Hazards and operating zones | Create operational situations and hazards |
| 3 | Safety functions and SIL | Create an AMR SIL assessment |
| 4 | FMEA and requirements | Create a failure mode and testable requirement |
| 5 | Capstone assessment | Complete a small warehouse AMR safety analysis |

Allow approximately 3 to 4 hours for the complete course.

## Prerequisites

Start Safeguard before the practical exercises:

```sh
bun server.js
```

Open:

```text
http://localhost:8080
```

The course example PlantUML model is available at [`examples/warehouse-amr.puml`](examples/warehouse-amr.puml).

## Important Scope Note

This course teaches a practical analysis workflow. It does not qualify a learner as a functional-safety practitioner and does not establish compliance for a real AMR installation.

- [ISO 12100:2010](https://www.iso.org/standard/51528.html) describes machinery risk assessment and risk reduction principles.
- [ISO 3691-4:2023](https://www.iso.org/standard/83545.html) specifies safety requirements and verification means for driverless industrial trucks and explicitly includes AMRs among its examples.
- [IEC 61508-1:2010](https://webstore.iec.ch/en/publication/5515) covers E/E/PE systems used to perform safety functions.
- The [IEC functional-safety overview](https://assets.iec.ch/public/acos/IEC%2061508%20%26%20Functional%20Safety-2022.pdf) explains that SIL is a property of a safety function.

Use the applicable standards, organization procedures, and competent reviewers for real projects.

## Module 1: AMR Safety Foundations

### 1.1 What Is An AMR?

An AMR is a powered mobile robot that can operate automatically within an intended environment. For safety analysis, do not look only at the robot chassis. Consider the complete system:

- Vehicle and payload
- Navigation and localization
- Safety scanner or other protective sensors
- Braking and drive controls
- Fleet manager and wireless communication
- Charging stations
- Workstations, doors, intersections, and aisle geometry
- Operators, visitors, maintenance staff, and other vehicles

### 1.2 Core Vocabulary

| Term | Beginner-friendly meaning | Warehouse example |
| --- | --- | --- |
| Hazard | A potential source of harm | Moving AMR can strike a person |
| Operational situation | The context in which activity occurs | AMR crosses a shared pedestrian aisle |
| Hazardous event | A hazard occurring in a specific situation | AMR fails to stop while a person crosses its path |
| Safety function | Behaviour intended to reduce risk | Initiate protective stop when an obstacle enters the protective field |
| Safe state | Condition reached after the safety function acts | AMR stopped with drive torque removed |
| Validation evidence | Proof that the safety function works as intended | Stopping-distance test report |

### 1.3 Example: Set The System Boundary

For this course, analyze a warehouse AMR that transports a 150 kg tote between storage and packing stations. It travels through shared aisles and a blind intersection. Pedestrians may enter the route during normal operation.

In **Architecture**, paste the content of [`examples/warehouse-amr.puml`](examples/warehouse-amr.puml), then select:

1. **Render diagram**
2. **Import components**

Expected result: seven architecture components appear in the imported model.

### Checkpoint 1

Answer these questions before moving on:

1. Name three people or groups who may be exposed to AMR hazards.
2. Why must a blind intersection be included in the system analysis?
3. Is "safety scanner failure" a hazard or a failure mode?

## Module 2: Hazards And Operating Zones

### 2.1 Use A Repeatable Process

A beginner-friendly risk-analysis loop is:

1. Define intended use and reasonably foreseeable misuse.
2. Identify life-cycle phases and operational situations.
3. Identify hazards and hazardous events.
4. Estimate and evaluate risk.
5. Reduce risk through design, safeguards, and information where appropriate.
6. Verify and document the result.

### 2.2 Working Example: Shared-Aisle Collision

Create this operational situation in **Operational situations**:

| Field | Value |
| --- | --- |
| Identifier | `OS-AMR-01` |
| Name | `Shared aisle travel` |
| Description | `AMR transports material in an aisle that is also used by pedestrians.` |

Create this hazard in **Hazard catalogue**:

| Field | Value |
| --- | --- |
| Identifier | `H-AMR-01` |
| Name | `AMR collision with pedestrian` |
| Description | `Moving AMR contacts or traps a pedestrian, causing impact or crushing injury.` |
| Category | `Mechanical` |

### 2.3 Think Beyond Nominal Operation

Add at least four operating situations for a realistic AMR:

- Normal shared-aisle travel
- Blind-intersection approach
- Docking or load transfer
- Charging
- Jam recovery
- Maintenance
- Manual movement or recovery mode

### Student Task 1: Hazard Catalogue

Add three more AMR hazards. At least one must concern the payload and one must concern charging or stored energy.

For each hazard, write:

- Identifier
- Name
- Description
- Relevant operational situations

## Module 3: Safety Functions And Target SIL

### 3.1 SIL Belongs To A Safety Function

Do not assign a SIL to the entire robot as a vague label. The assessment should focus on a safety function, such as protective stopping, speed limitation, or prevention of unintended movement.

Safeguard provides a C/F/P/W risk graph to estimate a **target SIL**:

| Factor | Question |
| --- | --- |
| `C` Consequence | How serious could the harm be? |
| `F` Exposure frequency | How often are people exposed? |
| `P` Possibility of avoidance | Could an exposed person realistically avoid the harm? |
| `W` Demand probability | How likely is the unwanted occurrence or demand? |

The displayed value is an engineering estimate for review. It is not a certificate and is not a replacement for the accepted method required by the applicable standards and your organization.

### 3.2 Working Example: Protective Stop

Open **AMR SIL assessment** and add:

| Field | Value |
| --- | --- |
| Identifier | `SIL-AMR-01` |
| Safety function | `Protective stop on obstacle detection` |
| Linked hazard | `H-AMR-01 · AMR collision with pedestrian` |
| Operational situation | `OS-AMR-01 · Shared aisle travel` |
| Hazardous event | `AMR continues moving after a person enters its travel path.` |
| Consequence | `C3 · Death of one person` |
| Exposure frequency | `F2 · Frequent to continuous exposure` |
| Possibility of avoidance | `P2 · Scarcely possible` |
| Demand probability | `W3 · Relatively high` |
| Safe state | `Controlled protective stop` |
| Validation evidence | `Stopping-distance and protective-field validation report` |

Expected app result:

```text
Target SIL estimate: SIL 4
```

### 3.3 Compare Lower-Risk Conditions

Change only the demand probability to `W1`. Observe how the target estimate changes. Restore `W3` afterward.

This comparison matters: a reviewer must understand why each classification was selected. A high number without supporting evidence is not useful.

### Student Task 2: Speed Limitation

Create an assessment for this scenario:

> The AMR enters a constrained loading area where operators work close to the vehicle. A safety function limits travel speed while the AMR is inside the zone.

Choose C/F/P/W values, record the resulting target SIL estimate, and justify each selection in one sentence.

### Student Task 3: Challenge The Inputs

For the protective-stop example:

1. Identify one design change that could improve avoidance.
2. Identify one operating-zone change that could reduce exposure.
3. Reassess the function after one change.
4. Explain whether the target estimate changed and why.

## Module 4: FMEA And Safety Requirements

### 4.1 Working Example: Scanner Failure Mode

Open **FMEA worksheet** and add:

| Field | Value |
| --- | --- |
| Component | `SCAN · Safety scanner` |
| Failure mode | `Protective field intrusion not detected` |
| Potential effect | `AMR does not initiate protective stop when a pedestrian enters the path.` |
| Linked hazard | `H-AMR-01 · AMR collision with pedestrian` |
| Operational situation | `OS-AMR-01 · Shared aisle travel` |
| Severity | `9` |
| Occurrence | `2` |
| Detection | `3` |
| Recommended action | `Use diagnostic monitoring and validate protective fields for each route segment.` |

Expected result:

```text
RPN = 9 x 2 x 3 = 54
```

### 4.2 Working Example: Testable Requirement

Open **Safety requirements** and add:

| Field | Value |
| --- | --- |
| Identifier | `SR-AMR-01` |
| Requirement statement | `The AMR shall initiate a protective stop when an obstacle enters the configured protective field during automatic travel.` |
| Source hazard | `H-AMR-01 · AMR collision with pedestrian` |
| Allocated component | `SCAN · Safety scanner` |
| Verification method | `Measure stopping distance for defined payload, speed, floor, and route conditions.` |
| Verification status | `Planned` |

Notice the wording: a reviewer can design a test for it. Avoid requirements such as "the AMR shall be safe."

### Student Task 4: Requirement Quality

Rewrite these weak requirements so each is testable:

1. `The AMR shall stop quickly.`
2. `The AMR shall be safe at intersections.`
3. `The battery shall not cause problems.`

## Module 5: Capstone Assessment

### Scenario

A warehouse AMR transports loaded totes through a mixed-traffic area. Forklifts cross the AMR route near a blind corner. Operators may remove blocked totes manually. The AMR charges automatically during low-demand periods.

### Student Task 5: Complete Mini Analysis

Use Safeguard to create:

1. A PlantUML architecture with at least six components.
2. Five operational situations, including charging and jam recovery.
3. Five hazards, including collision, payload, and stored-energy hazards.
4. Three AMR SIL assessments for distinct safety functions.
5. Three FMEA rows linked to architecture components and catalogue entries.
6. Three testable safety requirements with verification methods.
7. A JSON export of the completed workspace.

### Review Checklist

Before submitting your work, confirm:

- Every SIL assessment names a safety function.
- Every SIL assessment links a hazard and operational situation.
- C/F/P/W choices have written rationale in your notes.
- Every FMEA row names a component-level failure mode.
- Every safety requirement can be tested or inspected.
- The exported JSON file opens and contains `silAssessments`, `fmea`, and `requirements`.

## Knowledge Check

Answer without using the answer key:

1. Why is SIL assigned to a safety function rather than vaguely to an AMR?
2. What is the difference between a hazard and a hazardous event?
3. Give two operating-zone factors that can affect AMR risk.
4. What evidence could validate a protective-stop function?
5. Why should jam recovery be analyzed separately from normal travel?
6. What does RPN prioritize in an FMEA?
7. Why is `The AMR shall be safe` not a good safety requirement?
8. Does the app's target SIL estimate prove compliance? Explain.

## Answer Key

Instructor guidance and model answers are kept separately in [`answer-key.md`](answer-key.md).
