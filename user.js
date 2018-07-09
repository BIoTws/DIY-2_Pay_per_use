const biotCore = require('biot-core');
const ChannelsManager = require('biot-core/lib/ChannelsManager');
const eventBus = require('byteballcore/event_bus');

const timeout = 20000; // 20 sec
const minAmount = 5000;

let channel;
let time = 0;
let interval;

async function start() {
	await biotCore.init('test');
	const device = require('byteballcore/device');
	let myDeviceAddress = device.getMyDeviceAddress();
	let wallets = await biotCore.getMyDeviceWallets();

	let addrBalance = await biotCore.getWalletBalance(wallets[0]);
	console.error('balance', addrBalance);
	if ((addrBalance.base.stable + addrBalance.base.pending) < minAmount) {
		return console.error('Please use the faucet or replenish your account')
	}

	const channelsManager = new ChannelsManager(wallets[0], timeout);

	eventBus.on('text', async (from_address, text) => {
		let objMessage;
		try {
			objMessage = JSON.parse(text);
		} catch (e) {
			console.error(e);
		}

		if (objMessage && objMessage.price && objMessage.time) {
			channel = channelsManager.newChannel({
				walletId: wallets[0],
				myDeviceAddress,
				peerDeviceAddress: from_address,
				peerAddress: null,
				myAmount: 3500,
				peerAmount: 1,
				age: 10
			});
			channel.events.on('error', error => {
				console.error('channelError', channel.id, error);
			});
			channel.events.on('start', async () => {
				console.error('channel start: ', channel.id);
				interval = setInterval(async () => {
					time += 10;
					await channel.transfer(10, time);
				}, 10000);
			});
			channel.events.on('changed_step', (step) => {
				if (step === 'mutualClose') {
					clearInterval(interval);
					console.error('close');
					time = 0;
				}
				// console.error('changed_step: ', step);
			});
			channel.events.on('new_transfer', async (amount, message) => {

			});
			console.error('init', await channel.init());
		}
	});
}

start().catch(console.error);