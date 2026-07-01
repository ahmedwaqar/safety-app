# Critical Systems Lifecycle Interview Guide

Use this guide after completing the corresponding simulation in [`lifecycle-interview-practicum.md`](lifecycle-interview-practicum.md). These are reasoning patterns, not scripts. Replace generic language with your actual project decisions and remain explicit that the AsasBits Studio work is a simulation.

## What Experienced Interviewers Listen For

A strong answer usually shows:

- A clear role and decision boundary
- Awareness of system interfaces and lifecycle context
- Explicit uncertainty and assumptions
- Consideration of alternatives
- Evidence tied to a controlled configuration
- Cross-functional involvement without outsourcing responsibility
- A decision and escalation path
- Residual risk, limitations, and learning

A weak answer lists activities, standards, or documents without explaining a difficult decision.

## 1. Lifecycle Strategy

### Strong Answer Pattern

> I begin by defining the application, lifecycle, organizations, applicable obligations, and evidence needed for acceptance. I tailor activities based on novelty, reuse, risk, and available evidence, but I do not treat supplier certification as application assurance. I establish predecessor gates so architecture does not become fixed before hazards and requirements are understood, and validation cannot close before the approved configuration and acceptance criteria exist. I assign technical ownership, independent review, and acceptance authority separately where required. A gate closes through reviewed outputs and evidence, not because a meeting occurred.

### Good Technical Points

- Reuse can reduce repeated analysis, but assumptions and application constraints remain.
- Tailoring needs rationale, compensating controls, traceability, and approval.
- Safety is shared across engineering roles; accountability must still be named.
- Independence should match consequence, novelty, integrity, and governance.
- Stop implementation when the boundary, critical interfaces, or safety concept is materially unstable.

### Weak Answers

- “I follow the V-model.”
- “The safety manager creates the safety plan.”
- “We comply with the standard.”

These statements may be true but do not show judgment.

## 2. System Boundary

### Strong Answer Pattern

> I distinguish the System under Consideration from external systems and actors, but I keep every safety-relevant interface in the assurance scope. In the robotic-cell simulation, the forklift could remain an external actor while pallet geometry, exchange state, traffic control, and responsibility became controlled interface assumptions. I defined invalid-input behavior and assigned evidence ownership. The key lesson was that outside the product boundary does not mean outside the safety argument.

### Important Follow-Ups

- A larger boundary is not always better; it can obscure ownership.
- External parties can own allocated obligations and evidence.
- Interface agreements need values, timing, states, failure behavior, ownership, and change notification.
- If evidence is unavailable, restrict the claim, add independent validation, redesign the interface, or block acceptance.

## 3. Hazard Analysis

### Strong Answer Pattern

> I start with tasks and operating contexts, then develop event sequences rather than brainstorming injury words. I separate the source of harm, initiating causes, failed controls, exposure, and consequence. Unconfirmed observations stay in working notes until reviewed, but I do not ignore them because no incident has occurred. I involve operators and maintainers to discover real work, then test their observations against architecture, logs, site evidence, and foreseeable misuse.

### Hazard Closure

A hazard is not closed because:

- A requirement exists
- A safeguard was purchased
- A test was performed
- The risk score decreased

Closure needs implemented controls, evidence, residual-risk rationale, configuration relevance, authorized review, and transfer of any operating restrictions.

## 4. Architecture Trade-Off

### Strong Answer Pattern

> I compared the architectures against the safety function, response time, independence, diagnostics, common causes, maintainability, and validation burden. Two channels were not automatically superior because they shared power, mounting, environment, and configuration tools. I selected the concept only after making shared dependencies visible and identifying evidence for diagnostic response and dependent failures. I recorded why the rejected alternative did not provide enough independent risk reduction for its complexity.

### Experienced Details

- Redundancy can add latent failures and maintenance errors.
- Diversity can reduce some systematic or environmental common causes while introducing integration complexity.
- Diagnostics need a defined reaction and response time.
- Safe-state entry can harm availability and may create secondary hazards.
- Architecture selection should consider proof-test and repair assumptions.

## 5. Requirements

### Strong Answer Pattern

