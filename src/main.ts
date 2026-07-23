import { generateText } from "ai";
import type { Page } from "playwright";
import { model } from "./_internal/setup";
import { createSession } from "./session";

export type WorkflowInput = {
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	medicalId: string;
	gender: string;
	bloodType: string;
	allergies: string;
	medications: string;
	emergencyContact: string;
	emergencyPhone: string;
};

const defaultWorkflowInput: WorkflowInput = {
	firstName: "John",
	lastName: "Doe",
	dateOfBirth: "1990-01-01",
	medicalId: "91927885",
	gender: "male",
	bloodType: "O+",
	allergies: "Peanuts",
	medications: "None",
	emergencyContact: "Jane Doe",
	emergencyPhone: "555-123-4567",
};

type SectionName = "Personal Information" | "Medical Information" | "Emergency Contact";

type FormFieldName =
	| "First Name"
	| "Last Name"
	| "Date of Birth"
	| "Medical ID"
	| "Gender"
	| "Blood Type"
	| "Allergies"
	| "Current Medications"
	| "Emergency Contact Name"
	| "Emergency Contact Phone";

type AgentAction =
	| {
			action: "open_section";
			section: SectionName;
	  }
	| {
			action: "set_field";
			field: FormFieldName;
			value: string;
	  }
	| {
			action: "submit";
	  }
	| {
			action: "done";
	  };

type FormState = {
	fields: Record<FormFieldName, string>;
	submitted: boolean;
	activeSection: SectionName | null;
};

type FieldConfig = {
	section: SectionName;
	kind: "fill" | "select";
	targetKey: keyof WorkflowInput;
};

const sectionOrder: SectionName[] = ["Personal Information", "Medical Information", "Emergency Contact"];

const allFields: FormFieldName[] = [
	"First Name",
	"Last Name",
	"Date of Birth",
	"Medical ID",
	"Gender",
	"Blood Type",
	"Allergies",
	"Current Medications",
	"Emergency Contact Name",
	"Emergency Contact Phone",
];

const fieldConfigs: Record<FormFieldName, FieldConfig> = {
	"First Name": { section: "Personal Information", kind: "fill", targetKey: "firstName" },
	"Last Name": { section: "Personal Information", kind: "fill", targetKey: "lastName" },
	"Date of Birth": { section: "Personal Information", kind: "fill", targetKey: "dateOfBirth" },
	"Medical ID": { section: "Personal Information", kind: "fill", targetKey: "medicalId" },
	Gender: { section: "Medical Information", kind: "select", targetKey: "gender" },
	"Blood Type": { section: "Medical Information", kind: "select", targetKey: "bloodType" },
	Allergies: { section: "Medical Information", kind: "fill", targetKey: "allergies" },
	"Current Medications": { section: "Medical Information", kind: "fill", targetKey: "medications" },
	"Emergency Contact Name": { section: "Emergency Contact", kind: "fill", targetKey: "emergencyContact" },
	"Emergency Contact Phone": { section: "Emergency Contact", kind: "fill", targetKey: "emergencyPhone" },
};

const visibleFieldBySection: Record<SectionName, FormFieldName> = {
	"Personal Information": "First Name",
	"Medical Information": "Gender",
	"Emergency Contact": "Emergency Contact Name",
};

function createEmptyFieldState(): Record<FormFieldName, string> {
	return {
		"First Name": "",
		"Last Name": "",
		"Date of Birth": "",
		"Medical ID": "",
		Gender: "",
		"Blood Type": "",
		Allergies: "",
		"Current Medications": "",
		"Emergency Contact Name": "",
		"Emergency Contact Phone": "",
	};
}

function getFieldsForSection(section: SectionName): FormFieldName[] {
	return allFields.filter((field) => fieldConfigs[field].section === section);
}

function getTargetState(workflowInput: WorkflowInput): Record<FormFieldName, string> {
	return {
		"First Name": workflowInput.firstName,
		"Last Name": workflowInput.lastName,
		"Date of Birth": workflowInput.dateOfBirth,
		"Medical ID": workflowInput.medicalId,
		Gender: workflowInput.gender,
		"Blood Type": workflowInput.bloodType,
		Allergies: workflowInput.allergies,
		"Current Medications": workflowInput.medications,
		"Emergency Contact Name": workflowInput.emergencyContact,
		"Emergency Contact Phone": workflowInput.emergencyPhone,
	};
}

async function readFieldValue(page: Page, field: FormFieldName): Promise<string> {
	const locator = page.getByLabel(field);
	if ((await locator.count()) === 0) {
		return "";
	}

	return locator.inputValue();
}

async function detectActiveSection(page: Page): Promise<SectionName | null> {
	for (const section of sectionOrder) {
		const locator = page.getByLabel(visibleFieldBySection[section]);
		if ((await locator.count()) > 0) {
			return section;
		}
	}

	return null;
}

async function readFormState(page: Page, previousFields: Record<FormFieldName, string>): Promise<FormState> {
	const fields = { ...previousFields };
	for (const field of allFields) {
		const currentValue = await readFieldValue(page, field);
		if (currentValue !== "") {
			fields[field] = currentValue;
		}
	}

	const submitted = await page.getByText("Form submitted successfully!").isVisible().catch(() => false);
	const activeSection = await detectActiveSection(page);

	return { fields, submitted, activeSection };
}

function getNextSection(section: SectionName): SectionName | null {
	const currentIndex = sectionOrder.indexOf(section);
	if (currentIndex === -1 || currentIndex === sectionOrder.length - 1) {
		return null;
	}

	return sectionOrder[currentIndex + 1];
}

