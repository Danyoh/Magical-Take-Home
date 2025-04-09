# Magical LLM Challenge

## Overview

Welcome! We're excited to see you're interested in joining our team.

Today, you'll be working on a scoped down version of our autonomous automation platform.

Below you will find all the necessary information to complete the task. If you have any questions, please reach out to your contact at Magical.

Once you are complete, please put up the code in a **private** repository and add your contact at Magical as a collaborator (use their email to invite them).
> Please ensure you do not fork or open a pull request on this repository, put your solution in a private repository.


Time limit: this take-home is due 72hrs after you receive it.

### Task

Create a working agentic loop that will fill out an example healthcare workflow. Here is the SOP (standard operating procedure) for the workflow:

1. Navigate to https://magical-medical-form.netlify.app/
2. Fill out the form with:
   1. First Name: John
   2. Last Name: Doe
   3. Date of birth: 1990-01-01
   4. Medical ID: 91927885
3. Click 'Submit'

### Bonus Points

In this challenge there are a few bonus points, that'll help supercharge the agent.

1. Complete the 2nd and 3rd sections of the form. You will need to:
   1. Fill out dropdowns
   2. Scroll to, and open the appropriate sections
2. Add the ability to run the workflow via an API call
3. Add the ability to pass in variables for the prompt
   1. Think a dynamic "First Name" and "Last Name"
4. Make it so that this workflow can be run automatically on a schedule, every 5 minutes in this case.

### What's provided

We've provided you with a basic setup that will set you up for success. You're given:

1. An initiated playwright session
2. A model setup, with access to the Vercel AI SDK (what we use)
   1. NOTE: You will need to provide your own Gemini API key via the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable.
   2. You can get a free API key from the [Google AI Studio](https://aistudio.google.com/apikey).

## Setup

### System Requirements

- Node.js 20+

### Your task

You are given a playwright page, and a model.

You need to write a script that will fill out a form on the page.


### Setup

Clone the repository

Install dependencies
```bash
npm install
```

Install playwright
```bash
npx playwright install
```

Create a `.env` file and add your Gemini API key

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
```

### Running the script

```bash
npm run dev
```


