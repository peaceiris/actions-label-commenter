import {context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';

import {IssuesUpdateResponse, IssuesLockResponse, IssuesUnlockResponse} from './types';

async function closeIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
): Promise<IssuesUpdateResponse> {
  return await githubClient.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    state: 'closed'
  });
}

async function openIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
): Promise<IssuesUpdateResponse> {
  return await githubClient.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    state: 'open'
  });
}

async function lockIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number,
  lockReason?: string
): Promise<IssuesLockResponse> {
  const reason = (() => {
    switch (lockReason) {
      case 'off-topic':
        return 'off-topic';
      case 'too heated':
        return 'too heated';
      case 'resolved':
        return 'resolved';
      case 'spam':
        return 'spam';
      default:
        return 'resolved';
    }
  })();

  return await githubClient.rest.issues.lock({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    lock_reason: reason
  });
}

async function unlockIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
): Promise<IssuesUnlockResponse> {
  return await githubClient.rest.issues.unlock({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber
  });
}

export {closeIssue, openIssue, lockIssue, unlockIssue};
