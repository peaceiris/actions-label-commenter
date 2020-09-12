import * as core from '@actions/core';
import {context, getOctokit} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';
import fs from 'fs';
import yaml from 'js-yaml';
import Mustache from 'mustache';

async function closeIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
): Promise<void> {
  await githubClient.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    state: 'closed'
  });
  return;
}

async function openIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
): Promise<void> {
  await githubClient.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    state: 'open'
  });
  return;
}

export async function run(): Promise<void> {
  try {
    const inps: Inputs = getInputs();

    if (core.isDebug()) {
      core.startGroup('Dump GitHub context');
      console.log(context);
      core.endGroup();
    }

    const eventName = context.eventName;
    const labelEvent = context.payload.action;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labelName = (context.payload as any).label.name;
    let issueNumber = 0;
    if (eventName === 'issues') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      issueNumber = (context.payload as any).issue.number;
    } else if (eventName === 'pull_request' || eventName === 'pull_request_target') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      issueNumber = (context.payload as any).number;
    }

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

    const commentBody = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].body;
    const finalAction = config.labels[labelIndex][`${labelEvent}`][`${eventType}`].action;
    core.info(`\
[INFO] commentBody: ${commentBody}
[INFO] finalAction: ${finalAction}\
  `);

    if (commentBody === '' || commentBody === void 0) {
      core.info(`[INFO] no configuration labels.${labelName}.${labelEvent}.${eventType}.body`);
    }

    // Render template
    const commentBodyView = {
      issue: {
        user: {
          login: (context.payload as any).issue.user.login // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      },
      sender: {
        login: (context.payload as any).sender.login // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    };
    const commentBodyRendered = Mustache.render(commentBody, commentBodyView);

    // Post comment
    const githubToken = inps.GithubToken;
    const githubClient = getOctokit(githubToken);
    await githubClient.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: commentBodyRendered
    });

    // Close or Open issue
    if (finalAction === 'close') {
      await closeIssue(githubClient, issueNumber);
    } else if (finalAction === 'open') {
      await openIssue(githubClient, issueNumber);
    } else if (finalAction === '' || finalAction === void 0) {
      core.info(`[INFO] no configuration labels.${labelName}.${labelEvent}.${eventType}.action`);
      return;
    } else {
      throw new Error(
        `invalid value "${finalAction}" labels.${labelName}.${labelEvent}.${eventType}.action`
      );
    }

    return;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}
