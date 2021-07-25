import {info} from '@actions/core';
import {Context} from '@actions/github/lib/context';
import {
  IssuesEvent,
  IssuesLabeledEvent,
  PullRequestEvent,
  PullRequestLabeledEvent
} from '@octokit/webhooks-types';

import {groupConsoleLog} from '../logger';
import {Inputs} from './inputs-loader';

interface RunContext {
  readonly ConfigFilePath: string;
  readonly LabelName: string;
  readonly LabelEvent: string;
  readonly EventName: string;
  readonly EventType: string;
}

class ContextParser {
  readonly inputs: Inputs;
  readonly context: Context;
  readonly payload: IssuesEvent | IssuesLabeledEvent | PullRequestEvent | PullRequestLabeledEvent;
  readonly eventName: string;
  readonly eventType: string;
  readonly action: string;
  readonly labelName: string | undefined;
  readonly issueNumber: number;
  readonly userLogin: string;
  readonly senderLogin: string;
  readonly locked: boolean;

  constructor(inputs: Inputs, context: Context) {
    try {
      this.inputs = inputs;
      this.context = context;
      this.payload = context.payload as
        | IssuesEvent
        | IssuesLabeledEvent
        | PullRequestEvent
        | PullRequestLabeledEvent;
      this.eventName = this.getEventName();
      this.eventType = this.getEventType();
      this.action = this.getAction();
      this.labelName = this.getLabelName();
      this.issueNumber = this.getIssueNumber();
      this.userLogin = this.getUserLogin();
      this.senderLogin = this.getSenderLogin();
      this.locked = this.getLocked();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  dumpContext(): void {
    groupConsoleLog('Dump GitHub context', this.context, 'debug');
    info(`[INFO] issue number: ${this.issueNumber}`);
  }

  get runContext(): RunContext {
    const runContext = {
      ConfigFilePath: this.inputs.ConfigFilePath,
      LabelName: this.labelName as string,
      LabelEvent: this.action,
      EventName: this.eventName,
      EventType: this.eventType
    };
    groupConsoleLog('Dump runContext', runContext, 'info');
    return runContext;
  }

  getEventName(): string {
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

  getEventType(): string {
    if (this.eventName === 'issues') {
      return 'issue';
    }

    // if (this.eventName === 'pull_request' || this.eventName === 'pull_request_target')
    return 'pr';
  }

  getAction(): string {
    return this.payload.action;
  }

  getLabelName(): string | undefined {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesLabeledEvent).label?.name;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestLabeledEvent).label?.name;
  }

  getIssueNumber(): number {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesEvent).issue.number;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestEvent).number;
  }

  getUserLogin(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesEvent).issue.user.login;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestEvent).pull_request.user.login;
  }

  getSenderLogin(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuesEvent).sender.login;
    }
    // pull_request OR pull_request_target
    return (this.payload as PullRequestEvent).sender.login;
  }

  getLocked(): boolean {
    if (this.eventName === 'issues') {
      return Boolean((this.payload as IssuesEvent).issue.locked);
    }
    // pull_request OR pull_request_target
    return Boolean((this.payload as PullRequestEvent).pull_request.locked);
  }
}

export {RunContext, ContextParser};
