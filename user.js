const biotCore = require('biot-core');
const Channel = require('biot-core/lib/Channel');
const eventBus = require('byteballcore/event_bus');

let minAmount = 5000;

let channel;
let time = 0;
let interval;

async function start() {
	await biotCore.init('test');
	const device = require('byteballcore/device');
	let myDeviceAddress = device.getMyDeviceAddress();
	let wallets = await biotCore.getMyDeviceWallets();
	let arrAddresses = await biotCore.getAddressesInWallet(wallets[0]);
	let addrBalance = await biotCore.getAddressBalance(arrAddresses[0]);
	console.error('balance', addrBalance);
	if (addrBalance.base.stable < minAmount && addrBalance.base.pending < minAmount) {
		return console.error('Please use the faucet or replenish your account')
	}

	eventBus.on('text', async (from_address, text) => {
		let objMessage;
		try {
			objMessage = JSON.parse(text);
		} catch (e) {
			console.error(e);
		}

		if (objMessage && objMessage.price && objMessage.time) {
			channel = new Channel(wallets[0], myDeviceAddress, from_address, null, 3500, 1, 10);
			channel.events.on('error', error => {
				console.error('channelError', channel.id, error);
			});
			channel.events.on('start', async () => {
				console.error('channel start. t.js', channel.id);
				interval = setInterval(async () => {
					time += 5;
					await channel.transfer(5, time);
					console.error('channel', channel.info());
				}, 5000);
			});
			channel.events.on('changed_step', (step) => {
				if (step === 'mutualClose') {
					clearInterval(interval);
					console.error('close');
					time = 0;
				}
				console.error('changed_step: ', step);
			});
			channel.events.on('new_transfer', async (amount, message) => {

			});
			console.error('init', await channel.init());
		}
	});
}

start().catch(console.error);