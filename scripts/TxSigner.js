
const EC = require('elliptic').ec;
const curve = new EC('p256');

const crypto = require('crypto');

const SmartBuffer = require('smart-buffer').SmartBuffer;

const Sha256Hash = require('./Sha256Hash.js')
const TxTranscoder = require('./TxTranscoder.js')
const KeyTranscoder = require('./KeyTranscoder.js')
const AddressTranscoder = require('./AddressTranscoder.js')
const BufferSigner = require('./BufferSigner.js')

const signTx = (tx,privateKey) => {
  // console.log('signTx.tx[0]',tx);
  const encodedTxHex = TxTranscoder.encodeTx(tx,false);

  // console.log('signTx.encodedTxHex',encodedTxHex);

  const signatureHex = BufferSigner.sign(encodedTxHex,privateKey);

  const signature = Buffer.from(signatureHex, 'hex');

  const signatureParameter = new SmartBuffer();
  signatureParameter.writeInt8(signature.length);
  signatureParameter.writeBuffer(signature);
  const signatureParameterHex = signatureParameter.toString('hex').toUpperCase();
  
  const publicKey = KeyTranscoder.getPublic(privateKey);
  const publicKeyRaw = Buffer.from(publicKey, 'hex');

  const code = AddressTranscoder.getSingleSignatureRedeemScript(publicKeyRaw,1);
  
  const Program = {};
  Program.Code = code;
  Program.Parameter = signatureParameterHex;
  
  tx.Programs = [];
  tx.Programs.push(Program);

  // console.log('signTx.tx[1]',tx);

  return TxTranscoder.encodeTx(tx,true);
}

exports.signTx = signTx;
