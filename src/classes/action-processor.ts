import {GitHub} from '@actions/github/lib/utils';

import {info} from '../logger';
import {Comment} from './comment';
import {Locking, Action, Config} from './config';
import {ContextLoader} from './context-loader';
import {Inputs} from './inputs';
import {Issue} from './issue';

interface IAction {
  readonly inputs: Inputs;
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly contextLoader: ContextLoader;
  readonly config: Config;
  readonly comment: Comment;
  readonly issue: Issue;

  isLocked(): boolean | undefined;
  process(): Promise<void>;
}

class ActionProcessor implements IAction {
  readonly inputs: Inputs;
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly contextLoader: ContextLoader;
  readonly config: Config;
  readonly comment: Comment;
  readonly issue: Issue;

  constructor(
    inputs: Inputs,
    githubClient: InstanceType<typeof GitHub>,
    contextLoader: ContextLoader,
    config: Config,
    comment: Comment
  ) {
    this.inputs = inputs;
    this.githubClient = githubClient;
    this.contextLoader = contextLoader;
    this.config = config;
    this.comment = comment;
    this.issue = new Issue(
      this.githubClient,
      this.contextLoader.issueNumber,
      this.contextLoader.locked
    );
  }

  isLocked(): boolean | undefined {
    if (this.config.locking === ('unlock' as Locking)) {
      return false;
    }
    return Boolean(this.contextLoader.locked);
  }

  async process(): Promise<void> {
    this.contextLoader.dumpContext();
    this.config.dumpConfig();

    if (!this.config.labelIndex) {
      info(`No configuration`);
      return;
    }

    this.comment.dumpComponents();

    try {
      if (this.config.locking === ('unlock' as Locking)) {
        await this.issue.unlock();
      }

      await this.issue.createComment(this.comment.render);

      if (this.config.action === ('close' as Action)) {
        await this.issue.close();
      } else if (this.config.action === ('open' as Action)) {
        await this.issue.open();
      } else if (!this.config.action) {
        info(`No configuration ${this.config.parentFieldName}.action`);
      } else {
        throw new Error(
          `Invalid value "${this.config.action}" ${this.config.parentFieldName}.action`
        );
      }

      if (this.config.locking === ('lock' as Locking)) {
        this.issue.lock(this.config.lockReason);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export {ActionProcessor};
