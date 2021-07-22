import fs from 'fs';

import {info} from '@actions/core';
import yaml from 'js-yaml';

export class ConfigParser {
  readonly isExistsField: boolean;
  readonly configFilePath: string;
  readonly labelName: string;
  readonly labelEvent: string;
  readonly eventName: string;
  readonly eventType: string;
  readonly labelIndex: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;

  constructor(
    configFilePath: string,
    labelName: string,
    labelEvent: string,
    eventName: string,
    eventType: string
  ) {
    this.configFilePath = configFilePath;
    // Validate config file location
    if (!fs.existsSync(this.configFilePath)) {
      throw new Error(`not found ${this.configFilePath}`);
    }
    this.labelName = labelName;
    this.labelEvent = labelEvent;
    this.eventName = eventName;
    this.eventType = eventType;
    this.config = this.loadConfig();
    this.labelIndex = this.getLabelIndex();
    this.isExistsField = this.confirmFieldExistence();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(): any {
    return yaml.load(fs.readFileSync(this.configFilePath, 'utf8'));
  }

  getLabelIndex(): string | undefined {
    Object.keys(this.config.labels).forEach(label => {
      if (this.config.labels[label].name === this.labelName) {
        return label;
      }
    });
    return undefined;
  }

  confirmFieldExistence(): boolean {
    if (this.labelIndex) {
      if (this.config.labels[this.labelIndex][`${this.labelEvent}`]) {
        if (this.config.labels[this.labelIndex][`${this.labelEvent}`][`${this.eventType}`]) {
          return true;
        }
        throw new Error(
          `not found definition labels.${this.labelName}.${this.labelEvent}.${this.eventType}`
        );
      } else {
        info(`[INFO] no configuration labels.${this.labelName}.${this.labelEvent}`);
      }
    } else {
      info(`[INFO] no configuration labels.${this.labelName}`);
    }

    return false;
  }
}
