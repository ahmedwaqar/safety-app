# EN 50126 Railway RAMS Practicum

This course introduces the application of the EN 50126 railway RAMS lifecycle through a worked metro platform screen door (PSD) control upgrade. It combines systems engineering, reliability, availability, maintainability, safety, evidence planning, and change control in Praxis Studio.

The completed training project is:

[`examples/metro-psd-rams.praxis.json`](examples/metro-psd-rams.praxis.json)

Allow **10 to 14 hours** for the complete practicum.

## Learning Outcomes

After completing the course, a learner should be able to:

1. Explain the relationship among reliability, availability, maintainability, and safety.
2. Define the System under Consideration, its boundaries, interfaces, operating context, and assumptions.
3. Tailor the EN 50126 lifecycle and identify phase objectives, responsibilities, deliverables, and review gates.
4. Build and maintain a hazard log with traceable safety requirements and controls.
5. Define measurable RAM requirements and apportion them to subsystems.
6. Use FMEA and quantitative reasoning to challenge architecture and maintenance assumptions.
7. Distinguish verification, validation, independent safety assessment, and acceptance.
8. Organize evidence into a safety argument without treating document completion as proof.
9. Plan operation, maintenance, performance monitoring, modification, and decommissioning activities.
10. Use Praxis Studio to preserve review notes, workflow evidence, architecture, hazards, analyses, and requirements in one project.

## Standards Baseline

The contractual standards baseline must be agreed for each real project. As of June 2026:

