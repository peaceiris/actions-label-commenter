import {ActionProcessor} from './classes/action-processor';

export async function run(): Promise<void> {
  try {
    const actionProcessor: ActionProcessor = new ActionProcessor();
    await actionProcessor.process();
  } catch (error) {
    throw new Error(error.message);
  }
}
