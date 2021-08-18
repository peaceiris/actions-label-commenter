import {context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';
import type {GraphQlQueryResponseData} from '@octokit/graphql';
import {GraphqlResponseError} from '@octokit/graphql';
import type {RequestParameters} from '@octokit/graphql/dist-types/types';
// eslint-disable-next-line import/named
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

const snakeCase = (str: string) => {
  return str.replace(/-/g, '_').replace(/ /g, '_');
};

interface IIssue {
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly id: string;
  readonly number: number;
}

interface IIssueProcessor extends IIssue {
  createComment(body: string): Promise<void>;
  updateState(state: IssueState): Promise<void>;
  lock(reason: LockReason): Promise<void>;
  unlock(): Promise<void>;
  markPullRequestReadyForReview(): Promise<void>;
  convertPullRequestToDraft(): Promise<void>;
  addDiscussionComment(body: string): Promise<string>;
  lockLockable(reason: LockReason): Promise<void>;
  unlockLockable(): Promise<void>;
  markDiscussionCommentAsAnswer(id: string): Promise<void>;
}

class Issue implements IIssueProcessor {
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly id: string;
  readonly number: number;

  constructor(githubClient: InstanceType<typeof GitHub>, id: string, number: number) {
    this.githubClient = githubClient;
    this.id = id;
    this.number = number;
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
        info(`New comment has been created in issue #${this.number}, ${res.data.html_url}`);
        return;
      } else {
        throw new Error(`IssuesCreateCommentResponse.status: ${res.status}`);
      }
    } catch (error) {
<<<<<<< HEAD
      if (error instanceof Error) {
        throw new Error(error.message);
      }
=======
      groupConsoleLog('Dump error.stack', error.stack);
      throw new Error(error.message);
>>>>>>> 4ff1a82 (Deprecate (issue|pull_request|discussion).user.login and sender.login)
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
          info(`#${this.number} has been closed`);
          return;
        }
        info(`#${this.number} has been reopened`);
      } else {
        throw new Error(`IssuesUpdateResponse.status: ${res.status}`);
      }
    } catch (error) {
<<<<<<< HEAD
      if (error instanceof Error) {
        throw new Error(error.message);
      }
=======
      groupConsoleLog('Dump error.stack', error.stack);
      throw new Error(error.message);
>>>>>>> 4ff1a82 (Deprecate (issue|pull_request|discussion).user.login and sender.login)
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
        info(`#${this.number} has been locked`);
        return;
      } else {
        throw new Error(`IssuesLockResponse.status: ${res.status}`);
      }
    } catch (error) {
<<<<<<< HEAD
      if (error instanceof Error) {
        throw new Error(error.message);
      }
=======
      groupConsoleLog('Dump error.stack', error.stack);
      throw new Error(error.message);
>>>>>>> 4ff1a82 (Deprecate (issue|pull_request|discussion).user.login and sender.login)
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
        info(`#${this.number} has been unlocked`);
        return;
      } else {
        throw new Error(`IssuesUnlockResponse.status: ${res.status}`);
      }
    } catch (error) {
<<<<<<< HEAD
      if (error instanceof Error) {
        throw new Error(error.message);
      }
=======
      groupConsoleLog('Dump error.stack', error.stack);
      throw new Error(error.message);
>>>>>>> 4ff1a82 (Deprecate (issue|pull_request|discussion).user.login and sender.login)
    }
  }

  async markPullRequestReadyForReview(): Promise<void> {
    const query = `
      mutation MarkPullRequestReadyForReview($input: MarkPullRequestReadyForReviewInput!) {
        __typename
        markPullRequestReadyForReview(input: $input) {
          pullRequest {
            isDraft
          }
        }
      }
    `;
    const variables: RequestParameters = {
      input: {
        pullRequestId: this.id
      }
    };

    try {
      const res: GraphQlQueryResponseData = await this.githubClient.graphql(query, variables);
      info(`#${this.number} has been marked as ready for review`);
      groupConsoleLog('GraphQlQueryResponseData', res);
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groupConsoleLog('Request failed', error.request as any);
        throw new Error(error.message);
      } else {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
      }
    }
  }

  async convertPullRequestToDraft(): Promise<void> {
    const query = `
      mutation ConvertPullRequestToDraft($input: ConvertPullRequestToDraftInput!) {
        __typename
        convertPullRequestToDraft(input: $input) {
          pullRequest {
            isDraft
          }
        }
      }
    `;
    const variables: RequestParameters = {
      input: {
        pullRequestId: this.id
      }
    };

    try {
      const res: GraphQlQueryResponseData = await this.githubClient.graphql(query, variables);
      info(`#${this.number} has been converted to draft`);
      groupConsoleLog('GraphQlQueryResponseData', res);
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groupConsoleLog('Request failed', error.request as any);
        throw new Error(error.message);
      } else {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error('unexpected error');
      }
    }
  }

  async addDiscussionComment(body: string): Promise<string> {
    const query = `
      mutation AddDiscussionComment($input: AddDiscussionCommentInput!) {
        __typename
        addDiscussionComment(input: $input) {
          comment {
            body
            id
            url
          }
        }
      }
    `;
    const variables: RequestParameters = {
      input: {
        discussionId: this.id,
        body: body
      }
    };

    try {
      const res: GraphQlQueryResponseData = await this.githubClient.graphql(query, variables);
      info(`Add comment to #${this.number}, ${res.addDiscussionComment.comment.url}`);
      groupConsoleLog('GraphQlQueryResponseData', res);
      return res.addDiscussionComment.comment.id;
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groupConsoleLog('Request failed', error.request as any);
        throw new Error(error.message);
      } else {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error('unexpected error');
      }
    }
  }

  async lockLockable(reason: LockReason): Promise<void> {
    const query = `
      mutation LockLockable($input: LockLockableInput!) {
        __typename
        lockLockable(input: $input) {
          lockedRecord {
            locked
            activeLockReason
          }
        }
      }
    `;
    const variables: RequestParameters = {
      input: {
        lockableId: this.id,
        lockReason: snakeCase(reason || 'RESOLVED').toUpperCase()
      }
    };

    try {
      const res: GraphQlQueryResponseData = await this.githubClient.graphql(query, variables);
      info(`#${this.number} has been locked`);
      groupConsoleLog('GraphQlQueryResponseData', res);
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groupConsoleLog('Request failed', error.request as any);
        throw new Error(error.message);
      } else {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error('unexpected error');
      }
    }
  }

  async unlockLockable(): Promise<void> {
    const query = `
      mutation UnlockLockable($input: UnlockLockableInput!) {
        __typename
        unlockLockable(input: $input) {
          unlockedRecord {
            locked
          }
        }
      }
    `;
    const variables: RequestParameters = {
      input: {
        lockableId: this.id
      }
    };

    try {
      const res: GraphQlQueryResponseData = await this.githubClient.graphql(query, variables);
      info(`#${this.number} has been unlocked`);
      groupConsoleLog('GraphQlQueryResponseData', res);
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groupConsoleLog('Request failed', error.request as any);
        throw new Error(error.message);
      } else {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error('unexpected error');
      }
    }
  }

  async markDiscussionCommentAsAnswer(id: string): Promise<void> {
    const query = `
      mutation MarkDiscussionCommentAsAnswer($input: MarkDiscussionCommentAsAnswerInput!) {
        __typename
        markDiscussionCommentAsAnswer(input: $input) {
          discussion {
            id
          }
        }
      }
    `;
    const variables: RequestParameters = {
      input: {
        id: id
      }
    };

    try {
      const res: GraphQlQueryResponseData = await this.githubClient.graphql(query, variables);
      info(`Mark the discussion comment as answer`);
      groupConsoleLog('GraphQlQueryResponseData', res);
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groupConsoleLog('Request failed', error.request as any);
        throw new Error(error.message);
      } else {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error('unexpected error');
      }
    }
  }
}

export {LockReason, IIssueProcessor, Issue};
