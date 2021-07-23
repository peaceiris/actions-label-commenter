import {startGroup, endGroup, info, isDebug} from '@actions/core';
import {context, getOctokit} from '@actions/github';

import {CommentGenerator} from './classes/comment-generator';
import {lockingType, ConfigParser} from './classes/config-parser';
import {ContextParser} from './classes/context-parser';
import {ActionInfo} from './constants';
import {getInputs} from './get-inputs';
import {Inputs, RunContext} from './interfaces';
import {createComment, openIssue, closeIssue, unlockIssue, lockIssue} from './issues-helper';
import {groupConsoleLog} from './logger';
import {
  IssuesCreateCommentResponse,
  IssuesUpdateResponse,
  IssuesLockResponse,
  IssuesUnlockResponse
} from './types';

export async function run(): Promise<void> {
  try {
    info(`[INFO] Version ${ActionInfo.Version}`);
    const readmeUrl = `https://github.com/${ActionInfo.Owner}/${ActionInfo.Name}#readme`;
    info(`[INFO] Usage ${readmeUrl}`);

    const inps: Inputs = getInputs();

    groupConsoleLog('Dump GitHub context', context, 'debug');

    const contextParser = new ContextParser(context);
    const runContext: RunContext = {
      ConfigFilePath: inps.ConfigFilePath,
      LabelName: contextParser.labelName as string,
      LabelEvent: contextParser.action,
      EventName: contextParser.eventName,
      EventType: contextParser.eventType
    };
    const issueNumber = contextParser.issueNumber;

    groupConsoleLog('Dump runContext', runContext, 'info');
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

    // Generate comment body
    const comment = new CommentGenerator(contextParser, configParser, runContext);
    comment.dumpComponents();

    // Create octokit client
    const githubToken = inps.GithubToken;
    const githubClient = getOctokit(githubToken);

    // Unlock an issue
    if (configParser.locking === ('unlock' as lockingType)) {
      const issuesUnlockResponse: IssuesUnlockResponse = await unlockIssue(
        githubClient,
        issueNumber
      );
      groupConsoleLog('Unlock issue', issuesUnlockResponse, 'debug');
    }

    // Get locked status
    const locked: boolean | undefined = (() => {
      if (configParser.locking === ('unlock' as lockingType)) {
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
        comment.render
      );
      groupConsoleLog('issuesCreateCommentResponse', issuesCreateCommentResponse, 'debug');
      info(`[INFO] comment URL: ${issuesCreateCommentResponse.data.html_url}`);
    }

    // Close or Open an issue
    const finalAction =
      configParser.config.labels[configParser.labelIndex][`${runContext.LabelEvent}`][
        `${runContext.EventType}`
      ].action;
    if (finalAction === 'close') {
      const issuesCloseResponse: IssuesUpdateResponse = await closeIssue(githubClient, issueNumber);
      groupConsoleLog('issuesCloseResponse', issuesCloseResponse, 'debug');
    } else if (finalAction === 'open') {
      const issuesOpenResponse: IssuesUpdateResponse = await openIssue(githubClient, issueNumber);
      groupConsoleLog('issuesOpenResponse', issuesOpenResponse, 'debug');
    } else if (finalAction === '' || finalAction === void 0) {
      info(`[INFO] no configuration ${configParser.parentFieldName}.action`);
    } else {
      throw new Error(`invalid value "${finalAction}" ${configParser.parentFieldName}.action`);
    }

    // Lock an issue
    if (configParser.locking === ('lock' as lockingType)) {
      const lockReason =
        configParser.config.labels[configParser.labelIndex][`${runContext.LabelEvent}`][
          `${runContext.EventType}`
        ].lock_reason;
      const issuesLockResponse: IssuesLockResponse = await lockIssue(
        githubClient,
        issueNumber,
        lockReason
      );
      groupConsoleLog('Lock issue', issuesLockResponse, 'debug');
    }

    return;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}
