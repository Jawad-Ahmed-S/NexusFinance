This is the right move. Moving from "Dribbble-glow" to **"Modern Institutional"** is what separates a student project from a production-ready application. This style is inspired by high-end fintech like **Stripe**, **Mercury**, and **Qonto**.

Here is your **Nexus Bank Brand Identity & Design System** to keep the app consistent.

---

### **1. Core Palette (The "Ink & Paper" Theme)**
We avoid pure black and pure white to reduce eye strain and look more "premium."

| Element | Hex Code | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Base** | `#FFFFFF` | `bg-white` | Main cards, Header, Nav |
| **App Surface** | `#FAFAFA` | `bg-[#fafafa]` | Background behind cards |
| **Sidebar Base** | `#FCFCFC` | `bg-[#fcfcfc]` | Sidebar background |
| **Deep Ink** | `#0F172A` | `text-slate-900` | Headlines, Primary text, Dark buttons |
| **Slate Gray** | `#64748B` | `text-slate-500` | Secondary text, Labels, Icons |
| **Halal Green** | `#16A34A` | `text-green-600` | Success states, Credits, Verified badges |
| **Border Soft** | `#E2E8F0` | `border-slate-200` | All dividers and card outlines |

---

### **2. Typography (The "Swiss" Style)**
The secret to a professional bank is **Variable Fonts**. They look "engineered."

* **Primary Font Stack:** `Inter`, `Geist`, or `System-Sans`.
* **Headlines:** `Font-Bold`, `tracking-tight`. (Real banks don't use "wide" spacing for headers).
* **Numbers:** Use `font-mono` or `tabular-nums` for the ledger. This ensures that numbers stay aligned vertically in the table.
* **Micro-copy:** Use `font-bold`, `uppercase`, `tracking-widest`, and `text-[10px]` for labels (e.g., "ACCOUNT STATUS").

---

### **3. Layout Patterns (The Rules)**

#### **The "Rule of 2rem"**
Avoid the AI-standard of `rounded-3xl` (which looks like a toy).
* **Main Cards:** Use `rounded-2xl` (16px).
* **Buttons/Inputs:** Use `rounded-lg` (8px).
* **Status Badges:** Use `rounded-md` (6px).

#### **Shadows & Elevation**
* **No Drop Shadows:** Professional fintech uses **Borders** instead of shadows to define depth.
* **Exception:** Use a very subtle "Ring" or "Smic" shadow on the main balance card only: `shadow-sm shadow-slate-200/50`.

#### **Iconography**
* **Library:** `Lucide-react`.
* **Stroke Width:** Always set `strokeWidth={2}`.
* **Coloring:** Icons should be `text-slate-400` by default. Only color them (Green/Blue) if they represent a specific action or status.

---

### **4. Component Philosophy (The "Logic" of the UI)**

1.  **Functional Redundancy:** Every page should have a "Context Label" (e.g., *Financial Portal / Retail Banking*) in the header. It makes the app feel like part of a larger corporate system.
2.  **Data over Decoration:** If you have empty space, don't put an illustration. Put a "System Status" indicator or a "Last Updated" timestamp.
3.  **The "Halal" Indicator:** In a Shariah-compliant app, the "Green Dot" is your most powerful UI element. Use it next to "Verified," "Compliant," or "Active" to build trust.

---

### **5. Description for your Project Documentation**

> **Design Philosophy: Functional Minimalism & Institutional Trust**
>
> The Nexus Bank interface utilizes a **Functional Minimalist** design pattern, prioritizing information density and clarity over decorative elements. By moving away from "Glassmorphism" and high-vibrancy gradients, the UI adopts a **"Paper & Ink"** aesthetic that mimics high-end corporate financial terminals. 
>
> **Key Characteristics:**
> * **High Contrast:** Deep Ink (#0F172A) on Paper White (#FFFFFF) ensures maximum readability and a "hardened" software feel.
> * **Structured Geometry:** A strict 8px grid system with medium-radius borders (`16px`) creates a sense of stability and architectural balance.
> * **Tabular Alignment:** Financial data is rendered using monospaced numerical alignments to reflect accounting precision.
> * **Minimalist Color Theory:** Color is used strictly as a functional tool—Green for Shariah-compliance and credits, Slate for navigation, and White for surfaces—avoiding any "AI-generated" visual noise.

This framework is "decent," professional, and will make your demo look like a serious software product rather than a quick homework assignment.

**Ready to move to the ATM logic or the Transaction History details?**