> I consider a safety requirement ready when its source is traceable, conditions and modes are explicit, behavior is observable, timing and integrity are included where needed, allocation is clear, conflicts are resolved, and a feasible verification method exists. For end-to-end functions, I keep a system-level requirement and derive allocated interface and subsystem requirements instead of pretending one component owns the complete behavior.

### Derived Requirements

Record:

- Source design decision or hazard
- Rationale
- Allocation
- Verification method
- Upward and downward traceability

One test per requirement is not a meaningful rule. Coverage depends on modes, boundaries, faults, combinations, and analysis methods.

## 6. Supplier Evidence

### Strong Answer Pattern

> I classify supplier information by what it actually supports. A certificate may support a product claim under stated assumptions; it does not validate installation, configuration, interfaces, environment, or the complete safety function. I check version, scope, mission profile, failure definitions, diagnostic assumptions, restrictions, and systematic capability. Where detailed data is unavailable, I document uncertainty, run sensitivity analysis, seek independent evidence, add conservative assumptions, or change the design.

### Useful Phrase

> I would use the evidence for architecture screening, but I would not use it as final application evidence until the assumptions and configuration were confirmed.

## 7. Design Review And Baseline

### Strong Answer Pattern

> I define entry criteria before the review, include the disciplines that own affected interfaces, and separate comments from findings that block the review objective. A baseline can contain open actions only when they do not invalidate its intended use and are controlled with owner, due date, impact, and closure authority. Safety-significant uncertainty such as unconfirmed reset visibility would normally block release of the safety design baseline.

### Baseline Content

- Requirements and interfaces
- Architecture and design
- Hardware and software versions
- Safety parameters and configuration
- Analyses and assumptions
- V&V status
- Deviations and restrictions

## 8. Configuration Mismatch

### Strong Answer Pattern

> I would pause testing because evidence is only valid for a known configuration. I would preserve the as-found checksum, compare it with the approved baseline, identify the reason and authority for the change, and assess affected timing, requirements, hazards, and tests. A debounce change can alter detection or response time, so “minor” is not established by line count. I would either restore the baseline or approve a controlled change and regression plan before resuming.

### Nuance

If reverting creates immediate risk, stabilize the system in a controlled state, document the deviation, and obtain authorized technical direction. Do not improvise a hidden third configuration.

## 9. Failed Validation Test

### Model 90-Second Answer

> In the simulation, a pallet-opening validation test found that a person-sized object could enter beside a pallet while muting remained active. I preserved the test configuration and actual result, marked the test failed, opened a critical deviation, and informed the system, controls, validation, and project leads. I recommended preventing production use of that mode while we examined field geometry, muting sequence, requirements, and the assumption that pallet presence excluded person access. We considered geometry changes, sequence monitoring, additional sensing, and removal of the access path. I expanded regression beyond the observed path to approach directions, pallet variants, timing boundaries, and fault cases. The deviation could close only after the design changed, the risk analysis and requirements were updated, independent validation passed on the approved baseline, and affected claims were restored. The main lesson was to test the underlying assumption, not only the nominal sequence.

### Why This Works

It contains:

- Exact failure
- Immediate containment
- Cross-functional response
- Causal analysis
- Alternatives
- Regression strategy
- Closure evidence
- Learning

## 10. Release Pressure

### Strong Answer Pattern

> I separate the business decision from technical readiness. I make the blocking evidence gaps explicit, describe consequences and uncertainty, and identify whether any restricted configuration has independently justified controls. I do not quietly convert open failures into accepted risk. The authorized acceptance role may accept a defined residual risk, but cannot make missing evidence exist. I document my recommendation, dissent if necessary, and escalate through the agreed governance path.

### Temporary Controls

Potential controls must be technically credible, enforceable, monitored, time bounded, and included in acceptance. Examples may include disabling an affected mode or physically preventing access. Training alone is rarely adequate for a design defect with severe consequences.

## 11. Operational Incident

### Strong Answer Pattern

> I would first contain the hazard and preserve evidence, then investigate why the behavior made sense to the operator. I would examine nuisance-trip causes, production incentives, training, interface design, maintenance history, environmental effects, event logs, and whether bypass was foreseeable. I would avoid treating operator action as the root cause without examining the system that rewarded it. Corrective action would include effectiveness measures and trigger levels, not only retraining.

### Stop-Production Factors

