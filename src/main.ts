import * as core from '@actions/core';
import {context, getOctokit} from '@actions/github';
import {EventPayloads} from '@octokit/webhooks';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';
import fs from 'fs';
import yaml from 'js-yaml';
import Mustache from 'mustache';
import {openIssue, closeIssue, unlockIssue, lockIssue} from './issues-helper';
import {IssuesCreateCommentResponseData, OctokitResponse} from '@octokit/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupConsoleLog(groupTitle: string, body: any, debug: boolean): void {
  if (!debug) return;
  core.startGroup(groupTitle);
  console.log(body);
  core.endGroup();
}

export async function run(): Promise<void> {
  try {
    core.info('[INFO] Usage https://github.com/peaceiris/actions-label-commenter#readme');

    const inps: Inputs = getInputs();

    groupConsoleLog('Dump GitHub context', context, core.isDebug());

    const eventName: string = context.eventName;
    const payload = context.payload as
      | EventPayloads.WebhookPayloadIssues
      | EventPayloads.WebhookPayloadPullRequest;
    const labelEvent: string = payload.action;

    const labelName: string = (() => {
      if (eventName === 'issues') {
        const payloadIssuesLabel = (payload as EventPayloads.WebhookPayloadIssues)
          .label as EventPayloads.WebhookPayloadIssuesLabel;
        return payloadIssuesLabel.name;
      } else {
        // if (eventName === 'pull_request' || eventName === 'pull_request_target')
        const payloadPullRequestLabel = (payload as EventPayloads.WebhookPayloadPullRequest)
          .label as EventPayloads.WebhookPayloadPullRequestLabel;
        return payloadPullRequestLabel.name;
      }
    })();

    const issueNumber: number = (() => {
      if (eventName === 'issues') {
        const payloadIssuesIssue = (payload as EventPayloads.WebhookPayloadIssues)
          .issue as EventPayloads.WebhookPayloadIssuesIssue;
        return payloadIssuesIssue.number;
      } else {
        // if (eventName === 'pull_request' || eventName === 'pull_request_target')
        return (payload as EventPayloads.WebhookPayloadPullRequest).number;
      }
    })();

    core.info(`\
[INFO] config_file: ${inps.ConfigFilePath}
[INFO] labelName: ${labelName}
[INFO] labelEvent: ${labelEvent}
[INFO] issueNumber: ${issueNumber}\
  `);

    const configFilePath = inps.ConfigFilePath;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = yaml.safeLoad(fs.readFileSync(configFilePath, 'utf8'));
    if (core.isDebug()) {
      core.startGroup('Dump Config');
      console.log(config);
      core.endGroup();
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
      core.info(`[INFO] no configuration labels.${labelName}`);
      return;
    }

    if (config.labels[labelIndex][`${labelEvent}`] === void 0) {
      core.info(`[INFO] no configuration labels.${labelName}.${labelEvent}`);
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
        core.info(`[INFO] no configuration labels.${labelName}.${labelEvent}.${eventType}`);
        return;
      }
    } else if (eventName === 'pull_request' || eventName === 'pull_request_target') {
      eventType = 'pr';
      if (config.labels[labelIndex][`${labelEvent}`].pr === void 0) {
        core.info(`[INFO] no configuration labels.${labelName}.${labelEvent}.${eventType}`);
        return;
      }
    }

    const parentFieldName = `labels.${labelName}.${labelEvent}.${eventType}`;
    const logURL = `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['GITHUB_RUN_ID']}`;

    // Merge comment body
    const commentMain = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].body + '\n\n';
    const commentHeader = config.comment?.header + '\n\n';
    const commentFooter = config.comment?.footer + '\n\n';
    const commentFooterLinks =
      `<div align="right">` +
      `<a href="${logURL}">Log</a>` +
      ` | ` +
      `<a href="https://github.com/peaceiris/actions-label-commenter#readme">Bot Usage</a>` +
      `</div>\n` +
      '\n<!-- peaceiris/actions-label-commenter -->\n';
    const rawCommentBody = commentHeader + commentMain + commentFooter + commentFooterLinks;

    if (commentMain === '' || commentMain === void 0) {
      core.info(`[INFO] no configuration ${parentFieldName}.body`);
    } else {
      groupConsoleLog('rawCommentBody', rawCommentBody, core.isDebug());
    }

    const finalAction = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].action;
    core.info(`[INFO] finalAction: ${finalAction}`);

    // Render template
    const commentBodyView = (() => {
      if (eventName === 'issues') {
        return {
          issue: {
            user: {
              login: (payload as EventPayloads.WebhookPayloadIssues).issue.user.login
            }
          },
          sender: {
            login: (payload as EventPayloads.WebhookPayloadIssues).sender.login
          }
        };
      } else if (eventName === 'pull_request' || eventName === 'pull_request_target') {
        return {
          pull_request: {
            user: {
              login: (payload as EventPayloads.WebhookPayloadPullRequest).pull_request.user.login
            }
          },
          sender: {
            login: (payload as EventPayloads.WebhookPayloadPullRequest).sender.login
          }
        };
      } else {
        return {};
      }
    })();
    const commentBodyRendered = Mustache.render(rawCommentBody, commentBodyView);
    groupConsoleLog('commentBodyRendered', commentBodyRendered, core.isDebug());

    // Create octokit client
    const githubToken = inps.GithubToken;
    const githubClient = getOctokit(githubToken);

    // Get locking config
    const locking = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].locking;
    if (locking === 'lock' || locking === 'unlock') {
      core.info(`[INFO] ${parentFieldName}.locking is ${locking}`);
    } else if (locking === '' || locking === void 0) {
      core.info(`[INFO] no configuration ${parentFieldName}.locking`);
    } else {
      throw new Error(`invalid value "${locking}" ${parentFieldName}.locking`);
    }

    // Unlock an issue
    if (locking === 'unlock') {
      const unlockResult = await unlockIssue(githubClient, issueNumber);
      groupConsoleLog('Unlock issue', unlockResult, core.isDebug());
    }

    // Get locked status
    const locked: boolean = (() => {
      if (locking === 'unlock') {
        return false;
      } else if (eventName === 'issues') {
        const payloadIssuesIssue = (payload as EventPayloads.WebhookPayloadIssues)
          .issue as EventPayloads.WebhookPayloadIssuesIssue;
        return payloadIssuesIssue.locked;
      } else {
        // if (eventName === 'pull_request' || eventName === 'pull_request_target')
        return (payload as EventPayloads.WebhookPayloadPullRequest).pull_request.locked;
      }
    })();

    // Post comment
    if (!locked) {
      const issuesCreateCommentResponse: OctokitResponse<IssuesCreateCommentResponseData> = await githubClient.issues.createComment(
        {
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: commentBodyRendered
        }
      );
      groupConsoleLog('issuesCreateCommentResponse', issuesCreateCommentResponse, core.isDebug());
    }

    // Close or Open an issue
    if (finalAction === 'close') {
      await closeIssue(githubClient, issueNumber);
    } else if (finalAction === 'open') {
      await openIssue(githubClient, issueNumber);
    } else if (finalAction === '' || finalAction === void 0) {
      core.info(`[INFO] no configuration ${parentFieldName}.action`);
    } else {
      throw new Error(`invalid value "${finalAction}" ${parentFieldName}.action`);
    }

    // Lock an issue
    if (locking === 'lock') {
      const lockReason = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].lock_reason;
      const lockResult = await lockIssue(githubClient, issueNumber, lockReason);
      groupConsoleLog('Lock issue', lockResult, core.isDebug());
    }

    return;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}
