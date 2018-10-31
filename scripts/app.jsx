"use strict";

/** imports */
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );

const Row = require( 'react-bootstrap' ).Row;
const Col = require( 'react-bootstrap' ).Col;
const Grid = require( 'react-bootstrap' ).Grid;
const Table = require( 'react-bootstrap' ).Table;

const BigNumber = require( 'bignumber.js' );

const LedgerComm = require( './LedgerComm.js' );

const AddressTranscoder = require( './AddressTranscoder.js' )
const KeyTranscoder = require( './KeyTranscoder.js' )
const TxTranscoder = require( './TxTranscoder.js' )
const TxSigner = require( './TxSigner.js' )
const Asset = require( './Asset.js' )
const TxFactory = require( './TxFactory.js' )

/** global constants */

const LOG_LEDGER_POLLING = false;

const MAX_POLL_DATA_TYPE_IX = 2;

const PRIVATE_KEY_LENGTH = 64;

const PROD_TX_HISTORY_URL_PREFIX = 'https://blockchain.elastos.org/api/v1/txs/?address=';

const TEST_TX_HISTORY_URL_PREFIX = 'https://blockchain-beta.elastos.org/api/v1/txs/?pageNum=0&address=';

const TX_HISTORY_URL_PREFIX = TEST_TX_HISTORY_URL_PREFIX;

const ELA_HOST_PREFIX = 'http://elastos.coranos.io';

const ELA_REST_URL_PREFIX = `${ELA_HOST_PREFIX}:21334`;

const ELA_RPC_URL_PREFIX = `${ELA_HOST_PREFIX}:21333`;

const BALANCE_URL_PREFIX = `${ELA_REST_URL_PREFIX}/api/v1/asset/balances`;

const TX_UTXO_URL_PREFIX = `${ELA_REST_URL_PREFIX}/api/v1/asset/utxo`;

/** global variables */
var ledgerDeviceInfo = undefined;

var publicKey = undefined;

var address = undefined;

var pollDataTypeIx = 0;

var balance = undefined;

const sendToAddressStatuses = [];
sendToAddressStatuses.push( 'No Send-To Transaction Requested Yet' );

var balanceStatus = 'No Balance Requested Yet';

var transactionHistoryStatus = 'No History Requested Yet';

const parsedTransactionHistory = [];

var unspentTransactionOutputsStatus = 'No UTXOs Requested Yet';

const parsedUnspentTransactionOutputs = [];

/** functions */

const pollForDataCallback = ( message ) => {
    ledgerDeviceInfo = message;
    renderApp();
    pollDataTypeIx++;
    setPollForAllInfoTimer();
}

const pollForData = () => {
    if ( LOG_LEDGER_POLLING ) {
        console.log( 'getAllLedgerInfo ' + pollDataTypeIx );
    }
    var resetPollIndex = false;
    switch ( pollDataTypeIx ) {
        case 0:
            pollForDataCallback( 'Polling...' );
            break;
        case 1:
            const callback = () => {
                alert( ledgerDeviceInfo );
                renderApp();
                pollForDataCallback();
            }
            LedgerComm.getLedgerDeviceInfo( pollForDataCallback );
            break;
        case MAX_POLL_DATA_TYPE_IX:
            // only check every 10 seconds for a change in device status.
            pollDataTypeIx = 0;
            setTimeout( pollForData, 10000 );
            break;
        default:
            throw Error( 'poll data index reset failed.' );
    }
};

const setPollForAllInfoTimer = () => {
    setTimeout( pollForData, 1 );
}

const postJson = ( url, json, readyCallback, errorCallback ) => {
    var xmlhttp = new XMLHttpRequest();   // new HttpRequest instance 

    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if ( this.readyState == 4 ) {
            if ( this.status == 200 ) {
                readyCallback( JSON.parse( this.response ) );
            } else {
                errorCallback( this.response );
            }
        }
    }
    xhttp.responseType = 'json';
    xhttp.open( 'POST', url, true );
    xhttp.setRequestHeader( 'Content-Type', 'application/json' );

    const jsonString = JSON.stringify( json );
    xhttp.send( jsonString );
}

