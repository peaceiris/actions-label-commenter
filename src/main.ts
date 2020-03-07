import * as core from '@actions/core';
import * as github from '@actions/github';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';

export async function run(): Promise<void> {
  try {
    const inps: Inputs = getInputs();
    core.info(`[INFO] config_file: ${inps.ConfigFilePath}`);

    const context = github.context;
    console.log(context);
    console.log(context.payload);
  } catch (error) {
    throw new Error(error.message);
  }
}
