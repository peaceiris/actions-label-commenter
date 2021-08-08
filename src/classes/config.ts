import fs from 'fs';

import yaml from 'js-yaml';
import {get} from 'lodash-es';

import {groupConsoleLog} from '../logger';
import {RunContext} from './context-loader';
import {LockReason} from './issue';

type Locking = 'lock' | 'unlock' | undefined;
type Action = 'close' | 'open' | undefined;

interface IConfig {
  readonly parentFieldName: string;
  readonly labelIndex: string;
  readonly action: Action;
  readonly locking: Locking;
  readonly lockReason: LockReason;
}

interface IConfigLoader extends IConfig {
  readonly runContext: RunContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;

  getConfig(): IConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(): any;
  dumpConfig(): void;
  getLabelIndex(): string;
  getLocking(): Locking;
  getAction(): Action;
  getLockReason(): LockReason;
}

class ConfigLoader implements IConfigLoader {
  readonly runContext: RunContext;
  readonly parentFieldName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly labelIndex: string;
  readonly action: Action;
  readonly locking: Locking;
  readonly lockReason: LockReason;

  constructor(runContext: RunContext) {
    try {
      this.runContext = runContext;
      this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
      this.config = this.loadConfig();
      this.labelIndex = this.getLabelIndex();
      this.action = this.getAction();
      this.locking = this.getLocking();
      this.lockReason = this.getLockReason();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  getConfig(): IConfig {
    const config: IConfig = {
      parentFieldName: this.parentFieldName,
      labelIndex: this.labelIndex,
      action: this.action,
      locking: this.locking,
      lockReason: this.lockReason
    };
    return config;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(): any {
    return yaml.load(fs.readFileSync(this.runContext.ConfigFilePath, 'utf8'));
  }

  dumpConfig(): void {
    groupConsoleLog('Dump config', this.config);
  }

  getLabelIndex(): string {
    let labelIndex = '';
    Object.keys(this.config.labels).forEach(label => {
      if (this.config.labels[label].name === this.runContext.LabelName) {
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
      `${this.runContext.LabelEvent}.${this.runContext.EventType}.locking`
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
      `${this.runContext.LabelEvent}.${this.runContext.EventType}.action`
    );
  }

  getLockReason(): LockReason {
    return get(
      this.config.labels[this.labelIndex as string],
      `${this.runContext.LabelEvent}.${this.runContext.EventType}.lock_reason`
    );
  }
}

export {Locking, Action, IConfig, IConfigLoader, ConfigLoader};
