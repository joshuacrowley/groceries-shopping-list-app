# Ralph Guardrails (Signs)

> Lessons learned from past failures. READ THESE BEFORE ACTING.

## Core Signs

### Sign: Read Before Writing
- **Trigger**: Before modifying any file
- **Instruction**: Always read the existing file first
- **Added after**: Core principle

### Sign: Test After Changes
- **Trigger**: After any code change
- **Instruction**: Run tests to verify nothing broke
- **Added after**: Core principle

### Sign: Commit Checkpoints
- **Trigger**: Before risky changes
- **Instruction**: Commit current working state first
- **Added after**: Core principle

---

## Learned Signs

### Sign: NEVER read catalogue.json in full
- **Trigger**: When needing template metadata (icon, color, type, systemPrompt)
- **Instruction**: Use `grep -A 10 '"template": "TemplateName"' tiny-talking-todos-templates-for-react-native/catalogue.json` instead. The file is 88KB and will consume your entire context window.
- **Added after**: Iteration 1 — Agent read catalogue.json (88KB), PORTING-GUIDE.md (35KB), RecipeCard.tsx (68KB), and other reference files totaling ~273KB. Hit 80K token limit before writing any code. Zero templates completed.

### Sign: NEVER read reference docs that are summarized in RALPH_TASK.md
- **Trigger**: Before reading any file
- **Instruction**: RALPH_TASK.md already contains the porting pattern, conversion rules, and all necessary context. Do NOT read: PORTING-GUIDE.md, best-practices.md, hooks/useTodos.ts, or any existing client/templates/*.tsx for reference. Only read the specific web source template you're currently porting.
- **Added after**: Iteration 1 — Reading reference files consumed 273KB of context, leaving zero room for actual work.

### Sign: One template at a time, minimal reads
- **Trigger**: Starting work on a template
- **Instruction**: For each template, only read TWO things: (1) the web source file from `tiny-talking-todos-templates-for-react-native/templates/{Template}.tsx`, and (2) use grep for catalogue metadata. Then write the React Native version using the pattern in RALPH_TASK.md. Do not read other templates for reference.
- **Added after**: Iteration 1 — Context budget is ~80K tokens. Each web source template is 15-55KB. You need room to write the output (~20-50KB per template). Budget carefully.

### Sign: Do not read index.tsx until wiring up
- **Trigger**: When adding a template case to the switch statement
- **Instruction**: Read `client/app/(index)/list/[listId]/index.tsx` only when you need to add the import and case. Do not read it at the start of your session. When adding a case, read only the first 20 lines (imports) and the switch section (lines 258-278 approximately). Use grep to find the switch statement location.
- **Added after**: Iteration 1 — index.tsx is 38KB and was read unnecessarily at session start.
