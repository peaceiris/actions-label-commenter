import {
  startGroup,
  endGroup,
  info as coreInfo,
  debug as coreDebug,
  warning as coreWarning,
  error as coreError
} from '@actions/core';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
function groupConsoleLog(title: string, body: any): void {
  startGroup(`${title}`);
  console.log(body);
  endGroup();
}

function info(message: string): void {
  coreInfo(`${message}`);
}

function debug(message: string): void {
  coreDebug(`${message}`);
}

function warning(message: string): void {
  coreWarning(`${message}`);
}

function error(message: string): void {
  coreError(`${message}`);
}

export {groupConsoleLog, info, debug, warning, error};
