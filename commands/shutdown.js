module.exports = {
	name: 'shutdown',
	description: 'Graceful shutdown of the bot',
	usage: null,
	aliases: null,
	cooldown: 0,
	permissions: ['admin'],
	channels: null,

	execute(message, args, client) {
		message.react('👋').then (() => {
			client.destroy();
			return;
		});
	},
};
