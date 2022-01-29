module.exports = {
	name: 'ping',
	description: 'ping pong!',
	usage: null,
	aliases: null,
	cooldown: 0,
	permissions: null,
	channels: null,

	execute(message) {
		message.reply('Pong!');
	},
};
