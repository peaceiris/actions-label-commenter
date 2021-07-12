import {context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';

export async function closeIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
): Promise<void> {
  await githubClient.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    state: 'closed'
  });
  return;
}

export async function openIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
): Promise<void> {
  await githubClient.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    state: 'open'
  });
  return;
}

export async function lockIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number,
  lockReason?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
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

export async function unlockIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return await githubClient.rest.issues.unlock({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber
  });
}

export async function toggleDraftState(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number,
  draft: boolean
): Promise<void> {
  await githubClient.rest.pulls.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: issueNumber,
    draft: draft
  });
  return;
}
