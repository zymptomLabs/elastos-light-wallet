const assert = require('chai').assert;
const expect = require('chai').expect;

const bufferFixtures = require('./bufferSignTestData.json')

const BufferSigner = require('../scripts/BufferSigner.js')

const privateKey = bufferFixtures.privateKey;
const blankTransaction = bufferFixtures.blankTransaction;
const blankTransactionSignature = bufferFixtures.blankTransactionSignature;
const rawBlankTransaction = Buffer.from(blankTransaction, 'hex');

describe('buffer-sign', function() {
  it('signature of blankTransaction matches expected', function() {
    const expectedSignature = blankTransactionSignature;
    
    const actualSignature = BufferSigner.sign(blankTransaction,privateKey);

    expect(expectedSignature).to.deep.equal(actualSignature);
  });
});
