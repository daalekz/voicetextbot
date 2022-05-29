const Discord 		= require('discord.js');

module.exports = {
	/**
	 * Sends a message that indicates an error has occurred.
	 *
	 * @param {Discord.Message} message The original message which caused the Error
	 * @param {Error} err The Error object caught by the program
	 * @returns {Promise<Discord.Message>} The message sent to a channel indicating an error occured
	 */
	execute(message, err) {
		console.log('\x1b[41m', err, '\x1b[0m');

		const embedTemplate = new Discord.MessageEmbed();

		embedTemplate.setColor('#b00c00');
		embedTemplate.setTitle('yeah nah');
		embedTemplate.setAuthor(message.client.user.username, message.client.user.avatarURL());
		embedTemplate.setDescription('that dun broke');


		return message.channel.send({ embed: [embedTemplate] });
	},
};