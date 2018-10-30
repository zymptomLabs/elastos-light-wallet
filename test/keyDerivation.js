const assert = require('chai').assert;
const KeyTranscoder = require('../scripts/KeyTranscoder.js')
const AddressTranscoder = require('../scripts/AddressTranscoder.js')

const bitcoin = require('bitcoinjs-lib');
const wif = require('wif')
const fixtures = require('./keyDerivationTestData.json')

const ecc = require('tiny-secp256k1')

const hexPrivateKey = fixtures.privateKey;
const expectedPublicKey = fixtures.publicKey;
const expectedAddress = fixtures.address;
const hexScriptHash = fixtures.scriptHash;

describe('key-derivation', function() {
  it('private ECDSA derives expected public', function() {
    const actualPublicKey = KeyTranscoder.getPublic(hexPrivateKey);
    assert.equal(actualPublicKey, expectedPublicKey, 'PublicKey must match expected');
  });
  it('public ECDSA derives expected address', function() {
    const actualAddress = AddressTranscoder.getAddressFromPublicKey(expectedPublicKey);
    assert.equal(actualAddress, expectedAddress, 'Address must match expected');
  });
  it('scripthash derives expected address', function() {
    const rawScriptHash = Buffer.from(hexScriptHash, 'hex')
    const actualAddress = AddressTranscoder.getAddressFromProgramHash(rawScriptHash);
    assert.equal(actualAddress, expectedAddress, 'Address must match expected');
  });
  it('private and ecc derive same public', function() {
    const rawPrivateKey = Buffer.from(hexPrivateKey, 'hex');
    const keyPair = bitcoin.ECPair.fromPrivateKey(rawPrivateKey, {compressed: true});
    const actualPublicKeyECPair = keyPair.publicKey;
    const actualPublicKeyEcc = ecc.pointFromScalar(rawPrivateKey, {compressed: true});
    assert.equal(actualPublicKeyECPair.toString('hex'), actualPublicKeyEcc.toString('hex'), 'PublicKey must match expected');
  });
});
