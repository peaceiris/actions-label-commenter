import {
  startGroup,
  endGroup,
  isDebug,
  info as coreInfo,
  debug as coreDebug,
  warning as coreWarning,
  error as coreError
} from '@actions/core';

type LogLevel = 'debug' | 'info' | 'warning' | 'error';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
function groupConsoleLog(title: string, body: any, level: LogLevel): void {
  if (level === ('debug' as LogLevel) && !isDebug()) {
    return;
  }
  startGroup(`[${level}] ${title}`);
  console.log(body);
  endGroup();
}

function info(message: string): void {
  coreInfo(`[${coreInfo.name}] ${message}`);
}

function debug(message: string): void {
  coreDebug(`[${coreDebug.name}] ${message}`);
}

function warning(message: string): void {
  coreWarning(`[${coreWarning.name}] ${message}`);
}

function error(message: string): void {
  coreError(`[${coreError.name}] ${message}`);
}

export {groupConsoleLog, info, debug, warning, error};
