import { Client, Run } from "@langchain/langgraph-sdk";

interface DelayRunInputs {
  /**
   * The number of seconds to delay the run by.
   */
  seconds: number;
  /**
   * The node to resume on.
   */
  resumeNode: string;
  /**
   * The ID of the thread to resume in.
   */
  threadId: string;
  /**
   * The assistant ID to resume the run in.
   */
  assistantId: string;
  /**
   * The run ID of the current run to cancel.
   */
  runId: string;
  /**
   * The value of the state to resume the run with.
   */
  state: Record<string, any>;
  /**
   * Configurable values to pass to the run.
   */
  configurable?: Record<string, any>;
}

/**
 * Delay the execution of a run by a specified number of seconds.
 * This function will cancel the current run, and create a new run
 * for the same thread, with the specified state and configurable
 * fields to be executed after a delay.
 * @param param0 - The inputs to the function.
 * @returns The new run.
 */
export async function delayRun({
  seconds,
  resumeNode,
  threadId,
  assistantId,
  runId,
  state,
  configurable,
}: DelayRunInputs): Promise<Run> {
  const client = new Client({
    apiUrl:
      process.env.LANGGRAPH_API_URL || `http://localhost:${process.env.PORT}`,
  });

  const newRun = await client.runs.create(threadId, assistantId, {
    input: {},
    config: {
      configurable: {
        ...(configurable || {}),
      },
    },
    command: {
      update: state,
      goto: resumeNode,
    },
    afterSeconds: seconds,
  });

  await client.runs.cancel(threadId, runId);
  return newRun;
}
