import fs from 'fs';
import bs58 from 'bs58';

const secretKey = Uint8Array.from(
  JSON.parse(fs.readFileSync('../mintKey.json', 'utf8'))
);

const bs58Key = bs58.encode(secretKey);
console.log('Base58 Encoded Key:', bs58Key);