import {Inputs} from '../src/interfaces';
import {getInputs} from '../src/get-inputs';
import fs from 'fs';
import yaml from 'js-yaml';

beforeEach(() => {
  jest.resetModules();
  const doc = yaml.safeLoad(
    fs.readFileSync(__dirname + '/../action.yml', 'utf8')
  );
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    process.env[envVar] = doc.inputs[name]['default'];
  });
});

afterEach(() => {
  const doc = yaml.safeLoad(
    fs.readFileSync(__dirname + '/../action.yml', 'utf8')
  );
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
    expect(inps.ConfigFilePath).toMatch('.github/commenter.yml');
  });

  test('get spec inputs', () => {
    process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';
    process.env['INPUT_CONFIG_FILE'] = '.github/config/commenter.yml';

    const inps: Inputs = getInputs();

    expect(inps.GithubToken).toMatch('secret_token');
    expect(inps.ConfigFilePath).toMatch('.github/config/commenter.yml');
  });
});
