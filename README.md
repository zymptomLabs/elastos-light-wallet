# elastos-light-wallet

### to check if your node is working run:

url http://localhost:21333 -d '{"method":"getnodestate"}' -H "Content-Type: application/json"

### requirements

```
nodejs v10.11.0 or higher.
npm 6.4.1 or higher.
python 2.7 (for multiple versions, run "npm config set python ${path-to-python2.7}")
```

if windows give you an error "cannot find vcbuild.exe"
```
npm install -g --production windows-build-tools
```

```
Accessories

* npm plus (It is installed inside atom in the packages section)
* python
* microsoft visual studio 2005

To install python it is necessary to run windows CMD as administrator and execute the command [npm install --global --production windows-build-tools]

And run there [npm install node-gyp] to verify if you have installed C ++ if not installed

If you have a problem with visual C ++ you can use this command in the same Windows CMD [npm install mongoose --msvs_version = 2012]
```

To use:
```
npm install;
npm start;
```

To test:
```
npm test;
```

### helpful hash tools:
Hash of a hex message:
echo -n "<hex>" | shasum -a 256

Hash of the binary code inside a hex message:
perl -e 'print pack("H*","<hex>")' | shasum -a 256

### neo uses p256 as well, so can reuse some code:

https://github.com/CityOfZion/neon-js/blob/31600a3cb9c38b9a0d961e98475e4cc81c908cd8/packages/neon-core/src/wallet/core.ts

### todo

1) convert private key to public address, like CLI does.  
its a P256 curve, so the private key:  
  be1da20c6a33aa437dd47c7797f6a5b96aafde39dde24e10aaa0a3763a0cb335  
should convert to the public key:  
  037d5290f31135fd74e5aae50ea70e07bc86ac5dbf4c1279d4a29a2bda30f0c665  
address  
  EbDbMuMQcNhuyuyJdJT2DqN38bxiApQRgt  

NOTE: don't ever send stuff to this address. People will steal it.
If you want to send donations ,send it to this address instead:
  EPPYrYhbzPyfHsJKcKY1R5JVEUSZTidSnC

2) create transaction like CLI does.  
-- get an example transaction and convert it.  

-- start with (from,to,amount,fee).  

-- find utxo's of the from address.  

-- create a transaction that is byte-identical to
  https://github.com/elastos/Elastos.ELA/blob/master/core/transaction.go

-- to create a transaction using the ela cli:
```
./ela-cli wallet -t create --from EbDbMuMQcNhuyuyJdJT2DqN38bxiApQRgt --to EacksRXrSsufWF1qJCxfZeX6ggxFBMviny --amount 0.1 --fee 0.00001

./ela-cli wallet -t sign --file to_be_signed.txn
```

### force only one version of elastos-light-wallet

rm -rf .git;
git init;
git lfs uninstall;
find . -exec touch {} \;
git add .;
git commit -m "Initial commit";
git remote add origin https://github.com/coranos/elastos-light-wallet.git;
git push -u --force origin master;
git pull;git push;
