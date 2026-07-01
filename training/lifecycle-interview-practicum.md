# Critical Systems Lifecycle Interview Practicum

This practicum is a compressed simulation of full-lifecycle engineering work for safety-critical and high-assurance systems. It is designed to help an engineer answer experience-based interview questions with concrete decisions, trade-offs, evidence, and lessons learned.

It cannot replace years of responsibility on real projects. It can give you deliberate practice with the reasoning patterns experienced interviewers look for: defining uncertainty, finding the real system boundary, controlling interfaces, making risk-informed design decisions, handling failed tests, resisting schedule pressure, and defending release decisions.

Use either completed AsasBits Studio project:

- [`examples/palletizing-cell.asasbits.json`](examples/palletizing-cell.asasbits.json) for machinery and robotics
- [`examples/metro-psd-rams.asasbits.json`](examples/metro-psd-rams.asasbits.json) for railway RAMS

Model answers and interviewer probes are in [`lifecycle-interview-answer-key.md`](lifecycle-interview-answer-key.md).
Capture your rehearsed examples in the [`Engineering Interview Story Workbook`](interview-story-workbook.md).

## Outcomes

After completing the practicum, you should be able to:

1. Explain the lifecycle as a connected decision system rather than a document sequence.
2. Give specific examples of requirements, architecture, risk, V&V, configuration, and change decisions.
3. Distinguish facts, assumptions, estimates, evidence, and acceptance decisions.
4. Describe a failed test or review finding without hiding uncertainty or blaming another discipline.
5. Explain how you determine regression scope after a change.
6. Defend a release, restricted release, or no-release decision.
7. Discuss independence, competence, interfaces, supplier evidence, and organizational pressure.
8. Answer follow-up questions at system, subsystem, component, and operational levels.
9. State honestly what you decided in the simulation versus what you have done professionally.

## Interview Integrity

Do not present this exercise as employment experience.

A credible interview statement is:

> I have not yet owned that decision on a production program. To prepare, I completed a full lifecycle simulation for a robotic cell, including hazard analysis, requirements, interface control, V&V, a failed validation test, change impact, and a release review. My approach was...

That answer demonstrates initiative and judgment without inventing experience.

## How To Practice

For every scenario, produce four outputs:

1. **Project record:** Update the relevant AsasBits Studio artifacts.
2. **Decision memo:** Write five to ten sentences in Engineering notes.
3. **Spoken answer:** Explain the situation in 90 seconds without reading.
4. **Challenge round:** Answer the listed follow-up questions in 30 seconds each.

Record yourself. On playback, remove:

- Unsupported claims
- Excessive standards names
- Long background before the decision
- Statements that confuse activity with evidence
- Claims that safety was someone else's responsibility

## The Experienced-Answer Structure

Use this structure for experience questions:

| Step | What to explain |
| --- | --- |
| Context | System, lifecycle phase, operational consequence, and your role |
| Problem | The uncertainty, conflict, failure, or decision that mattered |
| Constraints | Safety, performance, schedule, interfaces, evidence, and authority |
| Method | How you structured the work and involved the right people |
| Decision | What you recommended or decided, including rejected alternatives |
| Evidence | What made the decision defensible |
| Outcome | What changed, what remained open, and who accepted residual risk |
| Learning | What you would repeat or improve |

This is stronger than a generic STAR answer because it exposes engineering judgment and evidence.

## Two-Week Schedule

| Day | Simulation |
| --- | --- |
| 1 | Lifecycle map, role, standards, and governance |
| 2 | System definition, interfaces, assumptions, and intended use |
| 3 | Hazard analysis and risk-reduction strategy |
| 4 | Architecture trade-off and safety-function definition |
| 5 | Requirements, allocation, and traceability |
| 6 | FMEA, FMEDA, common cause, and supplier evidence |
| 7 | Design review and baseline |
| 8 | Integration, commissioning, and configuration mismatch |
| 9 | Verification, validation, failed test, and deviation |
| 10 | Release review under schedule pressure |
| 11 | Operational incident and corrective action |
| 12 | Change impact and regression strategy |
| 13 | Safety-case or assurance argument |
| 14 | Mock interview and retrospective |

