import {setFailed} from '@actions/core';

import {run} from './main';

(async (): Promise<void> => {
  try {
    await run();
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    } else {
      setFailed('unexpected error');
    }
  }
})();
