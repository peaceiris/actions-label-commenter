import {getOctokit} from '@actions/github';

import {ActionProcessor} from '../../src/classes/action-processor';
import {IConfig, Action, Draft} from '../../src/classes/config';
import {EventAlias} from '../../src/classes/context-loader';
import {Issue} from '../../src/classes/issue';

const commentBody = `hello`;
const githubClient = getOctokit('token');
const issueMock: Issue = {
  githubClient: githubClient,
  id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
  number: 1,
  createComment: jest.fn(),
  updateState: jest.fn(),
  lock: jest.fn(),
  unlock: jest.fn(),
  markPullRequestReadyForReview: jest.fn(),
  convertPullRequestToDraft: jest.fn(),
  addDiscussionComment: jest.fn(),
  lockLockable: jest.fn(),
  unlockLockable: jest.fn(),
  markDiscussionCommentAsAnswer: jest.fn()
} as const;
const tests: Array<EventAlias> = ['issue', 'pr'];

// beforeAll(() => {
// });

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('Comment and close', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.invalid.labeled.${t}`,
        labelIndex: '0',
        action: 'close',
        locking: undefined,
        lockReason: undefined,
        answer: undefined
      } as const;
      const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
      await actionProcessor.process();
      expect(issueMock.createComment).toHaveBeenCalledTimes(1);
      expect(issueMock.createComment).toHaveBeenCalledWith(commentBody);
      expect(issueMock.updateState).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledWith('closed');
      expect(issueMock.lock).toHaveBeenCalledTimes(0);
      expect(issueMock.unlock).toHaveBeenCalledTimes(0);
    });
  }
});

describe('Comment, close, and lock without reason', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.locked (resolved).labeled.${t}`,
        labelIndex: '0',
        action: 'close',
        locking: 'lock',
        lockReason: undefined,
        answer: undefined
      } as const;
      const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
      await actionProcessor.process();
      expect(issueMock.createComment).toHaveBeenCalledTimes(1);
      expect(issueMock.createComment).toHaveBeenCalledWith(commentBody);
      expect(issueMock.updateState).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledWith('closed');
      expect(issueMock.lock).toHaveBeenCalledTimes(1);
      expect(issueMock.lock).toHaveBeenCalledWith(config.lockReason);
      expect(issueMock.unlock).toHaveBeenCalledTimes(0);
    });
  }
});

describe('Comment, close, and lock with lockReason', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.locked (spam).labeled.${t}`,
        labelIndex: '0',
        action: 'close',
        locking: 'lock',
        lockReason: 'spam',
        answer: undefined
      } as const;
      const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
      await actionProcessor.process();
      expect(issueMock.createComment).toHaveBeenCalledTimes(1);
      expect(issueMock.createComment).toHaveBeenCalledWith(commentBody);
      expect(issueMock.updateState).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledWith('closed');
      expect(issueMock.lock).toHaveBeenCalledTimes(1);
      expect(issueMock.lock).toHaveBeenCalledWith(config.lockReason);
      expect(issueMock.unlock).toHaveBeenCalledTimes(0);
    });
  }
});

describe('Unlock, open and comment', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.locked (heated).labeled.${t}`,
        labelIndex: '0',
        action: 'open',
        locking: 'unlock',
        lockReason: undefined,
        answer: undefined
      } as const;
      const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, true);
      await actionProcessor.process();
      expect(issueMock.unlock).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledWith('open');
      expect(issueMock.createComment).toHaveBeenCalledTimes(1);
      expect(issueMock.createComment).toHaveBeenCalledWith(commentBody);

      expect(issueMock.lock).toHaveBeenCalledTimes(0);
    });
  }
});