const getJson = ( url, callback ) => {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if ( this.readyState == 4 && this.status == 200 ) {
            callback( JSON.parse( this.response ) );
        }
    }
    xhttp.responseType = 'text';
    xhttp.open( 'GET', url, true );
    xhttp.send();
}

const getBalanceCallback = ( balanceResponse ) => {
    balanceStatus = `Balance Received:${balanceResponse.Desc} ${balanceResponse.Error} `;
    balance = balanceResponse.Result;

    renderApp();
}


const requestUnspentTransactionOutputs = () => {
    unspentTransactionOutputsStatus = 'UTXOs Requested';
    const unspentTransactionOutputsUrl = `${TX_UTXO_URL_PREFIX}/${address}/${Asset.elaAssetId}`;

    // console.log( 'unspentTransactionOutputsUrl ' + unspentTransactionOutputsUrl );

    getJson( unspentTransactionOutputsUrl, getUnspentTransactionOutputsCallback );
};

const getUnspentTransactionOutputsCallback = ( response ) => {
    unspentTransactionOutputsStatus = 'UTXOs Received';
    parsedUnspentTransactionOutputs.length = 0;

    console.log( 'getUnspentTransactionOutputsCallback ' + JSON.stringify( response ) );

    response.Result.forEach(( utxo, utxoIx ) => {
        const valueBigNumber = BigNumber( utxo.Value, 10 );

        utxo.utxoIx = utxoIx;
        utxo.valueSats = valueBigNumber.times( Asset.satoshis );

        parsedUnspentTransactionOutputs.push( utxo );
    } );

    renderApp();
}

const getTransactionHistoryCallback = ( transactionHistory ) => {
    transactionHistoryStatus = 'History Received';
    parsedTransactionHistory.length = 0;
    transactionHistory.txs.forEach(( tx, txIx ) => {
        tx.vin.forEach(( vinElt ) => {
            const parsedTransaction = {};
            parsedTransaction.n = txIx;
            parsedTransaction.type = 'input';
            parsedTransaction.value = vinElt.value;
            parsedTransaction.address = vinElt.addr;
            parsedTransactionHistory.push( parsedTransaction );
        } );
        tx.vout.forEach(( voutElt ) => {
            voutElt.scriptPubKey.addresses.forEach(( voutAddress ) => {
                const parsedTransaction = {};
                parsedTransaction.n = txIx;
                parsedTransaction.type = 'output';
                parsedTransaction.value = voutElt.value;
                parsedTransaction.address = voutAddress;
                parsedTransactionHistory.push( parsedTransaction );
            } );
        } );
    } );

    renderApp();
}

const hide = ( id ) => {
    const elt = document.getElementById( id );
    if ( elt == null ) {
        alert( `hide:no elt with id \'${id}\'` )
    }
    elt.style = 'display:none;';
}

const show = ( id ) => {
    const elt = document.getElementById( id );
    if ( elt == null ) {
        alert( `show:no elt with id \'${id}\'` )
    }
    elt.style = 'display:block;';
}

const getPublicKeyFromPrivateKey = () => {
    show( 'privateKey' );
    const privateKeyElt = document.getElementById( 'privateKey' );
    const privateKey = privateKeyElt.value;
    if ( privateKey.length != PRIVATE_KEY_LENGTH ) {
        alert( `private key must be a hex encoded string of length ${PRIVATE_KEY_LENGTH}, not ${privateKey.length}` );
        return;
    }
    publicKey = KeyTranscoder.getPublic( privateKey );
    address = AddressTranscoder.getAddressFromPublicKey( publicKey );

    hide( 'privateKey' );
    hide( 'privateKeyButton' );
    renderApp();

    requestTransactionHistory();
    requestBalance();
    requestUnspentTransactionOutputs();
}

const sendAmountToAddressErrorCallback = ( error ) => {
    sendToAddressStatuses.push( JSON.stringify( error ) );
    renderApp();
}

