# Bonfire CLI 🔥

Bonfire is a "checkpoint" tool for AI coding agents. It allows agents to save their context, progress, and next steps to a `.bonfire/` folder at the root of your repository. This helps maintain memory and continuity across different coding sessions or between different developers.

## Installation

```bash
npm install -g bonfire-cli
```

Or run via npx:

```bash
npx bonfire-cli <command>
```

## Commands

### `init`
Initializes the `.bonfire/` directory and creates an `agent-instructions.md` file. It also offers to append instructions to existing agent configuration files like `.cursorrules` or `.gemini/system.md`.

```bash
bonfire init
```

### `create <message>`
Creates a new bonfire checkpoint with the provided message. The file is automatically named with a timestamp (e.g., `2026-05-05-14-30-22.md`).

```bash
bonfire create "Refactored the authentication logic and added tests for the login flow."
```

#### Options:
- `-a, --author <name>`: Specify the author of the checkpoint. If omitted, it uses the `BONFIRE_AUTHOR` environment variable or the local Git user name.

### `list`
Lists all existing bonfires in reverse chronological order.

```bash
bonfire list
```

### `read <id>`
Outputs the content of a specific bonfire. You can provide the full filename or just the timestamp part.

```bash
bonfire read 2026-05-05-14-30-22
```

### `prune`
Removes old bonfires to keep the directory clean. By default, it keeps the 5 most recent checkpoints.

```bash
# Keep the default 5 most recent
bonfire prune

# Keep the last 10
bonfire prune --keep 10

# Remove all bonfires
bonfire prune --all
```

## AI Agent Integration

Bonfire is designed to be used **by the AI agent**, not by the human developer. The agent should be responsible for summarizing its own work and creating the checkpoint.

### 1. Initialize Instructions
Run `bonfire init` to create `.bonfire/agent-instructions.md`. This file contains the instructions that your agent needs to follow.

### 2. Connect to your Agent
During `bonfire init`, the CLI will offer to automatically append these instructions to common agent configuration files:
- .cursorrules (for Cursor)
- .gemini/system.md (for Gemini CLI)
- .github/copilot-instructions.md (for GitHub Copilot)
- .agents.md or AGENTS.md (Common agent instruction files)

### 3. Agent Workflow
Once integrated, your agent will follow these steps at the end of a session:
1. **Summarize**: The agent writes a concise summary of what was accomplished and what needs to be done next.
2. **Execute**: The agent runs the shell command: `bonfire create "The summary content"`.
3. **Commit**: The checkpoint is saved to disk, and can be committed to Git to share with other agents or developers.

## How it Works
Bonfire stores checkpoints as plain Markdown files in a `.bonfire/` directory. Each file includes the author, date, and the context message. By committing this directory to your repository, you share the session context with other developers and their AI agents.
