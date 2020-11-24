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
