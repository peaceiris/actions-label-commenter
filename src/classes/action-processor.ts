import {info, getInput} from '@actions/core';
import {context, getOctokit} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';

import {ActionInfo} from '../constants';
import {Inputs} from '../interfaces';
import {CommentGenerator} from './comment-generator';
import {Locking, Action, ConfigParser} from './config-parser';
import {ContextParser} from './context-parser';
import {Issue} from './issue';

class ActionProcessor {
  readonly inputs: Inputs;
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly contextParser: ContextParser;
  readonly configParser: ConfigParser;
  readonly commentGenerator: CommentGenerator;
  readonly issue: Issue;

  constructor() {
    try {
      this.inputs = this.getInputs();
      this.githubClient = getOctokit(this.inputs.GithubToken);
      this.contextParser = new ContextParser(this.inputs, context);
      this.configParser = new ConfigParser(this.contextParser.runContext);
      this.commentGenerator = new CommentGenerator(
        this.contextParser,
        this.configParser,
        this.contextParser.runContext
      );
      this.issue = new Issue(
        this.githubClient,
        this.contextParser.issueNumber,
        this.contextParser.locked
      );
    } catch (error) {
      throw new Error(error.message);
    }
  }

  dumpActionInfo(): void {
    info(`[INFO] Version ${ActionInfo.Version}`);
    const readmeUrl = `https://github.com/${ActionInfo.Owner}/${ActionInfo.Name}#readme`;
    info(`[INFO] Usage ${readmeUrl}`);
  }

  getInputs(): Inputs {
    return {
      GithubToken: getInput('github_token'),
      ConfigFilePath: getInput('config_file')
    };
  }

  isLocked(): boolean | undefined {
    if (this.configParser.locking === ('unlock' as Locking)) {
      return false;
    }
    return Boolean(this.contextParser.locked);
  }

  async process(): Promise<void> {
    this.dumpActionInfo();
    this.contextParser.dumpContext();
    this.configParser.dumpConfig();

    if (!this.configParser.labelIndex || !this.configParser.isExistsField) {
      return;
    }

    this.commentGenerator.dumpComponents();

    try {
      if (this.configParser.locking === ('unlock' as Locking)) {
        await this.issue.unlock();
      }

      await this.issue.createComment(this.commentGenerator.render);

      if (this.configParser.action === ('close' as Action)) {
        await this.issue.close();
      } else if (this.configParser.action === ('open' as Action)) {
        await this.issue.open();
      } else if (!this.configParser.action) {
        info(`[INFO] no configuration ${this.configParser.parentFieldName}.action`);
      } else {
        throw new Error(
          `invalid value "${this.configParser.action}" ${this.configParser.parentFieldName}.action`
        );
      }

      if (this.configParser.locking === ('lock' as Locking)) {
        this.issue.lock(this.configParser.lockReason);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export {ActionProcessor};
