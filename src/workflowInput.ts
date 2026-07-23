import { readFile } from "fs/promises";
import { join } from "path";
import type { WorkflowInput } from "./main";

export async function loadWorkflowInput(): Promise<WorkflowInput | undefined> {
	try {
		const workflowInputPath = join(process.cwd(), "workflow-input.json");
		const workflowInputText = await readFile(workflowInputPath, "utf8");
		return JSON.parse(workflowInputText) as WorkflowInput;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return undefined;
		}

		throw error;
	}
}