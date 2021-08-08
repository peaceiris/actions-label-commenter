import {getOctokit} from '@actions/github';

import {ActionProcessor} from '../../src/classes/action-processor';
import {IConfig} from '../../src/classes/config';
import {Issue} from '../../src/classes/issue';
import {groupConsoleLog} from '../../src/logger';

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
  unlock: jest.fn()
};

// beforeAll(() => {
// });

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('ActionProcessor', () => {
  test('Create a comment and close an issue', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.invalid.labeled.issue',
      labelIndex: '0',
      action: 'close',
      locking: undefined,
      lockReason: undefined
    };
    const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
    await actionProcessor.process();
    expect(issueMock.setLocked).toBeCalledTimes(0);
    expect(issueMock.createComment).toBeCalledTimes(1);
    expect(issueMock.createComment).toBeCalledWith(commentBody);
    expect(issueMock.updateState).toBeCalledTimes(1);
    expect(issueMock.updateState).toBeCalledWith('closed');
    expect(issueMock.lock).toBeCalledTimes(0);
    expect(issueMock.unlock).toBeCalledTimes(0);
  });

  test('Create a comment and open an issue', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.invalid.labeled.issue',
      labelIndex: '0',
      action: 'open',
      locking: undefined,
      lockReason: undefined
    };
    const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
    await actionProcessor.process();
    expect(issueMock.setLocked).toBeCalledTimes(0);
    expect(issueMock.createComment).toBeCalledTimes(1);
    expect(issueMock.createComment).toBeCalledWith(commentBody);
    expect(issueMock.updateState).toBeCalledTimes(1);
    expect(issueMock.updateState).toBeCalledWith('open');
    expect(issueMock.lock).toBeCalledTimes(0);
    expect(issueMock.unlock).toBeCalledTimes(0);
  });

  test('Open an issue without creating a comment if the issue is locked', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.invalid.labeled.issue',
      labelIndex: '0',
      action: 'open',
      locking: undefined,
      lockReason: undefined
    };
    const locked = true;
    const issueMock: Issue = {
      githubClient: githubClient,
      number: 1,
      locked: locked,
      setLocked: jest.fn(),
      createComment: jest.fn(),
      updateState: jest.fn(),
      lock: jest.fn(),
      unlock: jest.fn()
    };
    const actionProcessor = new ActionProcessor(config, commentBody, issueMock);
    await actionProcessor.process();
    expect(issueMock.setLocked).toBeCalledTimes(0);
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
    expect(issueMock.setLocked).toBeCalledTimes(0);
    expect(issueMock.createComment).toBeCalledTimes(0);
    expect(issueMock.updateState).toBeCalledTimes(0);
    expect(issueMock.lock).toBeCalledTimes(0);
    expect(issueMock.unlock).toBeCalledTimes(0);
  });
});
