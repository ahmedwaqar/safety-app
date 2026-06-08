# EN 50126 Railway RAMS Practicum Answer Key

Use this guide after the learner completes the exercises. Many answers depend on the railway application, contractual baseline, risk acceptance method, and organizations involved. Assess reasoning, traceability, ownership, and evidence quality.

## Module 1: RAMS Foundations

### Statement Classification

| Statement | Classification |
| --- | --- |
| Peak service shall continue with one isolated door leaf | Stakeholder need until made measurable and approved as a requirement |
| Existing door mechanics are suitable for ten more years | Assumption requiring condition and life evidence |
| A train departs while a door is open | Hazardous event or accident scenario |
| Departure permission is inhibited unless the platform is proved secure | Risk-control concept that should be developed into allocated requirements |
| Endurance-test report for 500,000 cycles | Evidence, provided configuration and acceptance criteria are identified |

The availability calculation with `MTBF = 8,000 h` and `MTTR = 2 h` is approximately `99.975%`. It is intrinsic availability and excludes many operational delays.

## Module 2: Lifecycle Tailoring

A defensible tailoring record:

- States what is tailored and why.
- Identifies affected lifecycle objectives and deliverables.
- Preserves traceability and configuration control.
- Introduces compensating reviews or evidence where work is reused.
- Is approved by authorized roles.

Reusing mechanical doors does not remove lifecycle work. It shifts emphasis toward condition assessment, interface validation, previous-use evidence, assumptions, and application constraints.

## Module 3: System Definition

A good boundary discussion recognizes that:

- The PSD control system may be the System under Consideration.
- Trains, signalling, station operations, passengers, power, and maintenance organizations can be external systems or actors with controlled interfaces.
- Existing mechanical doors may be inside the system even when they are not redesigned.
- Organizational interfaces are as important as electrical and data interfaces.
- Assumptions supplied by another party need owners, evidence, and change notification.

The emergency-evacuation situation should consider loss of normal control, responder access, passenger flow, manual release, communication, lighting, smoke, traction isolation, and restoration.

## Module 4: Hazard Control

Good additional hazards include:

- Crowd pressure prevents safe door movement or evacuation.
- Smoke requires doors to adopt a state inconsistent with normal train-interface logic.
- Incorrect electrical isolation exposes maintainers.
- A degraded-mode instruction permits train dispatch with an uncontrolled opening.

The seeded train-berth failure draft is valid when:

- Component `BERTH`, hazard `H-01`, and situation `OS-01` remain valid.
- The failure mode explains loss or corruption of berth information.
- The effect addresses unsafe door enablement or loss of service.
- The action addresses plausibility, timeout, independent confirmation, or controlled fallback.

RPN is a prioritization aid in this app. It is not a railway risk acceptance criterion.

## Module 5: Requirements And Apportionment

A project-level availability target should define:

- Service boundary
- Measurement period
- Included and excluded downtime
- Degraded service rules
- Failure counting rules
- Data source
- Demonstration period
- Confidence or acceptance method

The departure-permission function should be apportioned end to end. A reasonable decomposition includes:

- Door units prove individual closed and locked state.
- Central controller combines valid door states and detects inconsistency.
- Train-berth input prevents enablement for an absent or misaligned train.
- Signalling interface accepts only valid, timely, fail-safe status.
- Local controls cannot bypass protection without authorization and indication.
- Procedure controls exceptional degraded operation.

The Praxis Studio risk graph output is not formal EN 50126-2 SIL derivation evidence.

## Module 6: Architecture And Maintainability

A strong maintainability concept includes safe access, diagnostic coverage, fault localization, replaceable-unit strategy, spares, tools, competence, restoration test, configuration control, and measured restoration time.

For the degraded-mode trade-off:

- Full-platform shutdown is simpler and can be safer, but may create crowding and network disruption.
- Single-door isolation can improve service availability, but requires physical barriers, passenger management, indication, dispatch controls, time limits, and disciplined restoration.
- The correct decision depends on the complete operational risk, not availability alone.

## Module 7: Assurance And Acceptance

Examples:

- Reviewing a design against its allocated requirements is verification.
- Testing train alignment, passenger flow, faults, and degraded modes at the station is validation.
- An independent body reviewing process and safety evidence is assessment.
- The authorized railway stakeholder allowing operation under defined constraints is acceptance.

A credible safety-case outline links claims to evidence and exposes limitations. Open actions, assumptions, deviations, and application constraints must remain visible.

## Module 8: Operation And Change

Useful monitoring triggers include:

- Repeat door isolation above an agreed rate
- Restoration time exceeding the maintainability requirement
- Increase in false obstacle detections
- Bypass active beyond its permitted duration
- Failure trend inconsistent with reliability demonstration
- New rolling-stock interface mismatch
- Incident or precursor invalidating a hazard assumption

The new rolling-stock type likely affects berth detection, alignment tolerances, door geometry, interface timing, operational situations, validation, and acceptance. The cheaper sensor affects failure data, diagnostics, environmental capability, maintenance, requirements, FMEA, and possibly integrity allocation. Remote maintenance also requires cybersecurity analysis and controlled safety impact assessment.

## Capstone Review

A satisfactory project:

- Defines scope and interfaces before claiming risk control.
- Treats RAM and safety as interacting system properties.
- Uses measurable requirements with clear counting and acceptance rules.
- Links hazards to controls, requirements, architecture, and evidence.
- Distinguishes generic product evidence from application-specific validation.
- Records independence, competence, configuration, and acceptance responsibilities.
- Includes operation, monitoring, modification, and decommissioning.
- Reopens successfully as a portable Praxis Studio project.

Do not reward a large document set, high SIL, or low calculated failure rate without credible assumptions and evidence.
