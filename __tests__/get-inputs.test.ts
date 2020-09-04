import {Inputs} from '../src/interfaces';
import {getInputs} from '../src/get-inputs';
import fs from 'fs';
import yaml from 'js-yaml';

beforeEach(() => {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = yaml.safeLoad(fs.readFileSync(__dirname + '/../action.yml', 'utf8'));
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    process.env[envVar] = doc.inputs[name]['default'];
  });
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = yaml.safeLoad(fs.readFileSync(__dirname + '/../action.yml', 'utf8'));
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    delete process.env[envVar];
  });
});

describe('getInputs()', () => {
  test('get default inputs', () => {
    process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';

    const inps: Inputs = getInputs();

    expect(inps.GithubToken).toMatch('secret_token');
    expect(inps.ConfigFilePath).toMatch('.github/label-commenter-config.yml');
  });

  test('get spec inputs', () => {
    process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';
    process.env['INPUT_CONFIG_FILE'] = '.github/config/label-commenter-config.yml';

    const inps: Inputs = getInputs();

    expect(inps.GithubToken).toMatch('secret_token');
    expect(inps.ConfigFilePath).toMatch('.github/config/label-commenter-config.yml');
  });
});
