import {Context} from '@actions/github/lib/context';
import {
  IssuesLabeledEvent,
  IssuesUnlabeledEvent,
  PullRequestLabeledEvent,
  PullRequestUnlabeledEvent,
  DiscussionLabeledEvent,
  DiscussionUnlabeledEvent
} from '@octokit/webhooks-types';

import {groupConsoleLog, info} from '../logger';
import {Inputs} from './inputs';

type IssuePayload = IssuesLabeledEvent | IssuesUnlabeledEvent;
type PullRequestPayload = PullRequestLabeledEvent | PullRequestUnlabeledEvent;
type DiscussionPayload = DiscussionLabeledEvent | DiscussionUnlabeledEvent;
type Payload = IssuePayload | PullRequestPayload | DiscussionPayload;
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

interface IContext {
  readonly configFilePath: string;
  readonly sha: string;
  readonly owner: string;
  readonly repo: string;

  readonly eventName: EventName;
  readonly id: string;
  readonly eventAlias: EventAlias;
  readonly labelEvent: LabelEvent;
  readonly labelName: string | undefined;
  readonly issueNumber: number;
  readonly userLogin: string;
  readonly senderLogin: string;
  readonly locked: boolean;
}

interface IContextLoader extends IContext {
  readonly inputs: Inputs;
  readonly context: Context;
  readonly payload: Payload;
  readonly runContext: IContext;

  getRunContext(): IContext;
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
  readonly runContext: IContext;

  readonly configFilePath: string;
  readonly sha: string;
  readonly owner: string;
  readonly repo: string;

  readonly eventName: EventName;
  readonly id: string;
  readonly eventAlias: EventAlias;
  readonly labelEvent: LabelEvent;
  readonly labelName: string | undefined;
  readonly issueNumber: number;
  readonly userLogin: string;
  readonly senderLogin: string;
  readonly locked: boolean;

  constructor(inputs: Inputs, context: Context) {
    groupConsoleLog('Dump GitHub context', context);
    try {
      this.inputs = inputs;
      this.context = context;
      this.payload = context.payload as Payload;

      this.configFilePath = this.inputs.ConfigFilePath;
      this.sha = this.context.sha;
      this.owner = this.context.repo.owner;
      this.repo = this.context.repo.repo;

      this.eventName = this.getEventName();
      this.id = this.getId();
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
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error('unexpected error');
      }
    }
  }

  getRunContext(): IContext {
    const runContext: IContext = {
      configFilePath: this.inputs.ConfigFilePath,
      sha: this.sha,
      owner: this.owner,
      repo: this.repo,
      eventName: this.eventName,
      id: this.id,
      eventAlias: this.eventAlias,
      labelEvent: this.labelEvent,
      labelName: this.labelName as string,
      issueNumber: this.issueNumber,
      userLogin: this.userLogin,
      senderLogin: this.senderLogin,
      locked: this.locked
    } as const;
    groupConsoleLog('Dump runContext', runContext);
    return runContext;
  }

  getId(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).issue?.node_id;
    } else if (this.eventName === 'discussion') {
      return (this.payload as DiscussionPayload).discussion?.node_id;
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
    } else if (this.eventName === 'discussion') {
      return (this.payload as DiscussionPayload).label?.name;
    }

    return (this.payload as PullRequestPayload).label?.name;
  }

  getIssueNumber(): number {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).issue.number;
    } else if (this.eventName === 'discussion') {
      return (this.payload as DiscussionPayload).discussion.number;
    }

    return (this.payload as PullRequestPayload).number;
  }

  getUserLogin(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).issue.user.login;
    } else if (this.eventName === 'discussion') {
      return (this.payload as DiscussionPayload).discussion.user.login;
    }

    return (this.payload as PullRequestPayload).pull_request.user.login;
  }

  getSenderLogin(): string {
    if (this.eventName === 'issues') {
      return (this.payload as IssuePayload).sender.login;
    } else if (this.eventName === 'discussion') {
      return (this.payload as DiscussionPayload).sender.login;
    }

    return (this.payload as PullRequestPayload).sender.login;
  }

  getLocked(): boolean {
    if (this.eventName === 'issues') {
      return Boolean((this.payload as IssuePayload).issue.locked);
    } else if (this.eventName === 'discussion') {
      return Boolean((this.payload as DiscussionPayload).discussion.locked);
    }

    return Boolean((this.payload as PullRequestPayload).pull_request.locked);
  }
}

export {Payload, EventName, EventAlias, LabelEvent, IContext, ContextLoader};
