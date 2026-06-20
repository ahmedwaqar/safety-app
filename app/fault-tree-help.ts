// Fault-tree help and tutorial content
// Standard ISO 61025 FTA concepts and best practices

export const faultTreeHelp = {
  title: "Fault Tree Analysis - Interactive Guide",
  
  introduction: `
Fault Tree Analysis (FTA) is a systematic, deductive method for identifying how component failures combine to cause system failure.
Each gate has MULTIPLE inputs (contributing faults) and ONE output (resulting fault).
Cut sets show which fault combinations can cause the top event.
  `,
  
  gateTypes: {
    AND: {
      name: "AND Gate",
      description: "Output occurs only if ALL inputs occur simultaneously (independent events)",
      example: "A protective stop succeeds only if BOTH the scanner detects AND the PLC commands AND the controller executes",
      symbol: "D-shape with flat bottom"
    },
    OR: {
      name: "OR Gate",
      description: "Output occurs if ANY input occurs (at least one)",
      example: "System fails if scanner_fails OR PLC_fails OR controller_fails",
      symbol: "D-shape with curved bottom"
    },
    NAND: {
      name: "NAND Gate",
      description: "Output occurs only if NOT ALL inputs occur",
      example: "System is safe unless both redundant channels fail"
    },
    NOR: {
      name: "NOR Gate",
      description: "Output occurs only if NO inputs occur",
      example: "Fault occurs only if neither input condition is true"
    },
    XOR: {
      name: "XOR Gate (Exclusive OR)",
      description: "Output occurs if exactly one (but not all) inputs occur",
      example: "Rare in reliability; used for timing-dependent failures"
    },
    NOT: {
      name: "NOT Gate",
      description: "Inverts a single input (output = NOT input)",
      example: "Output occurs if the input does NOT occur"
    },
    KOFN: {
      name: "K-of-N Gate (Majority/Voting)",
      description: "Output occurs if K or more of N inputs occur",
      example: "2-of-3 redundant sensors: fault if 2+ sensors fail"
    }
  },
  
  bestPractices: [
    "Start with a clear, specific top event (the undesired state you're analyzing)",
    "Use descriptive labels for each gate and event",
    "Assign each node a unique ID for traceability",
    "Layer events logically (Detection, Logic, Actuation, Component faults, etc.)",
    "Include both independent basic events and common-cause (dependent) failures",
    "Keep trees modular - use transfer symbols for large systems",
    "Validate cut sets to ensure they make physical sense",
    "Quantify failure rates when possible to compute system reliability"
  ],
  
  example: {
    description: "Protective Stop Failure (Simplified)",
    nodes: [
      "TOP: Protective stop fails",
      "G1 (OR): Detection fails OR Logic fails OR Actuation fails",
      "G1.1 (AND): Scanner AND diagnostics both fail",
      "G1.2 (AND): PLC logic AND firmware both fail",
      "G1.3 (AND): Relay AND motor control both fail",
      "BE: Basic component failures"
    ]
  }
};

export function renderFaultTreeHelpModal(){
  const modal = document.createElement('div');
  modal.id = 'fault-tree-help-modal';
  modal.style.cssText = `
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      margin: 5% auto;
      padding: 20px;
      border-radius: 8px;
      width: 80%;
      max-width: 900px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #2563eb;padding-bottom:10px">
        <h2 style="margin:0;font-size:24px;color:#1e40af">${faultTreeHelp.title}</h2>
        <button id="fault-tree-help-close" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        ">✕</button>
      </div>
      
      <div style="margin-bottom:20px">
        <h3 style="color:#2563eb">What is Fault Tree Analysis?</h3>
        <p style="line-height:1.6;color:#333">${faultTreeHelp.introduction}</p>
      </div>
      
      <div style="margin-bottom:20px">
        <h3 style="color:#2563eb">Gate Types (ISO 61025)</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
          ${Object.entries(faultTreeHelp.gateTypes).map(([, gate]) => `
            <div style="border:1px solid #ddd;padding:12px;border-radius:4px;background:#f9f9f9">
              <strong style="color:#1e40af;font-size:14px">${gate.name}</strong><br>
              <small style="color:#666;line-height:1.4">${gate.description}</small>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-bottom:20px">
        <h3 style="color:#2563eb">Best Practices</h3>
        <ul style="color:#333;line-height:1.8">
          ${faultTreeHelp.bestPractices.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
      
      <div style="background:#f0f7ff;padding:15px;border-radius:4px;border-left:4px solid #2563eb">
        <strong style="color:#1e40af">Remember:</strong> Each gate has <strong>multiple inputs</strong> (faults) combining to produce <strong>one output</strong> (intermediate fault).
        Use multi-select (Ctrl/Cmd+Click) to choose multiple input events for a gate.
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeBtn = modal.querySelector('#fault-tree-help-close');
  if(closeBtn){
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  return modal;
}