const sendAmountToAddressReadyCallback = ( transactionJson ) => {
    sendToAddressStatuses.push( JSON.stringify( transactionJson ) );
    renderApp();
}

const sendAmountToAddress = () => {
    const sendToAddressElt = document.getElementById( 'sendToAddress' );
    const sendAmountElt = document.getElementById( 'sendAmount' );
    const privateKeyElt = document.getElementById( 'privateKey' );

    const sendToAddress = sendToAddressElt.value;
    const sendAmount = sendAmountElt.value;
    const privateKey = privateKeyElt.value;

    const unspentTransactionOutputs = parsedUnspentTransactionOutputs;
    console.log( 'sendAmountToAddress.unspentTransactionOutputs ' + JSON.stringify( unspentTransactionOutputs ) );

    const encodedTx = TxFactory.createSendToTx( privateKey, unspentTransactionOutputs, sendToAddress, sendAmount );

    const txUrl = `${ELA_RPC_URL_PREFIX}`;

    const json = `{"method":"sendrawtransaction", "params": ["${encodedTx}"]}`;

    console.log( 'sendAmountToAddress.encodedTx ' + JSON.stringify( encodedTx ) );

    const decodedTx = TxTranscoder.decodeTx( Buffer.from( encodedTx, 'hex' ) );

    console.log( 'sendAmountToAddress.decodedTx ' + JSON.stringify( decodedTx ) );

    sendToAddressStatuses.length = 0;
    sendToAddressStatuses.push( JSON.stringify( encodedTx ) );
    sendToAddressStatuses.push( JSON.stringify( decodedTx ) );
    sendToAddressStatuses.push( `Transaction Requested: curl ${txUrl} -H "Content-Type: application/json" -d '${json}'` );
    renderApp();
    postJson( ELA_RPC_URL_PREFIX, json, sendAmountToAddressReadyCallback, sendAmountToAddressErrorCallback );
}

const requestTransactionHistory = () => {
    transactionHistoryStatus = 'History Requested';
    const transactionHistoryUrl = TX_HISTORY_URL_PREFIX + address;
    getJson( transactionHistoryUrl, getTransactionHistoryCallback );
};

const requestBalance = () => {
    balanceStatus = 'History Requested';
    const balanceUrl = `${BALANCE_URL_PREFIX}/${address}`;
    getJson( balanceUrl, getBalanceCallback );
};

const showTab = ( id ) => {
    const tabcontent = document.getElementsByClassName( 'tabcontent' );
    for ( var i = 0; i < tabcontent.length; i++ ) {
        hide( tabcontent[i].id );
    }
    show( id );

    const tablinks = document.getElementsByClassName( 'tablinks' );
    for ( var i = 0; i < tablinks.length; i++ ) {
        if ( tablinks[i].innerText == id ) {
            tablinks[i].className += ' active';
        } else {
            tablinks[i].className = tablinks[i].className.replace( ' active', '' );
        }
    }
};

const showDefaultTab = () => {
    showTab( 'Home' );
}

