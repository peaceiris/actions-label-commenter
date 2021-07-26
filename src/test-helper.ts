import fs from 'fs';

import yaml from 'js-yaml';

function getDefaultInputs(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = yaml.load(fs.readFileSync(__dirname + '/../action.yml', 'utf8'));
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    process.env[envVar] = doc.inputs[name]['default'];
  });
}

function cleanupEnvs(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = yaml.load(fs.readFileSync(__dirname + '/../action.yml', 'utf8'));
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    delete process.env[envVar];
  });
}

export {getDefaultInputs, cleanupEnvs};