function getDeterministicFallbackAction(workflowInput: WorkflowInput, formState: FormState): AgentAction {
	if (formState.submitted) {
		return { action: "done" };
	}

	if (!formState.activeSection) {
		return {
			action: "open_section",
			section: "Personal Information",
		};
	}

	const targetState = getTargetState(workflowInput);
	const activeSectionFields = getFieldsForSection(formState.activeSection);

	for (const field of activeSectionFields) {
		if (formState.fields[field] !== targetState[field]) {
			return {
				action: "set_field",
				field,
				value: targetState[field],
			};
		}
	}

	const nextSection = getNextSection(formState.activeSection);
	if (nextSection) {
		return {
			action: "open_section",
			section: nextSection,
		};
	}

	return { action: "submit" };
}

function extractJsonObject(text: string): string {
	const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fencedMatch) {
		return fencedMatch[1].trim();
	}

	const firstBrace = text.indexOf("{");
	const lastBrace = text.lastIndexOf("}");

	if (firstBrace >= 0 && lastBrace > firstBrace) {
		return text.slice(firstBrace, lastBrace + 1);
	}

	return text.trim();
}

function parseAgentAction(text: string): AgentAction | null {
	try {
		const parsed = JSON.parse(extractJsonObject(text)) as Partial<AgentAction> & {
			section?: string;
			field?: string;
			value?: string;
		};

		if (parsed.action === "open_section") {
			if (!parsed.section || !sectionOrder.includes(parsed.section as SectionName)) {
				return null;
			}

			return {
				action: "open_section",
				section: parsed.section as SectionName,
			};
		}

		if (parsed.action === "set_field") {
			if (!parsed.field || !allFields.includes(parsed.field as FormFieldName)) {
				return null;
			}

			return {
				action: "set_field",
				field: parsed.field as FormFieldName,
				value: parsed.value ?? "",
			};
		}

		if (parsed.action === "submit" || parsed.action === "done") {
			return parsed as AgentAction;
		}
	} catch {
		return null;
	}

	return null;
}

function isActionCompatibleWithState(action: AgentAction, formState: FormState): boolean {
	if (action.action !== "set_field") {
		return true;
	}

	if (!formState.activeSection) {
		return false;
	}

	return fieldConfigs[action.field].section === formState.activeSection;
}

async function chooseNextAction(workflowInput: WorkflowInput, formState: FormState): Promise<AgentAction> {
	const targetState = getTargetState(workflowInput);
	const fallbackAction = getDeterministicFallbackAction(workflowInput, formState);

	const prompt = [
		"You are controlling a browser agent that fills a medical form.",
		"Choose exactly one next action based on the current state.",
		"Available actions:",
		"1. open exactly one section",
		"2. set exactly one field value",
		"3. submit the form once all fields in all sections match",
		"4. done if submission is already confirmed",
		"Return only JSON with one of these shapes:",
		'{"action":"open_section","section":"Medical Information"}',
		'{"action":"set_field","field":"First Name","value":"John"}',
		'{"action":"submit"}',
		'{"action":"done"}',
		"Dropdowns should also use set_field with the visible option value.",
		`Target values: ${JSON.stringify(targetState)}`,
		`Current state: ${JSON.stringify(formState)}`,
	].join("\n");

	const response = await generateText({
		model,
		prompt,
	});

	const parsedAction = parseAgentAction(response.text);
	if (parsedAction && isActionCompatibleWithState(parsedAction, formState)) {
		return parsedAction;
	}

	console.log("Falling back to deterministic action", fallbackAction);
	return fallbackAction;
}

async function executeAction(page: Page, action: AgentAction) {
	if (action.action === "open_section") {
		console.log(`Opening ${action.section}`);
		// Scroll the accordion trigger into view before clicking so section changes stay reliable.
		const sectionButton = page.getByRole("button", { name: action.section });
		await sectionButton.scrollIntoViewIfNeeded();
		await sectionButton.click();
		return;
	}

	if (action.action === "set_field") {
		console.log(`Setting ${action.field}`);
		// Fill or select one visible field at a time so each agent step is easy to reason about.
		const locator = page.getByLabel(action.field);
		const config = fieldConfigs[action.field];

		if (config.kind === "select") {
			await locator.selectOption(action.value);
		} else {
			await locator.fill(action.value);
		}

		return;
	}

	if (action.action === "submit") {
		console.log("Submitting form");
		// Scroll to the final action before submitting because later sections can push the button below the fold.
		const submitButton = page.getByRole("button", { name: "Submit" });
		await submitButton.scrollIntoViewIfNeeded();
		await submitButton.click();
		// Wait briefly for the success toast so the loop does not issue a duplicate submit on the next iteration.
		await page.getByText("Form submitted successfully!").waitFor({ timeout: 5000 }).catch(() => undefined);
		return;
	}

	console.log("Workflow already complete");
}

async function submitAndVerify(page: Page) {
	await page.getByText("Form submitted successfully!").waitFor();

	console.log("Submission confirmed");
}

export async function main(workflowInput: WorkflowInput = defaultWorkflowInput) {
	// This will automatically create a chromium instance, connect, and navigate to the given url.
	// You are given a playwright page back.
	const page = await createSession("https://magical-medical-form.netlify.app/");
	let knownFields = createEmptyFieldState();

	console.log("Starting agent loop");

	for (let step = 1; step <= 15; step += 1) {
		const formState = await readFormState(page, knownFields);
		knownFields = formState.fields;
		if (formState.submitted) {
			break;
		}

		const action = await chooseNextAction(workflowInput, formState);
		console.log(`Step ${step}`, action);

		if (action.action === "done") {
			break;
		}

		await executeAction(page, action);
	}

	await submitAndVerify(page);

	await page.context().browser()?.close();
}
