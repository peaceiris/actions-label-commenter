import {context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';
import type {GraphQlQueryResponseData} from '@octokit/graphql';
import type {RequestParameters} from '@octokit/graphql/dist-types/types';
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';

import {groupConsoleLog, info} from '../logger';

const octokit = new GitHub();
type IssuesCreateCommentResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.issues.createComment
>;
type IssuesUpdateResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.update>;
type IssuesLockResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.lock>;
type IssuesUnlockResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.issues.unlock>;

type IssueState = 'open' | 'closed';
type LockReason = 'off-topic' | 'too heated' | 'resolved' | 'spam' | undefined;

interface IIssue {
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly number: number;
  locked: boolean;
}

interface IIssueProcessor extends IIssue {
  setLocked(locked: boolean): void;
  createComment(body: string): Promise<void>;
  updateState(state: IssueState): Promise<void>;
  lock(reason: LockReason): Promise<void>;
  unlock(reason: LockReason): Promise<void>;
}

class Issue implements IIssueProcessor {
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly number: number;
  locked: boolean;

  constructor(githubClient: InstanceType<typeof GitHub>, number: number, locked: boolean) {
    this.githubClient = githubClient;
    this.number = number;
    this.locked = locked;
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
  }

  async createComment(body: string): Promise<void> {
    try {
      const res: IssuesCreateCommentResponse = await this.githubClient.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: body
      });

      groupConsoleLog('IssuesCreateCommentResponse', res);

      if (res.status === 201) {
        info(`New comment has been created in issue #${this.number}`);
        info(`Comment URL: ${res.data.html_url}`);
        return;
      } else {
        throw new Error(`IssuesCreateCommentResponse.status: ${res.status}`);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateState(state: IssueState): Promise<void> {
    try {
      const res: IssuesUpdateResponse = await this.githubClient.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: this.number,
        state: state
      });

      groupConsoleLog('IssuesUpdateResponse', res);

      if (res.status === 200) {
        if (state === 'closed') {
          info(`Issue #${this.number} has been closed`);
          return;
        }
        info(`Issue #${this.number} has been reopened`);
      } else {
        throw new Error(`IssuesUpdateResponse.status: ${res.status}`);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async lock(reason: LockReason): Promise<void> {
    try {
      const res: IssuesLockResponse = await this.githubClient.rest.issues.lock({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: this.number,
        lock_reason: reason || 'resolved'
      });

      groupConsoleLog('IssuesLockResponse', res);

      if (res.status === 204) {
        info(`Issue #${this.number} has been locked`);
        return;
      } else {
        throw new Error(`IssuesLockResponse.status: ${res.status}`);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async unlock(): Promise<void> {
    try {
      const res: IssuesUnlockResponse = await this.githubClient.rest.issues.unlock({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: this.number
      });

      groupConsoleLog('IssuesUnlockResponse', res);

      if (res.status === 204) {
        info(`Issue #${this.number} has been unlocked`);
        return;
      } else {
        throw new Error(`IssuesUnlockResponse.status: ${res.status}`);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async markPullRequestReadyForReview(): Promise<void> {
    const query = `
      mutation($input: MarkPullRequestReadyForReviewInput!) {
        markPullRequestReadyForReview(input: $input) {
          clientMutationId
        }
      }`;
    const variables: RequestParameters = {
      input: {
        pullRequestId: this.number
      }
    };

    try {
      const res: GraphQlQueryResponseData = await this.githubClient.graphql(query, variables);
      groupConsoleLog('GraphQlQueryResponseData', res);
    } catch (error) {
      groupConsoleLog('Request failed', error.request);
      throw new Error(error.message);
    }
  }

  async convertPullRequestToDraft(): Promise<void> {
    const query = `
      mutation($input: ConvertPullRequestToDraftInput!) {
        convertPullRequestToDraft(input: $input) {
          clientMutationId
        }
      }`;
    const variables: RequestParameters = {
      input: {
        pullRequestId: this.number
      }
    };

    try {
      const res: GraphQlQueryResponseData = await this.githubClient.graphql(query, variables);
      groupConsoleLog('GraphQlQueryResponseData', res);
    } catch (error) {
      groupConsoleLog('Request failed', error.request);
      throw new Error(error.message);
    }
  }
}

export {LockReason, IIssueProcessor, Issue};