For an interview within a few days, complete simulations 1, 3, 5, 7, 8, 9, and 12.

## Simulation 1: Lifecycle Strategy And Governance

### Situation

The project manager says:

> We already have a supplier risk assessment and certified components. Can we shorten the safety lifecycle and start implementation?

### Your Work

1. Open **Engineering workflow**.
2. Define which activities can reuse supplier work and which remain application specific.
3. Add predecessor gates from system definition through validation and release.
4. Record roles for engineering, validation, approval, and independent review.
5. Add a review record for lifecycle tailoring.
6. State what authority can approve the tailoring decision.

### Decision Memo

Explain:

- Why certified components do not certify the integrated application
- Which supplier evidence may be reused
- Which assumptions must be validated
- What compensating controls apply to tailored activities
- What would make you stop implementation

### Interview Question

**Tell me how you plan a safety-critical development lifecycle.**

### Challenge Round

1. What do you tailor when schedule is limited?
2. Who owns safety?
3. What must be independent?
4. How do you prevent the lifecycle from becoming bureaucracy?
5. What is your evidence that a gate is complete?

## Simulation 2: System Boundary And Interface Failure

### Situation

The mechanical team says the pallet and forklift are outside the robotic-cell boundary. Operations says they are part of normal production. No one owns pallet quality.

For the railway variant, the supplier says train berth data is an external input and therefore outside the PSD safety argument.

### Your Work

1. Update **Architecture** and the **Interface control** records.
2. Identify functional, physical, data, energy, human, and organizational interfaces.
3. Add assumptions with owners and evidence needs.
4. Add an operational situation for degraded or invalid external input.
5. Update the affected hazards and requirements.
6. Define the system response when an external assumption is violated.

### Decision Memo

Answer:

- What is inside the System under Consideration?
- What remains external but safety relevant?
- Who verifies each interface assumption?
- How are interface changes communicated?
- What is the fail-safe or controlled response to invalid input?

### Interview Question

**Describe a time you discovered that the real system boundary was larger than initially assumed.**

### Challenge Round

1. Why not simply put everything inside the boundary?
2. Can an external system carry a safety requirement?
3. How do contracts affect interface assurance?
4. What happens if the external party will not provide evidence?

## Simulation 3: Hazard Analysis Under Ambiguity

### Situation

A maintenance technician reports:

> Sometimes we stand near the pallet opening to watch the scanner lights during troubleshooting.

No incident has occurred. The project manager calls it an informal observation.

### Your Work

1. Capture the raw observation in **Engineering notes**.
2. Create or update the operational situation.
3. Develop the event sequence from task through potential harm.
4. Update the hazard log with owner, control strategy, residual-risk question, and status.
5. Identify whether the issue changes exposure, avoidance, foreseeable misuse, or maintenance design.
6. Record one design control, one diagnostic control, and one procedural control.

### Decision Memo

Explain why you did or did not promote the observation into controlled analysis.

### Interview Question

**How do you run a hazard analysis when information is incomplete?**

### Challenge Round

1. How do you avoid turning every concern into a hazard?
2. How do you involve operators without letting anecdotes drive the design?
3. What is the difference between a hazard, cause, failure mode, and hazardous event?
4. When can a hazard be closed?

## Simulation 4: Architecture Trade-Off

### Situation

Two concepts are proposed:

- **Concept A:** One high-integrity scanner with diagnostics
- **Concept B:** Two sensing channels using different technologies, but sharing power, mounting, and configuration tools

Concept B costs more and appears redundant.

### Your Work

