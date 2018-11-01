const KeyTranscoder = require('./KeyTranscoder.js')
const TxTranscoder = require('./TxTranscoder.js')
const TxSigner = require('./TxSigner.js')
const AddressTranscoder = require('./AddressTranscoder.js')
const Asset = require( './Asset.js' )
const BigNumber = require('bignumber.js');

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

  const sendAmountSats = BigNumber(sendAmount,10).times(Asset.satoshis);
  
  console.log(`createSendToTx.inputValueSats[${sendAmountSats}]`);

  const ZERO = BigNumber(0,10);
  
  const FEE = BigNumber(500,10);

  const sendAmountAndFeeSats = sendAmountSats.plus(FEE);
  
  console.log(`createSendToTx.sendAmountAndFeeSats[${sendAmountAndFeeSats}]`);
  
  var inputValueSats = BigNumber(0,10);
  unspentTransactionOutputs.forEach(( utxo ) => {
      if ( inputValueSats.isLessThan(sendAmountAndFeeSats )) {
        if(utxo.valueSats.isGreaterThan(ZERO)) {
          const utxoInput = {};
          utxoInput.TxId = utxo.Txid.toUpperCase();
          utxoInput.ReferTxOutputIndex = utxo.Index;
          utxoInput.Sequence = tx.UTXOInputs.length;

          console.log(`createSendToTx.utxoInput[${tx.UTXOInputs.length}] ${JSON.stringify(utxo)}`);

          tx.UTXOInputs.push( utxoInput );

          inputValueSats = inputValueSats.plus(utxo.valueSats);
        }
      }
  } );
  
  console.log(`createSendToTx.inputValueSats[${inputValueSats}]`);

  const changeValueSats = inputValueSats.minus(sendAmountAndFeeSats);

  console.log(`createSendToTx.changeValueSats[${changeValueSats}]`);
  
  const computedFeeSats = inputValueSats.minus(changeValueSats);

  console.log(`createSendToTx.computedFeeSats[${computedFeeSats}]`);

  {
      const sendOutput = {};
      sendOutput.AssetID = Asset.elaAssetId;
      sendOutput.Value = sendAmountSats.toString(10);
      sendOutput.OutputLock = 0;
      sendOutput.Address = sendToAddress;
      tx.Outputs.push( sendOutput );
  }
  {
      const changeOutput = {};
      changeOutput.AssetID = Asset.elaAssetId;
      changeOutput.Value = changeValueSats.toString(10);
      changeOutput.OutputLock = 0;
      changeOutput.Address = address;
      tx.Outputs.push( changeOutput );
  }

  if(changeValueSats.isLessThan(ZERO)) {
    return undefined;
  }

  tx.Programs = [];

  console.log('createSendToTx.unsignedTx ' + JSON.stringify(tx));
  
  const encodedSignedTx = TxSigner.signTx(tx, privateKey);

  console.log('createSendToTx.signedTx ' + JSON.stringify(tx));

  console.log('createSendToTx.encodedSignedTx ' + JSON.stringify(encodedSignedTx));

  return encodedSignedTx;
}

exports.createSendToTx = createSendToTx;