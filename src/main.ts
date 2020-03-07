import * as core from '@actions/core';
import {context, GitHub} from '@actions/github';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';
import fs from 'fs';
import yaml from 'js-yaml';

async function closeIssue(
  githubClient: GitHub,
  issueNumber: number
): Promise<void> {
  await githubClient.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber, // eslint-disable-line @typescript-eslint/camelcase
    state: 'closed'
  });
  return;
}

async function openIssue(
  githubClient: GitHub,
  issueNumber: number
): Promise<void> {
  await githubClient.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber, // eslint-disable-line @typescript-eslint/camelcase
    state: 'open'
  });
  return;
}

export async function run(): Promise<void> {
  try {
    const inps: Inputs = getInputs();

    console.log(context);

    const eventName = context.eventName;
    const labelEvent = context.payload.action;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labelName = (context.payload as any).label.name;
    let issueNumber = 0;
    if (eventName === 'issues') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      issueNumber = (context.payload as any).issue.number;
    } else if (eventName === 'pull_request') {
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
    const config = yaml.safeLoad(fs.readFileSync(configFilePath, 'utf8'));
    console.log(config);

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
      core.info(`no configuration for ${labelName}`);
      return;
    }

    if (config.labels[labelIndex][`${labelEvent}`] === void 0) {
      core.info(`no configuration for ${labelName} ${labelEvent}`);
      return;
    }

    if (
      config.labels[labelIndex][`${labelEvent}`].issue === void 0 &&
      config.labels[labelIndex][`${labelEvent}`].pr === void 0
    ) {
      throw new Error(
        `not found any definition for labels.${labelName}.${labelEvent}`
      );
    }

    let eventType = '';
    if (eventName === 'issues') {
      eventType = 'issue';
      if (config.labels[labelIndex][`${labelEvent}`].issue === void 0) {
        eventType = 'pr';
      }
    } else if (eventName === 'pull_request') {
      eventType = 'pr';
      if (config.labels[labelIndex][`${labelEvent}`].pr === void 0) {
        eventType = 'issue';
      }
    }

    const commentBody =
      config.labels[labelIndex][`${labelEvent}`][`${eventType}`].body;
    const finalAction =
      config.labels[labelIndex][`${labelEvent}`][`${eventType}`].action;
    core.info(`\
[INFO] commentBody: ${commentBody}
[INFO] finalAction: ${finalAction}\
`);

    const githubToken = inps.GithubToken;
    const githubClient = new GitHub(githubToken);
    await githubClient.issues.createComment({
      // eslint-disable-next-line @typescript-eslint/camelcase
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: commentBody
    });

    if (finalAction === 'close') {
      await closeIssue(githubClient, issueNumber);
    } else if (finalAction === 'open') {
      await openIssue(githubClient, issueNumber);
    }

    return;
  } catch (error) {
    throw new Error(error.message);
  }
}
