import {info} from '@actions/core';
import {Context} from '@actions/github/lib/context';
import {
  IssuesEvent,
  IssuesLabeledEvent,
  PullRequestEvent,
  PullRequestLabeledEvent
} from '@octokit/webhooks-types';

export class ContextParser {
  readonly context: Context;
  readonly payload: IssuesEvent | IssuesLabeledEvent | PullRequestEvent | PullRequestLabeledEvent;

  constructor(context: Context) {
    this.context = context;
    this.payload = context.payload as
      | IssuesEvent
      | IssuesLabeledEvent
      | PullRequestEvent
      | PullRequestLabeledEvent;
  }

  get eventName(): string {
    const eventName: string = this.context.eventName;
    info(`[INFO] event name: ${eventName}`);
    if (
      eventName === 'issues' ||
      eventName === 'pull_request' ||
      eventName === 'pull_request_target'
    ) {
      return eventName;
    } else if (eventName === 'discussion' || eventName === 'discussion_comment') {
      throw new Error(
        `unsupported event: ${eventName}, Please subscribe issue https://github.com/peaceiris/actions-label-commenter/issues/444`
      );
    } else {
      throw new Error(`unsupported event: ${eventName}`);
    }
  }

  get action(): string {
    return this.payload.action;
  }

  get labelName(): string | undefined {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesLabeledEvent).label?.name;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestLabeledEvent).label?.name;
  }

  get issueNumber(): number {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesEvent).issue.number;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestEvent).number;
  }

  get userLogin(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesEvent).issue.user.login;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestEvent).pull_request.user.login;
  }

  get senderLogin(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesEvent).sender.login;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestEvent).sender.login;
  }

  get locked(): boolean | undefined {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesEvent).issue.locked;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestEvent).pull_request.locked;
  }
}
