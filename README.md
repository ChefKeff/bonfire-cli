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

## How it Works
Bonfire stores checkpoints as plain Markdown files in a `.bonfire/` directory. By committing this directory to your repository, you share the session context with other developers and their AI agents.

## AI Agent Integration
To make your AI agent use Bonfire automatically, ensure the instructions in `.bonfire/agent-instructions.md` are added to your agent's system prompt or rules file.
