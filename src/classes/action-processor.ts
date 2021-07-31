import {info} from '../logger';
import {Config} from './config';
import {Issue} from './issue';

interface IAction {
  readonly locked: boolean;
  readonly config: Config;
  readonly commentBody: string;
  readonly issue: Issue;

  isLocked(): boolean | undefined;
  process(): Promise<void>;
}

class ActionProcessor implements IAction {
  readonly locked: boolean;
  readonly config: Config;
  readonly commentBody: string;
  readonly issue: Issue;

  constructor(locked: boolean, config: Config, commentBody: string, issue: Issue) {
    this.locked = locked;
    this.config = config;
    this.commentBody = commentBody;
    this.issue = issue;
  }

  isLocked(): boolean | undefined {
    if (this.config.locking === 'unlock') {
      return false;
    }
    return Boolean(this.locked);
  }

  async updateState(): Promise<void> {
    if (this.config.action === 'close') {
      await this.issue.updateState('closed');
    } else if (this.config.action === 'open') {
      await this.issue.updateState('open');
    } else if (!this.config.action) {
      info(`No configuration ${this.config.parentFieldName}.action`);
    } else {
      throw new Error(
        `Invalid value "${this.config.action}" ${this.config.parentFieldName}.action`
      );
    }
  }

  async process(): Promise<void> {
    info(`isLocked: ${this.locked}`);
    this.config.dumpConfig();

    if (!this.config.labelIndex) {
      info(`No configuration`);
      return;
    }

    try {
      if (this.config.locking === 'unlock') {
        await this.issue.unlock();
      }

      await this.issue.createComment(this.commentBody);
      await this.updateState();

      if (this.config.locking === 'lock') {
        await this.issue.lock(this.config.lockReason);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export {ActionProcessor};