1. Model both concepts in **Architecture** or Engineering notes.
2. Compare independence, common causes, diagnostics, response time, maintainability, and proof testing.
3. Update FMEA or FMEDA for at least one common-cause failure.
4. Record the selected concept and rejected alternative in a design review.
5. Identify evidence needed before the architecture can be accepted.

### Interview Question

**Tell me about an architecture trade-off involving safety, reliability, or availability.**

### Challenge Round

1. Why is redundancy not automatically safer?
2. What common causes concern you?
3. When would diversity help?
4. How do diagnostics affect the safe state?
5. What performance trade-off did you accept?

## Simulation 5: Requirements And Traceability Breakdown

### Situation

The requirements review finds:

- `The machine shall stop safely.`
- A timing value appears in a test procedure but not the requirement.
- A software requirement has no source hazard.
- Two requirements conflict during degraded operation.

### Your Work

1. Rewrite the weak requirement with conditions, behavior, timing, safe state, and reset response.
2. Allocate each requirement to architecture components and interfaces.
3. Link requirements to source hazards.
4. Create V&V records and expected evidence.
5. Use the traceability matrix to identify coverage gaps.
6. Record the conflict and resolution in a requirements review.

### Interview Question

**How do you know a safety requirement is good enough?**

### Challenge Round

1. Who owns a requirement allocated across multiple subsystems?
2. What makes a requirement verifiable?
3. How do you manage derived requirements?
4. How do you handle conflicting requirements?
5. Is one test per requirement sufficient?

## Simulation 6: Supplier Evidence And FMEDA Challenge

### Situation

The supplier provides a failure rate and diagnostic coverage but will not disclose the failure-mode distribution. Marketing material calls the device SIL capable.

### Your Work

1. Identify which FMEDA constants are facts, assumptions, or placeholders.
2. Record evidence references and limitations.
3. Run sensitivity cases for diagnostic coverage and common-cause beta.
4. Identify application-specific failures not covered by generic product data.
5. Create a supplier evidence review with a decision and actions.
6. State whether the current evidence supports architecture selection, final verification, or neither.

### Interview Question

**How do you use supplier safety evidence without accepting it blindly?**

### Challenge Round

1. What does SIL capability mean?
2. Can a certificate replace application validation?
3. What do you do when detailed failure data is unavailable?
4. How do environmental assumptions enter FMEDA?
5. Which sensitivity result would change your design?

## Simulation 7: Design Review And Baseline

### Situation

The team wants to release drawings while three actions remain:

- Reset location visibility is not confirmed.
- Pneumatic isolation labeling is incomplete.
- Scanner mounting tolerance is not documented.

### Your Work

1. Create a design review with entry criteria, participants, findings, and decision.
2. Classify each action by safety significance and owner.
3. Decide whether the design baseline can be approved, approved with conditions, or rejected.
4. Create or update the baseline and configuration inventory.
5. Define what changes require reopening the review.

### Interview Question

**Describe how you conduct a design review and decide whether to baseline the design.**

### Challenge Round

1. Can a baseline contain open actions?
2. What makes a review independent enough?
3. How do you distinguish a comment from a blocking finding?
4. What exactly is under configuration control?

## Simulation 8: Integration And Configuration Mismatch

### Situation

During commissioning, the safety PLC checksum differs from the released configuration. The controls engineer says the change only adjusted a debounce timer and asks to continue testing.

### Your Work

1. Stop and preserve the observed configuration.
2. Create a deviation and a change-impact record.
3. Identify affected requirements, hazards, interfaces, analyses, and tests.
4. Compare the as-built configuration with the approved baseline.
5. Define review, regression, and approval needed before testing resumes.
6. Record how temporary equipment or bypasses are controlled.

### Interview Question

**Tell me about a configuration problem found during integration.**

### Challenge Round

1. Why stop if the change appears minor?
2. Who can approve the change?
3. Which tests must be repeated?
4. How do you preserve evidence already collected?
5. What if reverting is more dangerous than continuing?

