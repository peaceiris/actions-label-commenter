import {info} from '../logger';
import {Config} from './config';
import {Issue} from './issue';

interface IAction {
  locked: boolean;
  readonly config: Config;
  readonly commentBody: string;
  readonly issue: Issue;

  process(): Promise<void>;
}

class ActionProcessor implements IAction {
  locked: boolean;
  readonly config: Config;
  readonly commentBody: string;
  readonly issue: Issue;

  constructor(locked: boolean, config: Config, commentBody: string, issue: Issue) {
    this.locked = locked;
    this.config = config;
    this.commentBody = commentBody;
    this.issue = issue;
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
        this.locked = false;
      }

      if (!this.locked) {
        await this.issue.createComment(this.commentBody);
      }

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