describe('Comment and open', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.invalid.labeled.${t}`,
        labelIndex: '0',
        action: 'open',
        locking: undefined,
        lockReason: undefined,
        answer: undefined
      } as const;
      const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
      await actionProcessor.process();
      expect(issueMock.createComment).toHaveBeenCalledTimes(1);
      expect(issueMock.createComment).toHaveBeenCalledWith(commentBody);
      expect(issueMock.updateState).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledWith('open');
      expect(issueMock.lock).toHaveBeenCalledTimes(0);
      expect(issueMock.unlock).toHaveBeenCalledTimes(0);
    });
  }
});

describe('Open without comment if the issue is locked', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.invalid.labeled.${t}`,
        labelIndex: '0',
        action: 'open',
        locking: undefined,
        lockReason: undefined,
        answer: undefined
      } as const;
      const issueMock: Issue = {
        githubClient: githubClient,
        id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
        number: 1,
        createComment: jest.fn(),
        updateState: jest.fn(),
        lock: jest.fn(),
        unlock: jest.fn(),
        markPullRequestReadyForReview: jest.fn(),
        convertPullRequestToDraft: jest.fn(),
        addDiscussionComment: jest.fn(),
        lockLockable: jest.fn(),
        unlockLockable: jest.fn(),
        markDiscussionCommentAsAnswer: jest.fn()
      } as const;
      const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, true);
      await actionProcessor.process();
      expect(issueMock.createComment).toHaveBeenCalledTimes(0);
      expect(issueMock.updateState).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledWith('open');
      expect(issueMock.lock).toHaveBeenCalledTimes(0);
      expect(issueMock.unlock).toHaveBeenCalledTimes(0);
    });
  }
});

describe('Skip all actions for a label that has no configuration', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.unknown.labeled.${t}`,
        labelIndex: '',
        action: undefined,
        locking: undefined,
        lockReason: undefined,
        answer: undefined
      } as const;
      const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
      await actionProcessor.process();
      expect(issueMock.createComment).toHaveBeenCalledTimes(0);
      expect(issueMock.updateState).toHaveBeenCalledTimes(0);
      expect(issueMock.lock).toHaveBeenCalledTimes(0);
      expect(issueMock.unlock).toHaveBeenCalledTimes(0);
      expect(issueMock.markPullRequestReadyForReview).toHaveBeenCalledTimes(0);
      expect(issueMock.convertPullRequestToDraft).toHaveBeenCalledTimes(0);
      expect(issueMock.addDiscussionComment).toHaveBeenCalledTimes(0);
      expect(issueMock.lockLockable).toHaveBeenCalledTimes(0);
      expect(issueMock.unlockLockable).toHaveBeenCalledTimes(0);
      expect(issueMock.markDiscussionCommentAsAnswer).toHaveBeenCalledTimes(0);
    });
  }
});

describe('Skip comment if body is empty', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.spam.labeled.${t}`,
        labelIndex: '1',
        action: 'close',
        locking: 'lock',
        lockReason: 'spam',
        answer: undefined
      } as const;
      const commentBody = '';
      const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
      await actionProcessor.process();
      expect(issueMock.createComment).toHaveBeenCalledTimes(0);
      expect(issueMock.updateState).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledWith('closed');
      expect(issueMock.lock).toHaveBeenCalledTimes(1);
      expect(issueMock.lock).toHaveBeenCalledWith('spam');
      expect(issueMock.unlock).toHaveBeenCalledTimes(0);
    });
  }
});

describe('Toggle draft status', () => {
  const tests = [
    {
      action: 'open',
      draft: true
    },
    {
      action: 'close',
      draft: false
    }
  ];

  for (const t of tests) {
    test(`draft ${t}`, async () => {
      const config: IConfig = {
        config: {},
        parentFieldName: `labels.invalid.labeled.pr`,
        labelIndex: '0',
        action: t.action as Action,
        locking: undefined,
        lockReason: undefined,
        draft: t.draft as Draft,
        answer: undefined
      } as const;
      const actionProcessor = new ActionProcessor('pr', config, commentBody, issueMock, false);
      await actionProcessor.process();
      expect(issueMock.createComment).toHaveBeenCalledTimes(1);
      expect(issueMock.updateState).toHaveBeenCalledTimes(1);
      expect(issueMock.lock).toHaveBeenCalledTimes(0);
      expect(issueMock.unlock).toHaveBeenCalledTimes(0);
      expect(issueMock.markPullRequestReadyForReview).toHaveBeenCalledTimes(t.draft ? 0 : 1);
      expect(issueMock.convertPullRequestToDraft).toHaveBeenCalledTimes(t.draft ? 1 : 0);
    });
  }
});

