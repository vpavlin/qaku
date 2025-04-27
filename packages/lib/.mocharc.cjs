const config = {
  extension: ['ts'],
  spec: 'src/**/*.spec.ts',
  require: ['ts-node/register', 'isomorphic-fetch'],
  loader: 'ts-node/esm',
  'node-option': [
    'experimental-specifier-resolution=node',
    'loader=ts-node/esm'
  ],
  exit: true,
  retries: 4,
}


module.exports = config;