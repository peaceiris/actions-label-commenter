import {isDebug} from '@actions/core';
import {get} from 'lodash-es';
import Mustache from 'mustache';

import {ActionInfo} from '../constants';
import {groupConsoleLog, info} from '../logger';
import {IConfig} from './config';
import {RunContext} from './context-loader';

interface IComment {
  readonly config: IConfig;
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
  readonly config: IConfig;
  readonly runContext: RunContext;

  readonly main: string;
  readonly header: string;
  readonly footer: string;
  readonly footerLinks: string;
  readonly rawBody: string;

  constructor(runContext: RunContext, config: IConfig) {
    this.config = config;
    this.runContext = runContext;
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
      `${this.runContext.labelEvent}.${this.runContext.eventAlias}.body`
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
    const rawBody = `${this.header}\n\n${this.main}\n\n${this.footer}`.trim();
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
    const eventName = () => {
      switch (this.runContext.eventAlias) {
        case 'issue':
          return this.runContext.eventAlias;
        case 'pr':
          return 'pull request';
        default:
          return 'discussion';
      }
    };

    if (this.runContext.eventAlias === 'issue') {
      return {
        eventName: eventName,
        number: this.runContext.issueNumber,
        labelName: this.runContext.labelName,
        author: this.runContext.userLogin,
        labeler: this.runContext.senderLogin,
        issue: {
          user: {
            login: this.runContext.userLogin
          }
        },
        sender: {
          login: this.runContext.senderLogin
        }
      };
    } else if (this.runContext.eventAlias === 'discussion') {
      return {
        eventName: eventName,
        number: this.runContext.issueNumber,
        labelName: this.runContext.labelName,
        author: this.runContext.userLogin,
        labeler: this.runContext.senderLogin,
        discussion: {
          user: {
            login: this.runContext.userLogin
          }
        },
        sender: {
          login: this.runContext.senderLogin
        }
      };
    } else if (this.runContext.eventAlias === 'pr') {
      return {
        eventName: eventName,
        number: this.runContext.issueNumber,
        labelName: this.runContext.labelName,
        author: this.runContext.userLogin,
        labeler: this.runContext.senderLogin,
        pull_request: {
          user: {
            login: this.runContext.userLogin
          }
        },
        sender: {
          login: this.runContext.senderLogin
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
