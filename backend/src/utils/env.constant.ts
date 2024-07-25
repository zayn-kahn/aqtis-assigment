/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv');
dotenv.config();

const requiredEnvVars = [
    'PORT',
    'CHAIN_ID',
    'ADDRESS',
    'PRIVATE_KEY',
    'RPC_URL'
  ];
  
  requiredEnvVars.forEach((varName) => {
    if (process.env[varName] === undefined) {
      console.error(`Error: Environment variable ${varName} is not defined.`);
      process.exit(1);
    }
  });

export const { PORT, CHAIN_ID, ADDRESS, PRIVATE_KEY, RPC_URL } = process.env;
