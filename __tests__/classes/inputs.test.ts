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
  const inputs: Inputs = new Inputs();

  expect(inputs.GithubToken).toBe('${{ github.token }}');
  expect(inputs.ConfigFilePath).toBe('.github/label-commenter-config.yml');
});

test('get custom inputs', () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';
  process.env['INPUT_CONFIG_FILE'] = '.github/custom-label-commenter-config.yml';

  const inputs: Inputs = new Inputs();

  expect(inputs.GithubToken).toBe('secret_token');
  expect(inputs.ConfigFilePath).toBe('.github/custom-label-commenter-config.yml');
});

test('if github_token is empty, throw error', () => {
  process.env['INPUT_GITHUB_TOKEN'] = '';
  process.env['INPUT_CONFIG_FILE'] = '.github/label-commenter-config.yml';

  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inputs: Inputs = new Inputs();
  }).toThrow('Input required and not supplied: github_token');
});

test('if config_file is empty, throw error', () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'secret_token';
  process.env['INPUT_CONFIG_FILE'] = '';

  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inputs: Inputs = new Inputs();
  }).toThrow('Input required and not supplied: config_file');
});
