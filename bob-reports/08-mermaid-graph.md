# Standalone Blast-Radius Graph

## Mermaid Diagram for demo-1.json

**Purpose**: Visual representation of blast radius for video/presentation  
**Source**: cascade/demo-outputs/demo-1.json  
**Format**: Mermaid flowchart (Left-to-Right)

---

## Complete Mermaid Code (Copy-Paste Ready)

```mermaid
graph LR
    %% Changed Function
    A[verifyToken<br/>services/auth/index.ts<br/>SIGNATURE CHANGED]:::changed
    
    %% Critical Impacts
    B[processCheckout<br/>services/billing/checkout.ts:13<br/>🔴 CRITICAL]:::critical
    C[validatePayment<br/>services/billing/checkout.ts:30<br/>🔴 CRITICAL]:::critical
    D[generateInvoice<br/>services/billing/invoice.ts:11<br/>🔴 CRITICAL]:::critical
    
    %% High Impact
    E[refreshToken<br/>services/auth/index.ts:23<br/>🟠 HIGH]:::high
    
    %% Downstream Impacts
    F[Checkout API<br/>Authentication Bypassed]:::impact
    G[Payment Processing<br/>Validation Bypassed]:::impact
    H[Invoice System<br/>Authorization Bypassed]:::impact
    I[Token Lifecycle<br/>Refresh Always Succeeds]:::impact
    
    %% Connections with labels
    A -->|returns object<br/>not boolean| B
    A -->|returns object<br/>not boolean| C
    A -->|returns object<br/>not boolean| D
    A -->|returns object<br/>not boolean| E
    
    B -->|all checkouts<br/>proceed| F
    C -->|all payments<br/>accepted| G
    D -->|all invoices<br/>generated| H
    E -->|expired tokens<br/>refreshed| I
    
    %% Styling
    classDef changed fill:#f44,stroke:#900,stroke-width:4px,color:#fff,font-weight:bold
    classDef critical fill:#f93,stroke:#c30,stroke-width:3px,color:#000
    classDef high fill:#fc6,stroke:#f60,stroke-width:2px,color:#000
    classDef impact fill:#fdd,stroke:#f99,stroke-width:2px,color:#600
    
    %% Legend
    subgraph Legend
        L1[Changed Function]:::changed
        L2[CRITICAL Impact]:::critical
        L3[HIGH Impact]:::high
        L4[Downstream Effect]:::impact
    end
```

---

## Simplified Version (For Presentations)

```mermaid
graph LR
    A[verifyToken<br/>CHANGED]:::changed --> B[checkout.ts:13]:::critical
    A --> C[checkout.ts:30]:::critical
    A --> D[invoice.ts:11]:::critical
    A --> E[auth/index.ts:23]:::high
    
    B --> F[Checkout BROKEN]:::impact
    C --> G[Payment BROKEN]:::impact
    D --> H[Invoice BROKEN]:::impact
    E --> I[Refresh BROKEN]:::impact
    
    classDef changed fill:#f44,stroke:#900,stroke-width:3px,color:#fff
    classDef critical fill:#f93,stroke:#c30,stroke-width:2px
    classDef high fill:#fc6,stroke:#f60,stroke-width:2px
    classDef impact fill:#fdd,stroke:#f99
```

---

## Compact Version (For GitHub Comments)

```mermaid
graph LR
    A[verifyToken<br/>CHANGED]:::changed --> B[checkout.ts:13<br/>processCheckout]:::critical
    A --> C[checkout.ts:30<br/>validatePayment]:::critical
    A --> D[invoice.ts:11<br/>generateInvoice]:::critical
    A --> E[auth/index.ts:23<br/>refreshToken]:::high
    
    B --> F[Checkout API<br/>BROKEN]:::impact
    C --> G[Payment Processing<br/>BROKEN]:::impact
    D --> H[Invoice Generation<br/>BROKEN]:::impact
    E --> I[Token Refresh<br/>BROKEN]:::impact
    
    classDef changed fill:#f44,stroke:#900,stroke-width:3px,color:#fff
    classDef critical fill:#f93,stroke:#c30,stroke-width:2px
    classDef high fill:#fc6,stroke:#f60,stroke-width:2px
    classDef impact fill:#fdd,stroke:#f99
```

---

## Color Legend

### Node Colors

| Risk Level | Fill Color | Stroke Color | Usage |
|------------|-----------|--------------|-------|
| **CHANGED** | `#f44` (Red) | `#900` (Dark Red) | The modified function |
| **CRITICAL** | `#f93` (Orange-Red) | `#c30` (Dark Orange) | Breaking changes, security issues |
| **HIGH** | `#fc6` (Orange) | `#f60` (Dark Orange) | Significant impact, needs attention |
| **MEDIUM** | `#ff9` (Yellow) | `#fc0` (Dark Yellow) | Moderate impact, test updates needed |
| **LOW** | `#9f9` (Light Green) | `#6c0` (Dark Green) | Minor impact, safe changes |
| **IMPACT** | `#fdd` (Light Pink) | `#f99` (Pink) | Downstream effects |

### Edge Labels

- **Solid lines**: Direct function calls
- **Dashed lines**: Indirect dependencies
- **Labels**: Describe the relationship or impact

---

## Rendering Instructions

### On GitHub
1. Copy the Mermaid code
2. Paste into a GitHub markdown file or comment
3. GitHub automatically renders Mermaid diagrams

