import {getOctokit, context} from '@actions/github';

import {ActionProcessor} from './classes/action-processor';
import {Comment} from './classes/comment';
import {ConfigLoader} from './classes/config';
import {ContextLoader} from './classes/context-loader';
import {Inputs} from './classes/inputs';
import {Issue} from './classes/issue';
import {ActionInfo} from './constants';
import {info} from './logger';

export async function run(): Promise<void> {
  try {
    info(`Version ${ActionInfo.Version}`);
    const readmeUrl = `https://github.com/${ActionInfo.Owner}/${ActionInfo.Name}#readme`;
    info(`Usage ${readmeUrl}`);

    const inputs = new Inputs();
    const githubClient = getOctokit(inputs.GithubToken);
    const contextLoader = new ContextLoader(inputs, context);
    contextLoader.dumpContext();
    const configLoader = await ConfigLoader.build(contextLoader.runContext);
    await configLoader.loadConfig(githubClient);
    const comment = new Comment(contextLoader.runContext, configLoader);
    comment.dumpComponents();
    const issue = new Issue(githubClient, contextLoader.runContext.id, contextLoader.issueNumber);
    const actionProcessor = new ActionProcessor(
      contextLoader.runContext.eventAlias,
      configLoader.getConfig(),
      comment.render,
      issue,
      contextLoader.locked
    );
    await actionProcessor.process();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
}
