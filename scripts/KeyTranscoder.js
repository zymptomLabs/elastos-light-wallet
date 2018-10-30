const EC = require('elliptic').ec;
const curve = new EC('p256');

const getPublic = (privateKey) => {
  const rawPrivateKey = Buffer.from(privateKey, 'hex');
  const keypair = curve.keyFromPrivate(rawPrivateKey);
  const publicKey = getPublicEncoded(keypair, true);
  return publicKey.toString('hex');
}

const getPublicEncoded = (keypair, encode) => {
  const unencodedPubKey = keypair.getPublic().encode('hex');
  if (encode) {
    const tail = parseInt(unencodedPubKey.substr(64 * 2, 2), 16);
    if (tail % 2 === 1) {
      return '03' + unencodedPubKey.substr(2, 64);
    } else {
      return '02' + unencodedPubKey.substr(2, 64);
    }
  } else {
    return unencodedPubKey;
  }
}

exports.getPublic = getPublic;
