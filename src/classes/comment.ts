import {isDebug} from '@actions/core';
import {get} from 'lodash-es';
import Mustache from 'mustache';

import {ActionInfo} from '../constants';
import {groupConsoleLog, info} from '../logger';
import {Config} from './config';
import {RunContext, ContextLoader} from './context-loader';

interface IComment {
  readonly contextLoader: ContextLoader;
  readonly config: Config;
  readonly runContext: RunContext;

  readonly main: string;
  readonly header: string;
  readonly footer: string;
  readonly footerLinks: string;
  readonly rawBody: string;

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

export class Comment implements IComment {
  readonly contextLoader: ContextLoader;
  readonly config: Config;
  readonly runContext: RunContext;

  readonly main: string;
  readonly header: string;
  readonly footer: string;
  readonly footerLinks: string;
  readonly rawBody: string;

  constructor(contextParser: ContextLoader, config: Config) {
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
      `${this.runContext.LabelEvent}.${this.runContext.EventType}.body`
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
      `<a href="${this.getLogURL}">Log</a>` +
      ` | ` +
      `<a href="${readmeUrl}">Bot Usage</a>` +
      `</div>\n` +
      `\n<!-- ${ActionInfo.Owner}/${ActionInfo.Name} -->\n`
    );
  }

  getRawBody(): string {
    if (isDebug()) {
      return `${this.header}\n\n${this.main}\n\n${this.footer}\n\n${this.footerLinks}`;
    }
    return `${this.header}\n\n${this.main}\n\n${this.footer}`;
  }

  dumpComponents(): void {
    if (!this.main) {
      info(`No configuration ${this.config.parentFieldName}.body`);
      return;
    } else {
      groupConsoleLog('commentMain', this.main);
      groupConsoleLog('commentHeader', this.header);
      groupConsoleLog('commentFooter', this.footer);
      groupConsoleLog('commentFooterLinks', this.footerLinks);
      groupConsoleLog('rawCommentBody', this.rawBody);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get view(): any {
    if (this.runContext.EventName === 'issues') {
      return {
        issue: {
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
    const renderedBody = Mustache.render(this.rawBody, this.view);
    groupConsoleLog('commentBodyRendered', renderedBody);
    return renderedBody;
  }
}
