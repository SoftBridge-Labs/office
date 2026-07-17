# SoftBridge Office Suite

Welcome to **SoftBridge Office Suite**, a secure, collaborative, and feature-rich workspace platform designed for productivity, scheduling, real-time whiteboards, document management, and private video meetings.

This project is built on Next.js 16 (using the App Router) and React 19, delivering a highly responsive, modern user experience.

---

## Key Features

- 📅 **Unified Calendar & Scheduling**: Create and manage calendar events, set overrides, conflict resolution assistance, and schedule new meetings.
- 🔗 **Availability Booking Links**: Custom booking links `/booking/[slug]` to schedule time slots easily.
- 🔒 **Private Video Meetings**: Secure meetings `/meet/[id]` using WebRTC (PeerJS) signaling. Verifies invitee list status so that only invited guests and organizers can enter.
- 📄 **Markdown Document Workspace**: Dedicated document editor at `/doc/[id]` with access settings (Private/Public Link) and email-based collaborator management.
- 📋 **Sprint Tasks Kanban Board**: Simple drag-and-drop or quick-move sprint planner with customizable priority parameters.
- 🎨 **Whiteboard & Sketch**: Collaborative sketchpad with fine color selection, brush adjustments, and shape stamp tools.
- 💾 **Local Sandbox Mode**: Unauthenticated users can run and use all office suite features using local storage fallback. A warning notice is displayed in the sidebar until they sign in to synchronize to the cloud.

---

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm or yarn

### Installation

1. Clone the repository to your local directory.
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Build & Production Deployment

To create an optimized production build of the project, run:
```bash
npm run build
npm run start
```

---

## API Usage

The SoftBridge Office Suite exposes multiple REST APIs available under `/api-proxy` (which proxies requests to the backend defined in `NEXT_PUBLIC_API_URL`).
You can use `src/lib/api.js` for interacting with the backend API.

### Meeting Reactions API

Meeting reactions are handled real-time through WebRTC Data Channels and synchronized with the backend. 
- **Send Reaction**: `api.sendMeetReaction(roomId, { emoji, sender })`
- **Receive Reactions**: Reactions are polled automatically via `api.syncMeetState(roomId)` returning `{ success, reactions }`.
- **Note**: The client automatically ignores duplicate reactions and accounts for clock drift.

### Ping API (Chat & Channels)

The Ping component is built to integrate with our unified messaging API. 
- **Conversations List**: Returns channels, DMs, and pinned chats. 
- **Department/Channel Sync**: Fetches members, presence (At Work, Away), and Meetings for the specified department.

*Check `src/lib/api.js` for the full collection of backend API methods (including Docs, Tasks, Whiteboard, and Admin tools).*

---

## License & Ownership

© 2026 SoftBridge Labs. All rights reserved.

This source code, assets, and documentation are the sole property of **SoftBridge Labs**. Commercial usage, reproduction, distribution, or modification of this codebase without the express written permission of SoftBridge Labs is strictly prohibited.

For commercial inquiries or custom deployment permissions, please contact info@softbridgelabs.in.
