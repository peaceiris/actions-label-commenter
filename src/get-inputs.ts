import {getInput} from '@actions/core';

import {Inputs} from './interfaces';

export function getInputs(): Inputs {
  const inps: Inputs = {
    GithubToken: getInput('github_token'),
    ConfigFilePath: getInput('config_file')
  };

  return inps;
}
