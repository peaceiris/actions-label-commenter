import fs from 'fs';

import {info} from '@actions/core';
import yaml from 'js-yaml';

import {RunContext} from '../interfaces';

export class ConfigParser {
  readonly isExistsField: boolean;
  readonly runContext: RunContext;
  readonly labelIndex: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;

  constructor(runContext: RunContext) {
    this.runContext = runContext;
    // Validate config file location
    if (!fs.existsSync(this.runContext.ConfigFilePath)) {
      throw new Error(`not found ${this.runContext.ConfigFilePath}`);
    }
    this.config = this.loadConfig();
    this.labelIndex = this.getLabelIndex();
    this.isExistsField = this.confirmFieldExistence();
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
}
