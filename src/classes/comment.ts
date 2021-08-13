import {isDebug} from '@actions/core';
import {get} from 'lodash-es';
import Mustache from 'mustache';

import {ActionInfo} from '../constants';
import {groupConsoleLog, info} from '../logger';
import {ConfigLoader} from './config';
import {RunContext, ContextLoader} from './context-loader';

interface IComment {
  readonly contextLoader: ContextLoader;
  readonly config: ConfigLoader;
  readonly runContext: RunContext;

  readonly main: string;
  readonly header: string;
  readonly footer: string;
  readonly footerLinks: string;
  readonly rawBody: string;
}

interface ICommentGenerator extends IComment {
  getLogURL(): string;
  getMain(): string;
  getHeader(): string;
  getFooter(): string;
  getFooterLinks(): string;
  getRawBody(): string;
  dumpComponents(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get view(): any;
  get render(): string;
}

class Comment implements ICommentGenerator {
  readonly contextLoader: ContextLoader;
  readonly config: ConfigLoader;
  readonly runContext: RunContext;

  readonly main: string;
  readonly header: string;
  readonly footer: string;
  readonly footerLinks: string;
  readonly rawBody: string;

  constructor(contextParser: ContextLoader, config: ConfigLoader) {
    this.contextLoader = contextParser;
    this.config = config;
    this.runContext = this.contextLoader.runContext;
    this.main = this.getMain();
    this.header = this.getHeader();
    this.footer = this.getFooter();
    this.footerLinks = this.getFooterLinks();
    this.rawBody = this.getRawBody();
  }

  getLogURL(): string {
    return `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['GITHUB_RUN_ID']}`;
  }

  getMain(): string {
    return get(
      this.config.config.labels[this.config.labelIndex as string],
      `${this.runContext.LabelEvent}.${this.runContext.EventAlias}.body`
    );
  }

  getHeader(): string {
    return this.config.config.comment?.header ?? '';
  }

  getFooter(): string {
    return this.config.config.comment?.footer ?? '';
  }

  getFooterLinks(): string {
    const readmeUrl = `https://github.com/${ActionInfo.Owner}/${ActionInfo.Name}#readme`;
    return (
      `<div align="right">` +
      `<a href="${this.getLogURL()}">Log</a>` +
      ` | ` +
      `<a href="${readmeUrl}">Bot Usage</a>` +
      `</div>\n`
    );
  }

  getRawBody(): string {
    const rawBody = `${this.header}\n\n${this.main}\n\n${this.footer}`;
    const identifier = `\n<!-- ${ActionInfo.Owner}/${ActionInfo.Name} -->\n`;
    if (isDebug()) {
      return `${rawBody}\n\n${this.footerLinks}${identifier}`;
    }
    return `${rawBody}\n${identifier}`;
  }

  dumpComponents(): void {
    if (!this.main) {
      info(`No configuration ${this.config.parentFieldName}.body`);
    } else {
      groupConsoleLog('rawCommentBody', this.rawBody);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get view(): any {
    if (this.runContext.EventName === 'issues') {
      return {
        eventName: this.runContext.EventName,
        number: this.runContext.IssueNumber,
        labelName: this.runContext.LabelName,
        author: this.contextLoader.userLogin,
        labeler: this.contextLoader.senderLogin,
        issue: {
          user: {
            login: this.contextLoader.userLogin
          }
        },
        sender: {
          login: this.contextLoader.senderLogin
        }
      };
    } else if (this.runContext.EventName === 'discussion') {
      return {
        eventName: this.runContext.EventName,
        number: this.runContext.IssueNumber,
        labelName: this.runContext.LabelName,
        author: this.contextLoader.userLogin,
        labeler: this.contextLoader.senderLogin,
        discussion: {
          user: {
            login: this.contextLoader.userLogin
          }
        },
        sender: {
          login: this.contextLoader.senderLogin
        }
      };
    } else if (
      this.runContext.EventName === 'pull_request' ||
      this.runContext.EventName === 'pull_request_target'
    ) {
      return {
        eventName: this.runContext.EventName,
        number: this.runContext.IssueNumber,
        labelName: this.runContext.LabelName,
        author: this.contextLoader.userLogin,
        labeler: this.contextLoader.senderLogin,
        pull_request: {
          user: {
            login: this.contextLoader.userLogin
          }
        },
        sender: {
          login: this.contextLoader.senderLogin
        }
      };
    } else {
      return {};
    }
  }

  get render(): string {
    if (!this.main) return '';
    const renderedBody = Mustache.render(this.rawBody, this.view);
    groupConsoleLog('commentBodyRendered', renderedBody);
    return renderedBody;
  }
}

export {Comment};
