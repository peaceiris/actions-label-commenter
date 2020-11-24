import {context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';

export async function closeIssue(
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number
): Promise<void> {
  await githubClient.issues.update({
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
  await githubClient.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    state: 'open'
  });
  return;
}

export async function lockHandler(
  parentFieldName: string,
  githubClient: InstanceType<typeof GitHub>,
  issueNumber: number,
  locking?: string,
  lockReason?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  if (locking === 'lock') {
    return await githubClient.issues.lock({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      lock_reason: lockReason
    });
  } else if (locking === 'unlock') {
    return await githubClient.issues.unlock({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber
    });
  } else if (locking === '' || locking === void 0) {
    return `[INFO] no configuration ${parentFieldName}.locking`;
  } else {
    throw new Error(`invalid value "${locking}" ${parentFieldName}.locking`);
  }
}
