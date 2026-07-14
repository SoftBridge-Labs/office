const fs = require('fs');
const path = require('path');

const pageContent = fs.readFileSync(path.join(__dirname, 'src/app/admin/page.js'), 'utf-8');

const tabs = [
  { name: 'Overview', file: 'overview/page.js' },
  { name: 'Users', file: 'users/page.js' },
  { name: 'Billing', file: 'billing/page.js' },
  { name: 'Departments', file: 'departments/page.js' },
  { name: 'Apps', file: 'apps/page.js' },
  { name: 'Permissions', file: 'permissions/page.js' },
  { name: 'Security', file: 'security/page.js' },
  { name: 'Groups', file: 'groups/page.js' },
  { name: 'Domains', file: 'domains/page.js' },
  { name: 'Audit', file: 'audit/page.js' },
];

for (const tab of tabs) {
  // Regex to extract the function
  const regex = new RegExp(`function ${tab.name}Tab\\(\\) \\{([\\s\\S]*?)\n\\}\n`);
  const match = pageContent.match(regex);
  
  if (match) {
    const fnBody = match[1];
    
    // Add necessary imports
    const content = `'use client';\n\nimport { useState, useEffect, useCallback } from 'react';\nimport { api } from '@/lib/api';\nimport { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';\n\nexport default function ${tab.name}Page() {${fnBody}\n}\n`;
    
    const dir = path.join(__dirname, 'src/app/admin', tab.file.split('/')[0]);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(path.join(__dirname, 'src/app/admin', tab.file), content);
    console.log(`Created ${tab.file}`);
  } else {
    console.log(`Could not find ${tab.name}Tab`);
  }
}

// Write the redirect page.js
const redirectContent = `import { redirect } from 'next/navigation';\n\nexport default function AdminIndex() {\n  redirect('/admin/overview');\n}\n`;
fs.writeFileSync(path.join(__dirname, 'src/app/admin/page.js'), redirectContent);
console.log('Updated root page.js with redirect');
