# Fault Tree Analysis (FTA) - Professional Engineering Tool

**Version 1.0** | ISO 61025 Compliant | Commercial-Grade

## Overview

This fault-tree editor provides aerospace, automotive, and safety-critical system engineers with a professional-grade tool for deductive reliability and safety analysis. Build, analyze, and export fault trees using a domain-specific language (DSL) based on industry standards.

## Key Features

### ✓ Multi-Input Gates (ISO 61025)
- **AND Gate**: Output if ALL inputs occur (independent event combination)
- **OR Gate**: Output if ANY input occurs (single point of failure)
- **XOR Gate**: Output if exactly ONE input occurs (diagnostic discriminator)
- **K-of-N Gate**: Output if K of N inputs occur (voting/majority logic)
- **NOT/NAND/NOR**: Negation and compound logic

### ✓ Professional DSL
Structured, readable fault tree language that validates:
- No duplicate node IDs
- All input references resolvable
- Proper gate type semantics
- Multi-layer hierarchical trees

### ✓ Cut Set Analysis
Automatically computes minimal cut sets to identify critical failure combinations and single points of failure.

### ✓ Semantic Validation
Parser checks:
- Unique output IDs across tree
- Valid input references (no dangling inputs)
- Proper gate semantics (AND ≠ OR)
- Multi-layer consistency

### ✓ User-Friendly Builder
- Multi-select inputs (Ctrl/Cmd+Click)
- Automatic unique ID generation
- Freeform event naming
- Inline validation messages
- Help modal with best practices

## How to Use

### 1. Creating a Gate

A gate combines multiple input events to produce one output event:

```
gate PROTECTIVE_STOP_FAILS {
  type: OR
  label: "Protective stop unavailable"
  children: [SCANNER_FAILS, PLC_FAILS, CONTROLLER_FAILS]
  layer: Logic
}
```

**Important**: Use Ctrl/Cmd+Click in the Inputs box to select multiple events. Most gates need 2+ inputs.

### 2. Creating a Basic Event

Basic events are terminal leaf nodes (component failures):

```
basic SCANNER_FAILS {
  label: "Safety scanner does not detect obstacle"
  component: SCAN
  layer: Detection
}
```

### 3. Building Top Event

Declare which event is the system failure you're analyzing:

```
fault_tree "Protective Stop Failure" {
  top: PROTECTIVE_STOP_FAILS
  
  gate PROTECTIVE_STOP_FAILS {
    type: OR
    label: "Protective stop unavailable"
    children: [SCANNER_FAILS, PLC_FAILS, CONTROLLER_FAILS]
    layer: Logic
  }
  
  basic SCANNER_FAILS { ... }
  basic PLC_FAILS { ... }
  basic CONTROLLER_FAILS { ... }
}
```

## Best Practices

### Naming Conventions
- Use ALL_CAPS_WITH_UNDERSCORES for identifiers
- Use descriptive labels explaining what fails (not how it fails)
- Include component reference where relevant

### Gate Selection
| Gate Type | Use Case | Example |
|-----------|----------|---------|
| AND | Multiple independent failures needed | Dual-channel safety: both channels must fail |
| OR | Any single failure causes outcome | Any sensor failure causes system failure |
| K-of-N | Voting/redundancy logic | 2-of-3 sensors: majority voting |
| NOT | Inversion (rare) | Safety achieved if hazard does NOT occur |

### Layering
Organize by functional layer:
- **Detection**: Sensor/perception failures
- **Logic**: Processing/decision failures  
- **Actuation**: Command execution failures
- **Component**: Hardware failure modes

### Structure
- Keep trees modular (max 7-9 inputs per gate)
- Use hierarchical decomposition
- Separate independent failure paths
- Document common-cause assumptions

## Validation & Analysis

### Parser Checks
The system validates:
- ✓ No duplicate node IDs
- ✓ All inputs reference existing nodes
- ✓ Gate children lists non-empty
- ✓ TOP event references valid node

