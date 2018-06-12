const pn532 = require('pn532');
const i2c = require('i2c');
const ndef = require('ndef');

const wire = new i2c(pn532.I2C_ADDRESS, {device: '/dev/i2c-1'});
const rfid = new pn532.PN532(wire);

rfid.on('ready', function() {
	console.log('Ready...');
	rfid.scanTag().then(function(tag) {
		console.log('Scanned...');
		rfid.readNdefData().then(function(data) {
			let records = ndef.decodeMessage(data);
			console.log(records);
		});
	});
});