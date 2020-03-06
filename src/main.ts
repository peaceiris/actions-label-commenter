import * as core from '@actions/core';
import {Inputs} from './interfaces';
import {getInputs} from './get-inputs';

export async function run(): Promise<void> {
  try {
    const inps: Inputs = getInputs();
    core.info(`[INFO] config_file: ${inps.ConfigFilePath}`);
  } catch (error) {
    throw new Error(error.message);
  }
}
