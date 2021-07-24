import {GitHub} from '@actions/github/lib/utils';
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';

const octokit = new GitHub();
type IssuesCreateCommentResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.issues.createComment
>;
type IssuesUpdateResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.update>;
type IssuesLockResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.lock>;
type IssuesUnlockResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.unlock>;

type LockReason = 'off-topic' | 'too heated' | 'resolved' | 'spam';

export {
  IssuesCreateCommentResponse,
  IssuesUpdateResponse,
  IssuesLockResponse,
  IssuesUnlockResponse,
  LockReason
};
