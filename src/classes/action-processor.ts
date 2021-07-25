import {info} from '@actions/core';
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

  constructor(
    inputs: Inputs,
    githubClient: InstanceType<typeof GitHub>,
    contextParser: ContextParser,
    configParser: ConfigParser,
    commentGenerator: CommentGenerator
  ) {
    try {
      this.inputs = inputs;
      this.githubClient = githubClient;
      this.contextParser = contextParser;
      this.configParser = configParser;
      this.commentGenerator = commentGenerator;
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