class App extends React.Component {
    render() {
        return ( <div id="tabcontainer">
            <div class="tab">
                <button class="tablinks" onClick={( e ) => showTab( 'Home' )}>Home</button>
                <button class="tablinks" onClick={( e ) => showTab( 'Send' )}>Send</button>
                <button class="tablinks" onClick={( e ) => showTab( 'Receive' )}>Receive</button>
                <button class="tablinks" onClick={( e ) => showTab( 'Transactions' )}>Transactions</button>
            </div>
            <div id="Home" class="tabcontent outlined">
                <b>Ledger Device Info</b>
                <p style={{
                    wordBreak: 'break-all'
                }}>
                    <code>{ledgerDeviceInfo}</code>
                    <code>&nbsp;</code>
                </p>
                <b>Private Key</b>
                <p style={{
                    height: '12px'
                }}>
                    <input style={{
                        fontFamily: 'monospace'
                    }} type="text" size="64" id="privateKey" placeholder="Private Key"></input>
                </p>
                <p>
                    <button id="privateKeyButton" onClick={( e ) => getPublicKeyFromPrivateKey()}>Use Private Key</button>
                </p>
            </div>
            <div id="Send" class="tabcontent outlined">
                <b>Send To Address</b>
                <p style={{
                    height: '12px'
                }}>
                    <input style={{
                        fontFamily: 'monospace'
                    }} type="text" size="64" id="sendToAddress" placeholder="Send To Address"></input>
                </p>
                <b>Amount</b>
                <p style={{
                    height: '12px'
                }}>
                    <input style={{
                        fontFamily: 'monospace'
                    }} type="text" size="64" id="sendAmount" placeholder="Send Amount"></input>
                </p>
                <p>
                    <button onClick={( e ) => sendAmountToAddress()}>Send Amount To Address</button>
                </p>
                <b>Send To Address Status</b>
                <p style={{
                    wordBreak: 'break-all'
                }}>
                    <table>
                        <tr>
                            <th>Status</th>
                        </tr>

                        {
                            sendToAddressStatuses.map(( sendToAddressStatus, key ) => {
                                return ( <tr>
                                    <td>{sendToAddressStatus}</td>
                                </tr> )
                            } )
                        }
                    </table>
                </p>

            </div>
            <div id="Receive" class="tabcontent outlined">
                <b>Public Key</b>
                <p style={{
                    wordBreak: 'break-all'
                }}>
                    <code>{publicKey}</code>
                    <code>&nbsp;</code>
                </p>
                <b>Address</b>
                <p style={{
                    wordBreak: 'break-all'
                }}>
                    <code>{address}</code>
                    <code>&nbsp;</code>
                </p>
                <b>Balance Status</b>
                <p style={{
                    wordBreak: 'break-all'
                }}>
                    <code>{balanceStatus}</code>
                    <code>&nbsp;</code>
                </p>
                <b>Balance</b>
                <p style={{
                    wordBreak: 'break-all'
                }}>
                    <code>{balance}</code>
                    <code>&nbsp;</code>
                </p>
            </div>
            <div id="Transactions" class="tabcontent outlined">
                <b>Transaction History</b>
                <p style={{
                    wordBreak: 'break-all'
                }}>
                    <code>Status:{transactionHistoryStatus}</code>
                </p>
                <table>
                    <tr>
                        <th>TX Number</th>
                        <th>Value Type</th>
                        <th>Address</th>
                        <th>Value (ELA)</th>
                        <th>Value (Sats)</th>
                    </tr>
                    {
                        parsedTransactionHistory.map( function( item, key ) {
                            return ( <tr>
                                <td>{item.n}</td>
                                <td>{item.type}</td>
                                <td>{item.address}</td>
                                <td>{item.value}</td>
                                <td>{item.valueSat}</td>
                            </tr> )
                        } )
                    }
                </table>
                <b>Unspent Transaction Outputs</b>
                <p style={{
                    wordBreak: 'break-all'
                }}>
                    <code>Status:{unspentTransactionOutputsStatus}</code>
                </p>
                <table>
                    <tr>
                        <th>utxoIx</th>
                        <th>Txid</th>
                        <th>Index</th>
                        <th>Value (ELA)</th>
                        <th>Value (Sats)</th>
                    </tr>
                    {
                        parsedUnspentTransactionOutputs.map( function( item, key ) {
                            return ( <tr>
                                <td>{item.utxoIx}</td>
                                <td>{item.Txid}</td>
                                <td>{item.Index}</td>
                                <td>{item.Value}</td>
                                <td>{item.ValueSats}</td>
                            </tr> )
                        } )
                    }
                </table>
            </div>
        </div> )
    }
}
const renderApp = () => {
    ReactDOM.render( <App />, document.getElementById( 'main' ) );
};

const onLoad = () => {
    showDefaultTab();
}

/** call initialization functions */
window.onload = onLoad;

setPollForAllInfoTimer();

renderApp();
