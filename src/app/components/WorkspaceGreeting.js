'use client';

import { useEffect, useState } from 'react';

function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function WorkspaceGreeting({ userProfile, context }) {
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    // The browser clock is the source of truth for the user's local greeting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
    const clock = window.setInterval(() => {
      setGreeting(getGreeting(new Date().getHours()));
    }, 60000);

    return () => window.clearInterval(clock);
  }, []);

  const name = userProfile?.name?.split(' ')[0] || 'there';

  return (
    <div className="workspace-greeting">
      <span className="workspace-greeting__eyebrow">{context}</span>
      <h1>{greeting}, {name}.</h1>
      <p>Keep the important work moving with a clear view of your workspace.</p>
    </div>
  );
}
