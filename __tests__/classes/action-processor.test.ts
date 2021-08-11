import {getOctokit} from '@actions/github';

import {ActionProcessor} from '../../src/classes/action-processor';
import {IConfig} from '../../src/classes/config';
import {Issue} from '../../src/classes/issue';

const commentBody = `hello`;
const githubClient = getOctokit('token');
const issueMock: Issue = {
  githubClient: githubClient,
  id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
  number: 1,
  locked: false,
  setLocked: jest.fn(),
  createComment: jest.fn(),
  updateState: jest.fn(),
  lock: jest.fn(),
  unlock: jest.fn(),
  markPullRequestReadyForReview: jest.fn(),
  convertPullRequestToDraft: jest.fn()
};
const tests = ['issue', 'pr'];

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
        parentFieldName: `labels.invalid.labeled.${t}`,
        labelIndex: '0',
        action: 'close',
        locking: undefined,
        lockReason: undefined
      };
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(1);
      expect(issueMock.createComment).toBeCalledWith(commentBody);
      expect(issueMock.updateState).toBeCalledTimes(1);
      expect(issueMock.updateState).toBeCalledWith('closed');
      expect(issueMock.lock).toBeCalledTimes(0);
      expect(issueMock.unlock).toBeCalledTimes(0);
    });
  }
});

describe('Comment, close, and lock without lockReason', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        parentFieldName: `labels.locked (resolved).labeled.${t}`,
        labelIndex: '0',
        action: 'close',
        locking: 'lock',
        lockReason: undefined
      };
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(1);
      expect(issueMock.createComment).toBeCalledWith(commentBody);
      expect(issueMock.updateState).toBeCalledTimes(1);
      expect(issueMock.updateState).toBeCalledWith('closed');
      expect(issueMock.lock).toBeCalledTimes(1);
      expect(issueMock.unlock).toBeCalledTimes(0);
    });
  }
});

describe('Comment, close, and lock with lockReason', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        parentFieldName: `labels.locked (spam).labeled.${t}`,
        labelIndex: '0',
        action: 'close',
        locking: 'lock',
        lockReason: 'spam'
      };
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(1);
      expect(issueMock.createComment).toBeCalledWith(commentBody);
      expect(issueMock.updateState).toBeCalledTimes(1);
      expect(issueMock.updateState).toBeCalledWith('closed');
      expect(issueMock.lock).toBeCalledTimes(1);
      expect(issueMock.lock).toBeCalledWith('spam');
      expect(issueMock.unlock).toBeCalledTimes(0);
    });
  }
});

describe('Unlock, open and comment', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        parentFieldName: `labels.locked (heated).labeled.${t}`,
        labelIndex: '0',
        action: 'open',
        locking: 'unlock',
        lockReason: undefined
      };
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(1);
      expect(issueMock.createComment).toBeCalledWith(commentBody);
      expect(issueMock.updateState).toBeCalledTimes(1);
      expect(issueMock.updateState).toBeCalledWith('open');
      expect(issueMock.lock).toBeCalledTimes(0);
      expect(issueMock.unlock).toBeCalledTimes(1);
    });
  }
});

describe('Comment and open', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        parentFieldName: `labels.invalid.labeled.${t}`,
        labelIndex: '0',
        action: 'open',
        locking: undefined,
        lockReason: undefined
      };
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(1);
      expect(issueMock.createComment).toBeCalledWith(commentBody);
      expect(issueMock.updateState).toBeCalledTimes(1);
      expect(issueMock.updateState).toBeCalledWith('open');
      expect(issueMock.lock).toBeCalledTimes(0);
      expect(issueMock.unlock).toBeCalledTimes(0);
    });
  }
});

describe('Open without comment if the issue is locked', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        parentFieldName: `labels.invalid.labeled.${t}`,
        labelIndex: '0',
        action: 'open',
        locking: undefined,
        lockReason: undefined
      };
      const issueMock: Issue = {
        githubClient: githubClient,
        id: 'MDExOlB1bGxSZXF1ZXN0NzA2MTE5NTg0',
        number: 1,
        locked: true,
        setLocked: jest.fn(),
        createComment: jest.fn(),
        updateState: jest.fn(),
        lock: jest.fn(),
        unlock: jest.fn(),
        markPullRequestReadyForReview: jest.fn(),
        convertPullRequestToDraft: jest.fn()
      };
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(0);
      expect(issueMock.updateState).toBeCalledTimes(1);
      expect(issueMock.updateState).toBeCalledWith('open');
      expect(issueMock.lock).toBeCalledTimes(0);
      expect(issueMock.unlock).toBeCalledTimes(0);
    });
  }
});

describe('Skip all actions for a label that has no configuration', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        parentFieldName: `labels.unknown.labeled.${t}`,
        labelIndex: '',
        action: undefined,
        locking: undefined,
        lockReason: undefined
      };
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(0);
      expect(issueMock.updateState).toBeCalledTimes(0);
      expect(issueMock.lock).toBeCalledTimes(0);
      expect(issueMock.unlock).toBeCalledTimes(0);
    });
  }
});

describe('Skip comment if body is empty', () => {
  for (const t of tests) {
    test(`${t}`, async () => {
      const config: IConfig = {
        parentFieldName: `labels.spam.labeled.${t}`,
        labelIndex: '1',
        action: 'close',
        locking: 'lock',
        lockReason: 'spam'
      };
      const commentBody = '';
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(0);
      expect(issueMock.updateState).toBeCalledTimes(1);
      expect(issueMock.updateState).toBeCalledWith('closed');
      expect(issueMock.lock).toBeCalledTimes(1);
      expect(issueMock.lock).toBeCalledWith('spam');
      expect(issueMock.unlock).toBeCalledTimes(0);
    });
  }
});

describe('Toggle draft status', () => {
  const tests = [true, false];

  for (const t of tests) {
    test(`draft ${t}`, async () => {
      const config: IConfig = {
        parentFieldName: `labels.invalid.labeled.pr`,
        labelIndex: '0',
        action: undefined,
        locking: undefined,
        lockReason: undefined,
        draft: t
      };
      const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
      await actionProcessor.process();
      expect(issueMock.createComment).toBeCalledTimes(1);
      expect(issueMock.updateState).toBeCalledTimes(0);
      expect(issueMock.lock).toBeCalledTimes(0);
      expect(issueMock.unlock).toBeCalledTimes(0);
      expect(issueMock.markPullRequestReadyForReview).toBeCalledTimes(t ? 0 : 1);
      expect(issueMock.convertPullRequestToDraft).toBeCalledTimes(t ? 1 : 0);
    });
  }
});
