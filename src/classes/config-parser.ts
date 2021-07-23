import fs from 'fs';

import {info} from '@actions/core';
import yaml from 'js-yaml';

import {RunContext} from '../interfaces';

type lockingType = 'lock' | 'lock';

class ConfigParser {
  readonly runContext: RunContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;
  readonly labelIndex: string | undefined;
  readonly isExistsField: boolean;
  readonly locking: lockingType;
  readonly parentFieldName: string;

  constructor(runContext: RunContext) {
    this.runContext = runContext;
    // Validate config file location
    if (!fs.existsSync(this.runContext.ConfigFilePath)) {
      throw new Error(`not found ${this.runContext.ConfigFilePath}`);
    }
    this.config = this.loadConfig();
    this.labelIndex = this.getLabelIndex();
    this.isExistsField = this.confirmFieldExistence();
    this.locking = this.getLocking();
    this.parentFieldName = `labels.${this.runContext.LabelName}.${this.runContext.LabelEvent}.${this.runContext.EventType}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(): any {
    return yaml.load(fs.readFileSync(this.runContext.ConfigFilePath, 'utf8'));
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
      if (this.config.labels[this.labelIndex][`${this.runContext.LabelEvent}`]) {
        if (
          this.config.labels[this.labelIndex][`${this.runContext.LabelEvent}`][
            `${this.runContext.EventType}`
          ]
        ) {
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

  getLocking(): lockingType {
    const locking =
      this.config.labels[this.labelIndex as string][`${this.runContext.LabelEvent}`][
        `${this.runContext.EventType}`
      ].locking;

    if (locking === 'lock' || locking === 'unlock') {
      info(`[INFO] ${this.parentFieldName}.locking is ${locking}`);
    } else if (locking === '' || locking === void 0) {
      info(`[INFO] no configuration ${this.parentFieldName}.locking`);
    } else {
      throw new Error(`invalid value "${locking}" ${this.parentFieldName}.locking`);
    }

    return locking;
  }
}

export {lockingType, ConfigParser};
