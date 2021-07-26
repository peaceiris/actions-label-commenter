import {getInput} from '@actions/core';

interface IInputs {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;

  // validate(): void;
}

class Inputs implements IInputs {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;

  constructor() {
    this.GithubToken = getInput('github_token');
    this.ConfigFilePath = getInput('config_file');
  }

  // TODO: Implements validate()
}

export {Inputs};
