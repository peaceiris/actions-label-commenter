import {groupConsoleLog, info} from '../logger';
import {IConfig} from './config';
import {EventAlias} from './context-loader';
import {Issue} from './issue';

interface IAction {
  readonly eventAlias: EventAlias;
  readonly config: IConfig;
  readonly commentBody: string;
  readonly issue: Issue;
  locked: boolean;
}

interface IActionProcessor extends IAction {
  process(): Promise<void>;
}

class ActionProcessor implements IActionProcessor {
  readonly eventAlias: EventAlias;
  readonly config: IConfig;
  readonly commentBody: string;
  readonly issue: Issue;
  locked: boolean;

  constructor(
    eventAlias: EventAlias,
    config: IConfig,
    commentBody: string,
    issue: Issue,
    locked: boolean
  ) {
    this.eventAlias = eventAlias;
    this.config = config;
    this.commentBody = commentBody;
    this.issue = issue;
    this.locked = locked;
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
  }

  async updateState(): Promise<void> {
    // TODO: v2 Replace action with state
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
      if (this.locked && this.config.locking === 'unlock') {
        if (this.eventAlias === 'discussion') {
          await this.issue.unlockLockable();
        } else {
          await this.issue.unlock();
        }
        this.setLocked(false);
      }

      if (this.eventAlias !== 'discussion') {
        await this.updateState();
      }

      if (this.eventAlias === 'pr' && this.config.draft) {
        await this.issue.convertPullRequestToDraft();
      } else if (this.config.draft === false) {
        await this.issue.markPullRequestReadyForReview();
      }

      if (this.locked) {
        info(`Issue #${this.issue.number} is locked, skip creating comment`);
      } else if (!this.commentBody) {
        info(`body is empty, skip creating comment`);
      } else {
        if (this.eventAlias === 'discussion') {
          const id = await this.issue.addDiscussionComment(this.commentBody);
          if (this.config.answer) {
            await this.issue.markDiscussionCommentAsAnswer(id);
          }
        } else {
          await this.issue.createComment(this.commentBody);
        }
      }

      if (!this.locked && this.config.locking === 'lock') {
        if (this.eventAlias === 'discussion') {
          await this.issue.lockLockable(this.config.lockReason);
        } else {
          await this.issue.lock(this.config.lockReason);
        }
        this.setLocked(true);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message as string);
      }
    }
  }
}

export {ActionProcessor};
