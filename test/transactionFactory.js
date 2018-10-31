const assert = require('chai').assert;
const expect = require('chai').expect;

const keyFixtures = require('./keyDerivationTestData.json')
const txFactoryFixtures = require('./transactionFactoryTestData.json')

const TxFactory = require('../scripts/TxFactory.js')
const KeyTranscoder = require('../scripts/KeyTranscoder.js')
const AddressTranscoder = require('../scripts/AddressTranscoder.js')
const TxTranscoder = require('../scripts/TxTranscoder.js')

const privateKey = keyFixtures.privateKey;
const publicKey = KeyTranscoder.getPublic(privateKey);
const sendToAddress = AddressTranscoder.getAddressFromPublicKey(publicKey);
const sendAmount = "1";

const unspentTransactionOutputs = txFactoryFixtures.unspentTransactionOutputs;
const encodedSignedTx = txFactoryFixtures.encodedSignedTx;

const encodeDecodeTx1 = txFactoryFixtures.encodeDecodeTx1;
//encodeDecodeTx1.TxAttributes.length = 0;
//encodeDecodeTx1.UTXOInputs.length = 0;
//encodeDecodeTx1.Outputs.length = 0;
//encodeDecodeTx1.Outputs[0] = encodeDecodeTx1.Outputs[1];
//encodeDecodeTx1.Outputs.length = 1;
//encodeDecodeTx1.Programs.length = 0;

describe('tx-factory', function () {
  it('encoded signed tx matches expected', function () {
    const expectedTx = encodedSignedTx;

    const actualTx = TxFactory.createSendToTx(privateKey, unspentTransactionOutputs, sendToAddress, sendAmount);

    expect(expectedTx).to.deep.equal(actualTx);
  });
  it('signed tx matches expected', function () {

    const expectedTx = TxTranscoder.decodeTx(Buffer.from(encodedSignedTx, 'hex'));

    const actualTx = TxTranscoder.decodeTx(Buffer.from(TxFactory.createSendToTx(privateKey, unspentTransactionOutputs, sendToAddress, sendAmount), 'hex'));

    expect(expectedTx).to.deep.equal(actualTx);
  });
  it('encode decode 1 works without error', function () {

    const expectedTx = encodeDecodeTx1;

    const actualTx = TxTranscoder.decodeTx(Buffer.from(TxTranscoder.encodeTx(encodeDecodeTx1, true), 'hex'));

    expect(expectedTx).to.deep.equal(actualTx);
  });
});
