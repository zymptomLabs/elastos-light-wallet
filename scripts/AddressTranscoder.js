const bs58 = require('bs58')
const SmartBuffer = require('smart-buffer').SmartBuffer;
const ripemd160 = require('ripemd160');

const Sha256Hash = require('./Sha256Hash.js')
const ArrayCopy = require('./ArrayCopy.js')

const Sha256HashTwice = (buffer) => {
  return Sha256Hash.Sha256Hash(Sha256Hash.Sha256Hash(buffer));
}

const getSingleSignatureRedeemScript = (pubkey, signType) => {
  // console.log('getSingleSignatureRedeemScript.pubkey', pubkey);
  const script = CreateSingleSignatureRedeemScript(pubkey, signType);
  const scriptBuffer = Buffer.from(script);
  // console.log('getSingleSignatureRedeemScript.scriptBuffer', scriptBuffer);
  const scriptBufferHex = scriptBuffer.toString('hex').toUpperCase();
  // console.log('getSingleSignatureRedeemScript.scriptBufferHex', scriptBufferHex);
  return scriptBufferHex;
}

const CreateSingleSignatureRedeemScript = (pubkey, signType) => {
  // console.log('CreateSingleSignatureRedeemScript.pubkey', pubkey);
  const script = new Uint8Array(35);
  script[0] = 33;
  ArrayCopy.arraycopy(pubkey, 0, script, 1, 33);
  if (signType == 1) {
    script[34] = 0xAC;
  } else if (signType == 3) {
    script[34] = 0xAD;
  }

  // console.log('CreateSingleSignatureRedeemScript.script', script);
  return script;
}

const sha256hash160 = (input) => {
  // console.log('sha256hash160.input', input);
  const sha256 = Sha256Hash.Sha256Hash(input);
  // console.log('sha256hash160.sha256', sha256);
  const digest = new ripemd160();
  digest.update(sha256, 0, sha256.length);
  digest.end();
  const out = digest.read();
  // console.log('sha256hash160.out', out);
  return out;
}

const ToCodeHash = (code, signType) => {
  // console.log('sha256hash160.code', code);
  const f = sha256hash160(code);
  const g = new Uint8Array(f.length + 1);
  // console.log('ToCodeHash.signType', signType);
  if (signType == 1) {
    g[0] = 33;
    ArrayCopy.arraycopy(f, 0, g, 1, f.length);
  } else if (signType == 2) {
    g[0] = 18;
  } else if (signType == 3) {
    g[0] = 103;
  } else if (signType == 4) {
    g[0] = 0x4B;
  } else {
    return null;
  }
  // console.log('ToCodeHash.f', f);
  ArrayCopy.arraycopy(f, 0, g, 1, f.length);
  // console.log('ToCodeHash.g', g);
  return Buffer.from(g);
}

const getProgram = (publicKey, singType) => {
  return CreateSingleSignatureRedeemScript(publicKey, singType);
}
const getSingleSignProgramHash = (publicKey, signType) => {
  return ToCodeHash(getProgram(publicKey, signType), signType);
}

const getAddressFromPublicKey = (publicKey) => {
  return getAddressFromProgramHash(getSingleSignProgramHash(Buffer.from(publicKey, 'hex'), 1));
}

const getProgramHashFromAddress = (address) => {
  // console.log('getProgramHashFromAddress.address', address);
  const programHashAndChecksum = bs58.decode(address);
  // console.log('getProgramHashFromAddress.programHashAndChecksum', programHashAndChecksum);
  const programHash = programHashAndChecksum.slice(0, 21);
  // console.log('getProgramHashFromAddress.programHash', programHash);
  return programHash;
}

const getAddressFromProgramHash = (programHash) => {
  // console.log('getAddressFromProgramHash.programHash', programHash);
  const f = SmartBuffer.fromBuffer(Sha256HashTwice(programHash));
  // console.log( 'ToAddress.f', f );
  const g = new SmartBuffer();
  // console.log( 'ToAddress.g[0]', g );
  g.writeBuffer(programHash);
  // console.log( 'ToAddress.g[1]', g );
  g.writeBuffer(f.readBuffer(4));
  // console.log( 'ToAddress.g[2]', g );
  const gBuffer = g.toBuffer();
  // console.log( 'ToAddress.gBuffer', gBuffer );
  const address = bs58.encode(gBuffer);
  // console.log( 'getAddressFromProgramHash.address', address );
  return address;
}

exports.getAddressFromPublicKey = getAddressFromPublicKey;
exports.getAddressFromProgramHash = getAddressFromProgramHash;
exports.getProgramHashFromAddress = getProgramHashFromAddress;
exports.getSingleSignatureRedeemScript = getSingleSignatureRedeemScript;
