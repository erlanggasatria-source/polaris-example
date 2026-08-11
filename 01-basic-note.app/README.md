# 📝 Polaris Example: 01 Basic Note App

A foundational example demonstrating how to build a reactive, event-driven React application using **Polaris Runtime v1.2.0** (`@polaris-runtime/core`).

This project showcases single-plugin registration, capability & workflow orchestration, domain-targeted state management, and unified event subscriptions for UI feedback (Loading indicators & Toast notifications).

---

## 🚀 Key Features Demonstrated

* **Single Plugin Declaration (`IPlugin`):** Encapsulates business capabilities and workflows within a single, declarative object.
* **Domain-Driven Standardized Results:** Demonstrates `successResult(payload, domain, id, message)` and `errorResult(error, domain, id)` helpers for clean audit trails.
* **Unified Event Pipeline (`subscribeAll`):** Eliminates complex Redux/Zustand boilerplate by using Polaris Runtime's event stream for global loading states and dynamic toast feedback.
* **Dynamic Operation Messages:** Automatically surfaces action-specific feedback in the UI using `event.output?.message` upon workflow completion.
* **Granular Workflow Completion Filtering:** Filters subscriptions via `event.type === 'workflow_completed'` to trigger data re-fetching without duplicate network/execution calls.

---

## 🧭 Polaris Explorer (Development Tools)

When importing `@polaris-runtime/core/dev` in development mode, Polaris automatically attempts to launch the **Polaris Explorer** UI window.

> **⚠️ Important Notice on Popup Blockers:**
> Most modern browsers will block automatic popup windows by default. When you start the application for the first time:
> 1. Look for the **Popup Blocked** icon in your browser's address bar.
> 2. Select **"Always allow popups and redirects"** for `http://localhost:5173`.
> 3. Alternatively, click the manual **"Open Polaris Explorer"** trigger button if provided in your dev toolbar.

### Why Polaris Explorer?

* **⚡ Ultra-Fast Onboarding for Human Developers:**
  New developers joining the project can immediately grasp the application's capabilities, domains, and business workflows directly from the Explorer UI—without reading through lines of component or plugin code.
* **🤖 Zero-Code LLM Context Injection:**
  You can export the runtime's `.json` manifest from Polaris Explorer and feed it directly to a new LLM instance. The AI instantly understands the entire web application architecture, business domains, and workflow pipelines purely from the self-describing descriptions.
* **🔍 Structural Inspection:**
  Inspect registered domains, plugins, capabilities, and step-by-step workflow definitions.

*(Note: Real-time event streams and execution audit logs are output directly to the Browser Web Console).*

---

## 🌟 Why Polaris? Self-Describing Audit Trail & Domain State Management

Polaris Engine broadcasts every execution lifecycle event via a centralized event channel. By tagging results with `domain` and `id`, Polaris simplifies cross-cutting UI concerns like notifications and loading states across multi-plugin enterprise applications.

### Unified Event Subscription Pattern (`IWorkflowEvent`)

Instead of writing `isLoading`, `isError`, or `toastMessage` states inside every component, `App.tsx` listens to the global runtime event stream:

```typescript
import { IWorkflowEvent, logger } from '@polaris-runtime/core/dev';

// Read-only query workflows that do not require success toast popups
const QUIET_WORKFLOWS = ['note/wf-list'];

runtime.subscribeAll((event: IWorkflowEvent) => {
  logger.debug('App Lifecycle Event:', event.type, event);

  // Track domain context
  const domain = event.output?.domain || 'system';

  // 1. Workflow Started -> Trigger Loading State
  if (event.type === 'workflow_started') {
    setLoading(true);
    setCurrentStep(`Executing ${event.workflowPath}...`);
  }

  // 2. Step Started -> Track Detailed Step Progress
  if (event.type === 'step_started') {
    setCurrentStep(`Step: ${event.stepName}`);
  }

  // 3. Workflow Completed -> Reset Loading & Display Success Toast
  if (event.type === 'workflow_completed') {
    setLoading(false);
    setCurrentStep('');

    if (!QUIET_WORKFLOWS.includes(event.workflowPath)) {
      const message = event.output?.message || `Operation completed: ${event.workflowPath}`;
      setToast({ message: `✅ ${message}`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  }

  // 4. Workflow Failed -> Display Error Toast
  if (event.type === 'workflow_failed') {
    setLoading(false);
    setCurrentStep('');
    const errorMessage = event.error || 'Execution failed';
    setToast({ message: `❌ ${errorMessage}`, type: 'error' });
    setTimeout(() => setToast(null), 4000);
  }
});
```

## 🛠️ Project Setup & Installation

### Prerequisites

    Node.js v18 or higher

    npm / pnpm / yarn

### Steps

#### 1. Install Dependencies:
```Bash

npm install
```

#### 2. Start Development Server:

```Bash

npm run dev
```

#### 3. Open Application:

Navigate to http://localhost:5173 in your browser. Open Browser DevTools Console to inspect real-time Polaris Runtime log outputs (logger.debug, logger.info, logger.verbose).

## 📁 Architecture Overview

```Plaintext
src/
├── plugins/
│   └── note.plugin.ts   # Plugin definition (Capabilities & Workflows)
├── components/
│   ├── NoteForm.tsx     # Form component to create new notes via runtime.execute
│   └── NoteList.tsx     # List component with granular event listener for auto-refetching
└── App.tsx              # Root component & global runtime initialization (subscribeAll)

```

## 🔗 Related Links

[Polaris Runtime Core](https://github.com/erlanggasatria-source/polaris-runtime) – The workflow engine powering these examples.

[npm Package](https://www.npmjs.com/package/@polaris-runtime/core) – Installed Polaris Runtime in your own projects.

Documentation – API reference and architecture guide.

- [Architecture](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/ARCHITECTURE.md) — Design principles and core concepts
- [API Reference](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/API.md) — Public API documentation
- [Changelog](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/CHANGELOG.md) — Version history