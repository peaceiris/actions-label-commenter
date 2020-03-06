import * as core from '@actions/core';
import {Inputs} from './interfaces';

export function getInputs(): Inputs {
  const inps: Inputs = {
    GithubToken: core.getInput('github_token'),
    ConfigFilePath: core.getInput('config_file')
  };

  return inps;
}
