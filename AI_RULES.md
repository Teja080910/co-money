# AI Agent Instructions

As an AI agent working on the **Co-Money / SOTTOCASA** project, you MUST strictly adhere to the following rules at all times:

1. **Read the README First**: You MUST read the `README.md` file to understand the project objective, core rules, and execution phases before you generate any new code or architect any solutions.
2. **Migration-First Workflow**: This repo is a migration project. Before generating any new feature code, you MUST first inspect the `existing-app/` folder to understand the old app's UI, flow, assets, naming, and business behavior. Reuse that app as the source of truth for what should be migrated.
3. **Continue From The Latest Codebase**: Always continue from the newest code already present in `client/` and `server/`. Do not restart features from scratch if partial modern implementations already exist. Extend, refactor, and modernize the current codebase instead of replacing working progress.
4. **Modern Target Stack**: All new implementation work should target the new stack only:
   - `client/`: modern React Native / Expo / TypeScript code
   - `server/`: modern Node.js / TypeScript backend code
   Use the old app only as a reference for migration, not as the destination for new code.
5. **Design Consistency**: When migrating screens, preserve the intent and user experience from the old app, but implement them with clean, modern React Native patterns and the existing theme/components already established in the new app.
6. **Behavior Parity Before Reinvention**: If a screen, flow, or backend behavior exists in `existing-app/`, first reproduce that behavior in the new stack. Improve structure and code quality, but do not invent new flows unless the user asks for a product change.
7. **Documentation First When Needed**: If the user asks for planning, architecture, or feature design, write the plan in markdown (`.md`) before coding. If the user directly asks for implementation, you may proceed with code after reviewing `README.md`, `existing-app/`, and the current `client/` / `server/` code.
8. **Code Quality**: Always maintain high-quality, clean, modular, and production-ready code. Follow standard software architecture patterns, keep the code easy to extend, and avoid overcomplicated solutions.
