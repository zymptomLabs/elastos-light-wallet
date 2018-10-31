const KeyTranscoder = require('./KeyTranscoder.js')
const TxTranscoder = require('./TxTranscoder.js')
const TxSigner = require('./TxSigner.js')
const AddressTranscoder = require('./AddressTranscoder.js')
const Asset = require( './Asset.js' )

const createSendToTx = (privateKey,unspentTransactionOutputs, sendToAddress, sendAmount) => {
  
  console.log('createSendToTx.privateKey ' + JSON.stringify(privateKey));
  console.log('createSendToTx.unspentTransactionOutputs ' + JSON.stringify(unspentTransactionOutputs));
  console.log('createSendToTx.sendToAddress ' + JSON.stringify(sendToAddress));
  console.log('createSendToTx.sendAmount ' + JSON.stringify(sendAmount));
  
  const publicKey = KeyTranscoder.getPublic( privateKey );
  console.log('createSendToTx.publicKey ' + JSON.stringify(publicKey));
  const address = AddressTranscoder.getAddressFromPublicKey( publicKey );
  console.log('createSendToTx.address ' + JSON.stringify(address));

  const tx = {};
  tx.TxType = 2;
  tx.LockTime = 0;
  tx.PayloadVersion = 0;
  tx.TxAttributes = [];
  tx.UTXOInputs = [];
  tx.Outputs = [];
  tx.Programs = [];

  {
    const txAttribute = {};
    txAttribute.Usage = 0;
    txAttribute.Data = '30';
    tx.TxAttributes.push(txAttribute);
  }
  
  var inputValue = 0;
  unspentTransactionOutputs.forEach(( utxo ) => {
      if ( inputValue < sendAmount ) {
          const utxoInput = {};
          utxoInput.TxId = utxo.Txid.toUpperCase();
          utxoInput.ReferTxOutputIndex = utxo.Index;
          utxoInput.Sequence = tx.UTXOInputs.length;

          tx.UTXOInputs.push( utxoInput );
          inputValue += utxo.Value;
      }
  } );

  {
      const sendOutput = {};
      sendOutput.AssetID = Asset.elaAssetId;
      sendOutput.Value = sendAmount;
      sendOutput.OutputLock = 0;
      sendOutput.Address = sendToAddress;
      tx.Outputs.push( sendOutput );
  }
  {
      const changeValue = sendAmount - inputValue;
      const changeOutput = {};
      changeOutput.AssetID = Asset.elaAssetId;
      changeOutput.Value = changeValue.toString();
      changeOutput.OutputLock = 0;
      changeOutput.Address = address;
      tx.Outputs.push( changeOutput );
  }


  tx.Programs = [];

  console.log('unsignedTx ' + JSON.stringify(tx));
  
  const encodedSignedTx = TxSigner.signTx(tx, privateKey);

  console.log('signedTx ' + JSON.stringify(tx));

  console.log('encodedSignedTx ' + JSON.stringify(encodedSignedTx));

  return encodedSignedTx;
}

exports.createSendToTx = createSendToTx;