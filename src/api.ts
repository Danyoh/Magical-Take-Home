import "dotenv-defaults/config";
import { createServer } from "http";
import { main } from "./main";
import { loadWorkflowInput } from "./workflowInput";

const port = Number(process.env.PORT ?? 3000);
let isRunning = false;

function sendJson(response: import("http").ServerResponse, statusCode: number, payload: unknown) {
	response.writeHead(statusCode, { "Content-Type": "application/json" });
	response.end(JSON.stringify(payload));
}

const server = createServer(async (request, response) => {
	if (request.method === "POST" && request.url === "/run") {
		if (isRunning) {
			sendJson(response, 409, { status: "busy" });
			return;
		}

		isRunning = true;

		try {
			const workflowInput = await loadWorkflowInput();
			await main(workflowInput);
			sendJson(response, 200, { status: "completed" });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			sendJson(response, 500, { status: "failed", message });
		} finally {
			isRunning = false;
		}

		return;
	}

	if (request.method === "GET" && request.url === "/health") {
		sendJson(response, 200, { status: "ok", running: isRunning });
		return;
	}

	sendJson(response, 404, { status: "not_found" });
});

server.listen(port, () => {
	console.log(`Workflow API listening on http://localhost:${port}`);
});