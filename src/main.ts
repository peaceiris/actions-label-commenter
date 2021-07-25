import {getOctokit, context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';

import {ActionProcessor} from './classes/action-processor';
import {CommentGenerator} from './classes/comment-generator';
import {ConfigParser} from './classes/config-parser';
import {ContextParser} from './classes/context-parser';
import {Inputs, InputsLoader} from './classes/inputs-loader';
import {ActionInfo} from './constants';
import {info} from './logger';

export async function run(): Promise<void> {
  try {
    info(`Version ${ActionInfo.Version}`);
    const readmeUrl = `https://github.com/${ActionInfo.Owner}/${ActionInfo.Name}#readme`;
    info(`Usage ${readmeUrl}`);

    const inputs: Inputs = new InputsLoader();
    const githubClient: InstanceType<typeof GitHub> = getOctokit(inputs.GithubToken);
    const contextParser: ContextParser = new ContextParser(inputs, context);
    const configParser: ConfigParser = new ConfigParser(contextParser.runContext);
    const commentGenerator: CommentGenerator = new CommentGenerator(contextParser, configParser);
    const actionProcessor: ActionProcessor = new ActionProcessor(
      inputs,
      githubClient,
      contextParser,
      configParser,
      commentGenerator
    );
    await actionProcessor.process();
  } catch (error) {
    throw new Error(error.message);
  }
}
