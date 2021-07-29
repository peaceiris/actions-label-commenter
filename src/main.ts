import {getOctokit, context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';

import {ActionProcessor} from './classes/action-processor';
import {Comment} from './classes/comment';
import {Config} from './classes/config';
import {ContextLoader} from './classes/context-loader';
import {Inputs} from './classes/inputs';
import {ActionInfo} from './constants';
import {info} from './logger';

export async function run(): Promise<void> {
  try {
    info(`Version ${ActionInfo.Version}`);
    const readmeUrl = `https://github.com/${ActionInfo.Owner}/${ActionInfo.Name}#readme`;
    info(`Usage ${readmeUrl}`);

    const inputs: Inputs = new Inputs();
    const githubClient: InstanceType<typeof GitHub> = getOctokit(inputs.GithubToken);
    const contextLoader: ContextLoader = new ContextLoader(inputs, context);
    const config: Config = new Config(contextLoader.runContext);
    const comment: Comment = new Comment(contextLoader, config);
    comment.dumpComponents();
    const actionProcessor: ActionProcessor = new ActionProcessor(
      inputs,
      githubClient,
      contextLoader,
      config,
      comment.render
    );
    await actionProcessor.process();
  } catch (error) {
    throw new Error(error.message);
  }
}
