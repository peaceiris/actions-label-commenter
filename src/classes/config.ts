import {GitHub} from '@actions/github/lib/utils';
// eslint-disable-next-line import/named
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';
import yaml from 'js-yaml';
import {get} from 'lodash-es';

import {groupConsoleLog, info} from '../logger';
import {IContext} from './context-loader';
import {LockReason} from './issue';

const octokit = new GitHub();
type ReposGetContentResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.repos.getContent
>;

type Locking = 'lock' | 'unlock' | undefined;
type Action = 'close' | 'open' | undefined;
type Draft = boolean | undefined;
type Answer = boolean | undefined;

interface IConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config?: any;
  readonly parentFieldName: string;
  labelIndex: string;
  action: Action;
  locking: Locking;
  lockReason: LockReason;
  draft?: Draft;
  answer?: Answer;
}

interface IConfigLoaderConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (runContext: IContext, config?: any): IConfigLoader;
  build(runContext: IContext, githubClient: InstanceType<typeof GitHub>): Promise<IConfigLoader>;
}

interface IConfigLoader extends IConfig {
  readonly runContext: IContext;

  getConfig(): IConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(runContext: IContext, githubClient: InstanceType<typeof GitHub>): any;
  getLabelIndex(): string;
  getLocking(): Locking;
  getAction(): Action;
  getLockReason(): LockReason;
  getAnswer(): Answer;
}

const ConfigLoader: IConfigLoaderConstructor = class ConfigLoader implements IConfigLoader {
  readonly runContext: IContext;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config?: any;
  readonly parentFieldName: string;
  labelIndex: string;
  action: Action;
  locking: Locking;
  lockReason: LockReason;
  draft?: Draft;
  answer?: Answer;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  constructor(runContext: IContext, config?: any) {
    try {
      this.runContext = runContext;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config = config;
      this.parentFieldName = `labels.${this.runContext.labelName}.${this.runContext.labelEvent}.${this.runContext.eventAlias}`;
      this.labelIndex = this.getLabelIndex();
      this.action = this.getAction();
      this.locking = this.getLocking();
      this.lockReason = this.getLockReason();
      this.draft = this.getDraft();
      this.answer = this.getAnswer();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  }

  static async build(
    runContext: IContext,
    githubClient: InstanceType<typeof GitHub>
  ): Promise<IConfigLoader> {
    const configPlaceholder = {
      labels: [
        {
          name: 'invalid',
          labeled: {
            issue: {
              body: 'body placeholder'
            }
          }
        }
      ]
    } as const;
    const config = await new ConfigLoader(runContext, configPlaceholder).loadConfig(
      runContext,
      githubClient
    );
    return new ConfigLoader(runContext, config);
  }

  getConfig(): IConfig {
    const config: IConfig = {
      config: this.config,
      parentFieldName: this.parentFieldName,
      labelIndex: this.labelIndex,
      action: this.action,
      locking: this.locking,
      lockReason: this.lockReason,
      draft: this.draft,
      answer: this.answer
    } as const;
    return config;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async loadConfig(runContext: IContext, githubClient: InstanceType<typeof GitHub>): Promise<any> {
    try {
      const res: ReposGetContentResponse = await githubClient.rest.repos.getContent({
        owner: runContext.owner,
        repo: runContext.repo,
        path: runContext.configFilePath,
        ref: runContext.sha
      });

      groupConsoleLog('Dump githubClient.rest.repos.getContent response', res);

      if (res.status === 200) {
        info(
          `Fetched ${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/blob/${runContext.sha}/${runContext.configFilePath}`
        );
        return yaml.load(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Buffer.from((res.data as any).content, (res.data as any).encoding).toString()
        );
      } else {
        throw new Error(`ReposGetContentResponse.status: ${res.status}`);
      }
    } catch (error) {
      groupConsoleLog('Dump error.stack', error.stack);
      throw new Error(error.message);
    }
  }

  getLabelIndex(): string {
    let labelIndex = '';
    Object.keys(this.config.labels).forEach(label => {
      if (this.config.labels[label].name === this.runContext.labelName) {
        if (labelIndex === '') {
          labelIndex = label;
        }
      }
    });
    return labelIndex;
  }

  getLocking(): Locking {
    const locking = get(
      this.config.labels[this.labelIndex as string],
      `${this.runContext.labelEvent}.${this.runContext.eventAlias}.locking`
    );

    if (locking === 'lock' || locking === 'unlock') {
      return locking;
    } else if (!locking) {
      return undefined;
    } else {
      throw new Error(`Invalid value "${locking}" ${this.parentFieldName}.locking`);
    }
  }

  getAction(): Action {
    return get(
      this.config.labels[this.labelIndex as string],
      `${this.runContext.labelEvent}.${this.runContext.eventAlias}.action`
    );
  }

  getLockReason(): LockReason {
    return get(
      this.config.labels[this.labelIndex as string],
      `${this.runContext.labelEvent}.${this.runContext.eventAlias}.lock_reason`
    );
  }

  getDraft(): Draft {
    return get(
      this.config.labels[this.labelIndex as string],
      `${this.runContext.labelEvent}.${this.runContext.eventAlias}.draft`
    );
  }

  getAnswer(): Answer {
    return get(
      this.config.labels[this.labelIndex as string],
      `${this.runContext.labelEvent}.${this.runContext.eventAlias}.answer`
    );
  }
};

export {Locking, Action, Draft, Answer, IConfig, IConfigLoader, ConfigLoader};
