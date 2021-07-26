import fs from 'fs';

import yaml from 'js-yaml';
import {get} from 'lodash-es';

import {groupConsoleLog, info} from '../logger';
import {RunContext} from './context-loader';
import {LockReason} from './issue';

type Locking = 'lock' | 'unlock';
type Action = 'close' | 'open';

interface IConfig {
  readonly runContext: RunContext;
  readonly parentFieldName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly labelIndex: string;
  readonly locking: Locking;
  readonly action: Action;
  readonly lockReason: LockReason;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(): any;
  dumpConfig(): void;
  getLabelIndex(): string;
  getLocking(): Locking;
  getAction(): Action;
  getLockReason(): LockReason;
}

class Config implements IConfig {
  readonly runContext: RunContext;
  readonly parentFieldName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly labelIndex: string;
  readonly locking: Locking;
  readonly action: Action;
  readonly lockReason: LockReason;

  constructor(runContext: RunContext) {
    try {
      this.runContext = runContext;
      this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
      this.config = this.loadConfig();
      this.labelIndex = this.getLabelIndex();
      this.locking = this.getLocking();
      this.action = this.getAction();
      this.lockReason = this.getLockReason();
    } catch (error) {
      throw new Error(error.message);
    }
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
      info(`${this.parentFieldName}.locking is ${locking}`);
    } else if (!locking) {
      info(`No configuration ${this.parentFieldName}.locking`);
    } else {
      throw new Error(`Invalid value "${locking}" ${this.parentFieldName}.locking`);
    }

    return locking;
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

export {Locking, Action, IConfig, Config};
