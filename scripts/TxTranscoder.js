/* based on https://github.com/elastos/Elastos.ELA/blob/master/core/transaction.go */
const BigNumber = require('bignumber.js');

const SmartBuffer = require('smart-buffer').SmartBuffer;

const AddressTranscoder = require('./AddressTranscoder.js')

// BigNumber.config({ CRYPTO: true });

const writeVarUint = (smartBuffer, n) => {
  if (n < 0xFD) {
    smartBuffer.writeUInt8(n);
    // 16 bit
  } else if (n <= 0xFFFF) {
    smartBuffer.writeUInt8(0xFD);
    smartBuffer.writeUInt16LE(n);
    // 32 bit
  } else if (n <= 0xFFFFFFFF) {
    smartBuffer.writeUInt8(0xFE);
    smartBuffer.writeUInt32LE(n);
    // 64 bit
  } else {
    smartBuffer.writeUInt8(0xFF);
    smartBuffer.writeUInt32LE(n >>> 0);
    smartBuffer.writeUInt32LE((n / 0x100000000) | 0);
  }
}

const readVarUint = (smartBuffer) => {
  const n = smartBuffer.readUInt8();
  //console.log( 'readVarUint.n', n );
  if ((n & 0xFF) < 0xFD) {
    return n & 0xFF;
  }
  if ((n & 0xFF) == 0xFD) {
    const number = smartBuffer.readUInt16LE();
    return number;
  } else if ((n & 0xFF) == 0xFE) {
    const number = smartBuffer.readUInt32LE();
    return number;
  } else if ((n & 0xFF) == 0xFF) {
    const number = smartBuffer.readUInt64LE();
    return number;
  }
  return 0;
}

exports.decodeTx = (encodedTx) => {
  if (!Buffer.isBuffer(encodedTx)) {
    throw Error('encodedTx must be a Buffer');
  }
  const decodedTx = {};

  const smartEncodedTx = SmartBuffer.fromBuffer(encodedTx);

  decodedTx.TxType = smartEncodedTx.readInt8();

  decodedTx.PayloadVersion = smartEncodedTx.readInt8();

  const TxAttributesLen = readVarUint(smartEncodedTx);

  const TxAttributes = [];
  for (let TxAttributeIx = 0; TxAttributeIx < TxAttributesLen; TxAttributeIx++) {
    const TxAttribute = {};
    TxAttribute.Usage = smartEncodedTx.readInt8();

    const TxAttributeDataLen = readVarUint(smartEncodedTx);
    const TxAttributeDataBuffer = smartEncodedTx.readBuffer(TxAttributeDataLen);

    TxAttribute.Data = TxAttributeDataBuffer.toString('hex').toUpperCase();

    TxAttributes.push(TxAttribute);
  }
  decodedTx.TxAttributes = TxAttributes;

  const UTXOInputsLen = readVarUint(smartEncodedTx);
  const UTXOInputs = [];
  for (let UTXOInputsLenIx = 0; UTXOInputsLenIx < UTXOInputsLen; UTXOInputsLenIx++) {
    const UTXOInput = {};

    UTXOInput.TxId = smartEncodedTx.readBuffer(32).reverse().toString('hex').toUpperCase();

    UTXOInput.ReferTxOutputIndex = smartEncodedTx.readUInt16LE();

    UTXOInput.Sequence = smartEncodedTx.readUInt32LE();

    UTXOInputs.push(UTXOInput);
  }
  decodedTx.UTXOInputs = UTXOInputs;

  const OutputsLen = readVarUint(smartEncodedTx);
  const Outputs = [];
  for (let OutputsIx = 0; OutputsIx < OutputsLen; OutputsIx++) {
    const Output = {};

    Output.AssetID = smartEncodedTx.readBuffer(32).reverse().toString('hex').toUpperCase();

    const value = smartEncodedTx.readBuffer(8);
    // console.log('decodeTx.value', value);
    const valueHex = value.reverse().toString('hex');
    // console.log('decodeTx.valueHex', valueHex);
    const valueBigNumber = BigNumber(valueHex, 16);
    // console.log('decodeTx.valueBigNumber', valueBigNumber);
    // console.log('decodeTx.valueBigNumber.Hex', valueBigNumber.toString(16));
    Output.Value = valueBigNumber.toString(10);
    // console.log('decodeTx.Value', Output.Value);

    Output.OutputLock = smartEncodedTx.readUInt32LE();

    const programHash = smartEncodedTx.readBuffer(21);
    // console.log('decodeTx.programHash', programHash.toString('hex'));
    Output.Address = AddressTranscoder.getAddressFromProgramHash(programHash);
    // console.log('decodeTx.Address', Output.Address);

    Outputs.push(Output);
  }
  decodedTx.Outputs = Outputs;

  decodedTx.LockTime = smartEncodedTx.readUInt32LE();

  const Programs = [];

  const ProgramsLen = readVarUint(smartEncodedTx);

  // console.log('decodeTx.ProgramsLen', ProgramsLen);

  for (let ProgramIx = 0; ProgramIx < ProgramsLen; ProgramIx++) {
    const Program = {};

    const parameterLen = readVarUint(smartEncodedTx);
    Program.Parameter = smartEncodedTx.readBuffer(parameterLen).toString('hex').toUpperCase();

    const codeLen = readVarUint(smartEncodedTx);
    Program.Code = smartEncodedTx.readBuffer(codeLen).toString('hex').toUpperCase();

    Programs.push(Program);
  }

  decodedTx.Programs = Programs;

  return decodedTx;
};

