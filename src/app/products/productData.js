// Product catalog with features, descriptions, and metadata
export const products = [
  {
    id: 'ping',
    name: 'Ping',
    tagline: 'Team Chat & Instant Messaging',
    shortDescription: 'Real-time team communication with channels, direct messages, and rich media sharing.',
    longDescription: 'Keep your team connected with instant messaging, organized channels, and seamless collaboration. Ping brings all conversations into one focused space with threaded discussions and smart notifications. Our team chat platform combines the best of modern communication tools, featuring persistent conversation history, full-text search across all messages, user presence indicators, and real-time typing notifications. Stay synchronized with your team using organized channels for different projects, departments, or topics, direct one-on-one messaging for private conversations, threaded discussions to keep conversations organized and easy to follow, and rich media sharing including images, videos, documents, and files. Ping integrates with your existing workflows, supports extensive integrations with third-party applications, enables custom bots for automation, and provides comprehensive APIs for developers.',
    features: [
      'Channel-based conversations',
      'Direct messaging',
      'Thread discussions',
      'Rich media sharing',
      'Message reactions',
      'Push notifications',
      'User presence & status',
      'Message search',
      'File sharing and storage',
      'Integrations support'
    ],
    benefits: [
      'Reduce email overload',
      'Keep conversations organized',
      'Real-time team updates',
      'Improved response times',
      'Better team transparency'
    ],
    icon: '/Icons/Ping.png',
    color: '#FF6B6B',
    href: '/products/ping',
    useCases: [
      'Daily team standups',
      'Project updates',
      'Quick decisions',
      'Cross-team collaboration',
      'Remote team communication'
    ]
  },
  {
    id: 'calendar',
    name: 'Calendar',
    tagline: 'Smart Scheduling & Meeting Management',
    shortDescription: 'Unified calendar with AI scheduling, meeting rooms, and availability management.',
    longDescription: 'Manage your team\'s schedule with intelligent calendar features. Find meeting times instantly, book rooms, and let AI handle the scheduling complexity. Integrates with all your calendar systems. Our smart calendar solution provides unified calendar view across your entire team, eliminating scheduling conflicts and double bookings. Features include AI-powered scheduling assistant that finds optimal meeting times automatically, intelligent meeting room booking with real-time availability, automatic timezone detection and conversion for global teams, and calendar synchronization with Google Calendar, Outlook, and iCal. The calendar integrates with all major email providers for seamless scheduling through email invites, provides recurring meeting support with intelligent conflict detection, enables availability sharing with customizable time slots, and includes meeting reminders via email and push notifications. Track team availability in real-time, manage meeting preferences and meeting room resources, access calendar from any device with automatic syncing, and enable guests to view available time slots for booking without accessing your full calendar.',
    features: [
      'Unified calendar view',
      'AI-powered scheduling',
      'Meeting room booking',
      'Availability sharing',
      'Time zone support',
      'Calendar sync',
      'Meeting reminders',
      'Conflict detection',
      'Team availability',
      'Smart scheduling suggestions'
    ],
    benefits: [
      'Save hours on scheduling',
      'Reduce meeting conflicts',
      'Better time management',
      'Improved attendance',
      'Simplified coordination'
    ],
    icon: '/Icons/Calender.png',
    color: '#4ECDC4',
    href: '/products/calendar',
    useCases: [
      'Team meetings',
      'Client calls',
      'Resource planning',
      'Project milestones',
      'All-hands meetings'
    ]
  },
  {
    id: 'meet',
    name: 'Meet',
    tagline: 'HD Video Conferencing & Screen Sharing',
    shortDescription: 'High-quality video calls with screen sharing, recording, and collaboration tools.',
    longDescription: 'Crystal-clear video conferencing with advanced features for teams of any size. Share screens, record meetings, collaborate in real-time, and maintain focus with minimal distractions. Our video conferencing platform delivers HD video quality with adaptive bitrate streaming for reliable performance on any connection. Features include screen sharing for seamless collaboration, real-time meeting recording for future reference and compliance, support for up to 300+ participants in a single meeting, and crystal-clear HD audio with automatic noise cancellation. Engage participants with interactive tools including live polls for instant feedback, hand raising to manage speaker queue, live reactions for quick feedback without interrupting, and participant chat for discussions during presentations. Enhance your meetings with virtual backgrounds to maintain privacy, breakout rooms for group discussions, live transcription and closed captions for accessibility, and meeting chat with persistent history. Integrate with calendar systems for one-click meeting launch, support for dial-in numbers for remote participation, and secure meeting encryption with end-to-end encryption option for sensitive discussions.',
    features: [
      'HD video quality',
      'Screen sharing',
      'Recording & playback',
      'Meeting polls',
      'Hand raising',
      'Live reactions',
      'Chat integration',
      'Participant management',
      'Virtual backgrounds',
      'Breakout rooms'
    ],
    benefits: [
      'Reduce travel costs',
      'Better engagement',
      'Meeting recordings',
      'Accessible from anywhere',
      'Secure & encrypted'
    ],
    icon: '/Icons/Meet.png',
    color: '#95E1D3',
    href: '/products/meet',
    useCases: [
      'Team meetings',
      'Client presentations',
      'Training sessions',
      'One-on-ones',
      'All-hands meetings'
    ]
  },
  {
    id: 'calendar-booking',
    name: 'Booking',
    tagline: 'Public Scheduling & Appointment Management',
    shortDescription: 'Let clients book time with you instantly through customizable booking links.',
    longDescription: 'Create public booking links and let clients schedule time with you automatically. Smart availability management, timezone support, and automated confirmations reduce scheduling overhead. Our appointment scheduling platform eliminates back-and-forth emails and phone calls. Create customizable booking links that embed on your website or share via email, letting clients view your availability and book appointments instantly. Features include automatic timezone detection so clients always book in their local time, confirmation emails sent automatically to both you and the client with meeting details, customizable intake forms to collect important information before appointments, and buffer time between meetings to prevent overbooking. Set up multiple calendars for different types of appointments, configure meeting duration options, define custom meeting location or Zoom/Meet links, and manage availability rules including blackout dates and recurring schedules. Support for recurring bookings, cancellation policies with automatic refunds when applicable, no-show reminders via email or SMS, and integration with payment systems for paid appointments. Track all bookings in one central dashboard, export booking data for reporting, access historical booking analytics, and receive instant notifications when someone books an appointment.',
    features: [
      'Custom booking links',
      'Timezone intelligence',
      'Automated confirmations',
      'Calendar sync',
      'Availability rules',
      'Multiple calendars',
      'Buffer time between meetings',
      'Custom questions',
      'Email reminders',
      'Cancellation policies'
    ],
    benefits: [
      'Eliminate back-and-forth',
      'Automate scheduling',
      'Never miss appointments',
      'Professional presence',
      'Save admin time'
    ],
    icon: '/Icons/Calender.png',
    color: '#F7DC6F',
    href: '/products/booking',
    useCases: [
      'Client consultations',
      'Sales demos',
      'Customer support calls',
      'Service appointments',
      'Coaching sessions'
    ]
  },
  {
    id: 'tasks',
    name: 'Tasks',
    tagline: 'Project & Task Management',
    shortDescription: 'Track tasks, manage projects, and keep teams accountable with real-time updates.',
    longDescription: 'Organize work across teams with an intuitive task management system. Set priorities, track progress, assign work, and celebrate completed projects together. Our comprehensive project management platform provides complete visibility into all team work with customizable task statuses, detailed task descriptions and attachments, and real-time progress tracking. Create and organize tasks with priority levels from low to urgent, assign tasks to team members with due dates and reminders, add subtasks for complex work, and attach files and documents for context. Collaborate on tasks with inline comments, @mentions for notifications, activity history for full audit trail, and status updates visible to stakeholders. Create task templates for recurring work, set up automation rules to update task statuses automatically, track time spent on tasks for resource planning, and generate detailed project reports. Organize tasks using custom labels and categories, filter and search across all tasks, set up custom workflows for your team\'s process, and integrate with your existing tools. Bulk operations for updating multiple tasks at once, export task data to Excel or CSV, access from mobile devices with offline support, and sync across all devices automatically.',
    features: [
      'Task creation & assignment',
      'Priority levels',
      'Due dates & reminders',
      'Progress tracking',
      'Team collaboration',
      'Subtasks',
      'Comments & attachments',
      'Task templates',
      'Bulk operations',
      'Export & reporting'
    ],
    benefits: [
      'Clear work visibility',
      'Better accountability',
      'Reduced missed deadlines',
      'Improved team alignment',
      'Progress transparency'
    ],
    icon: '/Icons/Tasks.png',
    color: '#FF9F43',
    href: '/products/tasks',
    useCases: [
      'Project delivery',
      'Sprint planning',
      'Individual workflows',
      'Team coordination',
      'Action tracking'
    ]
  },
  {
    id: 'docs',
    name: 'Docs',
    tagline: 'Collaborative Document Editor',
    shortDescription: 'Write, edit, and collaborate on documents in real-time with your team.',
    longDescription: 'Create beautiful documents with built-in collaboration. Real-time editing, version history, comments, and sharing make documentation effortless. Perfect for policies, guides, and team knowledge. Our collaborative document platform replaces email attachments and version confusion with real-time collaboration. Multiple team members can edit the same document simultaneously with changes appearing instantly, automatic conflict resolution ensures data consistency, and you can see exactly who is editing which section. Features include rich text formatting with professional styling options, support for embedded images, videos, and media, tables and lists for organizing information, and code blocks for technical documentation. Track all changes with version history, allowing you to view and restore previous versions anytime. Add inline comments and suggestions directly in documents, @mention collaborators for discussion, and enable suggestion mode for non-destructive editing. Share documents with custom permission levels including view-only, edit, or comment access. Publish documents with public sharing links, export documents to PDF or Word formats, and organize documents in folders with hierarchical structures. Create document templates for consistency across your organization, set up team guidelines and policies in documents, maintain company knowledge base with full-text search, and access all documents from any device with automatic syncing.',
    features: [
      'Real-time collaboration',
      'Rich text editing',
      'Version history',
      'Comments & mentions',
      'Sharing & permissions',
      'Export formats',
      'Formatting tools',
      'Table of contents',
      'Revision tracking',
      'Templates'
    ],
    benefits: [
      'Reduce email attachments',
      'Better version control',
      'Faster feedback cycles',
      'Single source of truth',
      'Easy collaboration'
    ],
    icon: '/Icons/Docs.png',
    color: '#FF6B9D',
    href: '/products/docs',
    useCases: [
      'Policy documentation',
      'Team guides',
      'Project proposals',
      'Meeting notes',
      'Knowledge sharing'
    ]
  },
  {
    id: 'tickets',
    name: 'Tickets',
    tagline: 'Customer Support & Issue Tracking',
    shortDescription: 'AI-powered support with ticket management, knowledge base, and customer satisfaction.',
    longDescription: 'Deliver exceptional customer support with AI-first ticket management. AI deflects common issues, agents handle complex ones, and customers stay informed every step of the way. Our customer support platform combines intelligent AI deflection with human touch for best-in-class customer experiences. AI-powered chatbot deflects 40-60% of common support inquiries using your knowledge base, automatically categorizes and routes incoming tickets to appropriate teams, and escalates complex issues to human agents. Features include automatic ticket creation from emails, chat, phone calls, and web forms, ticket triage with auto-assignment based on expertise and workload, SLA tracking with automatic escalation when breaching, and comprehensive ticket search and filtering. Provide customers with a public-facing ticket portal to check support ticket status anytime, enable customer self-service with integrated knowledge base, and reduce support volume with AI-powered smart suggestions. Internal collaboration tools include notes and internal comments visible only to support team, ticket assignment and reassignment with notifications, priority levels and impact assessment, and full conversation history in one place. Knowledge base management with articles searchable by customers, automatic knowledge base suggestions for agents during ticket handling, and tracking of which articles solve which types of issues. Track support metrics including resolution time, first response time, customer satisfaction scores, and common issue identification. Integrations with email, Slack, Teams, and other communication platforms, webhook support for custom integrations, and comprehensive APIs for developers.',
    features: [
      'AI-powered deflection',
      'Ticket management',
      'Auto-triage',
      'SLA tracking',
      'Knowledge base',
      'Public booking widget',
      'Email integration',
      'Customer portal',
      'Performance analytics',
      'Webhook support'
    ],
    benefits: [
      'Reduce support costs',
      'Faster resolution times',
      'Improved satisfaction',
      'Better knowledge capture',
      'Data-driven insights'
    ],
    icon: '/Icons/Tickets.png',
    color: '#A29BFE',
    href: '/products/tickets',
    useCases: [
      'Customer support',
      'Bug reporting',
      'Feature requests',
      'Billing inquiries',
      'General help'
    ]
  },
  {
    id: 'bookmarks',
    name: 'Bookmarks',
    tagline: 'Smart Link Management & Collections',
    shortDescription: 'Save, organize, and share important links with your team instantly.',
    longDescription: 'Never lose an important link again. Save, organize, and collaborate on bookmarks with your team. Quick access to resources, documentation, and tools you use every day. Our smart bookmark management platform centralizes all your important links in one searchable location. Save any web page with a single click using our browser extension or manual saving, capture screenshots and web clippings for visual reference, and add descriptions and tags for easy categorization. Organize bookmarks into collections by project, department, or topic, share collections with team members with granular permission control, and track who added or modified bookmarks for accountability. Advanced features include full-text search across all saved bookmarks and descriptions, filter by tags, collections, or saved date, duplicate detection to prevent saving the same link twice, and integration with your browser favorites. Collaborative features include team comments on bookmarks for discussions, ability to see recently saved bookmarks by team members, and activity feed showing bookmark changes. Export collections to share outside the platform, print collections for offline reference, and access bookmarks from any device with automatic syncing. Smart recommendations based on team usage patterns, browser extension for one-click saving from any webpage, and integrations with productivity tools for embedding links in other platforms.',
    features: [
      'One-click save',
      'Collections',
      'Team sharing',
      'Search & filter',
      'Tags & labels',
      'Descriptions',
      'Bulk operations',
      'Export collections',
      'Browser integration',
      'Quick access'
    ],
    benefits: [
      'Better resource organization',
      'Team knowledge sharing',
      'Faster access to tools',
      'Reduced time searching',
      'Centralized reference'
    ],
    icon: '/Icons/Bookmark.png',
    color: '#74B9FF',
    href: '/products/bookmarks',
    useCases: [
      'Knowledge management',
      'Tool management',
      'Resource sharing',
      'Reference collection',
      'Team library'
    ]
  },
  {
    id: 'whiteboard',
    name: 'Whiteboard',
    tagline: 'Visual Collaboration & Brainstorming',
    shortDescription: 'Collaborate visually with infinite canvas for brainstorming and planning.',
    longDescription: 'Unlock creativity with an infinite digital whiteboard. Perfect for brainstorming sessions, wireframing, diagramming, and collaborative planning with real-time team participation. Our visual collaboration platform provides an infinite canvas for unlimited creative expression. Draw freehand with pencil tools that support pressure sensitivity, create shapes including rectangles, circles, lines, and arrows, add text annotations with formatting options, and insert images for reference or mockups. Real-time collaboration features include multiple team members drawing simultaneously with live cursor tracking, presence indicators showing who is working on which part of the canvas, and automatic syncing of all changes across all participants. Powerful organization tools include infinite zoom and pan for working at any scale, layers for organizing complex drawings, and grouping elements together for easier manipulation. Template library with pre-built templates for common use cases like user journey maps, wireframes, flowcharts, and brainstorming templates. Export functionality includes exporting to PNG, PDF, or SVG formats, sharing static snapshots with non-collaborators, and embedding whiteboards on websites. Persistent storage keeps all whiteboards organized in folders, access full version history with ability to revert to any previous state, and search within whiteboards using text recognition. Presentation mode for sharing whiteboards in slideshow format, collaborative voting and polling features for decision-making, and real-time notification of changes made by team members. Integration with Zoom and other video conference platforms for seamless screen sharing, support for stylus and tablet input for natural drawing experience, and mobile app for sketching on the go.',
    features: [
      'Infinite canvas',
      'Drawing tools',
      'Shape library',
      'Text & annotations',
      'Real-time collaboration',
      'Zoom & pan',
      'Export formats',
      'Templates',
      'Version history',
      'Team sharing'
    ],
    benefits: [
      'Boost creativity',
      'Better ideation',
      'Visual communication',
      'Remote collaboration',
      'Permanent records'
    ],
    icon: '/Icons/Whiteboard.png',
    color: '#FFD93D',
    href: '/products/whiteboard',
    useCases: [
      'Brainstorming sessions',
      'Wireframing',
      'Diagramming',
      'Planning & strategy',
      'Design collaboration'
    ]
  }
];

