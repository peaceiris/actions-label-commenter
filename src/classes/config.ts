import {GitHub} from '@actions/github/lib/utils';
import yaml from 'js-yaml';
import {get} from 'lodash-es';

import {groupConsoleLog} from '../logger';
import {IContext} from './context-loader';
import {LockReason} from './issue';

type Locking = 'lock' | 'unlock' | undefined;
type Action = 'close' | 'open' | undefined;
type Draft = boolean | undefined;
type Answer = boolean | undefined;

interface IConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly parentFieldName: string;
  labelIndex: string;
  action: Action;
  locking: Locking;
  lockReason: LockReason;
  draft?: Draft;
  answer?: Answer;
}

interface IConfigLoaderConstructor {
  new (runContext: IContext): IConfigLoader;
  build(runContext: IContext): Promise<IConfigLoader>;
}

interface IConfigLoader extends IConfig {
  readonly runContext: IContext;

  getConfig(): IConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(githubClient: InstanceType<typeof GitHub>): any;
  dumpConfig(): void;
  getLabelIndex(): string;
  getLocking(): Locking;
  getAction(): Action;
  getLockReason(): LockReason;
  getAnswer(): Answer;
}

const ConfigLoader: IConfigLoaderConstructor = class ConfigLoader implements IConfigLoader {
  readonly runContext: IContext;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly parentFieldName: string;
  labelIndex: string;
  action: Action;
  locking: Locking;
  lockReason: LockReason;
  draft?: Draft;
  answer?: Answer;

  constructor(runContext: IContext) {
    try {
      this.runContext = runContext;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config = {} as any;
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

  static async build(runContext: IContext): Promise<IConfigLoader> {
    return new ConfigLoader(runContext);
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
    };
    return config;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async loadConfig(githubClient: InstanceType<typeof GitHub>): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await githubClient.rest.repos.getContent({
      owner: this.runContext.owner,
      repo: this.runContext.repo,
      path: this.runContext.configFilePath,
      ref: this.runContext.sha
    });

    return yaml.load(Buffer.from(response.data.content, response.data.encoding).toString());
  }

  dumpConfig(): void {
    groupConsoleLog('Dump config', this.config);
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