## Simulation 9: Failed Validation Test

### Situation

During `VT-02`, a person-sized test object can pass beside a pallet while muting remains active. Production launch is in two days.

### Your Work

1. Set the V&V result to **Failed** and link a deviation.
2. Preserve the exact configuration, test method, actual result, and evidence.
3. Identify immediate containment.
4. Perform causal analysis across requirements, architecture, assumptions, configuration, and test coverage.
5. Define corrective design options and regression scope.
6. Update affected hazards, claims, reviews, and release readiness.
7. Decide whether any restricted operation is defensible.

### Interview Question

**Describe a failed test and how you handled it.**

### Challenge Round

1. Was the failure caused by the product or a poor requirement?
2. Who did you inform first?
3. How did you avoid fixing only the observed test case?
4. Could procedure alone control the issue?
5. What evidence was invalidated?
6. What allowed the deviation to close?

## Simulation 10: Release Pressure

### Situation

Management requests release with:

- One failed validation test
- Two open high-severity deviations
- Incomplete operator training
- An approved component certificate
- A customer penalty for delay

### Your Work

1. Conduct a release review.
2. Separate technical readiness from business pressure.
3. Identify blocking conditions and possible restricted-release conditions.
4. State who has authority to accept residual risk.
5. Record the decision, evidence, limitations, and required follow-up.
6. Confirm that unsupported claims remain unsupported.

### Interview Question

**Have you ever disagreed with management about release readiness?**

### Challenge Round

1. Are you being too conservative?
2. What is the quantified risk?
3. Could the customer accept the deviation?
4. What temporary controls would you consider?
5. How would you communicate the decision without becoming adversarial?

## Simulation 11: Operational Incident

### Situation

Three months after release, event logs show repeated protective stops followed by quick operator resets. One shift reports tying a reflective marker near the scanner to reduce nuisance trips.

### Your Work

1. Record the event as operational evidence and an issue.
2. Define immediate containment and reporting.
3. Investigate technical, human, environmental, maintenance, and production causes.
4. Check whether hazard assumptions and foreseeable misuse remain valid.
5. Identify corrective action, effectiveness checks, and monitoring indicators.
6. Assess whether the safety case, training, requirements, or design must change.

### Interview Question

**How would you investigate a safety-related field issue?**

### Challenge Round

1. Is operator bypass the root cause?
2. How do you preserve a just culture?
3. When do you stop production?
4. How do you prove corrective action is effective?
5. What would trigger fleet- or site-wide action?

## Simulation 12: Major Change And Regression

### Situation

The robotic cell receives a 20 kg carton, 15% speed increase, taller pallet, and changed recipe.

Railway variant: a new rolling-stock type, shorter dwell time, remote maintenance, and cheaper obstacle sensor are proposed together.

### Your Work

1. Update the change-impact record.
2. Identify affected system definition, interfaces, hazards, requirements, architecture, FMEA/FMEDA, RAM objectives, procedures, and claims.
3. Distinguish direct, indirect, and potentially unaffected artifacts.
4. Define analysis, inspection, test, validation, review, and acceptance regression.
5. Establish the target baseline.
6. Decide whether changes should be separated to preserve diagnosability and evidence.

### Interview Question

**How do you determine regression scope after a safety-relevant change?**

### Challenge Round

1. Why not rerun every test?
2. How do you justify not rerunning a test?
3. What if several changes interact?
4. Which assumptions are most likely invalidated?
5. When does a change become a new system?

## Simulation 13: Assurance Argument

### Situation

The project has many reports, but the assessor says:

> I cannot see why this evidence proves the system is acceptably safe for this application.

### Your Work

1. Create a top-level safety or assurance claim.
2. Decompose it into system definition, hazard control, design integrity, V&V, configuration, competence, and operational-control claims.
3. Link approved evidence.
4. Mark unsupported claims honestly.
5. Record assumptions, limitations, residual risks, and operating restrictions.
6. Explain how a future change affects the argument.

