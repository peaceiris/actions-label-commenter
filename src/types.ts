import {Octokit} from '@octokit/rest';
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';

const octokit = new Octokit();
type IssuesCreateCommentResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.issues.createComment
>;
type IssuesUpdateResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.update>;
type IssuesLockResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.lock>;
type IssuesUnlockResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.unlock>;

export {
  IssuesCreateCommentResponse,
  IssuesUpdateResponse,
  IssuesLockResponse,
  IssuesUnlockResponse
};
