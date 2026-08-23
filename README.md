# Polaris Examples

> **Live examples of applications built with Polaris Runtime.**

This repository contains complete, runnable example applications that demonstrate how to build real-world business workflows using [Polaris Runtime](https://github.com/erlanggasatria-source/polaris-runtime) — the self-describing, grammar-first workflow engine.

---

## 📚 Available Examples

| Example | Description | Tech Stack | Live Preview |
|---------|-------------|------------|--------------|
| [01 Basic Note App](./01-basic-note.app/) | Foundational example demonstrating single-plugin registration, capability & workflow orchestration, domain-targeted state management, and unified event subscriptions for UI feedback. | React + TypeScript + Polaris Runtime | — |
| [02 Note Guard App](./02-note-guard.app/) | Intermediate example showcasing OOP domain model encapsulation, declarative authorization rules (`allowed`), exception-driven execution, and ultra-thin UI guards via `can()`. | React + TypeScript + Polaris Runtime | [🚀 Live Demo](https://polaris-example.vercel.app/) |
| [03 Meeting Notes App](./03-meeting-notes-app/) | Full-featured meeting management with state machine, role-based permissions, and real-time event subscription. | React + TypeScript + Polaris Runtime + localStorage | — |
| [04 Meeting Notes App](./04-meeting-new-skin/) | Experimental UI generated with LLM with bisnis model (Plugin) from example 03, AI Native success test | React + TypeScript + Polaris Runtime + localStorage | [🚀 Live Demo](https://polaris-example-meeting.vercel.app/) |


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

## 🚀 Quick Start

Each example is self-contained and can be run independently.

```bash
# Clone the repository
git clone https://github.com/erlanggasatria-source/polaris-runtime.git
cd polaris-examples

# Navigate to the example you want to try
cd meeting-notes-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🧠 What You'll Learn

From these examples, you'll understand:

    Domain Modeling → Encapsulating business logic in domain classes (MeetingModel)

    Workflow Orchestration → Composing capabilities into multi-step workflows

    Role-Based Permissions → Using allowed guards and canExecute() for fine-grained access control

    Event Subscription → Real-time UI updates via subscribeAll()

    Global Context → Managing user sessions and roles via workspace/wf-set-context

    Repository Pattern → Data persistence with localStorage (and soon IndexedDB, SQL)

## 🔗 Related Links

[Polaris Runtime Core](https://github.com/erlanggasatria-source/polaris-runtime) – The workflow engine powering these examples.

[npm Package](https://www.npmjs.com/package/@polaris-runtime/core) – Install Polaris Runtime in your own projects.

Documentation – API reference and architecture guide.

- [Architecture](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/ARCHITECTURE.md) — Design principles and core concepts
- [API Reference](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/API.md) — Public API documentation
- [Changelog](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/CHANGELOG.md) — Version history

## 📄 License

MIT © Polaris Team

## 🤝 Contributing

Found a bug or want to add a new example? Feel free to open an issue or submit a pull request.