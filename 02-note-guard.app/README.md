# 🔐 Polaris Example: 02 Note Guard App

An intermediate example demonstrating **Class Model Domain Encapsulation**, **Declarative Authorization Rules (`allowed`)**, **Exception-driven Capability Flow**, and **Reactive UI Button Guards (`can()`)** using **Polaris Runtime v1.2.0** (`@polaris-runtime/core`).

---

## 🚀 Key Features Demonstrated

* **OOP Domain Model Encapsulation (`NoteModel`):** Centralizes data structures, status mutations (`.lock()`, `.updateContent()`), and error collections `[[key, msg], ...]` inside a clean TypeScript class.
* **Declarative Workflow Guards (`allowed`):** Protects sensitive operations (`note/wf-update`, `note/wf-lock`, `note/wf-delete`) using rule specifications (`operator: 'eq'`, `source: 'input'`, `value: 'draft'`).
* **Ultra-Thin UI Guards (`can()`):** Direct export helper wrapping `runtime.canExecute(...)` declared right beside the runtime instance to eliminate UI `if-else` boilerplate.
* **Fail-Safe Capability Execution:** Enforces re-validation within capabilities and uses native `throw new Error(...)` handled gracefully by the Polaris Runtime event pipeline.
* **Interactive Polaris Explorer:** Self-describing architecture that can be inspected visually or exported as a `.json` manifest for instant developer onboarding and LLM context injection.

---

## 🧩 Architectural Highlights

### 1. Domain Model Encapsulation (`NoteModel.ts`)

Instead of loose plain objects or fragmented validation logic across UI components, domain rules reside entirely within the class model:

```typescript
export class NoteModel {
  public id: string;
  public title: string;
  public content: string;
  public status: NoteStatus; // 'draft' | 'locked'

  // Validates title length and required content
  public validate(): boolean { ... }

  // Encapsulated state mutations
  public updateContent(title: string, content: string): void {
    this.title = title.trim();
    this.content = content.trim();
    this.updatedAt = Date.now();
  }

  public lock(): void {
    this.status = 'locked';
    this.updatedAt = Date.now();
  }
}
```

### 2. Declarative Workflow Guard Rules (allowed)

Workflows declare execution prerequisites directly within their definitions. No manual checks required inside React components:

```TypeScript
{
  name: 'note/wf-update',
  description: 'Updates an existing draft note',
  allowed: [
    { key: 'status', value: 'draft', source: 'input', operator: 'eq' }
  ],
  steps: [
    { name: 'update-note', useCapability: 'note/cap-update' }
  ]
}
```

### 3. Centralized can() Helper & Single-Entry Import

The can() helper is declared directly beside the runtime instance after registering plugins (App.tsx / runtime.ts). React components import both runtime and can from a single entry point:

```TypeScript
// App.tsx (or runtime.ts)
export const runtime = new PolarisRuntime();
runtime.registerPlugin(notePlugin);

/**
 * Direct helper export returning clean boolean for UI guards.
 * Polaris Engine automatically logs the failure reason via internal logger on development mode.
 */
export const can = (workflowPath: string, input?: any): boolean => {  
  const result = runtime.canExecute(workflowPath, input);
  return result.allowed
}
```

In React components (NoteItem.tsx), action buttons are reactively enabled or disabled by querying Polaris Engine using the expressive can() helper:

```TypeScript
import { runtime, can } from '../App';

export const NoteItem: React.FC<{ note: INoteData }> = ({ note }) => {
  return (
    <div className="note-actions">
      <button disabled={!can('note/wf-update', note)}>✏️ Edit</button>
      <button disabled={!can('note/wf-lock', note)}>🔒 Lock</button>
      <button disabled={!can('note/wf-delete', note)}>🗑️ Delete</button>
    </div>
  );
};
```
---

# 🧭 Polaris Explorer (Development Tools)

When importing @polaris-runtime/core/dev, Polaris automatically launches the Polaris Explorer window.

    ⚠️ Popup Blocker Notice: Allow popups for http://localhost:5173 in your browser address bar on first run.

    ⚡ Ultra-Fast Human Developer Onboarding: Instantly understand capability contracts, domain state models, and authorization rules without reading source files.

    🤖 Zero-Code LLM Context Injection: Export the .json manifest from Explorer to give LLMs full context on the application's capabilities and business workflows.

---

## 🌐 Live Interactive Demo

Experience the interactive application and inspect live workflow execution in real time:

* **🚀 Launch Application:** [https://polaris-example.vercel.app/](https://polaris-example.vercel.app/)

> **💡 Polaris Explorer Tip:** Allow browser pop-ups on initial load or click **"Launch Explorer Manually"** inside the app banner to visually inspect capability contracts, state transitions, and rule evaluation logs in real time.

---

## 🔍 Real-Time Development Inspection

To observe how Polaris Engine orchestrates events, validates input, and evaluates `allowed` rules under the hood:

1. Open your browser **Developer Tools** (`F12` or `Cmd + Option + I` / `Ctrl + Shift + I`).
2. Switch to the **Console** tab.
3. Execute actions in the app (e.g., creating, updating, locking, or deleting notes) to view detailed, real-time **`log.verbose`** output emitted directly by Polaris Runtime:
   * **Workflow Orchestration Logs:** Step-by-step capability execution pipelines.
   * **Rule Evaluation Diagnostics:** Exact reasons why actions are `allowed` or blocked (`canExecute`).
   * **Domain State Mutations:** Encapsulated Class Model mutations and error payloads.

---

# 🛠️ Project Setup & Installation

```Bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:5173 and inspect real-time audit logs in the Browser Web Console.

---

# 🔗 Related Links

[Polaris Runtime Core](https://github.com/erlanggasatria-source/polaris-runtime) – The workflow engine powering these examples.

[npm Package](https://www.npmjs.com/package/@polaris-runtime/core) – Installed Polaris Runtime in your own projects.

Documentation – API reference and architecture guide.

- [Architecture](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/ARCHITECTURE.md) — Design principles and core concepts
- [API Reference](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/API.md) — Public API documentation
- [Changelog](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/CHANGELOG.md) — Version history