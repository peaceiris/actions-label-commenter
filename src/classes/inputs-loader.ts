import {getInput} from '@actions/core';

interface Inputs {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;

  // validate(): void;
}

class InputsLoader implements Inputs {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;

  constructor() {
    this.GithubToken = getInput('github_token');
    this.ConfigFilePath = getInput('config_file');
  }

  // TODO: Implements validate()
}

export {Inputs, InputsLoader};
