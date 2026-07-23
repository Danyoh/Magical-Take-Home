# Magical LLM Challenge

## Overview

This project implements an AI-assisted browser automation workflow for the Magical take-home assignment.

The workflow launches a Playwright browser session, navigates to the healthcare form, uses a constrained LLM loop to decide the next valid action, and completes the form submission flow.

### What I Implemented

The current implementation covers the base task and several bonus items.

1. Navigate to the target form automatically.
2. Fill the required Personal Information fields.
3. Submit the form and verify the success state.
4. Complete the Medical Information and Emergency Contact sections.
5. Support external workflow input through a JSON file.
6. Expose the workflow through a small HTTP API.
7. Add a GitHub Actions workflow for scheduled and manual runs.

### How The Agent Works

The agent loop is intentionally constrained.

1. Read the current form state from the page.
2. Ask the model for exactly one next action.
3. Validate that action against the currently visible section.
4. Execute the action with Playwright.
5. Repeat until the success state is detected.

This keeps the system simpler and more reliable than a fully open-ended browser agent.

### Project Structure

The main files are:

1. `src/main.ts`
   The orchestration layer, agent loop, field state tracking, and form actions.
2. `src/session.ts`
   Browser setup and the Playwright page session.
3. `src/workflowInput.ts`
   Loads external workflow data from `workflow-input.json`.
4. `src/api.ts`
   Minimal HTTP API with `POST /run` and `GET /health`.
5. `src/_internal/run.ts`
   Local entrypoint for `npm run dev`.
6. `.github/workflows/run-workflow.yml`
   Scheduled and manually triggered GitHub Actions workflow.

## Setup

### System Requirements

- Node.js 20+

### Setup

Install dependencies

```bash
npm install
```

Install Playwright

```bash
npx playwright install
```

Create a `.env` file and add your Gemini API key

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
```

### Workflow Input

Workflow values are stored in `workflow-input.json`.

You can edit that file to change the data used by the automation run.

### Running The Script

Run the local workflow:

```bash
npm run dev
```

Run the API server:

```bash
npm run api
```

Trigger the API workflow:

```bash
curl -X POST http://localhost:3000/run
```

Check API health:

```bash
curl http://localhost:3000/health
```

## GitHub Actions

The repository includes a GitHub Actions workflow that supports:

1. Manual runs through `workflow_dispatch`
2. Scheduled runs every 5 minutes through `schedule`

To use the workflow, add this repository secret in GitHub:

```bash
GOOGLE_GENERATIVE_AI_API_KEY
```

CI runs use `HEADLESS=true` so Playwright can run in GitHub Actions.

## Notes

This implementation deliberately uses a constrained action model instead of a fully general browser agent.

That choice improves predictability, keeps the code easier to explain, and still satisfies the requirement to build a working agentic loop.
