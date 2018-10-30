const assert = require('chai').assert;
const expect = require('chai').expect;

const txFixtures = require('./signedTransactionTranscodeTestData.json')
const keyFixtures = require('./keyDerivationTestData.json')

const TxTranscoder = require('../scripts/TxTranscoder.js')
const TxSigner = require('../scripts/TxSigner.js')

const decodedTx = txFixtures.decodedSignedTx;
const decodedTxForSigning = txFixtures.decodedTxForSigning;
const encodedSignedTx = txFixtures.encodedSignedTx;
const encodedTxForSigning = txFixtures.encodedTxForSigning;
const rawEncodedSignedTx = Buffer.from(encodedSignedTx, 'hex');

const rawDecodedTx = JSON.parse(JSON.stringify(decodedTx));
const rawDecodedTxForSigning = JSON.parse(JSON.stringify(decodedTxForSigning));
// console.log('expectedTx', expectedTx);
const privateKey = keyFixtures.privateKey;

const lineSplit32 = (str) => {
  // return str.toUpperCase();
  return str.match(/.{1,32}/g).join('\n').toUpperCase();
}

describe('tx-sign', function() {
  it('decodedSignedTx.length encodes to encodedSignedTx.length', function() {
    const expectedTx = encodedSignedTx;
    const actualTx = TxSigner.signTx(rawDecodedTxForSigning, privateKey);
    expect(expectedTx.length).to.equal(actualTx.length);
  });
  it('HEX decodedSignedTx encodes to encodedSignedTx', function() {
    const expectedTx = encodedSignedTx;
    const actualTx = TxSigner.signTx(rawDecodedTxForSigning, privateKey);

    // split so it's not all one long line of hex.
    expect(lineSplit32(expectedTx)).to.deep.equal(lineSplit32(actualTx));
  });
  it('JSON decodedSignedTx encodes to encodedSignedTx', function() {
    const expectedTx = TxTranscoder.decodeTx(rawEncodedSignedTx);
    console.log('expectedTx', expectedTx.Programs);

    const actualSignedTx = Buffer.from(TxSigner.signTx(rawDecodedTx, privateKey), 'hex');
    const actualTx = TxTranscoder.decodeTx(actualSignedTx);
    console.log('actualTx', actualTx.Programs);

    // split so it's not all one long line of hex.
    expect(expectedTx).to.deep.equal(actualTx);
  });
});
