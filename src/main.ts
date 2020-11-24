import * as core from '@actions/core';
import {context, getOctokit} from '@actions/github';
import {EventPayloads} from '@octokit/webhooks';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';
import fs from 'fs';
import yaml from 'js-yaml';
import Mustache from 'mustache';
import {openIssue, closeIssue, lockHandler} from './issues-helper';
import {IssuesCreateCommentResponseData, OctokitResponse} from '@octokit/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function consoleDebug(groupTitle: string, body: any): void {
  if (core.isDebug()) {
    core.startGroup(groupTitle);
    console.log(body);
    core.endGroup();
  }
}

export async function run(): Promise<void> {
  try {
    core.info('[INFO] Usage https://github.com/peaceiris/actions-label-commenter#readme');

    const inps: Inputs = getInputs();

    consoleDebug('Dump GitHub context', context);

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

    const logURL = `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['GITHUB_RUN_ID']}`;
    const commentBody =
      config.labels[labelIndex][`${labelEvent}`][`${eventType}`].body +
      `\n<div align="right">` +
      `<a href="${logURL}">Log</a>` +
      ` | ` +
      `<a href="https://github.com/peaceiris/actions-label-commenter#readme">Bot Usage</a>` +
      `</div>\n` +
      '\n<!-- peaceiris/actions-label-commenter -->\n';
    const finalAction = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].action;
    core.info(`\
[INFO] commentBody: ${commentBody}
[INFO] finalAction: ${finalAction}\
  `);

    if (commentBody === '' || commentBody === void 0) {
      core.info(`[INFO] no configuration labels.${labelName}.${labelEvent}.${eventType}.body`);
    }

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
    const commentBodyRendered = Mustache.render(commentBody, commentBodyView);

    // Create octokit client
    const githubToken = inps.GithubToken;
    const githubClient = getOctokit(githubToken);

    // Unlock an issue
    const locking = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].locking;
    const unlockResult = await lockHandler(
      `labels.${labelName}.${labelEvent}.${eventType}`,
      githubClient,
      issueNumber,
      locking
    );
    consoleDebug('Unlock issue', unlockResult);

    // Post comment
    const issuesCreateCommentResponse: OctokitResponse<IssuesCreateCommentResponseData> = await githubClient.issues.createComment(
      {
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: commentBodyRendered
      }
    );
    consoleDebug('issuesCreateCommentResponse', issuesCreateCommentResponse);

    // Close or Open an issue
    if (finalAction === 'close') {
      await closeIssue(githubClient, issueNumber);
    } else if (finalAction === 'open') {
      await openIssue(githubClient, issueNumber);
    } else if (finalAction === '' || finalAction === void 0) {
      core.info(`[INFO] no configuration labels.${labelName}.${labelEvent}.${eventType}.action`);
    } else {
      throw new Error(
        `invalid value "${finalAction}" labels.${labelName}.${labelEvent}.${eventType}.action`
      );
    }

    // Lock an issue
    const lockReason = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].lock_reason;
    const lockResult = await lockHandler(
      `labels.${labelName}.${labelEvent}.${eventType}`,
      githubClient,
      issueNumber,
      locking,
      lockReason
    );
    consoleDebug('Lock issue', lockResult);

    return;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}
