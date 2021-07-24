import {info} from '@actions/core';
import {context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';

import {IIssue} from '../interfaces';
import {groupConsoleLog} from '../logger';
import {
  IssuesCreateCommentResponse,
  IssuesUpdateResponse,
  IssuesLockResponse,
  IssuesUnlockResponse,
  LockReason
} from '../types';

export class Issue implements IIssue {
  readonly githubClient: InstanceType<typeof GitHub>;
  readonly number: number;
  locked: boolean;

  constructor(githubClient: InstanceType<typeof GitHub>, number: number, locked: boolean) {
    this.githubClient = githubClient;
    this.number = number;
    this.locked = locked;
  }

  private setLocked(locked: boolean): void {
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

    groupConsoleLog('IssuesCreateCommentResponse', ret, 'debug');

    if (ret.status === 201) {
      info(`[INFO] New comment has been created in issue #${this.number}`);
      info(`[INFO] Comment URL: ${ret.data.html_url}`);
      return;
    } else {
      throw new Error(`IssuesCreateCommentResponse.status: ${ret.status}`);
    }
  }

  async close(): Promise<void> {
    const ret: IssuesUpdateResponse = await this.githubClient.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: this.number,
      state: 'closed'
    });

    groupConsoleLog('IssuesUpdateResponse', ret, 'debug');

    if (ret.status === 200) {
      info(`Issue #${this.number} has been closed`);
      return;
    } else {
      throw new Error(`IssuesUpdateResponse.status: ${ret.status}`);
    }
  }

  async open(): Promise<void> {
    const ret: IssuesUpdateResponse = await this.githubClient.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: this.number,
      state: 'open'
    });

    groupConsoleLog('IssuesUpdateResponse', ret, 'debug');

    if (ret.status === 200) {
      info(`Issue #${this.number} has been reopened`);
      return;
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

    groupConsoleLog('IssuesLockResponse', ret, 'debug');

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

    groupConsoleLog('IssuesUnlockResponse', ret, 'debug');

    if (ret.status === 204) {
      this.setLocked(false);
      info(`Issue #${this.number} has been unlocked`);
      return;
    } else {
      throw new Error(`IssuesUnlockResponse.status: ${ret.status}`);
    }
  }
}
