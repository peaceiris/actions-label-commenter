import {setFailed} from '@actions/core';

import {groupConsoleLog} from './logger';
import {run} from './main';

(async (): Promise<void> => {
  try {
    await run();
  } catch (error) {
    groupConsoleLog('Dump error.stack', error.stack);
    setFailed(`Action failed with error: ${error.message}`);
  }
})();