describe('discussion', () => {
  const t: EventAlias = 'discussion';

  test(`Comment`, async () => {
    const config: IConfig = {
      config: {},
      parentFieldName: `labels.invalid.labeled.${t}`,
      labelIndex: '0',
      action: undefined,
      locking: undefined,
      lockReason: undefined,
      answer: undefined
    } as const;
    const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
    await actionProcessor.process();
    expect(issueMock.addDiscussionComment).toHaveBeenCalledTimes(1);
    expect(issueMock.addDiscussionComment).toHaveBeenCalledWith(commentBody);
    expect(issueMock.lockLockable).toHaveBeenCalledTimes(0);
    expect(issueMock.unlockLockable).toHaveBeenCalledTimes(0);
    expect(issueMock.markDiscussionCommentAsAnswer).toHaveBeenCalledTimes(0);
  });

  test(`Comment and lock`, async () => {
    const config: IConfig = {
      config: {},
      parentFieldName: `labels.invalid.labeled.${t}`,
      labelIndex: '0',
      action: undefined,
      locking: 'lock',
      lockReason: 'spam',
      answer: undefined
    } as const;
    const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
    await actionProcessor.process();
    expect(issueMock.addDiscussionComment).toHaveBeenCalledTimes(1);
    expect(issueMock.addDiscussionComment).toHaveBeenCalledWith(commentBody);
    expect(issueMock.lockLockable).toHaveBeenCalledTimes(1);
    expect(issueMock.lockLockable).toHaveBeenCalledWith(config.lockReason);
    expect(issueMock.unlockLockable).toHaveBeenCalledTimes(0);
    expect(issueMock.markDiscussionCommentAsAnswer).toHaveBeenCalledTimes(0);
  });

  test(`Comment and lock without reason`, async () => {
    const config: IConfig = {
      config: {},
      parentFieldName: `labels.invalid.labeled.${t}`,
      labelIndex: '0',
      action: undefined,
      locking: 'lock',
      lockReason: undefined,
      answer: undefined
    } as const;
    const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
    await actionProcessor.process();
    expect(issueMock.addDiscussionComment).toHaveBeenCalledTimes(1);
    expect(issueMock.addDiscussionComment).toHaveBeenCalledWith(commentBody);
    expect(issueMock.lockLockable).toHaveBeenCalledTimes(1);
    expect(issueMock.lockLockable).toHaveBeenCalledWith(config.lockReason);
    expect(issueMock.unlockLockable).toHaveBeenCalledTimes(0);
    expect(issueMock.markDiscussionCommentAsAnswer).toHaveBeenCalledTimes(0);
  });

  test(`Comment and unlock`, async () => {
    const config: IConfig = {
      config: {},
      parentFieldName: `labels.invalid.labeled.${t}`,
      labelIndex: '0',
      action: undefined,
      locking: 'unlock',
      lockReason: undefined,
      answer: undefined
    } as const;
    const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, true);
    await actionProcessor.process();
    expect(issueMock.addDiscussionComment).toHaveBeenCalledTimes(1);
    expect(issueMock.addDiscussionComment).toHaveBeenCalledWith(commentBody);
    expect(issueMock.lockLockable).toHaveBeenCalledTimes(0);
    expect(issueMock.unlockLockable).toHaveBeenCalledTimes(1);
    expect(issueMock.markDiscussionCommentAsAnswer).toHaveBeenCalledTimes(0);
  });

  test(`Comment and mark as answer`, async () => {
    const config: IConfig = {
      config: {},
      parentFieldName: `labels.invalid.labeled.${t}`,
      labelIndex: '0',
      action: undefined,
      locking: undefined,
      lockReason: undefined,
      answer: true
    } as const;
    const actionProcessor = new ActionProcessor(t, config, commentBody, issueMock, false);
    await actionProcessor.process();
    expect(issueMock.addDiscussionComment).toHaveBeenCalledTimes(1);
    expect(issueMock.addDiscussionComment).toHaveBeenCalledWith(commentBody);
    expect(issueMock.lockLockable).toHaveBeenCalledTimes(0);
    expect(issueMock.unlockLockable).toHaveBeenCalledTimes(0);
    expect(issueMock.markDiscussionCommentAsAnswer).toHaveBeenCalledTimes(1);
  });
});