- Credible exposure to uncontrolled severe harm
- Defeated or unreliable critical protection
- Unknown affected population
- Inability to enforce containment
- Evidence that the accepted safety argument is invalid

## 12. Change And Regression

### Strong Answer Pattern

> I start from the approved baseline and the changed assumptions, then trace outward through interfaces, hazards, requirements, analyses, implementation, tests, procedures, and assurance claims. I identify direct effects, coupled effects, and artifacts whose non-impact needs justification. I select regression based on failure mechanisms and evidence validity rather than rerunning everything or testing only the changed component. For interacting changes, I prefer staged introduction where practical so results remain diagnosable.

### Justifying No Retest

Document:

- Why the test objective is unaffected
- Which inputs and configuration remain equivalent
- Whether interfaces or assumptions changed
- Analysis or review supporting the conclusion
- Approval authority

## 13. Assurance Argument

### Strong Answer Pattern

> A safety case is a structured argument that the system is acceptably safe for a defined application and configuration, supported by relevant evidence and explicit assumptions. Traceability helps, but it does not explain why the controls are adequate or why the evidence is sufficient. I decompose the top claim, expose unsupported subclaims and contradictory evidence, and keep operating restrictions and residual risks visible. Acceptance belongs to the authorized stakeholder under the applicable governance process.

### Evidence Quality Questions

1. Does it address the claim?
2. Is it for the correct configuration?
3. Were acceptance criteria defined beforehand?
4. Is the method competent and sufficiently independent?
5. Are limitations and anomalies visible?
6. Is the evidence current after change?

## Behavioral Answer Patterns

### Disagreement With Another Discipline

Good answer:

- Establish the shared system objective.
- Make assumptions and evidence visible.
- Compare alternatives against agreed criteria.
- Escalate the unresolved decision, not the person.
- Record the outcome and learning.

Avoid:

- “I convinced them.”
- “Safety overruled production.”
- Describing technical disagreement as incompetence.

### Insufficient Information

Good answer:

- State what decision is needed and by when.
- Separate reversible from irreversible decisions.
- Identify minimum evidence.
- Use bounded assumptions and conservative controls.
- Assign owners and expiry conditions.
- Revisit the decision when evidence arrives.

### Communicating Bad News

Good answer:

- Communicate early.
- Lead with impact and recommendation.
- Bring evidence and uncertainty.
- Offer technically credible options.
- Record authority and decision.

## Rapid-Fire Technical Questions

### Verification Versus Validation

- **Verification:** Did the output satisfy its specified inputs?
- **Validation:** Does the integrated system satisfy intended use and stakeholder needs in representative context?
- A system can be correctly implemented against an inadequate requirement and therefore pass verification but fail validation.

### Safety Versus Reliability

- Reliability concerns continued correct performance.
- Safety concerns unacceptable risk.
- A safe shutdown can reduce availability.
- A highly reliable unsafe behavior remains unsafe.

### Fault Versus Failure

- A fault is an abnormal condition or cause.
- A failure is the loss of ability to perform a required function.
- Terminology may vary by standard; define the project usage.

### Independence

Independence reduces confirmation bias and conflicts of interest. Required depth depends on consequence, integrity, novelty, governance, and whether the reviewer can objectively challenge the work.

### Residual Risk

Residual risk is the risk remaining after controls. It must be evaluated against the accepted method, communicated where necessary, and accepted by authorized roles. It is not whatever remains when the schedule expires.

### Common Cause

A common cause can defeat multiple apparently independent channels through shared power, environment, design, software, maintenance, installation, or organizational action.

## Self-Assessment Checklist

Before using an answer in an interview, confirm:

- I can state my real role.
- I can name the decision.
- I can explain at least one rejected alternative.
- I can identify the evidence and configuration.
- I can state what remained uncertain.
- I can explain who approved or accepted the outcome.
- I can describe one lesson.
- I am not presenting the simulation as employment experience.

## Final Mock Interview Standard

A strong session demonstrates:

- Ten answers within 90 seconds each
- Specific technical follow-ups without contradiction
- At least one honest no-release recommendation
- At least one failed-test story
- At least one cross-disciplinary disagreement
- At least one change-impact and regression explanation
- Clear distinction between engineering recommendation and acceptance authority
- No invented experience
