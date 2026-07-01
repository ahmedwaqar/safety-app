# AsasBits UML DSL guide

AsasBits UML DSL is the source language for the native Architecture editor. Its syntax is intentionally close to PlantUML: declare named UML entities, give them short aliases, and connect those aliases with arrows. The app handles shape position, size, routing, and layout separately.

Use the DSL to describe **what the architecture means**. Use the canvas and inspector to decide **how the diagram is arranged**.

## Quick start

```text
diagram "Collaborative robot cell" {
  component "Safety PLC" as PLC
  component "Robot controller" as CTRL
  component "Area scanner" as SCAN

  interface SCAN -> PLC : "Protective-field status"
  PLC ..> CTRL : "Safe-stop command"
}
```

1. Open **Architecture**.
2. Enter or paste DSL into **Architecture source**.
3. Select **Apply source**. Valid source also applies automatically after a short pause.
4. Choose a layout mode and select **Layout** if the initial arrangement needs improvement.
5. Drag shapes with the mouse or edit X, Y, width, and height in the inspector.

Manual layout does not add coordinates or sizes to the DSL. Geometry is stored as editor view state and remains associated with each stable alias.

## Diagram declaration

Wrap the model in one diagram block:

```text
diagram "Warehouse AMR" {
  component "Fleet manager" as FLEET
}
```

The quoted text is the diagram name. Blank lines are allowed. Comments begin with `#` or `'`:

```text
# Safety-related control path
' Reviewed with the controls team
```

Older sources using `uml component "Name" {` remain readable, but new source is serialized with the simpler `diagram "Name" {` form.

## Entities

The standard declaration follows PlantUML's familiar name-and-alias form:

```text
<kind> "<display name>" as <ALIAS>
```

Examples:

```text
component "Safety PLC" as PLC
node "Vehicle computer" as COMPUTER
actor "Maintenance technician" as TECH
useCase "Recover from safe stop" as RECOVER
state "Protective stop" as SAFE_STOP
```

Aliases identify entities in relationships and downstream safety analyses.

- Start an alias with a letter.
- Use letters, numbers, `_`, and `-`.
- Keep aliases short and stable, such as `PLC`, `SCAN`, or `BRAKE_CTRL`.
- Aliases are case-insensitively unique within the diagram.
- Rename display text freely; avoid changing an alias unless the entity's identity really changed.

Supported entity kinds are:

| Family | Kinds |
| --- | --- |
| Structural | `class`, `abstractClass`, `enumeration`, `dataType`, `object`, `package`, `component`, `subsystem`, `port`, `node`, `artifact` |
| Use case | `actor`, `useCase`, `boundary`, `control`, `entity` |
| Sequence | `lifeline`, `activation`, `frame`, `message` |
| Activity | `start`, `activity`, `activityObject`, `decision`, `merge`, `forkJoin`, `swimlane`, `interruptibleRegion`, `signalSend`, `signalReceive`, `guard`, `activityFrame`, `end` |
| State | `initialState`, `state`, `finalState` |
| Annotation | `note`, `constraint` |

`node` renders as a UML deployment node. Interfaces are native relationships, not intermediary entity shapes.

## Entity details

Use a block only when an entity needs additional UML meaning:

```text
class "SafetyCommand" as COMMAND {
  <<safety data>>
  + functionId: String
  + demandedState: SafeState
  + validate(): Result
  doc "Command exchanged across the safety boundary"
}
```

Inside an entity block:

- `<<text>>` defines a stereotype.
- A member containing `(` is rendered as an operation.
- Other member lines are rendered as attributes or enumeration literals.
- `doc "text"` records inspector documentation.
- `body "text"` defines visible body text for notes and text-oriented entities.

The explicit forms `stereotype "..."`, `attribute "..."`, `operation "..."`, and `documentation "..."` are also accepted for compatibility.

Example enumeration:

```text
enumeration "SafeState" as SAFE_STATE {
  STOPPED
  TORQUE_OFF
  CONTROLLED_STOP
}
```

## Relationships

Connect aliases with simple arrows:

```text
SOURCE ..> TARGET : "Label"
```

The label is optional. These arrow forms map to native UML connectors:

| Syntax | Relationship |
| --- | --- |
| `A -- B` | Association |
| `A -> B` or `A ..> B` | Dependency |
| `A --|> B` | Generalization |
| `A ..|> B` | Realization |
| `A o-- B` | Aggregation |
| `A *-- B` | Composition |

Examples:

```text
OPERATOR -- HMI : "Operates"
CTRL ..> DRIVE : "Motion command"
SAFETY_CTRL ..|> SAFETY_FUNCTION : "Implements"
WHEEL *-- BRAKE : "Contains"
```

For connector types without a distinct arrow token, prefix the relationship kind:

```text
interface SCAN -> PLC : "Protective-field status"
delegation PORT_A -> CONTROLLER : "Delegates input"
include TRANSPORT -> PROTECT : "Includes protection"
extend RECOVER -> PROTECT : "Recovery after stop"
controlFlow VALIDATE -> DECISION : "Checked"
interruptFlow RUNNING -> SAFE_STOP : "Protective-stop demand"
```

`interface` renders native ball-and-socket notation directly on the connector.

## Automatic and manual layout

The DSL has no position or size syntax. The Architecture editor owns presentation:

