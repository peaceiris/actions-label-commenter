import fs from 'fs';

import yaml from 'js-yaml';
import {get} from 'lodash-es';

import {groupConsoleLog, info} from '../logger';
import {RunContext} from './context-parser';
import {LockReason} from './issue';

type Locking = 'lock' | 'lock';
type Action = 'close' | 'open';

class ConfigParser {
  readonly runContext: RunContext;
  readonly parentFieldName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly labelIndex: string | undefined;
  readonly locking: Locking;
  readonly action: Action;
  readonly lockReason: LockReason;

  constructor(runContext: RunContext) {
    try {
      this.runContext = runContext;
      this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
      // Validate config file location
      if (!fs.existsSync(this.runContext.ConfigFilePath)) {
        throw new Error(`Not found ${this.runContext.ConfigFilePath}`);
      }
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

  getLabelIndex(): string | undefined {
    Object.keys(this.config.labels).forEach(label => {
      if (this.config.labels[label].name === this.runContext.LabelName) {
        return label;
      }
    });
    return undefined;
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

export {Locking, Action, ConfigParser};
