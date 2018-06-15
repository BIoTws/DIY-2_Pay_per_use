# DIY-2_Pay_per_use

#### Service device:
```sh
$ git clone https://github.com/BIoTws/DIY-2_Pay_per_use
$ cd DIY-2_Pay_per_use
$ npm install
$ ./testnetify.sh
$ node service.js
```

#### User device:
```sh
$ git clone https://github.com/BIoTws/DIY-2_Pay_per_use
$ cd DIY-2_Pay_per_use
$ npm install
$ ./testnetify.sh
$ node user.js
```

#### Configuration
1) Start User
2) Copy "my pairing code"
3) Replace the values in write_nfc.js on Service device 
4) Execute write_nfc.js and apply rfid card
5) Start User
