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
type EventName = 'issues' | 'pull_request' | 'pull_request_target' | 'discussion';
type EventAlias = 'issue' | 'pr' | 'discussion';
type LabelEvent = 'labeled' | 'unlabeled';

interface EventTypeTable {
  issues: EventAlias;
  pull_request: EventAlias;
  pull_request_target: EventAlias;
  discussion: EventAlias;
}
const eventTypeTable: EventTypeTable = {
  issues: 'issue',
  pull_request: 'pr',
  pull_request_target: 'pr',
  discussion: 'discussion'
};
const eventType = (eventName: EventName): EventAlias =>
  eventTypeTable[eventName as keyof EventTypeTable];

interface RunContext {
  readonly Id: string;
  readonly ConfigFilePath: string;
  readonly LabelName: string;
  readonly LabelEvent: LabelEvent;
  readonly EventName: EventName;
  readonly EventAlias: EventAlias;
}

interface IContext {
  readonly inputs: Inputs;
  readonly context: Context;
  readonly payload: Payload;

  readonly id: string;
  readonly eventName: EventName;
  readonly eventAlias: EventAlias;
  readonly labelEvent: LabelEvent;
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
  getId(): string;
  getEventName(): EventName;
  getEventAlias(): EventAlias;
  getLabelEvent(): LabelEvent;
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
  readonly eventName: EventName;
  readonly eventAlias: EventAlias;
  readonly labelEvent: LabelEvent;
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
      this.eventAlias = this.getEventAlias();
      this.labelEvent = this.getLabelEvent();
      this.labelName = this.getLabelName();
      this.issueNumber = this.getIssueNumber();
      this.userLogin = this.getUserLogin();
      this.senderLogin = this.getSenderLogin();
      this.locked = this.getLocked();

      this.runContext = this.getRunContext();
    } catch (error) {
      groupConsoleLog('Dump context', context);
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
      LabelEvent: this.labelEvent,
      EventName: this.eventName,
      EventAlias: this.eventAlias
    };
    groupConsoleLog('Dump runContext', runContext);
    return runContext;
  }

  getId(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).issue?.node_id;
    }
    return (this.payload as PullRequestPayload).pull_request?.node_id;
  }

  getEventName(): EventName {
    const eventName = this.context.eventName as EventName;
    info(`Event name: ${eventName}`);
    if (eventType(eventName)) {
      return eventName;
    } else {
      throw new Error(`Unsupported event: ${eventName}`);
    }
  }

  getEventAlias(): EventAlias {
    return eventType(this.eventName);
  }

  getLabelEvent(): LabelEvent {
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

export {Payload, EventName, EventAlias, LabelEvent, RunContext, IContext, ContextLoader};
