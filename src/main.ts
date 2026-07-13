import { generateText } from "ai";
import { model } from "./_internal/setup";
import { createSession } from "./session";

export async function main() {
	// This will automatically create a chromium instance, connect, and navigate to the given url.
	// You are given a playwright page back.
	const page = await createSession("https://www.google.com");

	console.log("Querying the LLM");
	// We've given you an model (gemini-3.5-flash), you can use the vercel AI SDK to generate text, setup tools, etc.
	// Ensure you have set the GOOGLE_GENERATIVE_AI_API_KEY environment variable.
	const response = await generateText({
		model,
		prompt: "How many r's are in strawberry?",
	});

	console.log(response.text);
}
