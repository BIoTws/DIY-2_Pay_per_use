const pn532 = require('pn532');
const i2c = require('i2c');
const ndef = require('ndef');

const wire = new i2c(pn532.I2C_ADDRESS, {device: '/dev/i2c-1'});
const rfid = new pn532.PN532(wire);
let lastUID;
let lastScanTime = 0;

let interval = 3000;

rfid.on('ready', () => {
	console.log('Ready...');
	rfid.on('tag', (tag) => {
		if (lastUID === tag.uid && lastScanTime + interval > Date.now()) return;
		lastUID = tag.uid;
		lastScanTime = Date.now();
		console.log('Scanned...');
		rfid.readNdefData().then((data) => {
			let records = ndef.decodeMessage(data);
			if (records.length) {
				console.log('Value:', records[0].value);
			} else {
				console.log('Value: ', null);
			}
		});
	});
});