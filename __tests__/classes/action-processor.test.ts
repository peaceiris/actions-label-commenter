import {getOctokit} from '@actions/github';

import {ActionProcessor} from '../../src/classes/action-processor';
import {IConfig} from '../../src/classes/config';
import {Issue} from '../../src/classes/issue';

const commentBody = `hello`;
const githubClient = getOctokit('token');
let locked = false;
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

// beforeEach(() => {
// });

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('ActionProcessor', () => {
  test('Create comment and close issue', async () => {
    const config: IConfig = {
      parentFieldName: 'labels.invalid.labeled.issue',
      labelIndex: '0',
      locking: undefined,
      action: 'close',
      lockReason: undefined
    };
    locked = false;
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
});
