import fs from 'fs';

import {startGroup, endGroup, info, isDebug} from '@actions/core';
import {context, getOctokit} from '@actions/github';
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';
import {
  IssuesEvent,
  IssuesLabeledEvent,
  PullRequestEvent,
  PullRequestLabeledEvent
} from '@octokit/webhooks-types';
import yaml from 'js-yaml';
import Mustache from 'mustache';

import {getInputs} from './get-inputs';
import {Inputs} from './interfaces';
import {openIssue, closeIssue, unlockIssue, lockIssue} from './issues-helper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupConsoleLog(groupTitle: string, body: any, debug: boolean): void {
  if (!debug) return;
  startGroup(groupTitle);
  console.log(body);
  endGroup();
}

export async function run(): Promise<void> {
  try {
    info('[INFO] Usage https://github.com/peaceiris/actions-label-commenter#readme');

    const inps: Inputs = getInputs();

    groupConsoleLog('Dump GitHub context', context, isDebug());

    const eventName: string = context.eventName;
    info(`[INFO] event name: ${eventName}`);
    if (
      eventName !== 'issues' &&
      eventName !== 'pull_request' &&
      eventName !== 'pull_request_target'
    ) {
      info(`[INFO] unsupported event: ${eventName}`);
      return;
    }

    const payload = context.payload as IssuesEvent | PullRequestEvent;
    const labelEvent: string = payload.action;

    const labelName: string | undefined = (() => {
      if (eventName === 'issues') {
        return (payload as IssuesLabeledEvent).label?.name;
      } else {
        // if (eventName === 'pull_request' || eventName === 'pull_request_target')
        return (payload as PullRequestLabeledEvent).label?.name;
      }
    })();

    const issueNumber: number = (() => {
      if (eventName === 'issues') {
        return (payload as IssuesEvent).issue.number;
      } else {
        // if (eventName === 'pull_request' || eventName === 'pull_request_target')
        return (payload as PullRequestEvent).number;
      }
    })();

    info(`\
[INFO] config file path: ${inps.ConfigFilePath}
[INFO] label name: ${labelName}
[INFO] label event: ${labelEvent}
[INFO] issue number: ${issueNumber}\
  `);

    const configFilePath = inps.ConfigFilePath;
    // Validate config file location
    if (!fs.existsSync(configFilePath)) {
      throw new Error(`not found ${configFilePath}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = yaml.load(fs.readFileSync(configFilePath, 'utf8'));
    if (isDebug()) {
      startGroup('Dump config');
      console.log(config);
      endGroup();
    }

    let isExistLabel = false;
    let labelIndex = '';
    Object.keys(config.labels).forEach(label => {
      if (config.labels[label].name === labelName) {
        isExistLabel = true;
        if (labelIndex === '') {
          labelIndex = label;
        }
      }
    });

    if (!isExistLabel) {
      info(`[INFO] no configuration labels.${labelName}`);
      return;
    }

    if (config.labels[labelIndex][`${labelEvent}`] === void 0) {
      info(`[INFO] no configuration labels.${labelName}.${labelEvent}`);
      return;
    }

    if (
      config.labels[labelIndex][`${labelEvent}`].issue === void 0 &&
      config.labels[labelIndex][`${labelEvent}`].pr === void 0
    ) {
      throw new Error(`not found any definition labels.${labelName}.${labelEvent}`);
    }

    let eventType = '';
    if (eventName === 'issues') {
      eventType = 'issue';
      if (config.labels[labelIndex][`${labelEvent}`].issue === void 0) {
        info(`[INFO] no configuration labels.${labelName}.${labelEvent}.${eventType}`);
        return;
      }
    } else if (eventName === 'pull_request' || eventName === 'pull_request_target') {
      eventType = 'pr';
      if (config.labels[labelIndex][`${labelEvent}`].pr === void 0) {
        info(`[INFO] no configuration labels.${labelName}.${labelEvent}.${eventType}`);
        return;
      }
    }

    const parentFieldName = `labels.${labelName}.${labelEvent}.${eventType}`;
    const logURL = `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['GITHUB_RUN_ID']}`;

    // Merge comment body
    const commentMain = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].body;
    const commentHeader = config.comment?.header ?? '';
    const commentFooter = config.comment?.footer ?? '';
    const commentFooterLinks =
      `<div align="right">` +
      `<a href="${logURL}">Log</a>` +
      ` | ` +
      `<a href="https://github.com/peaceiris/actions-label-commenter#readme">Bot Usage</a>` +
      `</div>\n` +
      '\n<!-- peaceiris/actions-label-commenter -->\n';
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
      if (eventName === 'issues') {
        return {
          issue: {
            user: {
              login: (payload as IssuesEvent).issue.user.login
            }
          },
          sender: {
            login: (payload as IssuesEvent).sender.login
          }
        };
      } else if (eventName === 'pull_request' || eventName === 'pull_request_target') {
        return {
          pull_request: {
            user: {
              login: (payload as PullRequestEvent).pull_request.user.login
            }
          },
          sender: {
            login: (payload as PullRequestEvent).sender.login
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
    type IssuesCreateCommentResponse = GetResponseTypeFromEndpointMethod<
      typeof githubClient.rest.issues.createComment
    >;

    // Get locking config
    const locking = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].locking;
    if (locking === 'lock' || locking === 'unlock') {
      info(`[INFO] ${parentFieldName}.locking is ${locking}`);
    } else if (locking === '' || locking === void 0) {
      info(`[INFO] no configuration ${parentFieldName}.locking`);
    } else {
      throw new Error(`invalid value "${locking}" ${parentFieldName}.locking`);
    }

    // Unlock an issue
    if (locking === 'unlock') {
      const unlockResult = await unlockIssue(githubClient, issueNumber);
      groupConsoleLog('Unlock issue', unlockResult, isDebug());
    }

    // Get locked status
    const locked: boolean | undefined = (() => {
      if (locking === 'unlock') {
        return false;
      } else if (eventName === 'issues') {
        return (payload as IssuesEvent).issue.locked;
      } else {
        // if (eventName === 'pull_request' || eventName === 'pull_request_target')
        return (payload as PullRequestEvent).pull_request.locked;
      }
    })();

    // Post comment
    if (!locked) {
      const issuesCreateCommentResponse: IssuesCreateCommentResponse =
        await githubClient.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: commentBodyRendered
        });
      groupConsoleLog('issuesCreateCommentResponse', issuesCreateCommentResponse, isDebug());
      info(`[INFO] comment URL: ${issuesCreateCommentResponse.data.html_url}`);
    }

    // Close or Open an issue
    const finalAction = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].action;
    if (finalAction === 'close') {
      await closeIssue(githubClient, issueNumber);
    } else if (finalAction === 'open') {
      await openIssue(githubClient, issueNumber);
    } else if (finalAction === '' || finalAction === void 0) {
      info(`[INFO] no configuration ${parentFieldName}.action`);
    } else {
      throw new Error(`invalid value "${finalAction}" ${parentFieldName}.action`);
    }

    // Lock an issue
    if (locking === 'lock') {
      const lockReason = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].lock_reason;
      const lockResult = await lockIssue(githubClient, issueNumber, lockReason);
      groupConsoleLog('Lock issue', lockResult, isDebug());
    }

    return;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}
