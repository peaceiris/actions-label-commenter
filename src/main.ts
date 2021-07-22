import {startGroup, endGroup, info, isDebug} from '@actions/core';
import {context, getOctokit} from '@actions/github';
import Mustache from 'mustache';

import {ConfigParser} from './classes/config-parser';
import {ContextParser} from './classes/context-parser';
import {ActionInfo} from './constants';
import {getInputs} from './get-inputs';
import {Inputs, RunContext} from './interfaces';
import {createComment, openIssue, closeIssue, unlockIssue, lockIssue} from './issues-helper';
import {
  IssuesCreateCommentResponse,
  IssuesUpdateResponse,
  IssuesLockResponse,
  IssuesUnlockResponse
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupConsoleLog(groupTitle: string, body: any, debug: boolean): void {
  if (!debug) return;
  startGroup(groupTitle);
  console.log(body);
  endGroup();
}

export async function run(): Promise<void> {
  try {
    info(`[INFO] Version ${ActionInfo.Version}`);
    const readmeUrl = `https://github.com/${ActionInfo.Owner}/${ActionInfo.Name}#readme`;
    info(`[INFO] Usage ${readmeUrl}`);

    const inps: Inputs = getInputs();

    groupConsoleLog('Dump GitHub context', context, isDebug());

    const contextParser = new ContextParser(context);
    const runContext: RunContext = {
      ConfigFilePath: inps.ConfigFilePath,
      LabelName: contextParser.labelName as string,
      LabelEvent: contextParser.action,
      EventName: contextParser.eventName,
      EventType: contextParser.eventType
    };
    const issueNumber = contextParser.issueNumber;

    startGroup('[INFO] Dump runContext');
    console.log(runContext);
    endGroup();
    info(`[INFO] issue number: ${issueNumber}`);

    const configParser = new ConfigParser(runContext);

    if (isDebug()) {
      startGroup('Dump config');
      console.log(configParser.config);
      endGroup();
    }

    if (!configParser.labelIndex || !configParser.isExistsField) {
      return;
    }

    const parentFieldName = `labels.${runContext.LabelName}.${runContext.LabelEvent}.${runContext.EventType}`;
    const logURL = `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['GITHUB_RUN_ID']}`;

    // Merge comment body
    const commentMain =
      configParser.config.labels[configParser.labelIndex][`${runContext.LabelEvent}`][
        `${runContext.EventType}`
      ].body;
    const commentHeader = configParser.config.comment?.header ?? '';
    const commentFooter = configParser.config.comment?.footer ?? '';
    const commentFooterLinks =
      `<div align="right">` +
      `<a href="${logURL}">Log</a>` +
      ` | ` +
      `<a href="${readmeUrl}">Bot Usage</a>` +
      `</div>\n` +
      `\n<!-- ${ActionInfo.Owner}/${ActionInfo.Name} -->\n`;
    const rawCommentBody = (() => {
      if (isDebug()) {
        return `${commentHeader}\n\n${commentMain}\n\n${commentFooter}\n\n${commentFooterLinks}`;
      }
      return `${commentHeader}\n\n${commentMain}\n\n${commentFooter}`;
    })();

    if (commentMain === '' || commentMain === void 0) {
      info(`[INFO] no configuration ${parentFieldName}.body`);
    } else {
      groupConsoleLog('commentMain', commentMain, isDebug());
      groupConsoleLog('commentHeader', commentHeader, isDebug());
      groupConsoleLog('commentFooter', commentFooter, isDebug());
      groupConsoleLog('commentFooterLinks', commentFooterLinks, isDebug());
      groupConsoleLog('rawCommentBody', rawCommentBody, isDebug());
    }

    // Render template
    const commentBodyView = (() => {
      if (runContext.EventName === 'issues') {
        return {
          issue: {
            user: {
              login: contextParser.userLogin
            }
          },
          sender: {
            login: contextParser.senderLogin
          }
        };
      } else if (
        runContext.EventName === 'pull_request' ||
        runContext.EventName === 'pull_request_target'
      ) {
        return {
          pull_request: {
            user: {
              login: contextParser.userLogin
            }
          },
          sender: {
            login: contextParser.senderLogin
          }
        };
      } else {
        return {};
      }
    })();
    const commentBodyRendered = Mustache.render(rawCommentBody, commentBodyView);
    groupConsoleLog('commentBodyRendered', commentBodyRendered, isDebug());

    // Create octokit client
    const githubToken = inps.GithubToken;
    const githubClient = getOctokit(githubToken);

    // Get locking config
    const locking =
      configParser.config.labels[configParser.labelIndex][`${runContext.LabelEvent}`][
        `${runContext.EventType}`
      ].locking;
    if (locking === 'lock' || locking === 'unlock') {
      info(`[INFO] ${parentFieldName}.locking is ${locking}`);
    } else if (locking === '' || locking === void 0) {
      info(`[INFO] no configuration ${parentFieldName}.locking`);
    } else {
      throw new Error(`invalid value "${locking}" ${parentFieldName}.locking`);
    }

    // Unlock an issue
    if (locking === 'unlock') {
      const issuesUnlockResponse: IssuesUnlockResponse = await unlockIssue(
        githubClient,
        issueNumber
      );
      groupConsoleLog('Unlock issue', issuesUnlockResponse, isDebug());
    }

    // Get locked status
    const locked: boolean | undefined = (() => {
      if (locking === 'unlock') {
        return false;
      } else if (runContext.EventName === 'issues') {
        return contextParser.locked;
      } else {
        return contextParser.locked;
      }
    })();

    // Post comment
    if (!locked) {
      const issuesCreateCommentResponse: IssuesCreateCommentResponse = await createComment(
        githubClient,
        context,
        commentBodyRendered
      );
      groupConsoleLog('issuesCreateCommentResponse', issuesCreateCommentResponse, isDebug());
      info(`[INFO] comment URL: ${issuesCreateCommentResponse.data.html_url}`);
    }

    // Close or Open an issue
    const finalAction =
      configParser.config.labels[configParser.labelIndex][`${runContext.LabelEvent}`][
        `${runContext.EventType}`
      ].action;
    if (finalAction === 'close') {
      const issuesCloseResponse: IssuesUpdateResponse = await closeIssue(githubClient, issueNumber);
      groupConsoleLog('issuesCloseResponse', issuesCloseResponse, isDebug());
    } else if (finalAction === 'open') {
      const issuesOpenResponse: IssuesUpdateResponse = await openIssue(githubClient, issueNumber);
      groupConsoleLog('issuesOpenResponse', issuesOpenResponse, isDebug());
    } else if (finalAction === '' || finalAction === void 0) {
      info(`[INFO] no configuration ${parentFieldName}.action`);
    } else {
      throw new Error(`invalid value "${finalAction}" ${parentFieldName}.action`);
    }

    // Lock an issue
    if (locking === 'lock') {
      const lockReason =
        configParser.config.labels[configParser.labelIndex][`${runContext.LabelEvent}`][
          `${runContext.EventType}`
        ].lock_reason;
      const issuesLockResponse: IssuesLockResponse = await lockIssue(
        githubClient,
        issueNumber,
        lockReason
      );
      groupConsoleLog('Lock issue', issuesLockResponse, isDebug());
    }

    return;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}