- [EN 50126-1:2017+A1:2024](https://www.nen.nl/en/nen-en-50126-1-2017-a1-2024-en-331535) defines the generic railway RAMS process.
- [EN 50126-2:2017+A1:2024](https://www.nen.nl/en/nen-en-50126-2-2017-a1-2024-en-331534) addresses the systems approach to safety.
- [IEC 62278-1:2025](https://webstore.iec.ch/en/publication/68933) and [IEC 62278-2:2025](https://webstore.iec.ch/en/publication/79793) are the current international counterparts.
- [EN 50716:2023](https://connect.nen.nl/Standard/Detail?name=NEN-EN+50716%3A2023+en) addresses railway software development for signalling and rolling-stock applications.
- [IEC 62425:2025](https://webstore.iec.ch/en/publication/68909) addresses safety-related electronic systems for railway signalling.

This training summarizes engineering concepts and does not reproduce the standards. It does not establish compliance, certification, authorization, or competence. Use purchased standards, applicable law, contractual requirements, railway authority processes, and competent independent reviewers.

## Terminology Note

EN 50126 is a European Standard. IEC 62278 is the international RAMS series. The phrase “IEC EN 50126” is commonly used informally, but a project should cite the exact adopted standard and amendment in its standards register.

## Scenario

A metro operator is replacing the platform screen door control system at an existing underground station. The doors must coordinate with train position, train doors, signalling permission, and station operations.

The upgrade includes:

- Central PSD controller
- Platform door control units
- Door position and obstacle detection
- Train berth-detection interface
- Signalling and automatic train operation interface
- Local control panel
- Operations control centre interface
- Maintenance terminal and event recorder
- Normal and backed-up power supplies
- Existing mechanical doors and platform structure

The project must maintain passenger service during staged installation. Existing trains, signalling, station procedures, and mechanical door assets remain partly unchanged.

## Setup

1. Start Praxis Studio with `bun server.js`.
2. Open `http://localhost:8080`.
3. Select **File > Open**.
4. Open `training/examples/metro-psd-rams.praxis.json`.
5. Confirm that **Metro PSD EN 50126 Training** appears in the workspace selector.
6. Select **File > Save** to create a personal checkpoint before editing.

Use **Open in new tab** when comparing the baseline with your working project. Closing a workspace affects only the current tab; deleting removes stored project data.

## Module 1: RAMS Foundations

**Estimated time:** 60 minutes

### 1.1 RAMS Is A System Property

| Dimension | Working question | PSD example |
| --- | --- | --- |
| Reliability | How consistently does the system perform its required function? | Door control completes demanded cycles without failure |
| Availability | Is the required service available when needed? | Platform remains available for passenger service |
| Maintainability | Can faults be diagnosed and restored within the required time? | A failed door module is isolated and replaced quickly |
| Safety | Is unacceptable risk controlled throughout the lifecycle? | Train departure is prevented when the platform interface is unsafe |

These dimensions interact. A fail-safe response may stop service and reduce availability. A degraded mode may improve availability while introducing operational hazards. RAMS engineering makes these trade-offs explicit.

### 1.2 Exercise: Review The Seeded Engineering Note

Open **Engineering notes**.

1. Review the assumptions table.
2. Add one reliability, availability, maintainability, and safety concern.
3. Assign an owner and evidence need to each concern.
4. Insert the equation:

```text
Intrinsic availability = MTBF / (MTBF + MTTR)
```

5. Link the note to **Architecture** and **Engineering workflow**.

### 1.3 Exercise: Classify Statements

Classify each statement as a need, requirement, assumption, hazard, control, or evidence:

1. Peak service shall continue with one isolated door leaf.
2. Existing door mechanics are suitable for ten more years.
3. A train departs while a door is open.
4. Departure permission is inhibited unless the platform is proved secure.
5. Endurance-test report for 500,000 cycles.

## Module 2: Lifecycle Tailoring And RAMS Management

**Estimated time:** 75 minutes

EN 50126-1 uses a 12-phase lifecycle:

1. Concept
2. System definition and operational context
3. Risk analysis and evaluation
4. Specification of system requirements
5. Architecture and apportionment
6. Design and implementation
7. Manufacture
8. Integration
9. System validation
10. System acceptance
11. Operation, maintenance, and performance monitoring
12. Decommissioning

Tailoring changes the depth, sequencing, and evidence, not the obligation to control omitted work.

### 2.1 Exercise: Inspect The Workflow

Open **Engineering workflow** and review the 12 seeded activities.

For each activity, identify:

- Responsible organization and owner
- Inputs and outputs
- RAMS checkpoint
- Planned evidence
- Verification or validation responsibility
- Independence requirement

### 2.2 Exercise: Write A Tailoring Decision

In Engineering notes, create a table with:

| Lifecycle phase | Tailoring decision | Justification | Compensating control | Approver |
| --- | --- | --- | --- | --- |

Add decisions for:

- Existing mechanical doors reused without redesign
- Factory manufacture limited to controller cabinets and door modules
- Staged integration during engineering hours
- Reuse of an existing generic controller platform

### 2.3 Review Gate

Do not mark the concept activity complete until the project has:

- A defined RAMS policy and plan
- Named roles and interfaces
- Competence expectations
- Evidence and configuration strategy
- Independent review strategy
- Agreed lifecycle tailoring

## Module 3: System Definition And Operational Context

**Estimated time:** 90 minutes

### 3.1 Exercise: Challenge The Boundary

Open **Architecture** and render the diagram.

Identify:

- System under Consideration
- External systems
- Human actors
- Physical, functional, data, power, and organizational interfaces
- Existing assets being reused
- Assumptions supplied by other projects

Discuss whether the train, signalling interlocking, platform, passengers, operator, and maintenance organization are inside the system boundary or part of its environment.

### 3.2 Exercise: Review Operational Situations

Open **Operational situations** and review the seeded entries.

Add:

| Field | Value |
| --- | --- |
| Identifier | `OS-09` |
| Name | `Emergency evacuation with traction power isolated` |
| Description | `Passengers and responders use the platform while normal train and PSD control functions are unavailable.` |

For every situation, record:

- Intended service
- Degraded modes
- Foreseeable misuse
- Maintenance state
- Environmental conditions
- People and organizations involved
- Entry and exit conditions

### 3.3 Deliverable

Update workflow activity **Define system and operational context** with evidence references for:

- System definition
- Interface register
- Operating concept
- Assumption register
- Existing-system constraints

## Module 4: Risk Analysis And Hazard Control

**Estimated time:** 120 minutes

### 4.1 Hazard Log Principles

A useful hazard record has:

- Unique identifier
- Hazardous condition and credible consequence
- Relevant operational context
- Cause and initiating events
- Existing and proposed controls
- Owner
- Status and acceptance rationale
- Links to requirements, verification, and residual risk

Praxis Studio separates the hazard catalogue from failure modes and requirements. Use Engineering notes for workshop observations that are not yet controlled records.

### 4.2 Exercise: Hazard Workshop

Open **Hazard catalogue** and review the seeded hazards.

Add one hazard concerning:

- Crowd behaviour
- Fire or smoke
- Electrical isolation
- Incorrect degraded-mode instruction

Then open Engineering notes and create a review table containing `Observation`, `Hazard candidate`, `Situation`, `Decision`, `Owner`, and `Evidence`.

### 4.3 Exercise: Promote A Failure Draft

The seeded FMEA draft concerns loss of train-berth information.

1. Confirm the component, hazard, and situation identifiers.
2. Select **Clean up table**.
3. Correct any invalid reference.
4. Select **Import cleaned rows**.
5. Open **FMEA worksheet** and confirm that the row appears once.

Cleanup normalizes structure; it does not approve the engineering conclusion.

### 4.4 Risk Acceptance

For each major hazard, record which acceptance principle and organizational process apply. Do not invent a universal risk matrix or claim that an RPN proves tolerability. The accepted method may rely on codes of practice, comparison with a reference system, explicit risk estimation, or a combination under applicable railway regulation and project governance.

## Module 5: RAMS Requirements And Apportionment

**Estimated time:** 120 minutes

### 5.1 Define Measurable RAM Requirements

Use Engineering notes to draft:

| Attribute | Example project-level measure |
| --- | --- |
| Reliability | Mean cycles between service-affecting PSD failures |
| Availability | Platform PSD service availability during traffic hours |
| Maintainability | Mean time to restore one failed door control unit |
| Safety | Hazard controls and integrity requirements for departure permission |

Calculate:

```text
If MTBF = 8,000 h and MTTR = 2 h:
Availability = 8,000 / (8,000 + 2) = 0.999750
```

Explain why operational availability may be lower after logistics delay, access time, fault detection, and administrative delay are included.

### 5.2 Exercise: Review Safety Requirements

Open **Safety requirements**.

For each seeded requirement, check:

- Traceable source hazard
- Defined operating condition
- Observable behavior
- Allocated component
- Timing or performance criterion where needed
- Degraded and fault response
- Verification method

### 5.3 Exercise: Apportion Requirements

Choose the project-level requirement:

> Train departure permission shall not be issued unless all platform openings are closed and locked, or an authorized degraded-mode process provides an equivalent controlled condition.

Apportion it across:

- Door control units
- Central PSD controller
- Train detection
- Signalling interface
- Local indication and controls
- Operating procedure

Record interface assumptions and avoid allocating a complete system requirement to one component without considering the end-to-end function.

### 5.4 SIL Caution

EN 50126-2 provides methods for deriving safety integrity requirements and SILs for safety-related electronic functions. The Praxis Studio **AMR SIL assessment** is a generic training risk graph and is not the EN 50126-2 allocation method. Use it only to discuss assumptions; do not use its output as formal railway SIL evidence.

## Module 6: Architecture, Failure Analysis, And Maintainability

**Estimated time:** 120 minutes

### 6.1 Exercise: Review FMEA

Open **FMEA worksheet** and review:

- Loss of door-closed detection
- Controller output stuck energized
- Obstacle detection unavailable
- Local bypass left active
- Loss of backed-up power

For each row, ask:

1. Is the failure mode stated at component level?
2. Is the end effect linked to the system function?
3. Can one cause defeat multiple controls?
4. Is the fault detectable within the required time?
5. Does the recommended action improve design, diagnostics, maintenance, or evidence?

### 6.2 Exercise: Maintainability Design

Propose a maintenance concept covering:

- Fault localization
- Replaceable units
- Safe isolation
- Access constraints
- Spares and logistics
- Restoration test
- Configuration control
- Maximum restoration time
- Competence and authorization

Add a requirement for post-replacement functional testing before the door returns to service.

### 6.3 Exercise: Availability Trade-Off

Compare:

1. Fail the complete platform on any single door fault.
2. Isolate one door leaf and operate under a controlled degraded mode.

Assess safety, service availability, passenger flow, human error, maintenance exposure, and evidence needs. Record the decision in Engineering notes and the selected controls in Safety requirements.

## Module 7: Verification, Validation, Safety Demonstration, And Acceptance

**Estimated time:** 120 minutes

### 7.1 Distinguish The Activities

| Activity | Core question |
| --- | --- |
| Verification | Did the output correctly satisfy its input requirements? |
| Validation | Does the integrated system satisfy intended use and RAMS requirements in its operational context? |
| Independent safety assessment | Has the safety process and evidence been examined with the required independence? |
| Acceptance | Has the authorized stakeholder accepted the system for the defined application and conditions? |

### 7.2 Exercise: Evidence Matrix

Create a table in Engineering notes with:

| Requirement | Verification method | Validation scenario | Evidence | Owner | Independence |
| --- | --- | --- | --- | --- | --- |

Include:

- Normal train alignment
- Train misalignment
- One door obstructed
- Loss of train-berth information
- Loss and restoration of power
- Communications timeout
- Maintenance bypass
- Degraded operation

### 7.3 Safety Case Structure

Draft a safety argument with:

1. System definition and application constraints
2. Quality and safety management evidence
3. Hazard and risk-control argument
4. Requirements and architecture traceability
5. Verification and validation results
6. Competence and independence evidence
7. Configuration and change status
8. Residual risks, assumptions, and operating restrictions

A safety case is an argued body of evidence. It is not a folder made credible by its size.

### 7.4 Review Gate

Mark **Validate integrated RAMS performance** complete only when:

- Acceptance criteria are defined
- Tests represent operational and degraded contexts
- Results are configuration controlled
- Failures and deviations are resolved or formally dispositioned
- Assumptions are validated
- Required independent review is complete

## Module 8: Operation, Monitoring, Modification, And Decommissioning

**Estimated time:** 90 minutes

### 8.1 Performance Monitoring

Define operational indicators for:

- Service-affecting failures
- Door isolation events
- False obstacle detections
- Mean restoration time
- Repeat failures
- Bypass use and duration
- Hazardous incidents and precursors
- Requirement or assumption violations

State trigger levels for investigation and who owns the response.

### 8.2 Change Scenario

The operator proposes:

- Shorter dwell time
- A new rolling-stock type
- Remote maintenance access
- A cheaper obstacle sensor
- Reduced overnight maintenance staffing

Perform impact analysis covering:

- System definition and interfaces
- Hazards and risk acceptance
- RAM requirements
- Safety integrity allocation
- Software and configuration
- Human factors and procedures
- Verification, validation, and independent assessment
- Existing acceptance and safety-case claims

### 8.3 Decommissioning

Plan for:

- Safe removal and isolation
- Temporary operating arrangements
- Data and event-record retention
- Configuration archive
- Disposal and environmental constraints
- Hazards introduced by partial removal
- Transfer of residual responsibilities

## Capstone: RAMS Readiness Review

Prepare a handover containing:

1. Approved system definition and interface register.
2. Tailored 12-phase lifecycle and RAMS plan.
3. At least nine operational situations.
4. At least eight hazards with owners and controls.
5. Measurable reliability, availability, and maintainability requirements.
6. Traceable safety requirements and allocation.
7. At least six FMEA rows.
8. Verification and validation evidence matrix.
9. Safety-case outline with open claims and evidence.
10. Operation and performance-monitoring plan.
11. Change-impact assessment.
12. Exported `.praxis.json` project that reopens successfully.

## Peer Review Questions

1. Is the System under Consideration unambiguous?
2. Which assumptions are owned outside the project?
3. Where do RAM and safety objectives conflict?
4. Which requirement is hardest to validate in the real operating context?
5. Which single failure or common cause can defeat multiple controls?
6. What degraded modes depend heavily on human action?
7. Which evidence is generic and which is specific to this application?
8. Are verification, validation, assessment, and acceptance responsibilities independent enough?
9. What operational data could invalidate a RAMS assumption?
10. Which proposed change would reopen the largest part of the safety argument?

## Completion Standard

The learner has completed the practicum when they can explain and defend the trace from operational need through system definition, hazards, RAMS requirements, architecture, implementation evidence, validation, acceptance, operation, and change control.

The instructor guidance is in [`en-50126-answer-key.md`](en-50126-answer-key.md).
