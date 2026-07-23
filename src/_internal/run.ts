import "dotenv-defaults/config";
import { main } from "../main";
import { loadWorkflowInput } from "../workflowInput";

(async () => {
  const workflowInput = await loadWorkflowInput();
  await main(workflowInput);
})();

