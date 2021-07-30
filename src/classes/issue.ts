import {context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';
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
type LockReason = 'off-topic' | 'too heated' | 'resolved' | 'spam';

interface IIssue {
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly number: number;
  locked: boolean;

  setLocked(locked: boolean): void;
  createComment(body: string): Promise<void>;
  updateState(state: IssueState): Promise<void>;
  lock(reason: LockReason): Promise<void>;
  unlock(reason: LockReason): Promise<void>;
}

class Issue implements IIssue {
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
    if (this.locked) {
      info(`Issue #${this.number} is locked, skip ${this.createComment.name}`);
      return;
    }

    const ret: IssuesCreateCommentResponse = await this.githubClient.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: body
    });

    groupConsoleLog('IssuesCreateCommentResponse', ret);

    if (ret.status === 201) {
      info(`New comment has been created in issue #${this.number}`);
      info(`Comment URL: ${ret.data.html_url}`);
      return;
    } else {
      throw new Error(`IssuesCreateCommentResponse.status: ${ret.status}`);
    }
  }

  async updateState(state: IssueState): Promise<void> {
    const ret: IssuesUpdateResponse = await this.githubClient.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: this.number,
      state: state
    });

    groupConsoleLog('IssuesUpdateResponse', ret);

    if (ret.status === 200) {
      if (state === 'closed') {
        info(`Issue #${this.number} has been closed`);
        return;
      }
      info(`Issue #${this.number} has been reopened`);
    } else {
      throw new Error(`IssuesUpdateResponse.status: ${ret.status}`);
    }
  }

  async lock(reason: LockReason): Promise<void> {
    const ret: IssuesLockResponse = await this.githubClient.rest.issues.lock({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: this.number,
      lock_reason: reason || 'resolved'
    });

    groupConsoleLog('IssuesLockResponse', ret);

    if (ret.status === 204) {
      this.setLocked(true);
      info(`Issue #${this.number} has been locked`);
      return;
    } else {
      throw new Error(`IssuesLockResponse.status: ${ret.status}`);
    }
  }

  async unlock(): Promise<void> {
    const ret: IssuesUnlockResponse = await this.githubClient.rest.issues.unlock({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: this.number
    });

    groupConsoleLog('IssuesUnlockResponse', ret);

    if (ret.status === 204) {
      this.setLocked(false);
      info(`Issue #${this.number} has been unlocked`);
      return;
    } else {
      throw new Error(`IssuesUnlockResponse.status: ${ret.status}`);
    }
  }
}

export {LockReason, Issue};
