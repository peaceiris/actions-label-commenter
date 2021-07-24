import {startGroup, endGroup, isDebug} from '@actions/core';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
function groupConsoleLog(title: string, body: any, level: LogLevel): void {
  if (level === ('debug' as LogLevel) && !isDebug()) {
    return;
  }
  startGroup(`[${level.toUpperCase}] ${title}`);
  console.log(body);
  endGroup();
}

export {groupConsoleLog};
