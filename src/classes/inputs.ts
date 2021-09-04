import {getInput} from '@actions/core';

interface IInputs {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;
}

class Inputs implements IInputs {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;

  constructor() {
    this.GithubToken = getInput('github_token', {required: true});
    this.ConfigFilePath = getInput('config_file', {required: true});
  }
}

export {Inputs};
