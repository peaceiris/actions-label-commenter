import fs from 'fs';
import path from 'path';

import {load} from 'js-yaml';

const actionYamlPath = path.join(process.cwd(), 'action.yml');

function getDefaultInputs(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = load(fs.readFileSync(actionYamlPath, 'utf8'));
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    process.env[envVar] = doc.inputs[name]['default'];
  });
}

function cleanupEnvs(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = load(fs.readFileSync(actionYamlPath, 'utf8'));
  Object.keys(doc.inputs).forEach(name => {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    delete process.env[envVar];
  });
}

export {getDefaultInputs, cleanupEnvs};
