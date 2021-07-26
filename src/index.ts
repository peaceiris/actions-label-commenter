import {setFailed} from '@actions/core';

import {run} from './main';

(async (): Promise<void> => {
  try {
    await run();
  } catch (error) {
    setFailed(`Action failed with error: ${error.message}`);
  }
})();
