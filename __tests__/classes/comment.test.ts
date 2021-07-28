import {context} from '@actions/github';
import {Context} from '@actions/github/lib/context';
import {
  IssuesEvent,
  IssuesLabeledEvent,
  PullRequestEvent,
  PullRequestLabeledEvent
} from '@octokit/webhooks-types';

import {Comment} from '../../src/classes/comment';
import {Locking, Action, IConfig} from '../../src/classes/config';
import {RunContext, IContext} from '../../src/classes/context-loader';
import {Inputs} from '../../src/classes/inputs';
import {LockReason} from '../../src/classes/issue';
import {getDefaultInputs, cleanupEnvs} from '../../src/test-helper';

beforeEach(() => {
  process.env['GITHUB_SERVER_URL'] = 'https://github.com';
  process.env['GITHUB_REPOSITORY'] = 'peaceiris/actions-label-commenter';
  process.env['GITHUB_RUN_ID'] = '123456789';

  getDefaultInputs();
});

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();

  cleanupEnvs();

  delete process.env['GITHUB_SERVER_URL'];
  delete process.env['GITHUB_REPOSITORY'];
  delete process.env['GITHUB_RUN_ID'];
  delete process.env['RUNNER_DEBUG'];
});

const config = {
  comment: {
    header: 'Hi, there.',
    footer:
      "---\n\n> This is an automated comment created by the [peaceiris/actions-label-commenter]. Responding to the bot or mentioning it won't have any effect.\n\n[peaceiris/actions-label-commenter]: https://github.com/peaceiris/actions-label-commenter"
  },
  labels: [
    {
      name: 'invalid',
      labeled: {
        issue: {
          body: 'Thank you @{{ issue.user.login }} for suggesting this. Please follow the issue templates.',
          action: 'close'
        },
        pr: {
          body: 'Thank you @{{ pull_request.user.login }} for suggesting this. Please follow the pull request templates.',
          action: 'close'
        }
      },
      unlabeled: {
        issue: {
          body: 'Thank you for following the template. The repository owner will reply.',
          action: 'open'
        }
      }
    },
    {
      name: 'locked (spam)',
      labeled: {
        issue: {
          body: 'This issue has been **LOCKED** because of spam!\n\nPlease do not spam messages and/or issues on the issue tracker. You may get blocked from this repository for doing so.\n',
          action: 'close',
          locking: 'lock',
          lock_reason: 'spam'
        },
        pr: {
          body: 'This pull-request has been **LOCKED** because of spam!\n\nPlease do not spam messages and/or pull-requests on this project. You may get blocked from this repository for doing so.\n',
          action: 'close',
          locking: 'lock',
          lock_reason: 'spam'
        }
      }
    }
  ]
};

