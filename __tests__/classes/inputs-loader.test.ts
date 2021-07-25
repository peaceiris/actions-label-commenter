import fs from 'fs';

import yaml from 'js-yaml';

import {Inputs, InputsLoader} from '../../src/classes/inputs-loader';

beforeEach(() => {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = yaml.load(fs.readFileSync(__dirname + '/../../action.yml', 'utf8'));
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    process.env[envVar] = doc.inputs[name]['default'];
  });
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = yaml.load(fs.readFileSync(__dirname + '/../../action.yml', 'utf8'));
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    delete process.env[envVar];
  });
});

test('get default inputs', () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';

  const inputs: Inputs = new InputsLoader();

  const expextedInputs: Inputs = {
    GithubToken: 'secret_token',
    ConfigFilePath: '.github/label-commenter-config.yml'
  };

  expect(inputs).toEqual(expextedInputs);
});

test('get custom inputs', () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';
  process.env['INPUT_CONFIG_FILE'] = '.github/custom-label-commenter-config.yml';

  const inputs: Inputs = new InputsLoader();

  const expextedInputs: Inputs = {
    GithubToken: 'secret_token',
    ConfigFilePath: '.github/custom-label-commenter-config.yml'
  };

  expect(inputs).toEqual(expextedInputs);
});
