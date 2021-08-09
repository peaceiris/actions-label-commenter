import {Context} from '@actions/github/lib/context';
import {
  IssuesLabeledEvent,
  IssuesUnlabeledEvent,
  PullRequestLabeledEvent,
  PullRequestUnlabeledEvent
} from '@octokit/webhooks-types';

import {groupConsoleLog, info} from '../logger';
import {Inputs} from './inputs';

type IssuePayload = IssuesLabeledEvent | IssuesUnlabeledEvent;
type PullRequestPayload = PullRequestLabeledEvent | PullRequestUnlabeledEvent;
type Payload = IssuePayload | PullRequestPayload;

interface RunContext {
  readonly Id: string;
  readonly ConfigFilePath: string;
  readonly LabelName: string;
  readonly LabelEvent: string;
  readonly EventName: string;
  readonly EventType: string;
}

interface IContext {
  readonly inputs: Inputs;
  readonly context: Context;
  readonly payload: Payload;

  readonly id: string;
  readonly eventName: string;
  readonly eventType: string;
  readonly action: string;
  readonly labelName: string | undefined;
  readonly issueNumber: number;
  readonly userLogin: string;
  readonly senderLogin: string;
  readonly locked: boolean;

  readonly runContext: RunContext;
}

interface IContextLoader extends IContext {
  dumpContext(): void;
  getRunContext(): RunContext;
  getEventName(): string;
  getEventType(): string;
  getAction(): string;
  getLabelName(): string | undefined;
  getIssueNumber(): number;
  getUserLogin(): string;
  getSenderLogin(): string;
  getLocked(): boolean;
}

class ContextLoader implements IContextLoader {
  readonly inputs: Inputs;
  readonly context: Context;
  readonly payload: Payload;

  readonly id: string;
  readonly eventName: string;
  readonly eventType: string;
  readonly action: string;
  readonly labelName: string | undefined;
  readonly issueNumber: number;
  readonly userLogin: string;
  readonly senderLogin: string;
  readonly locked: boolean;

  readonly runContext: RunContext;

  constructor(inputs: Inputs, context: Context) {
    try {
      this.inputs = inputs;
      this.context = context;
      this.payload = context.payload as Payload;

      this.id = this.getId();
      this.eventName = this.getEventName();
      this.eventType = this.getEventType();
      this.action = this.getAction();
      this.labelName = this.getLabelName();
      this.issueNumber = this.getIssueNumber();
      this.userLogin = this.getUserLogin();
      this.senderLogin = this.getSenderLogin();
      this.locked = this.getLocked();

      this.runContext = this.getRunContext();
    } catch (error) {
      groupConsoleLog('Dump context', context);
      groupConsoleLog('Dump error.stack', error.stack);
      throw new Error(error.message);
    }
  }

  dumpContext(): void {
    groupConsoleLog('Dump GitHub context', this.context);
    info(`Issue number: ${this.issueNumber}`);
  }

  getRunContext(): RunContext {
    const runContext: RunContext = {
      Id: this.id,
      ConfigFilePath: this.inputs.ConfigFilePath,
      LabelName: this.labelName as string,
      LabelEvent: this.action,
      EventName: this.eventName,
      EventType: this.eventType
    };
    groupConsoleLog('Dump runContext', runContext);
    return runContext;
  }

  getId(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).issue.node_id;
    }

    return (this.payload as PullRequestPayload).pull_request.node_id;
  }

  getEventName(): string {
    const eventName: string = this.context.eventName;
    info(`Event name: ${eventName}`);
    if (
      eventName === 'issues' ||
      eventName === 'pull_request' ||
      eventName === 'pull_request_target'
    ) {
      return eventName;
    } else if (eventName === 'discussion' || eventName === 'discussion_comment') {
      throw new Error(
        `Unsupported event: ${eventName}, Please subscribe issue https://github.com/peaceiris/actions-label-commenter/issues/444`
      );
    } else {
      throw new Error(`Unsupported event: ${eventName}`);
    }
  }

  getEventType(): string {
    if (this.eventName === 'issues') {
      return 'issue';
    }

    return 'pr';
  }

  getAction(): string {
    return this.payload.action;
  }

  getLabelName(): string | undefined {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).label?.name;
    }

    return (this.payload as PullRequestPayload).label?.name;
  }

  getIssueNumber(): number {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).issue.number;
    }

    return (this.payload as PullRequestPayload).number;
  }

  getUserLogin(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).issue.user.login;
    }

    return (this.payload as PullRequestPayload).pull_request.user.login;
  }

  getSenderLogin(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).sender.login;
    }

    return (this.payload as PullRequestPayload).sender.login;
  }

  getLocked(): boolean {
    if (this.eventName === 'issues') {
      return Boolean((this.payload as IssuePayload).issue.locked);
    }

    return Boolean((this.payload as PullRequestPayload).pull_request.locked);
  }
}

export {Payload, RunContext, IContext, ContextLoader};