describe('getRawBody', () => {
  class ContextLoaderMock implements IContext {
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
    readonly runContext: RunContext;

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
        this.runContext = this.getRunContext();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    dumpContext(): void {
      return;
    }

    getRunContext(): RunContext {
      const runContext: RunContext = {
        ConfigFilePath: this.inputs.ConfigFilePath,
        LabelName: this.labelName as string,
        LabelEvent: this.action,
        EventName: this.eventName,
        EventType: this.eventType
      };
      return runContext;
    }

    getEventName(): string {
      return 'issues';
    }

    getEventType(): string {
      return 'issue';
    }

    getAction(): string {
      return 'labeled';
    }

    getLabelName(): string | undefined {
      return 'invalid';
    }

    getIssueNumber(): number {
      return 1;
    }

    getUserLogin(): string {
      return 'userLogin';
    }

    getSenderLogin(): string {
      return 'senderLogin';
    }

    getLocked(): boolean {
      return false;
    }
  }

  class ConfigMock implements IConfig {
    readonly runContext: RunContext;
    readonly parentFieldName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly config: any;
    readonly labelIndex: string;
    readonly locking: Locking;
    readonly action: Action;
    readonly lockReason: LockReason;

    constructor(runContext: RunContext) {
      try {
        this.runContext = runContext;
        this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
        this.config = this.loadConfig();
        this.labelIndex = this.getLabelIndex();
        this.locking = this.getLocking();
        this.action = this.getAction();
        this.lockReason = this.getLockReason();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadConfig(): any {
      return config;
    }

    dumpConfig(): void {
      return;
    }

    getLabelIndex(): string {
      return '0';
    }

    getLocking(): Locking {
      return 'unlock';
    }

    getAction(): Action {
      return 'close';
    }

    getLockReason(): LockReason {
      return 'resolved';
    }
  }

  test('isDebug is false', () => {
    const inputs: Inputs = new Inputs();
    const contextLoader: ContextLoaderMock = new ContextLoaderMock(inputs, context);
    const config: ConfigMock = new ConfigMock(contextLoader.runContext);
    const comment: Comment = new Comment(contextLoader, config);

    expect(comment.render).toBe(`\
Hi, there.

Thank you @userLogin for suggesting this. Please follow the issue templates.

---

> This is an automated comment created by the [peaceiris/actions-label-commenter]. Responding to the bot or mentioning it won't have any effect.

[peaceiris/actions-label-commenter]: https://github.com/peaceiris/actions-label-commenter

<!-- peaceiris/actions-label-commenter -->
`);
  });

  test('isDebug is true', () => {
    process.env['RUNNER_DEBUG'] = '1';

    const inputs: Inputs = new Inputs();
    const contextLoader: ContextLoaderMock = new ContextLoaderMock(inputs, context);
    const config: ConfigMock = new ConfigMock(contextLoader.runContext);
    const comment: Comment = new Comment(contextLoader, config);

    expect(comment.render).toBe(`\
Hi, there.

Thank you @userLogin for suggesting this. Please follow the issue templates.

---

> This is an automated comment created by the [peaceiris/actions-label-commenter]. Responding to the bot or mentioning it won't have any effect.

[peaceiris/actions-label-commenter]: https://github.com/peaceiris/actions-label-commenter

<div align="right"><a href="https://github.com/peaceiris/actions-label-commenter/actions/runs/123456789">Log</a> | <a href="https://github.com/peaceiris/actions-label-commenter#readme">Bot Usage</a></div>

<!-- peaceiris/actions-label-commenter -->
`);
  });
});

describe('Mustache issues', () => {
  class ContextLoaderMock implements IContext {
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
    readonly runContext: RunContext;

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
        this.runContext = this.getRunContext();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    dumpContext(): void {
      return;
    }

    getRunContext(): RunContext {
      const runContext: RunContext = {
        ConfigFilePath: this.inputs.ConfigFilePath,
        LabelName: this.labelName as string,
        LabelEvent: this.action,
        EventName: this.eventName,
        EventType: this.eventType
      };
      return runContext;
    }

    getEventName(): string {
      return 'issues';
    }

    getEventType(): string {
      return 'issue';
    }

    getAction(): string {
      return 'labeled';
    }

    getLabelName(): string | undefined {
      return 'invalid';
    }

    getIssueNumber(): number {
      return 1;
    }

    getUserLogin(): string {
      return 'userLogin';
    }

    getSenderLogin(): string {
      return 'senderLogin';
    }

    getLocked(): boolean {
      return false;
    }
  }

  class ConfigMock implements IConfig {
    readonly runContext: RunContext;
    readonly parentFieldName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly config: any;
    readonly labelIndex: string;
    readonly locking: Locking;
    readonly action: Action;
    readonly lockReason: LockReason;

    constructor(runContext: RunContext) {
      try {
        this.runContext = runContext;
        this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
        this.config = this.loadConfig();
        this.labelIndex = this.getLabelIndex();
        this.locking = this.getLocking();
        this.action = this.getAction();
        this.lockReason = this.getLockReason();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadConfig(): any {
      return config;
    }

    dumpConfig(): void {
      return;
    }

    getLabelIndex(): string {
      return '0';
    }

    getLocking(): Locking {
      return undefined;
    }

    getAction(): Action {
      return 'close';
    }

    getLockReason(): LockReason {
      return 'resolved';
    }
  }

  test('invalid.labeled.pr', () => {
    const inputs: Inputs = new Inputs();
    const contextLoader: ContextLoaderMock = new ContextLoaderMock(inputs, context);
    const config: ConfigMock = new ConfigMock(contextLoader.runContext);
    const comment: Comment = new Comment(contextLoader, config);

    expect(comment.render).toBe(`\
Hi, there.

Thank you @userLogin for suggesting this. Please follow the issue templates.

---

> This is an automated comment created by the [peaceiris/actions-label-commenter]. Responding to the bot or mentioning it won't have any effect.

[peaceiris/actions-label-commenter]: https://github.com/peaceiris/actions-label-commenter

<!-- peaceiris/actions-label-commenter -->
`);
  });
});

describe('Mustache pull_request', () => {
  class ContextLoaderMock implements IContext {
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
    readonly runContext: RunContext;

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
        this.runContext = this.getRunContext();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    dumpContext(): void {
      return;
    }

    getRunContext(): RunContext {
      const runContext: RunContext = {
        ConfigFilePath: this.inputs.ConfigFilePath,
        LabelName: this.labelName as string,
        LabelEvent: this.action,
        EventName: this.eventName,
        EventType: this.eventType
      };
      return runContext;
    }

    getEventName(): string {
      return 'pull_request';
    }

    getEventType(): string {
      return 'pr';
    }

    getAction(): string {
      return 'labeled';
    }

    getLabelName(): string | undefined {
      return 'invalid';
    }

    getIssueNumber(): number {
      return 1;
    }

    getUserLogin(): string {
      return 'userLogin';
    }

    getSenderLogin(): string {
      return 'senderLogin';
    }

    getLocked(): boolean {
      return false;
    }
  }

  class ConfigMock implements IConfig {
    readonly runContext: RunContext;
    readonly parentFieldName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly config: any;
    readonly labelIndex: string;
    readonly locking: Locking;
    readonly action: Action;
    readonly lockReason: LockReason;

    constructor(runContext: RunContext) {
      try {
        this.runContext = runContext;
        this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
        this.config = this.loadConfig();
        this.labelIndex = this.getLabelIndex();
        this.locking = this.getLocking();
        this.action = this.getAction();
        this.lockReason = this.getLockReason();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadConfig(): any {
      return config;
    }

    dumpConfig(): void {
      return;
    }

    getLabelIndex(): string {
      return '0';
    }

    getLocking(): Locking {
      return undefined;
    }

    getAction(): Action {
      return 'close';
    }

    getLockReason(): LockReason {
      return 'resolved';
    }
  }

  test('invalid.labeled.pr', () => {
    const inputs: Inputs = new Inputs();
    const contextLoader: ContextLoaderMock = new ContextLoaderMock(inputs, context);
    const config: ConfigMock = new ConfigMock(contextLoader.runContext);
    const comment: Comment = new Comment(contextLoader, config);

    expect(comment.render).toBe(`\
Hi, there.

Thank you @userLogin for suggesting this. Please follow the pull request templates.

---

> This is an automated comment created by the [peaceiris/actions-label-commenter]. Responding to the bot or mentioning it won't have any effect.

[peaceiris/actions-label-commenter]: https://github.com/peaceiris/actions-label-commenter

<!-- peaceiris/actions-label-commenter -->
`);
  });
});

describe('Mustache pull_request_target', () => {
  class ContextLoaderMock implements IContext {
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
    readonly runContext: RunContext;

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
        this.runContext = this.getRunContext();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    dumpContext(): void {
      return;
    }

    getRunContext(): RunContext {
      const runContext: RunContext = {
        ConfigFilePath: this.inputs.ConfigFilePath,
        LabelName: this.labelName as string,
        LabelEvent: this.action,
        EventName: this.eventName,
        EventType: this.eventType
      };
      return runContext;
    }

    getEventName(): string {
      return 'pull_request_target';
    }

    getEventType(): string {
      return 'pr';
    }

    getAction(): string {
      return 'labeled';
    }

    getLabelName(): string | undefined {
      return 'invalid';
    }

    getIssueNumber(): number {
      return 1;
    }

    getUserLogin(): string {
      return 'userLogin';
    }

    getSenderLogin(): string {
      return 'senderLogin';
    }

    getLocked(): boolean {
      return false;
    }
  }

  class ConfigMock implements IConfig {
    readonly runContext: RunContext;
    readonly parentFieldName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly config: any;
    readonly labelIndex: string;
    readonly locking: Locking;
    readonly action: Action;
    readonly lockReason: LockReason;

    constructor(runContext: RunContext) {
      try {
        this.runContext = runContext;
        this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
        this.config = this.loadConfig();
        this.labelIndex = this.getLabelIndex();
        this.locking = this.getLocking();
        this.action = this.getAction();
        this.lockReason = this.getLockReason();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadConfig(): any {
      return config;
    }

    dumpConfig(): void {
      return;
    }

    getLabelIndex(): string {
      return '0';
    }

    getLocking(): Locking {
      return undefined;
    }

    getAction(): Action {
      return 'close';
    }

    getLockReason(): LockReason {
      return 'resolved';
    }
  }

  test('invalid.labeled.pr', () => {
    const inputs: Inputs = new Inputs();
    const contextLoader: ContextLoaderMock = new ContextLoaderMock(inputs, context);
    const config: ConfigMock = new ConfigMock(contextLoader.runContext);
    const comment: Comment = new Comment(contextLoader, config);

    expect(comment.render).toBe(`\
Hi, there.

Thank you @userLogin for suggesting this. Please follow the pull request templates.

---

> This is an automated comment created by the [peaceiris/actions-label-commenter]. Responding to the bot or mentioning it won't have any effect.

[peaceiris/actions-label-commenter]: https://github.com/peaceiris/actions-label-commenter

<!-- peaceiris/actions-label-commenter -->
`);
  });
});
