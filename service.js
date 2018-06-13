const biotCore = require('biot-core');
const ChannelsManager = require('biot-core/lib/ChannelsManager');
const objectHash = require('byteballcore/object_hash');
const pn532 = require('pn532');
const i2c = require('i2c');
const ndef = require('ndef');
const PythonShell = require('python-shell');

const wire = new i2c(pn532.I2C_ADDRESS, {device: '/dev/i2c-1'});
const rfid = new pn532.PN532(wire);

let lastUID;
let lastScanTime = 0;

let scanInterval = 6000;


let minAmount = 5000;
let channels = {};

async function start() {
	await biotCore.init('test');
	let wallets = await biotCore.getMyDeviceWallets();
	let arrAddresses = await biotCore.getAddressesInWallet(wallets[0]);
	let addrBalance = await biotCore.getAddressBalance(arrAddresses[0]);
	console.error('balance', addrBalance);
	if (addrBalance.base.stable < minAmount && addrBalance.base.pending < minAmount) {
		return console.error('Please use the faucet or replenish your account')
	}

	const channelsManager = new ChannelsManager(wallets[0]);

	channelsManager.events.on('newChannel', async (objInfo) => {
		console.error('new Channel: ', objInfo);
		channels[objInfo.peerDeviceAddress] = {
			time: 0,
			balance: 0
		};
		channels[objInfo.peerDeviceAddress].channel = channelsManager.getNewChannel(objInfo);
		let channel = channels[objInfo.peerDeviceAddress].channel;

		channel.events.on('error', error => {
			console.error('channelError', channel.id, error);
		});
		channel.events.on('start', async () => {
			console.error('channel start', channel.id);
			channels[objInfo.peerDeviceAddress].interval = setInterval(() => {
				console.error('--------');
				console.error('Time: ', channels[objInfo.peerDeviceAddress].time);
				console.error('Balance: ', channels[objInfo.peerDeviceAddress].balance);
				console.error('--------');
				channels[objInfo.peerDeviceAddress].time += 10;
			}, 10000);
			openBarrier();
			await sleep(10000);
			closeBarrier();
		});
		channel.events.on('changed_step', (step) => {
			console.error('changed_step: ', step);
		});
		channel.events.on('new_transfer', async (amount, message) => {
			console.error('new_transfer', amount, 'time: ', message);
			channels[objInfo.peerDeviceAddress].balance += amount;
			console.error('channel', channel.info());
		});
		await channel.init();
		await channel.approve();
		console.error(channel.info());
	});
}

async function parseRFID(records) {
	if (!records.length) return;
	if (/^([\w\/+]+)@([\w.:\/-]+)#([\w\/+-]+)$/.test(records[0].value)) {
		let pairingCode = records[0].value;
		let peerDeviceAddress = objectHash.getDeviceAddress(pairingCode.split('@')[0]);
		if (!channels[peerDeviceAddress]) {
			await biotCore.addCorrespondent(pairingCode);
			biotCore.sendTextMessageToDevice(peerDeviceAddress, JSON.stringify({price: 10, time: 10}));
		} else {
			clearInterval(channels[peerDeviceAddress].interval);
			console.error(await channels[peerDeviceAddress].channel.closeMutually());
			openBarrier();
			await sleep(10000);
			closeBarrier();
			console.error('!-----');
			console.error(channels[peerDeviceAddress].time, channels[peerDeviceAddress].balance);
			console.error(channels[peerDeviceAddress].channel.info());
			delete channels[peerDeviceAddress];
		}
	}
}

function sleep(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	})
}

rfid.on('ready', () => {
	console.log('Ready...');
	rfid.on('tag', (tag) => {
		if (lastUID === tag.uid && lastScanTime + scanInterval > Date.now()) return;
		lastUID = tag.uid;
		lastScanTime = Date.now();
		console.log('Scanned...');
		rfid.readNdefData().then((data) => {
			parseRFID(ndef.decodeMessage(data)).catch(console.error);
		});
	});
});

function openBarrier() {
	let options = {
		mode: 'text',
		pythonOptions: ['-u'],
		args: ['3.0']
	};

	PythonShell.run('servo.py', options, function (err, results) {
		if (err) throw err;
		console.log('results: %j', results);
	});
}

function closeBarrier() {
	let options = {
		mode: 'text',
		pythonOptions: ['-u'],
		args: ['7.5']
	};

	PythonShell.run('servo.py', options, function (err, results) {
		if (err) throw err;
		console.log('results: %j', results);
	});
}


start().catch(console.error);