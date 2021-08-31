import {setFailed} from '@actions/core';

import {groupConsoleLog} from './logger';
import {run} from './main';

(async (): Promise<void> => {
  try {
    await run();
  } catch (error) {
    if (error instanceof Error) {
      groupConsoleLog('Dump error.stack', error.message);
      setFailed(error.message);
    } else {
      setFailed('unexpected error');
    }
  }
})();
