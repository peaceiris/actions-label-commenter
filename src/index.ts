import * as core from '@actions/core';
import {run} from './main';

(async (): Promise<void> => {
  try {
    await run();
  } catch (error) {
    core.setFailed(`Action failed with error "${error.message}"`);
  }
})();
