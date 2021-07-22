import fs from 'fs';

import yaml from 'js-yaml';

export class ConfigParser {
  readonly configFilePath: string;
  readonly labelName: string;
  readonly labelIndex: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: any;

  constructor(configFilePath: string, labelName: string) {
    this.configFilePath = configFilePath;
    // Validate config file location
    if (!fs.existsSync(this.configFilePath)) {
      throw new Error(`not found ${this.configFilePath}`);
    }
    this.labelName = labelName;
    this.config = this.loadConfig();
    this.labelIndex = this.getLabelIndex();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadConfig(): any {
    return yaml.load(fs.readFileSync(this.configFilePath, 'utf8'));
  }

  getLabelIndex(): string | null {
    Object.keys(this.config.labels).forEach(label => {
      if (this.config.labels[label].name === this.labelName) {
        return label;
      }
    });
    return null;
  }
}
