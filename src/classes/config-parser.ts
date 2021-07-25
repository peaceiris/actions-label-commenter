import fs from 'fs';

import {info} from '@actions/core';
import yaml from 'js-yaml';
import {get} from 'lodash-es';

import {groupConsoleLog} from '../logger';
import {RunContext} from './context-parser';
import {LockReason} from './issue';

type Locking = 'lock' | 'lock';
type Action = 'close' | 'open';

class ConfigParser {
  readonly runContext: RunContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly labelIndex: string | undefined;
  readonly isExistsField: boolean;
  readonly locking: Locking;
  readonly action: Action;
  readonly lockReason: LockReason;
  readonly parentFieldName: string;

  constructor(runContext: RunContext) {
    try {
      this.runContext = runContext;
      // Validate config file location
      if (!fs.existsSync(this.runContext.ConfigFilePath)) {
        throw new Error(`not found ${this.runContext.ConfigFilePath}`);
      }
      this.config = this.loadConfig();
      this.labelIndex = this.getLabelIndex();
      this.isExistsField = this.confirmFieldExistence();
      this.locking = this.getLocking();
      this.action = this.getAction();
      this.lockReason = this.getLockReason();
      this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(): any {
    return yaml.load(fs.readFileSync(this.runContext.ConfigFilePath, 'utf8'));
  }

  dumpConfig(): void {
    groupConsoleLog('Dump config', this.config, 'debug');
  }

  getLabelIndex(): string | undefined {
    Object.keys(this.config.labels).forEach(label => {
      if (this.config.labels[label].name === this.runContext.LabelName) {
        return label;
      }
    });
    return undefined;
  }

  confirmFieldExistence(): boolean {
    if (this.labelIndex) {
      const labelEvent = get(this.config.labels[this.labelIndex], `${this.runContext.LabelEvent}`);
      if (labelEvent) {
        const eventType = get(labelEvent, `${this.runContext.EventType}`);
        if (eventType) {
          return true;
        }
        throw new Error(
          `not found definition labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`
        );
      } else {
        info(
          `[INFO] no configuration labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}`
        );
      }
    } else {
      info(`[INFO] no configuration labels.${this.runContext.LabelName}`);
    }

    return false;
  }

  getLocking(): Locking {
    const locking = get(
      this.config.labels[this.labelIndex as string],
      `${this.runContext.LabelEvent}.${this.runContext.EventType}.locking`
    );

    if (locking === 'lock' || locking === 'unlock') {
      info(`[INFO] ${this.parentFieldName}.locking is ${locking}`);
    } else if (!locking) {
      info(`[INFO] no configuration ${this.parentFieldName}.locking`);
    } else {
      throw new Error(`invalid value "${locking}" ${this.parentFieldName}.locking`);
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
