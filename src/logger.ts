import {startGroup, endGroup, info as coreInfo} from '@actions/core';

const isTest = Boolean(process.env['ACTIONS_LABEL_COMMENTER_TEST']);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
function groupConsoleLog(title: string, body: any): void {
  if (isTest) return;
  startGroup(`${title}`);
  console.log(body);
  endGroup();
}

function info(message: string): void {
  if (isTest) return;
  coreInfo(`${message}`);
}

export {groupConsoleLog, info};
