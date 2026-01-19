import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the static YAML specification
const yamlPath = path.join(__dirname, 'swagger.yaml');
const file = fs.readFileSync(yamlPath, 'utf8');
const swaggerSpec = yaml.load(file);

export default swaggerSpec;