- New entities are positioned automatically using the selected layout mode.
- Existing aliases retain their current geometry when source is reapplied.
- **Layout** arranges the complete diagram using the selected algorithm.
- Mouse dragging adjusts a shape interactively.
- Inspector fields provide exact X, Y, width, and height values.
- Connector endpoints can be dragged and reconnected directly on the canvas.
- None of these presentation changes add geometry to source.

This separation keeps architecture text concise while allowing a carefully reviewed visual layout. If source adds one new entity, existing manually positioned entities remain fixed and the new entity receives an automatic position.

## Example: safety component diagram

```text
diagram "Collaborative robot safety architecture" {
  component "Area scanner" as SCANNER {
    doc "Detects intrusion into the protective field"
  }
  component "Safety PLC" as PLC {
    <<safety controller>>
    doc "Evaluates protective devices and commands a safe state"
  }
  component "Robot controller" as CTRL
  component "Emergency stop" as ESTOP
  component "Robot drives" as DRIVE

  interface SCANNER -> PLC : "Protective-field status"
  interface ESTOP -> PLC : "Emergency-stop status"
  PLC ..> CTRL : "Safe-stop command"
  CTRL ..> DRIVE : "Torque-off request"
}
```

## Example: class diagram

```text
diagram "Safety command model" {
  class "SafetyCommand" as COMMAND {
    <<value object>>
    + functionId: String
    + demandedState: SafeState
    + timestamp: Instant
    + isFresh(now): Boolean
  }

  enumeration "SafeState" as SAFE_STATE {
    STOPPED
    TORQUE_OFF
    CONTROLLED_STOP
  }

  class "CommandValidator" as VALIDATOR {
    + validate(command): Result
    doc "Checks freshness, source, range, and permitted transition"
  }

  COMMAND -- SAFE_STATE : "Uses state"
  VALIDATOR ..> COMMAND : "Validates"
}
```

## Example: use-case diagram

```text
diagram "AMR operating use cases" {
  actor "Warehouse operator" as OPERATOR
  actor "Maintenance technician" as TECH
  useCase "Transport tote" as TRANSPORT
  useCase "Initiate protective stop" as PROTECT
  useCase "Recover from safe stop" as RECOVER

  OPERATOR -- TRANSPORT : "Requests transport"
  include TRANSPORT -> PROTECT
  TECH -- RECOVER : "Performs recovery"
  extend RECOVER -> PROTECT : "Recovery after stop"
}
```

## Example: activity diagram

```text
diagram "Protective-stop response" {
  start "Demand received" as START
  activity "Validate demand" as VALIDATE
  decision "Demand valid?" as VALID
  activity "Command controlled stop" as STOP
  activity "Reject and diagnose" as REJECT
  end "Safe state reached" as SAFE

  controlFlow START -> VALIDATE
  controlFlow VALIDATE -> VALID
  controlFlow VALID -> STOP : "valid"
  controlFlow VALID -> REJECT : "invalid"
  controlFlow STOP -> SAFE
}
```

## Example: state diagram

```text
diagram "Robot safety states" {
  initialState "Initial" as INITIAL
  state "Ready" as READY
  state "Running" as RUNNING
  state "Safe stop" as SAFE_STOP
  finalState "Powered down" as OFF

  controlFlow INITIAL -> READY : "initialization complete"
  controlFlow READY -> RUNNING : "start command"
  interruptFlow RUNNING -> SAFE_STOP : "protective-stop demand"
  controlFlow SAFE_STOP -> READY : "validated reset"
  controlFlow SAFE_STOP -> OFF : "shutdown"
}
```

## Source and canvas synchronization

The source editor and canvas operate on one semantic model:

- **Apply source** parses text into native entities and relationships.
- **Palette insertion** adds an entity and regenerates concise source.
- **Inspector editing** updates names, aliases, documentation, and relationships.
- **Dragging and geometry fields** update view state only.
- **Connector drawing** adds a relationship declaration to source.
- **Connector endpoint movement** updates view routing without adding layout syntax.
- **Undo/redo** restores model and view state together.

Invalid text is retained as a separate draft. It does not replace the last valid canvas. Correct the line-specific error and apply again.

## Troubleshooting

| Message or symptom | Resolution |
| --- | --- |
| `Expected: diagram "Diagram name" {` | Add or correct the outer diagram declaration. |
| `Duplicate element alias` | Give every entity a unique alias, ignoring case. |
| `Unknown source element` or `Unknown target element` | Define the referenced alias or correct the arrow endpoint. |
| `Unsupported element property` | Use a stereotype, member line, `doc`, or `body`. |
| `Element ... is missing a closing brace` | Close the entity block before the next declaration. |
| `Diagram is missing a closing brace` | Add the final `}`. |
| Shapes overlap | Select a layout mode and apply **Layout**, then drag or use inspector geometry fields. |
| Reapplying source moves a renamed entity | Keep its alias stable; geometry is matched by alias. |
| Invalid source does not change the canvas | This is intentional. Correct the retained draft and apply again. |

## Review checklist

- Does the diagram answer a clear engineering question?
- Are aliases stable and consistent with downstream analyses?
- Does each entity have a clear responsibility and boundary?
- Do connector labels describe commands, information, dependencies, or ownership precisely?
- Are safety interfaces and safe-state commands explicit?
- Is the final automatic/manual layout readable without misleading crossings?
- Has the source and rendered canvas been reviewed together?
- Are architecture changes traced to hazards, requirements, FMEA/FMEDA, fault trees, and verification evidence where applicable?
