import {startGroup, endGroup} from '@actions/core';

type logLevel = 'debug' | 'info' | 'warn' | 'error';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
function groupConsoleLog(title: string, body: any, level: logLevel): void {
  startGroup(`[${level.toUpperCase}] ${title}`);
  console.log(body);
  endGroup();
}

export {groupConsoleLog};
