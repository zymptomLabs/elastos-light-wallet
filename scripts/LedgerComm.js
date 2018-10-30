//const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid');
const TransportNodeHid = {};
TransportNodeHid.default = {};
TransportNodeHid.default.isSupported = ( () => { return false; } );
TransportNodeHid.default.list = ( () => { return [] } );

const LOG_LEDGER_MESSAGE = false;

const finishLedgerDeviceInfo = ( msg ) => {
    if ( LOG_LEDGER_MESSAGE ) {
        console.log( 'getLedgerDeviceInfo : ', msg );
    }
    return msg;
}

const getLedgerDeviceInfo = ( callback ) => {
    const supported = TransportNodeHid.default.isSupported();
    if ( !supported ) {
        callback( finishLedgerDeviceInfo( 'Your computer does not support the ledger device.' ) );
    }

    TransportNodeHid.default.list().then(( paths ) => {
        if ( paths.length === 0 ) {
            callback( finishLedgerDeviceInfo( 'USB Error: No device found.' ) );
        } else {
            TransportNodeHid.default.open( paths[0] ).then(( device ) => {
                try {
                    const deviceInfo = device.device.getDeviceInfo();
                    const deviceInfoStr = JSON.stringify( deviceInfo );
                    callback( finishLedgerDeviceInfo( deviceInfoStr ) );
                } catch ( error ) {
                    callback( finishLedgerDeviceInfo( 'Error ' + JSON.stringify( error ) ) );
                } finally {
                    device.close();
                }
            }, ( reason ) => {
                callback( reason.message );
            } );
        }
    }, ( reason ) => {
        callback( reason.message );
    } );
};

exports.getLedgerDeviceInfo = getLedgerDeviceInfo;