export const allFeatures = {
  communication: [
    'Real-time messaging',
    'Channel organization',
    'Direct messaging',
    'Thread discussions',
    'Rich media sharing',
    'Message reactions',
    'Push notifications'
  ],
  scheduling: [
    'Calendar management',
    'AI-powered scheduling',
    'Meeting room booking',
    'Availability sharing',
    'Time zone support',
    'Automatic confirmations',
    'SLA tracking'
  ],
  video: [
    'HD video conferencing',
    'Screen sharing',
    'Meeting recording',
    'Meeting polls',
    'Chat integration',
    'Virtual backgrounds',
    'Breakout rooms'
  ],
  productivity: [
    'Task management',
    'Document collaboration',
    'Real-time editing',
    'Version control',
    'Comment system',
    'Template library',
    'Export capabilities'
  ],
  support: [
    'AI-powered deflection',
    'Ticket management',
    'Auto-triage',
    'Knowledge base',
    'SLA tracking',
    'Customer portal',
    'Analytics & reporting'
  ],
  organization: [
    'Link bookmarking',
    'Smart collections',
    'Team sharing',
    'Search & filtering',
    'Tagging system',
    'Bulk operations',
    'Export management'
  ],
  collaboration: [
    'Visual whiteboarding',
    'Infinite canvas',
    'Shape libraries',
    'Real-time co-editing',
    'Version history',
    'Export options',
    'Template support'
  ]
};