exports.encodeTx = (decodedTx, includePrograms) => {
  if (includePrograms === undefined) {
    throw Error('includePrograms is a required parameter.');
  }

   //console.log('encodeTx.includePrograms', includePrograms);
  
  const encodedTx = new SmartBuffer();

  encodedTx.writeInt8(decodedTx.TxType);

  encodedTx.writeInt8(decodedTx.PayloadVersion);

  writeVarUint(encodedTx, decodedTx.TxAttributes.length);

  decodedTx.TxAttributes.forEach((TxAttribute) => {
    encodedTx.writeInt8(TxAttribute.Usage);

    const data = Buffer.from(TxAttribute.Data, 'hex');
    writeVarUint(encodedTx, data.length);
    encodedTx.writeBuffer(data);
  });

  writeVarUint(encodedTx, decodedTx.UTXOInputs.length);
  decodedTx.UTXOInputs.forEach((UTXOInput) => {
    const txId = Buffer.from(UTXOInput.TxId, 'hex').reverse();
    encodedTx.writeBuffer(txId);

    encodedTx.writeUInt16LE(UTXOInput.ReferTxOutputIndex);

    encodedTx.writeUInt32LE(UTXOInput.Sequence);
  });

  writeVarUint(encodedTx, decodedTx.Outputs.length);
  decodedTx.Outputs.forEach((Output) => {
    const assetID = Buffer.from(Output.AssetID, 'hex').reverse();
    encodedTx.writeBuffer(assetID);

    // console.log('encodeTx.Value', Output.Value);
    const valueBigNumber = BigNumber(Output.Value, 10);
    // console.log('encodeTx.valueBigNumber', valueBigNumber);
    // console.log('encodeTx.valueBigNumber.Hex', valueBigNumber.toString(16));
    const valueHex = valueBigNumber.toString(16).padStart(16, '0');
    // console.log('encodeTx.valueHex', valueHex);
    const value = Buffer.from(valueHex, 'hex').reverse();
    // console.log('encodeTx.value', value);
    encodedTx.writeBuffer(value);

    encodedTx.writeUInt32LE(Output.OutputLock);

    const programHash = AddressTranscoder.getProgramHashFromAddress(Output.Address);
    encodedTx.writeBuffer(programHash);
  });

  encodedTx.writeUInt32LE(decodedTx.LockTime);

  if (includePrograms) {
    writeVarUint(encodedTx, decodedTx.Programs.length);
    decodedTx.Programs.forEach((Program) => {
      const parameter = Buffer.from(Program.Parameter, 'hex');
      writeVarUint(encodedTx, parameter.length);
      encodedTx.writeBuffer(parameter);

      const code = Buffer.from(Program.Code, 'hex');
      writeVarUint(encodedTx, code.length);
      encodedTx.writeBuffer(code);
    })
  }

  return encodedTx.toString('hex');
};