### On mermaid.live
1. Go to https://mermaid.live
2. Paste the Mermaid code
3. Export as PNG or SVG
4. Use in presentations or documentation

### In VS Code
1. Install "Markdown Preview Mermaid Support" extension
2. Open this file in VS Code
3. Use Markdown preview (Cmd/Ctrl + Shift + V)

### In Documentation Sites
Most documentation platforms support Mermaid:
- GitHub
- GitLab
- Notion
- Confluence (with plugin)
- Docusaurus
- MkDocs

---

## Screenshot Instructions

### For Video/Presentation

1. **Render at mermaid.live**:
   - Go to https://mermaid.live
   - Paste complete Mermaid code
   - Adjust zoom for clarity

2. **Export Options**:
   - PNG: For presentations (PowerPoint, Keynote)
   - SVG: For scalable graphics (web, print)
   - URL: For sharing live diagram

3. **Recommended Settings**:
   - Theme: Default or Forest
   - Width: 1920px (for 1080p video)
   - Background: White or transparent

4. **Screenshot Tips**:
   - Use high resolution (2x or 3x)
   - Ensure all text is readable
   - Include legend in frame
   - Crop excess whitespace

---

## Alternative Visualizations

### Vertical Layout (Top-Down)

```mermaid
graph TD
    A[verifyToken<br/>CHANGED]:::changed
    
    A --> B[processCheckout<br/>CRITICAL]:::critical
    A --> C[validatePayment<br/>CRITICAL]:::critical
    A --> D[generateInvoice<br/>CRITICAL]:::critical
    A --> E[refreshToken<br/>HIGH]:::high
    
    B --> F[Checkout Broken]:::impact
    C --> G[Payment Broken]:::impact
    D --> H[Invoice Broken]:::impact
    E --> I[Refresh Broken]:::impact
    
    classDef changed fill:#f44,stroke:#900,stroke-width:3px,color:#fff
    classDef critical fill:#f93,stroke:#c30,stroke-width:2px
    classDef high fill:#fc6,stroke:#f60,stroke-width:2px
    classDef impact fill:#fdd,stroke:#f99
```

### Radial Layout (Centered)

```mermaid
graph TD
    A[verifyToken<br/>CHANGED]:::changed
    
    A --> B1[checkout.ts:13]:::critical
    A --> B2[checkout.ts:30]:::critical
    A --> B3[invoice.ts:11]:::critical
    A --> B4[auth/index.ts:23]:::high
    
    B1 --> C1[Checkout API]:::impact
    B2 --> C2[Payment]:::impact
    B3 --> C3[Invoice]:::impact
    B4 --> C4[Refresh]:::impact
    
    classDef changed fill:#f44,stroke:#900,stroke-width:3px,color:#fff
    classDef critical fill:#f93,stroke:#c30,stroke-width:2px
    classDef high fill:#fc6,stroke:#f60,stroke-width:2px
    classDef impact fill:#fdd,stroke:#f99
```

---

## Usage in Different Contexts

### 1. GitHub PR Comment
Use the **Compact Version** - fits well in comments, clear and concise

### 2. Video Presentation
Use the **Complete Version** - includes all details, labels, and legend

### 3. Documentation
Use the **Simplified Version** - easier to understand at a glance

### 4. Executive Summary
Use the **Radial Layout** - shows impact spreading from center

---

## Customization Guide

### Adding More Nodes

```mermaid
A --> F[New Impact<br/>Description]:::risk_level
```

### Changing Colors

```mermaid
classDef custom fill:#your_color,stroke:#border_color,stroke-width:2px
```

### Adding Subgraphs

```mermaid
subgraph "Service Name"
    A[Function 1]
    B[Function 2]
end
```

### Edge Styles

```mermaid
A -->|label| B          %% Solid arrow with label
A -.->|label| B         %% Dashed arrow
A ==>|label| B          %% Thick arrow
```

---

## Export Checklist

For video/presentation use:
- [ ] Rendered at mermaid.live
- [ ] Exported as PNG (1920x1080 or higher)
- [ ] All text is readable
- [ ] Colors are distinct
- [ ] Legend is visible
- [ ] No truncated labels
- [ ] Background is appropriate (white/transparent)

For documentation use:
- [ ] Mermaid code is in markdown file
- [ ] Renders correctly on target platform
- [ ] All nodes are labeled clearly
- [ ] Color scheme matches documentation theme

---

## Money Shot Recommendations

### For Demo Video

**Best Version**: Complete Version with Legend

**Why**:
- Shows full context
- Professional appearance
- Clear risk levels
- Includes legend for clarity

**Rendering**:
1. Use mermaid.live
2. Export as PNG at 2x resolution
3. Use as B-roll while explaining
4. Zoom in on specific nodes during narration

### For Thumbnail

**Best Version**: Simplified Version

**Why**:
- Clean and bold
- Easy to read at small sizes
- Immediate visual impact
- Clear "before/after" story

---

## Technical Notes

### Mermaid Version
- Tested with Mermaid v10.0+
- Compatible with GitHub's Mermaid renderer
- Works with most Mermaid-supporting platforms

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: May need zoom for details

### Performance
- Renders instantly on modern browsers
- No external dependencies
- Lightweight (< 5KB of text)

---

**Graph Complete**  
**Ready for**: Rendering at mermaid.live  
**Recommended**: Export as PNG for video  
**Resolution**: 1920x1080 or higher