### Interview Question

**What is a safety case, and how do you know it is credible?**

### Challenge Round

1. Is a traceability matrix a safety case?
2. Can a claim be supported by one report?
3. What makes evidence relevant?
4. How do you handle contradictory evidence?
5. Who accepts the final argument?

## Simulation 14: Final Mock Interview

Ask another person to select ten questions without showing them to you first.

### Core Questions

1. Walk me through the lifecycle of a safety-critical system you analyzed.
2. How do you define system boundaries and interfaces?
3. How do you identify and close hazards?
4. Describe an architecture decision with competing safety and performance needs.
5. How do you derive and review safety requirements?
6. How do verification and validation differ?
7. Tell me about a failed test.
8. How do you manage configuration and baselines?
9. How do you decide release readiness?
10. How do you assess change impact and regression scope?
11. How do you handle supplier evidence?
12. How do you investigate a field incident?
13. What role does independence play?
14. How do you build a safety or assurance case?
15. What engineering mistake have you made in this simulation?

### Behavioral Questions

1. Tell me about a disagreement with another discipline.
2. Describe a time you had insufficient information.
3. Tell me about a decision you escalated.
4. Describe how you communicated bad news.
5. Tell me about a trade-off you rejected.
6. Describe a review where your work was challenged.
7. Tell me about a time your initial assumption was wrong.
8. How do you prioritize when everything appears safety critical?

### Interviewer Red Flags To Avoid

- “Safety was handled by the safety team.”
- “The component was certified, so integration was safe.”
- “The test passed, so the requirement was complete.”
- “We reduced the risk score until it was acceptable.”
- “We reran all tests” without explaining impact analysis.
- “Management accepted the risk” without defining authority and evidence.
- “There were no failures.”
- Claiming professional ownership you did not have.

## Scoring Rubric

Score each answer from `0` to `4`.

| Dimension | 0 | 2 | 4 |
| --- | --- | --- | --- |
| System thinking | Isolated component answer | Mentions interfaces | Connects lifecycle, people, interfaces, and operations |
| Decision clarity | No decision | Decision stated | Alternatives, authority, and conditions are explicit |
| Evidence | Opinion only | Names a document or test | Explains relevance, configuration, acceptance criteria, and limitations |
| Risk reasoning | Uses labels only | Identifies hazard and control | Explains event sequence, assumptions, hierarchy of controls, and residual risk |
| Traceability | No links | Links some artifacts | Traces need through hazard, design, requirement, V&V, and claim |
| Change control | Treats change locally | Identifies affected tests | Assesses indirect effects, baseline, regression, and acceptance |
| Communication | Vague or defensive | Understandable | Concise, transparent, escalates appropriately, and handles disagreement |
| Learning | No reflection | Generic lesson | Identifies a specific changed practice |

Target:

- `18/32`: credible junior answer
- `24/32`: strong engineer answer
- `28/32`: experienced reasoning, provided it matches your real level of authority

## Experience Portfolio

Prepare these artifacts before the interview:

1. One-page lifecycle map.
2. System boundary and interface diagram.
3. One hazard event sequence.
4. One architecture trade study.
5. One requirement-to-evidence trace.
6. One failed-test and deviation story.
7. One change-impact and regression matrix.
8. One release recommendation.
9. One assurance-claim decomposition.
10. A list of three lessons that changed your engineering approach.

Do not share confidential employer information. The included training scenarios are suitable for discussion because they are synthetic.

## Completion Standard

You are ready for the interview when you can:

- Answer each core question in 90 seconds and survive three follow-ups.
- Explain what you know, what you assumed, and what evidence you would seek.
- Defend a no-release decision calmly.
- Admit where your simulation differs from professional experience.
- Navigate the project and show traceability without searching for the story.
- Describe at least three decisions where safety emerged from better engineering rather than added paperwork.
