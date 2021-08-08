import fs from 'fs';

import {getInput} from '@actions/core';

interface IInputs {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;
}

interface IInputsLoader extends IInputs {
  isFileExists(file: string): boolean;
  validate(): void;
}

class Inputs implements IInputsLoader {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;

  constructor() {
    this.GithubToken = getInput('github_token', {required: true});
    this.ConfigFilePath = getInput('config_file', {required: true});
    this.validate();
  }

  isFileExists(file: string): boolean {
    return fs.existsSync(file);
  }

  validate(): void {
    if (!this.isFileExists(this.ConfigFilePath)) {
      throw new Error(`Not found ${this.ConfigFilePath}`);
    }
  }
}

export {Inputs};
