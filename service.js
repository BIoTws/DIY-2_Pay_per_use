const biotCore = require('biot-core');
const ChannelsManager = require('biot-core/lib/ChannelsManager');
const objectHash = require('byteballcore/object_hash');

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
				channels[objInfo.peerDeviceAddress].time += 5;
			}, 5000);
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

async function rfid(pairingCode) {
	let peerDeviceAddress = objectHash.getDeviceAddress(pairingCode.split('@')[0]);
	if (!channels[peerDeviceAddress]) {
		await biotCore.addCorrespondent(pairingCode);
		biotCore.sendTextMessageToDevice(peerDeviceAddress, JSON.stringify({price: 5, time: 5}));
	} else {
		clearInterval(channels[peerDeviceAddress].interval);
		await channels[peerDeviceAddress].channel.closeMutually().catch(console.error);
		console.error('!-----');
		console.error(channels[peerDeviceAddress].time, channels[peerDeviceAddress].balance);
		console.error(channels[peerDeviceAddress].channel.info());
		delete channels[peerDeviceAddress];
	}
}


start().catch(console.error);