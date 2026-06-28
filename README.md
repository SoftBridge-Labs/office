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

## License & Ownership

© 2026 SoftBridge Labs. All rights reserved.

This source code, assets, and documentation are the sole property of **SoftBridge Labs**. Commercial usage, reproduction, distribution, or modification of this codebase without the express written permission of SoftBridge Labs is strictly prohibited.

For commercial inquiries or custom deployment permissions, please contact info@softbridgelabs.in.
