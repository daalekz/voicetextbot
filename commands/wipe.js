const config = require('../config/config.js'),
	{ appendSysLog } = require('../utils.js');

module.exports = {
	name: 'wipe',
	description:
    'Clear the last two weeks of messages from the voice text channel',
	usage: null,
	aliases: ['cleanup'],
	cooldown: 20,
	permissions: ['invoice'],
	channels: [config.inVoiceTextChannel],

	execute(message) {
		appendSysLog(
			`channel wiped by ${message.author.username} at ${message.createdAt}`,
		);

		wipe(message.client.channels.cache.get(config.inVoiceTextChannel))
			.then(message.channel
				.send(`Welcome to the In-Voice text channel. You may use the \`${config.prefix}${this.name}\` command to wipe the contents of this channel at any time`))
			.then((result) => {return result;});
	},
};

async function wipe(channel) {
	let msg_size = 100;
	do {
		const fetched = await channel.messages.fetch({ limit: 100 });
		const notPinned = fetched.filter((fetchedMsg) => !fetchedMsg.pinned);
		await channel
			.bulkDelete(notPinned, true)
			.then((messages) => (msg_size = messages.size))
			.catch((error) =>{
				appendSysLog(`error wiping channel with error ${error}`);
				return false;
			});
	} while (msg_size == 100);
}