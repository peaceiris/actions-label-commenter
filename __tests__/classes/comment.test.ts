import {Comment} from '../../src/classes/comment';
import {IConfig} from '../../src/classes/config';
import {RunContext} from '../../src/classes/context-loader';
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
  labels: [
    {
      name: 'invalid',
      labeled: {
        issue: {
          body: 'Thank you @{{ issue.user.login }} for suggesting this. Please follow the issue templates.',
          action: 'close',
          locking: 'lock',
          lock_reason: 'resolved'
        },
        pr: {
          body: 'Thank you @{{ pull_request.user.login }} for suggesting this. Please follow the pull request templates.',
          action: 'close',
          locking: 'lock'
        }
      }
    },
    {
      name: 'proposal',
      labeled: {
        discussion: {
          body: 'Thank you @{{ author }} for suggesting this. @{{ labeler }} will reply.'
        }
      }
    },
    {
      name: 'locked (spam)',
      labeled: {
        pr: {
          body: 'This {{ eventName }} #{{ number }} has been **LOCKED** with the label {{ labelName }}!\n\nPlease do not spam messages on this project. You may get blocked from this repository for doing so.\n',
          action: 'close',
          locking: 'lock',
          lock_reason: 'spam'
        }
      }
    }
  ]
};

describe('header and footer', () => {
  const configWithComment = {
    comment: {
      header: 'Hi, there.',
      footer:
        "---\n\n> This is an automated comment created by the [peaceiris/actions-label-commenter]. Responding to the bot or mentioning it won't have any effect.\n\n[peaceiris/actions-label-commenter]: https://github.com/peaceiris/actions-label-commenter"
    },
    ...config
  };
  const ctx: RunContext = {
    configFilePath: '.github/label-commenter-config.yml',
    eventName: 'issues',
    id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
    eventAlias: 'issue',
    labelEvent: 'labeled',
    labelName: 'invalid',
    issueNumber: 1,
    userLogin: 'userLogin',
    senderLogin: 'senderLogin',
    locked: false
  };
  const cfg: IConfig = {
    config: configWithComment,
    parentFieldName: 'labels.invalid.labeled.issue',
    labelIndex: '0',
    locking: 'unlock',
    action: 'close',
    lockReason: 'resolved'
  };

  test('comment.render returns expected comment with header and footer', () => {
    const comment: Comment = new Comment(ctx, cfg);
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

describe('isDebug', () => {
  const ctx: RunContext = {
    configFilePath: '.github/label-commenter-config.yml',
    eventName: 'issues',
    id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
    eventAlias: 'issue',
    labelEvent: 'labeled',
    labelName: 'invalid',
    issueNumber: 1,
    userLogin: 'userLogin',
    senderLogin: 'senderLogin',
    locked: false
  };
  const cfg: IConfig = {
    config: config,
    parentFieldName: 'labels.invalid.labeled.issue',
    labelIndex: '0',
    locking: 'unlock',
    action: 'close',
    lockReason: 'resolved'
  };

  test('comment.render returns expected comment if isDebug is false', () => {
    const comment: Comment = new Comment(ctx, cfg);
    expect(comment.render).toBe(`\
Thank you @userLogin for suggesting this. Please follow the issue templates.

<!-- peaceiris/actions-label-commenter -->
`);
  });

  test('comment.render returns expected comment if isDebug is true', () => {
    process.env['RUNNER_DEBUG'] = '1';
    const comment: Comment = new Comment(ctx, cfg);

    expect(comment.render).toBe(`\
Thank you @userLogin for suggesting this. Please follow the issue templates.

<div align="right"><a href="https://github.com/peaceiris/actions-label-commenter/actions/runs/123456789">Log</a> | <a href="https://github.com/peaceiris/actions-label-commenter#readme">Bot Usage</a></div>

<!-- peaceiris/actions-label-commenter -->
`);
  });
});

describe('invalid.labeled.issue', () => {
  const ctx: RunContext = {
    configFilePath: '.github/label-commenter-config.yml',
    eventName: 'issues',
    id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
    eventAlias: 'issue',
    labelEvent: 'labeled',
    labelName: 'invalid',
    issueNumber: 1,
    userLogin: 'userLogin',
    senderLogin: 'senderLogin',
    locked: false
  };
  const cfg: IConfig = {
    config: config,
    parentFieldName: 'labels.invalid.labeled.issue',
    labelIndex: '0',
    locking: undefined,
    action: 'close',
    lockReason: 'resolved'
  };
  const comment: Comment = new Comment(ctx, cfg);

  test('comment.render returns expected comment', () => {
    expect(comment.render).toBe(`\
Thank you @userLogin for suggesting this. Please follow the issue templates.

<!-- peaceiris/actions-label-commenter -->
`);
  });
});

describe('invalid.labeled.pr pull_request', () => {
  const ctx: RunContext = {
    configFilePath: '.github/label-commenter-config.yml',
    eventName: 'pull_request',
    id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
    eventAlias: 'pr',
    labelEvent: 'labeled',
    labelName: 'invalid',
    issueNumber: 1,
    userLogin: 'userLogin',
    senderLogin: 'senderLogin',
    locked: false
  };
  const cfg: IConfig = {
    config: config,
    parentFieldName: 'labels.invalid.labeled.issue',
    labelIndex: '0',
    locking: undefined,
    action: 'close',
    lockReason: undefined
  };
  const comment: Comment = new Comment(ctx, cfg);

  test('comment.render returns expected comment', () => {
    expect(comment.render).toBe(`\
Thank you @userLogin for suggesting this. Please follow the pull request templates.

<!-- peaceiris/actions-label-commenter -->
`);
  });
});

describe('invalid.labeled.pr pull_request_target', () => {
  const ctx: RunContext = {
    configFilePath: '.github/label-commenter-config.yml',
    eventName: 'pull_request_target',
    id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
    eventAlias: 'pr',
    labelEvent: 'labeled',
    labelName: 'invalid',
    issueNumber: 1,
    userLogin: 'userLogin',
    senderLogin: 'senderLogin',
    locked: false
  };
  const cfg: IConfig = {
    config: config,
    parentFieldName: 'labels.invalid.labeled.issue',
    labelIndex: '0',
    locking: undefined,
    action: 'close',
    lockReason: undefined
  };
  const comment: Comment = new Comment(ctx, cfg);

  test('comment.render returns expected comment', () => {
    expect(comment.render).toBe(`\
Thank you @userLogin for suggesting this. Please follow the pull request templates.

<!-- peaceiris/actions-label-commenter -->
`);
  });
});

describe('placeholders', () => {
  test('comment.render returns expected comment, author', () => {
    const ctx: RunContext = {
      configFilePath: '.github/label-commenter-config.yml',
      eventName: 'discussion',
      id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
      eventAlias: 'discussion',
      labelEvent: 'labeled',
      labelName: 'proposal',
      issueNumber: 1,
      userLogin: 'userLogin',
      senderLogin: 'senderLogin',
      locked: false
    };
    const cfg: IConfig = {
      config: config,
      parentFieldName: 'labels.invalid.labeled.discussion',
      labelIndex: '1',
      locking: undefined,
      action: undefined,
      lockReason: undefined
    };
    const comment: Comment = new Comment(ctx, cfg);
    expect(comment.render).toBe(`\
Thank you @userLogin for suggesting this. @senderLogin will reply.

<!-- peaceiris/actions-label-commenter -->
`);
  });

  test('comment.render returns expected comment, eventName, number, labelName', () => {
    const ctx: RunContext = {
      configFilePath: '.github/label-commenter-config.yml',
      eventName: 'pull_request',
      id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
      eventAlias: 'pr',
      labelEvent: 'labeled',
      labelName: 'locked (spam)',
      issueNumber: 1,
      userLogin: 'userLogin',
      senderLogin: 'senderLogin',
      locked: false
    };
    const cfg: IConfig = {
      config: config,
      parentFieldName: 'labels.locked (spam).labeled.pr',
      labelIndex: '2',
      locking: 'lock',
      action: 'close',
      lockReason: 'spam'
    };
    const comment: Comment = new Comment(ctx, cfg);
    expect(comment.render).toBe(`\
This pull request #1 has been **LOCKED** with the label locked (spam)!\n\nPlease do not spam messages on this project. You may get blocked from this repository for doing so.

<!-- peaceiris/actions-label-commenter -->
`);
  });
});
