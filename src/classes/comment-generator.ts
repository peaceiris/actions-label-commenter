import {info, isDebug} from '@actions/core';
import Mustache from 'mustache';

import {ActionInfo} from '../constants';
import {RunContext, Comment} from '../interfaces';
import {groupConsoleLog} from '../logger';
import {ConfigParser} from './config-parser';
import {ContextParser} from './context-parser';

export class CommentGenerator {
  readonly contextParser: ContextParser;
  readonly configParser: ConfigParser;
  readonly runContext: RunContext;
  readonly comment: Comment;
  readonly rawBody: string;

  constructor(contextParser: ContextParser, configParser: ConfigParser, runContext: RunContext) {
    this.contextParser = contextParser;
    this.configParser = configParser;
    this.runContext = runContext;
    this.comment = {
      Main: this.getMain(),
      Header: this.getHeader(),
      Footer: this.getFooter(),
      FooterLinks: this.getFooterLinks()
    };
    this.rawBody = this.getRawBody();
  }

  getLogURL(): string {
    return `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['GITHUB_RUN_ID']}`;
  }

  getMain(): string {
    return this.configParser.config.labels[this.configParser.labelIndex as string][
      `${this.runContext.LabelEvent}`
    ][`${this.runContext.EventType}`].body;
  }

  getHeader(): string {
    return this.configParser.config.comment?.header ?? '';
  }

  getFooter(): string {
    return this.configParser.config.comment?.footer ?? '';
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
      return `${this.comment.Header}\n\n${this.comment.Main}\n\n${this.comment.Footer}\n\n${this.comment.FooterLinks}`;
    }
    return `${this.comment.Header}\n\n${this.comment.Main}\n\n${this.comment.Footer}`;
  }

  dumpComponents(): void {
    if (!this.comment.Main) {
      info(`[INFO] no configuration ${this.configParser.parentFieldName}.body`);
      return;
    } else {
      groupConsoleLog('commentMain', this.comment.Main, 'debug');
      groupConsoleLog('commentHeader', this.comment.Header, 'debug');
      groupConsoleLog('commentFooter', this.comment.Footer, 'debug');
      groupConsoleLog('commentFooterLinks', this.comment.FooterLinks, 'debug');
      groupConsoleLog('rawCommentBody', this.rawBody, 'debug');
    }
  }

  get render(): string {
    // Render template
    const commentBodyView = (() => {
      if (this.runContext.EventName === 'issues') {
        return {
          issue: {
            user: {
              login: this.contextParser.userLogin
            }
          },
          sender: {
            login: this.contextParser.senderLogin
          }
        };
      } else if (
        this.runContext.EventName === 'pull_request' ||
        this.runContext.EventName === 'pull_request_target'
      ) {
        return {
          pull_request: {
            user: {
              login: this.contextParser.userLogin
            }
          },
          sender: {
            login: this.contextParser.senderLogin
          }
        };
      } else {
        return {};
      }
    })();
    const renderedBody = Mustache.render(this.rawBody, commentBodyView);
    groupConsoleLog('commentBodyRendered', renderedBody, 'debug');
    return renderedBody;
  }
}
