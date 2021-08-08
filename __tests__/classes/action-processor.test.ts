import {getOctokit} from '@actions/github';

import {ActionProcessor} from '../../src/classes/action-processor';
import {IConfig} from '../../src/classes/config';
import {Issue} from '../../src/classes/issue';

const commentBody = `hello`;
const githubClient = getOctokit('token');
const issueMock: Issue = {
  githubClient: githubClient,
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

// beforeAll(() => {
// });

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('issue', () => {
  test('Comment and close', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.invalid.labeled.issue',
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

  test('Comment, close, and lock without lockReason', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.locked (resolved).labeled.issue',
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

  test('Comment, close, and lock with lockReason', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.locked (spam).labeled.issue',
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

  test('Unlock, open and comment', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.locked (heated).labeled.issue',
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

  test('Comment and open', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.invalid.labeled.issue',
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

  test('Open without comment if the issue is locked', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.invalid.labeled.issue',
      labelIndex: '0',
      action: 'open',
      locking: undefined,
      lockReason: undefined
    };
    const issueMock: Issue = {
      githubClient: githubClient,
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

  test('Skip all actions for a label that has no configuration', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.unknown.labeled.issue',
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

  test('Skip comment if body is empty', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.spam.labeled.issue',
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
});
