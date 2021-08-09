import {getOctokit, context} from '@actions/github';

import {ActionProcessor} from './classes/action-processor';
import {Comment} from './classes/comment';
import {ConfigLoader} from './classes/config';
import {ContextLoader} from './classes/context-loader';
import {Inputs} from './classes/inputs';
import {Issue} from './classes/issue';
import {ActionInfo} from './constants';
import {groupConsoleLog, info} from './logger';

export async function run(): Promise<void> {
  try {
    info(`Version ${ActionInfo.Version}`);
    const readmeUrl = `https://github.com/${ActionInfo.Owner}/${ActionInfo.Name}#readme`;
    info(`Usage ${readmeUrl}`);

    const inputs = new Inputs();
    const githubClient = getOctokit(inputs.GithubToken);
    const contextLoader = new ContextLoader(inputs, context);
    const configLoader = new ConfigLoader(contextLoader.runContext);
    const comment = new Comment(contextLoader, configLoader);
    comment.dumpComponents();
    const issue = new Issue(
      githubClient,
      contextLoader.runContext.Id,
      contextLoader.issueNumber,
      contextLoader.locked
    );
    const actionProcessor = new ActionProcessor(configLoader.getConfig(), comment.render, issue);
    await actionProcessor.process();
  } catch (error) {
    groupConsoleLog('Dump error.stack', error.stack);
    throw new Error(error.message);
  }
}
