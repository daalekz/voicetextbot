const Discord 		= require('discord.js');
const errorhandler 	= require('./errorhandler.js');

module.exports = {
	/**
	 * Sends a message containing an embed in reply to an original message, or to a specified channel.
	 * Can also be used to edit a message if the message supplied was authored by the client.
	 * 
	 * @param {Discord.Message} message The original message to reply to
	 * @param {Object} embed An object containing the data to send in the embed
	 * @param {Discord.Channel} channel The channel in which to send the message - defaults to the message parameter's channel if none specified
	 * @returns {Promise<Discord.Message>} The new message created, the message edited, or an error message
	 */
	execute(message,embed,channel){
		let fetched = false;

		if(!channel){
			channel = message.channel;
		}

		if(!message){ //get most recent message from passed channel if no message exists
			return channel.messages.fetch({limit:1}).then(messages => {
				message = messages.first();
				fetched = true;
				return run();
			});
		}else{
			return run();
		}
		
		/**
		 * Runs the embed sending logic after determining the correct destination location
		 * 
		 * @returns {Promise<Discord.Message>} The new message created, the message edited, or an error message
		 */
		function run(){
			const embedTemplate = module.exports.prepare(embed, message);

			try{
				//edit message instead of creating new one if message object received came from the bot
				if(message && message.author === message.client.user && !fetched){ 
					return message.edit({
						content: embed.outside || null,
						embeds: [embedTemplate],
						files: embed.attach || null
					});
				}else{
					return channel.send({
						content: embed.outside || null,
						embeds: [embedTemplate],
						files: embed.attach || null
					});
				}
			}catch(error){
				return errorhandler.execute(message, error);
			}
		}	
	},

	/**
	 * A template for converting an object containing embed data into a Discord-friendly Embed object which can be sent in a message.
	 * 
	 * @param {Object} embed An object containing the data for the embed.
	 * @param {Discord.Message} message The message which caused the embed to be prepared.
	 * @returns A Discord MessageEmbed object.
	 */
	prepare: (embed, message) =>{
		const embedTemplate = new Discord.MessageEmbed();
		
		if(embed.color) embedTemplate.setColor(embed.color);
		if(embed.title) embedTemplate.setTitle(embed.title);
		if(embed.url) embedTemplate.setURL(embed.url);
		if(embed.author) embedTemplate.setAuthor({ name: embed.author.name, iconURL: embed.author.avatar});
		if(embed.description) embedTemplate.setDescription(embed.description);
		if(embed.fields) embedTemplate.addFields(embed.fields);
		if(embed.image) embedTemplate.setImage(embed.image.url);
		if(embed.thumbnail) embedTemplate.setThumbnail(embed.thumbnail.url); 

		if(embed.footer) {
			embedTemplate.setFooter({text: embed.footer.text, iconURL: embed.footer.avatar ?? message.client.user.avatarURL()});
		}

		return embedTemplate;
	}
};