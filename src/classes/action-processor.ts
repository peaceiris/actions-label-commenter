import {groupConsoleLog, info} from '../logger';
import {IConfig} from './config';
import {Issue} from './issue';

interface IAction {
  readonly config: IConfig;
  readonly commentBody: string;
  readonly issue: Issue;
}

interface IActionProcessor extends IAction {
  process(): Promise<void>;
}

class ActionProcessor implements IActionProcessor {
  readonly config: IConfig;
  readonly commentBody: string;
  readonly issue: Issue;

  constructor(config: IConfig, commentBody: string, issue: Issue) {
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
    groupConsoleLog('Dump config', this.config);

    if (!this.config.labelIndex) {
      info(`No configuration`);
      return;
    }

    try {
      if (this.config.locking === 'unlock') {
        await this.issue.unlock();
        this.issue.setLocked(false);
      }

      await this.updateState();

      if (this.config.draft) {
        await this.issue.convertPullRequestToDraft();
      } else if (this.config.draft === false) {
        await this.issue.markPullRequestReadyForReview();
      }

      if (this.issue.locked) {
        info(`Issue #${this.issue.number} is locked, skip creating comment`);
      } else if (!this.commentBody) {
        info(`body is empty, skip creating comment`);
      } else {
        await this.issue.createComment(this.commentBody);
      }

      if (this.config.locking === 'lock') {
        await this.issue.lock(this.config.lockReason);
        this.issue.setLocked(true);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export {ActionProcessor};