### Cut Set Analysis
Displays:
- **Minimal Cut Sets**: Minimum fault combinations causing top event
- **Order**: 1st-order (single points of failure), 2nd-order (dual failures), etc.
- **Implications**: Which failures matter most for design

## Examples

### Example 1: Simple 2-Level Tree
```
fault_tree "Robot Stop Failure" {
  top: STOP_FAILS
  
  gate STOP_FAILS {
    type: AND
    label: "Stop command fails"
    children: [COMMAND_FAILS, EXECUTION_FAILS]
  }
  
  basic COMMAND_FAILS {
    label: "PLC does not issue stop"
    component: PLC
  }
  
  basic EXECUTION_FAILS {
    label: "Motor does not stop"
    component: MOTOR
  }
}
```

**Cut sets**: {COMMAND_FAILS, EXECUTION_FAILS}  
**Meaning**: Both failures must occur; no single point of failure.

### Example 2: 3-Level Tree with OR
```
fault_tree "System Failure" {
  top: FAILURE
  
  gate FAILURE {
    type: OR
    label: "System output incorrect"
    children: [INPUT_ERROR, PROCESSING_ERROR, OUTPUT_ERROR]
  }
  
  gate INPUT_ERROR {
    type: OR
    label: "Input data wrong"
    children: [SENSOR1_FAILS, SENSOR2_FAILS]
  }
  
  gate PROCESSING_ERROR {
    type: AND
    label: "Processing fails"
    children: [CPU_FAILS, MEMORY_FAILS]
  }
  
  basic SENSOR1_FAILS { label: "Sensor 1 fails" }
  basic SENSOR2_FAILS { label: "Sensor 2 fails" }
  basic CPU_FAILS { label: "CPU fails" }
  basic MEMORY_FAILS { label: "Memory fails" }
  basic OUTPUT_ERROR { label: "Output stage fails" }
}
```

**Cut sets**:  
1st-order: {SENSOR1_FAILS}, {SENSOR2_FAILS}, {OUTPUT_ERROR}  
2nd-order: {CPU_FAILS, MEMORY_FAILS}

**Meaning**: System fails if any sensor fails OR output fails; processing layer is redundant.

## Technical Details

### DSL Grammar
- Event IDs: `[A-Za-z_][A-Za-z0-9_]*`
- Gate types: AND, OR, XOR, NOT, NAND, NOR, KOFN
- K-of-N syntax: `type: KOFN:2/3` (2 of 3)
- Layers: Arbitrary strings for organizational grouping

### Semantic Checks
- **Duplicate output prevention**: Each gate produces unique output ID
- **Input resolution**: Every input reference must resolve to existing BE or gate output
- **Circular dependency detection**: Planned for future version

### Cut Set Computation
Uses Boolean algebra:
- AND gate: Intersection of child cut sets
- OR gate: Union of child cut sets  
- K-of-N: Combinatorial subset analysis

## Standards & Compliance

- **ISO 61025:2006**: Fault tree analysis (FTA)
- **SAE ARP4761**: Aerospace FTA guidelines
- **IEC 61508**: Functional safety framework
- **ISO 26262**: Automotive functional safety

## Tips for Commercial Use

1. **Export**: Copy DSL for version control (Git, SVN)
2. **Quantification**: Add failure rates in attributes for probabilistic analysis
3. **Traceability**: Link gates to requirements via unique IDs
4. **Review**: Use layer view to present to safety teams
5. **Evolution**: Maintain baseline versions as design changes

## Known Limitations

- Circular dependencies not yet detected
- No graphical draw interface (text-based DSL only)
- Max tree size ~100 nodes recommended
- Conditional events (INHIBIT gate) minimal support

## Future Enhancements

- [ ] Graphical fault tree editor
- [ ] Quantitative FMEA integration
- [ ] Export to FTA+ format
- [ ] Interactive cut set visualization
- [ ] Common-cause analysis tools
- [ ] Failure rate library

---

**Contact**: For enterprise features or customization, refer to the safety case documentation.

**Last Updated**: 2026-06-20
