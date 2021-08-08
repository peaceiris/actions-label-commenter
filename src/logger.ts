import {isDebug, startGroup, endGroup, info as coreInfo} from '@actions/core';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
function groupConsoleLog(title: string, body: any): void {
  if (!isDebug()) return;
  startGroup(`${title}`);
  console.log(body);
  endGroup();
}

function info(message: string): void {
  coreInfo(`${message}`);
}

export {groupConsoleLog, info};
