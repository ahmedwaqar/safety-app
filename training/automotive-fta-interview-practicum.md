# Automotive FTA interview practicum

Designed for a functional-safety interview in automated driving. Work each exercise aloud: state assumptions first, reason from vehicle behaviour to technical failure, then say what evidence closes the claim. The interviewer is listening for boundaries, dependencies, and judgement—not a recital of standards.

## The 90-second answer

> I use FTA deductively after the item definition and HARA have bounded the hazard. I define a specific top event in a stated vehicle state and ODD, then decompose causal paths through perception, decision, actuation, safety mechanisms, vehicle interfaces, and shared dependencies. AND/OR logic gives me minimal cut sets for a coherent qualitative tree; I treat common causes and systematic faults explicitly rather than assuming redundant channels are independent. I use the result to improve the architecture, allocate safety requirements, and derive verification cases. For numbers, I control failure-rate sources, mission time, diagnostic coverage, repair assumptions, and common-cause assumptions separately—the drawing itself is not a safety argument.

## Exercise 1 — From HARA to top event

**Prompt.** A highway-driving feature commands lateral steering. A malfunctioning behaviour is an unintended sustained steering torque while the feature is active. Build the first level of the FTA.

Before drawing, say:

- Item/function: lateral control while the feature is engaged.
- Operational situation: highway lane, defined speed/curvature/weather envelope, driver takeover assumptions stated.
- Top event: *unintended steering torque reaches the road wheels while LKA is active*.
- Safety goal direction: prevent or mitigate unintended lateral control; transition to a safe/degraded state within the allocated fault-tolerant time interval.

Suggested first cut:

```text
TOP = ERRONEOUS_LATERAL_REQUEST AND SAFETY_MONITOR_MISSES
ERRONEOUS_LATERAL_REQUEST = PERCEPTION_FALSE_LANE OR CONTROL_SW_FAULT OR SHARED_CALIBRATION_ERROR
SAFETY_MONITOR_MISSES = MONITOR_DF AND STEERING_DISABLE_FAILURE
```

Then challenge it: is the monitor independent in power, clock, input data, execution environment, calibration, and systematic-development path? Is a false lane boundary a malfunction, an intended-functionality limitation, or both? What is the driver/fallback assumption? Load `adas-lane-keeping.ft`, then add one credible shared cause.

## Exercise 2 — AEB pedestrian scenario

**Prompt.** The vehicle fails to mitigate a collision with a pedestrian in a scenario inside the declared ODD. Explain why “camera fails OR radar fails OR lidar fails” is usually a weak answer.

High-quality answer:

1. State the scenario boundary: pedestrian geometry/occlusion, speed, road friction, detection and braking timing, and whether the feature is required to act.
2. Separate failure to recognize from failure to deliver braking.
3. Use voting only if the channels are genuinely independent and the system’s actual decision logic has that structure.
4. Add shared time synchronization, shared calibration/configuration, common compute, power, and communication as possible common causes.
5. Include end-to-end actuation: request integrity, brake controller, actuator, and the actual feedback/diagnostic response.

The starter model in `adas-pedestrian-detection.ft` has these minimal cut-set shapes:

| Order | Example meaning |
| --- | --- |
| 2 | perception false negative + brake actuation/request dangerous failure |
| 3 | any two independent sensor-channel dangerous failures + brake delivery failure |
| 2 | shared time-base failure + brake delivery failure |

**Stretch question.** How would you prove “independent”? Answer with evidence: interface analysis, FMEA/FM​​EDA, freedom-from-interference/partitioning argument where relevant, power/network/clock analysis, configuration control, supplier evidence, fault injection, and confirmation review—not a block diagram.

## Exercise 3 — Find the modelling errors

For each statement, give the correction.

1. “An AND gate proves two sensors are independent.”
2. “A minimal cut set is a probability.”
3. “We have a watchdog, so the residual risk is low.”
4. “A camera false negative is always a functional-safety fault.”
5. “We can use XOR and present the same cut-set report.”

Answer key:

1. AND represents Boolean necessity only. Independence is an assumption that needs a separate common-cause analysis and evidence.
2. It is the smallest event combination that causes the top event. Probability needs quantified inputs and controlled assumptions.
3. Define what it detects, diagnostic latency, fault reaction time, coverage, independence, latent faults, and whether recovery/fallback is safe in the scenario.
4. It may be an SOTIF/performance limitation, a functional-safety malfunction, or an interaction; classify it against the intended behaviour, ODD, and system boundary.
5. XOR is non-monotonic. Use a dedicated Boolean/probabilistic treatment and do not report ordinary MCS as the complete answer.

## Exercise 4 — Common-cause attack

**Prompt.** A team claims 2-out-of-3 sensor voting makes object detection tolerant to two sensor failures. Spend two minutes attacking the claim.

Look for shared:

- clock/time synchronization or GNSS time;
- calibration target, mounting datum, release/configuration, and map frame;
- power rail, ground, thermal zone, EMI, contamination, weather/visibility;
- compute platform, operating system, middleware, fusion library, and compiler/toolchain;
- network gateway, message schema, freshness policy, and cybersecurity-induced degradation;
- human/service process and supplier change.

Close with a design action: diversify, partition, add an independently sensed monitor, improve diagnostics, constrain the ODD, or detect and transition to a verified minimal-risk/degraded state. Choose based on evidence; “add redundancy” alone is not an action plan.

## Exercise 5 — Quantification judgement

**Prompt.** The panel asks for a top-event probability. What do you ask for before calculating?

Say: “First I confirm that the tree is coherent and that the event probability is meaningful for the safety target. I need the time basis/mission, failure-rate source and confidence, failure-mode classification, diagnostic coverage and latency, repair or exposure model, demand rate where applicable, common-cause model, independence assumptions, and treatment of systematic faults. I would use a reviewed toolchain for a production calculation and retain the model/version as a safety-case work product.”

Do not multiply basic-event probabilities casually when the tree contains shared causes, demands, diagnostics, or dependent events.

## Mock interview prompts

- Walk me from an item definition through HARA, functional safety concept, technical safety concept, system design, verification, validation, and confirmation measures.
- A perception team says its ML model has a lower miss rate. What safety question do you ask next?
- How do you resolve a disagreement between a supplier’s FMEDA and vehicle-level fault tree?
- What would make you reject an FTA at safety review?
- How do you handle a late calibration software change after safety validation?
- What is the boundary between ISO 26262 functional safety and SOTIF for an automated-driving feature, and how do they meet in the safety case?

## Strong closing stance

An effective safety expert is neither a standards librarian nor a blocker. Be precise about uncertainty, push on hidden dependencies, turn analysis findings into owned requirements and evidence, and preserve traceability when the design changes. In automated driving, keep the vehicle behaviour, ODD, human/fallback role, and real-world validation evidence in view while you reason about the E/E failure path.
