# FMEDA For Beginners

This lesson introduces failure modes, effects, and diagnostic analysis (FMEDA) through the AMR protective-stop example in AsasBits Studio. Complete the main [AMR Robot Safety Training](README.md) first or use this as a focused follow-up.

## Learning Objectives

After this lesson, a learner should be able to:

1. Explain why FMEDA works at failure-mode level.
2. Separate safe, dangerous detected, dangerous undetected, and no-effect failures.
3. Use symbolic constants to make assumptions visible.
4. Calculate diagnostic coverage (`DC`) and safe failure fraction (`SFF`).
5. Sync residual dangerous rates (`λDU`) into the PFH/PFDavg calculator.
6. Identify limitations that require expert analysis.

## 1. Start With A Safety Function

Analyze a specific safety function:

```text
Protective stop on obstacle detection
```

The safety scanner detects a person or object in the AMR path. The safety logic requests a controlled stop. The question is not merely "can the scanner fail?" The useful question is:

> Which scanner failure modes are safe, dangerous detected, or dangerous undetected for this safety function?

## 2. Core FMEDA Terms

| Term | Meaning | Scanner example |
| --- | --- | --- |
| `λ` | Failure rate | Total scanner failures per hour |
| `λS` | Safe failure rate | Scanner falsely reports an obstacle and stops the AMR |
| `λDD` | Dangerous detected failure rate | Scanner misses an obstacle briefly, but diagnostics detect the fault and stop the AMR |
| `λDU` | Dangerous undetected failure rate | Scanner misses an obstacle and diagnostics do not detect the fault |
| `λNE` | No-effect failure rate | Failure mode does not affect this safety function |
| `DC` | Diagnostic coverage | Fraction of dangerous failures detected by diagnostics |
| `SFF` | Safe failure fraction | Fraction of failures that are safe or detected dangerous |

## 3. Working Symbolic Example

Open **FMEDA worksheet**. The seeded example defines:

| Symbol | Value | Meaning |
| --- | --- | --- |
| `lambda_scanner` | `2e-6` | Scanner failures per hour |
| `frac_safe` | `0.35` | Safe-failure fraction |
| `frac_dangerous` | `0.4` | Dangerous-failure fraction |
| `dc_scanner` | `0.9` | Diagnostic coverage |

The scanner rows use symbolic expressions:

```text
λS  = lambda_scanner * frac_safe
    = 2e-6 * 0.35
    = 7e-7 / h

λDD = lambda_scanner * frac_dangerous * dc_scanner
    = 2e-6 * 0.4 * 0.9
    = 7.2e-7 / h

λDU = lambda_scanner * frac_dangerous * (1 - dc_scanner)
    = 2e-6 * 0.4 * (1 - 0.9)
    = 8e-8 / h
```

Expected worksheet rollup:

```text
λDU = 8.00e-8 / h
DC  = 90.0%
```

The seeded fractions intentionally do not sum to `1`. The unallocated portion is a prompt: investigate whether it should be assigned to no-effect modes or other failure modes. FMEDA is useful partly because it exposes incomplete assumptions.

## 4. Why Use Symbols?

Symbols make assumptions reusable and reviewable. Compare:

```text
2e-6 * 0.4 * (1 - 0.9)
```

with:

```text
lambda_scanner * frac_dangerous * (1 - dc_scanner)
```

The second expression tells a reviewer what each number means. When a source value changes, update the constant and review every affected row.

Supported expression features:

- Named constants
- Numbers, including scientific notation such as `2e-6`
- Parentheses
- `+`, `-`, `*`, and `/`

The parser rejects unknown symbols, unsupported characters, division by zero, and negative rates.

## 5. Hands-On Task: Brake Monitoring

Add these constants:

| Symbol | Value | Description |
| --- | --- | --- |
| `lambda_brake` | `4e-7` | Brake subsystem total failure rate |
| `frac_brake_du` | `0.1` | Residual undetected dangerous brake fraction |

Add an FMEDA row:

| Field | Value |
| --- | --- |
| Architecture component | `DRIVE · Drive and brake system` |
| Classification | `Dangerous undetected · λDU` |
| Failure mode | `Brake torque unavailable without diagnostic detection` |
| Local effect | `Commanded stop does not produce expected braking torque` |
| End effect | `AMR stopping distance exceeds validated limit` |
| Diagnostic measure | `Residual failure after deceleration monitor` |
| Expression | `lambda_brake * frac_brake_du` |

Expected evaluated rate:

```text
4.00e-8 / h
```

## 6. Sync To Quantitative Safety

Select **Sync λDU to quantitative safety**, then open **Quantitative safety**.

The calculator receives the residual dangerous rate grouped by architecture component. This creates a handoff:

```text
FMEDA failure modes → architecture component λDU → safety-function PFH or PFDavg
```

Use the quantitative screen to discuss whether diagnostics, proof testing, or redundant architecture need improvement for the target SIL.

## 7. Student Tasks

### Task 1: Complete The Scanner Allocation

The seeded scanner fractions allocate `0.35` to safe failures and `0.4` to dangerous failures.

1. Calculate the unallocated fraction.
2. Add `frac_no_effect`.
3. Add a no-effect scanner row with:

```text
lambda_scanner * frac_no_effect
```

4. Explain why no-effect classifications still need technical justification.

### Task 2: Improve Diagnostic Coverage

Change `dc_scanner` conceptually from `0.9` to `0.95`.

1. Calculate the new `λDD`.
2. Calculate the new `λDU`.
3. Explain why stronger diagnostics reduce residual dangerous failures but do not automatically prove compliance.

### Task 3: Identify Missing Analysis

List at least four analyses or evidence items that are still required before using the result in a real safety case.

Consider:

- Data-source credibility
- Common-cause failures
- Diagnostic response time
- Hardware fault tolerance
- Safe failure fraction
- Systematic capability
- Environmental conditions
- Validation tests

### Task 4: Architecture Review

Suppose a single safety scanner cannot meet the target integrity level.

1. Propose a redundant architecture.
2. Identify one common-cause failure that could defeat both channels.
3. Identify one independence measure.
4. Explain why adding a second sensor does not automatically solve the safety problem.

## 8. Knowledge Check

1. What is the difference between `λDD` and `λDU`?
2. Why is `λDU` important for PFH or PFDavg calculations?
3. What does diagnostic coverage measure?
4. What does SFF include?
5. Why should symbolic constants have descriptions and sources?
6. Can the FMEDA worksheet replace expert review?

## Answer Key

Model answers are available in [`answer-key.md`](answer-key.md#fmeda-follow-up).
