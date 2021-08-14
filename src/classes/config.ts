import fs from 'fs';

import yaml from 'js-yaml';
import {get} from 'lodash-es';

import {groupConsoleLog} from '../logger';
import {RunContext} from './context-loader';
import {LockReason} from './issue';

type Locking = 'lock' | 'unlock' | undefined;
type Action = 'close' | 'open' | undefined;
type Draft = boolean | undefined;
type Answer = boolean | undefined;

interface IConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly parentFieldName: string;
  readonly labelIndex: string;
  readonly action: Action;
  readonly locking: Locking;
  readonly lockReason: LockReason;
  readonly draft?: Draft;
  readonly answer?: Answer;
}

interface IConfigLoader extends IConfig {
  readonly runContext: RunContext;

  getConfig(): IConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(): any;
  dumpConfig(): void;
  getLabelIndex(): string;
  getLocking(): Locking;
  getAction(): Action;
  getLockReason(): LockReason;
  getAnswer(): Answer;
}

class ConfigLoader implements IConfigLoader {
  readonly runContext: RunContext;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly parentFieldName: string;
  readonly labelIndex: string;
  readonly action: Action;
  readonly locking: Locking;
  readonly lockReason: LockReason;
  readonly draft?: Draft;
  readonly answer?: Answer;

  constructor(runContext: RunContext) {
    try {
      this.config = this.loadConfig();
      this.runContext = runContext;
      this.parentFieldName = `labels.${this.runContext.labelName}.${this.runContext.labelEvent}.${this.runContext.eventAlias}`;
      this.labelIndex = this.getLabelIndex();
      this.action = this.getAction();
      this.locking = this.getLocking();
      this.lockReason = this.getLockReason();
      this.draft = this.getDraft();
      this.answer = this.getAnswer();
    } catch (error) {
      throw new Error(error.message);
    }
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
  loadConfig(): any {
    return yaml.load(fs.readFileSync(this.runContext.configFilePath, 'utf8'));
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
}

export {Locking, Action, Draft, Answer, IConfig, IConfigLoader, ConfigLoader};
