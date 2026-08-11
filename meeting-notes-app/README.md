# Meeting Notes App – Polaris Runtime Example

A complete example application built with **Polaris Runtime** and **React** that demonstrates how to build a real-world business workflow with state machine, role-based permissions, and real-time event subscription.

---

## 🧩 What This Example Demonstrates

- **Domain Modeling** → Meeting lifecycle with status transitions (`draft` → `waiting_approval` → `scheduled` → `waiting_note_approval` → `done`).
- **Role-Based Permissions** → Different actions for `member`, `secretary`, and `leader` (using `allowed` guards and `canExecute`).
- **Workflow as Orchestrator** → Each action (approve, reject, add note, revise note) is a 5-step workflow.
- **Domain Logic Isolation** → Business logic (validations, transitions, logging) is encapsulated in `MeetingModel` class.
- **Event State Subscription** → UI subscribes to workflow events to show real-time progress.
- **LocalStorage Repository** → Data persistence using `repo` plugin (localStorage).
- **Global Context** → User and role switching via `workspace/wf-set-context`.

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/polaris/examples.git
cd examples/meeting-notes-app

# 2. Install dependencies (including Polaris Runtime)
npm install

# 3. Start the development server
npm run dev
```

Open http://localhost:5173 in your browser.

## 📂 Project Structure

```text
meeting-notes-app/
├── src/
│   ├── components/
│   │   ├── MeetingList.tsx       # List of meetings with status badges
│   │   ├── MeetingForm.tsx       # Create new meeting (future/past)
│   │   ├── MeetingDetail.tsx     # Detail view with actions, notes, history
│   │   └── ProgressBar.tsx       # Real-time workflow progress
│   ├── domain/
│   │   └── meeting.model.ts      # Meeting domain class (validations, transitions, log)
│   ├── plugins/
│   │   ├── repo.plugin.ts        # Repository plugin (localStorage CRUD)
│   │   ├── meeting.plugin.ts     # Meeting plugin (workflows + capabilities)
│   │   └── workspace.plugin.ts   # Global context management
│   ├── types/
│   │   └── meeting.types.ts      # TypeScript interfaces
│   ├── styles/
│   │   └── App.css               # Dark theme styling
│   ├── App.tsx                   # Main React component
│   └── main.tsx                  # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🧠 How It Works

### 1. Workflow Lifecycle

```text
┌────────────────────────────────────────────────────────────────────────┐
│                    MEETING STATE MACHINE                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  📝 DRAFT                                                             │
│  ├── Create (with optional note)                                       │
│  ├── Edit (draft only)                                                 │
│  └── Delete (draft only)                                               │
│                                                                        │
│  ⏳ WAITING_APPROVAL (jadwal)                                         │
│  ├── Approve → SCHEDULED (leader/secretary)                            │
│  └── Reject → DRAFT (leader/secretary)                                 │
│                                                                        │
│  📅 SCHEDULED                                                         │
│  ├── Add Note → WAITING_NOTE_APPROVAL (creator/secretary/leader)       │
│  └── Cancel → CANCELED (leader/secretary)                              │
│                                                                        │
│  📝 WAITING_NOTE_APPROVAL                                             │
│  ├── Approve Note → DONE (leader)                                      │
│  ├── Reject Note → SCHEDULED (leader)                                  │
│  └── Revise Note → WAITING_NOTE_APPROVAL (creator/secretary/leader)    │
│                                                                        │
│  ✅ DONE                                                              │
│  └── Revise Note → WAITING_NOTE_APPROVAL (any role)                    │
│                                                                        │
│  ❌ CANCELED (final)                                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Capability Data Flow

| Source	| Description   |
|---    | ---   |
| context.input	| Original input from UI (e.g., { id, note, reason }). Immutable.   |
| input.payload	| Output of the previous step (e.g., meeting object from repo/cap-get). Mutable.    |
| context.context	| Global session data (userId, role, workspace). Read-only. |

```typescript
// Example capability
run: (input, context) => {
  const meeting = input.payload; // from previous step
  const userId = context.context.get('userId');
  const note = context.input.note; // original UI input
  // validate...
  return successResult({ domain, id, data });
}
```

### 3. Role-Based Permissions

    canExecute(workflowName, input) checks both role guards and status guards.

    UI uses runtime.canExecute() to show/hide buttons.

```typescript
// Guard example
allowed: [
  { key: 'role', value: ['leader', 'secretary'], source: 'context', operator: 'in' },
  { key: 'status', value: 'waiting_approval', source: 'input', operator: 'eq' }
]
```

## 🧪 Testing

### Switch User

Use the dropdown in the header to switch between:

    Liu Ruyan (Leader) → full permissions

    Sheng Min Yan (Secretary) → approve, add note, cancel

    Chen Fan (Member) → create, submit approval, edit/delete own draft

### Workflow Flow Test

    Create a draft (future or past) → draft

    Submit approval → waiting_approval (or waiting_note_approval if note exists)

    Approve as leader/secretary → scheduled

    Add note → waiting_note_approval

    Approve note as leader → done

    Revise note (from done or waiting_note_approval) → waiting_note_approval again

## 📦 Dependencies

    Polaris Runtime – Core workflow engine (local package or published)

    React – UI framework

    TypeScript – Type safety

## 📄 License

MIT © Polaris Team


## 🔗 Related Links

[Polaris Runtime Core](https://github.com/erlanggasatria-source/polaris-runtime) – The workflow engine powering these examples.

[npm Package](https://www.npmjs.com/package/@polaris-runtime/core) – Install Polaris Runtime in your own projects.

Documentation – API reference and architecture guide.

- [Architecture](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/ARCHITECTURE.md) — Design principles and core concepts
- [API Reference](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/API.md) — Public API documentation
- [Changelog](https://github.com/erlanggasatria-source/polaris-runtime/blob/main/CHANGELOG.md) — Version history