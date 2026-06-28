# Contributing to SoftBridge Office Suite

Thank you for your interest in contributing to the SoftBridge Office Suite. Please read through these guidelines before submitting code changes or opening pull requests.

## Proprietary Notice & Ownership

This repository is proprietary software owned by **SoftBridge Labs**. 

- **Commercial Use Restriction**: Commercial usage of this code, or any derivative works, without the prior written consent of SoftBridge Labs is strictly prohibited.
- **Contributions Terms**: By contributing to this repository, you agree to license your contributions to SoftBridge Labs under terms that grant SoftBridge Labs full ownership and unlimited rights to use, modify, publish, and commercially exploit the contributed code.

---

## Code Quality & Architecture Standards

We maintain high design aesthetics and code organization standards. Please adhere to the following principles:

1. **Modular Components**: Avoid large files. If a page or component exceeds 200–300 lines of code, refactor it into smaller sub-components (e.g., placing them under `components/` folders).
2. **Custom CSS Styling**: Avoid plain/unstyled browser defaults. Always style input controls, selectors, buttons, and textareas with standard CSS classes to maintain a sleek, dark/light glassmorphic appearance.
3. **No Raw Emojis**: Use Google Material Symbols (`material-symbols-outlined`) for icons instead of raw emoji characters.
4. **Access Control**: Any new meet/collaboration rooms or endpoints must include explicit authorization checks for invited members/hosts.

---

## Contribution Workflow

### Step 1: Branch Naming Conventions
Create a feature branch from the `main` branch. Use clear prefixes:
- `feature/` for new features (e.g., `feature/document-folders`)
- `bugfix/` for bug fixes (e.g., `bugfix/meet-audio-disconnect`)
- `refactor/` for code refactoring (e.g., `refactor/tasks-kanban`)

### Step 2: Code & Verification
Before submitting a pull request, verify that the project compiles cleanly without errors:
```bash
npm run build
npm run lint
```

### Step 3: Submitting a PR
- Provide a clear, descriptive title.
- Link any related issue or request ticket.
- Document any changes to setup steps or configuration variables.

For further clarification on license agreements or design alignment, contact dev@softbridgelabs.in.
