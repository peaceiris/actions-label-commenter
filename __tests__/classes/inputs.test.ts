import fs from 'fs';

import {Inputs} from '../../src/classes/inputs';
import {getDefaultInputs, cleanupEnvs} from '../../src/test-helper';

beforeEach(() => {
  getDefaultInputs();
});

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();

  cleanupEnvs();
});

test('get default inputs', () => {
  const fsExistsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);

  const inputs: Inputs = new Inputs();

  expect(fsExistsSyncSpy).toHaveBeenCalled();
  expect(inputs.GithubToken).toBe('${{ github.token }}');
  expect(inputs.ConfigFilePath).toBe('.github/label-commenter-config.yml');
});

test('get custom inputs', () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';
  process.env['INPUT_CONFIG_FILE'] = '.github/custom-label-commenter-config.yml';
  const fsExistsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);

  const inputs: Inputs = new Inputs();

  expect(fsExistsSyncSpy).toHaveBeenCalled();
  expect(inputs.GithubToken).toBe('secret_token');
  expect(inputs.ConfigFilePath).toBe('.github/custom-label-commenter-config.yml');
});

test('if github_token is empty, throw error', () => {
  process.env['INPUT_GITHUB_TOKEN'] = '';
  process.env['INPUT_CONFIG_FILE'] = '.github/label-commenter-config.yml';
  const fsExistsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);

  expect(fsExistsSyncSpy).not.toHaveBeenCalled();
  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inputs: Inputs = new Inputs();
  }).toThrowError('Input required and not supplied: github_token');
});

test('if config_file is empty, throw error', () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';
  process.env['INPUT_CONFIG_FILE'] = '';
  const fsExistsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);

  expect(fsExistsSyncSpy).not.toHaveBeenCalled();
  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inputs: Inputs = new Inputs();
  }).toThrowError('Input required and not supplied: config_file');
});

test('if config_file is not found, throw error', () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';
  process.env['INPUT_CONFIG_FILE'] = '.github/label-commenter-config.yml';
  const fsExistsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);

  expect(fsExistsSyncSpy).not.toHaveBeenCalled();
  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inputs: Inputs = new Inputs();
  }).toThrowError('Not found .github/label-commenter-config.yml');
});
