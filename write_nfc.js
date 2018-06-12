const pn532 = require('pn532');
const i2c = require('i2c');
const ndef = require('ndef');

const wire = new i2c(pn532.I2C_ADDRESS, {device: '/dev/i2c-1'});
const rfid = new pn532.PN532(wire);

const peerPairingCode = 'A0buAHIPJMx8xcW9SbjqgQZEZIfa2x/B5QSnx80D2Dv0@biot.ws/bb-test#test';

rfid.on('ready', function() {
	console.log('Ready...');
	rfid.scanTag().then(function(tag) {
		console.log('Scanned...');
		let messages = [
			ndef.textRecord(peerPairingCode)
		];
		let data = ndef.encodeMessage(messages);

		console.log('Data ready...');

		rfid.writeNdefData(data).then(function(response) {
			console.log('Write successful');
			rfid.readNdefData().then(function(data) {
				let records = ndef.decodeMessage(data);
				console.log(records);
			});
		});
	});
});