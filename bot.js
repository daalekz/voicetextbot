/* eslint-disable no-var */
const Discord = require('discord.js');
const _ = require('underscore');
const config = require('./config/config.js');
const client = new Discord.Client();
// const config = require('./bot-config.js');

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}`);
	const guilds = client.guilds.cache.map(guild => guild.name);
	console.log(guilds);

});

client.on('voiceStateUpdate', function(oldVoiceState, newVoiceState) {
	console.log(`Voice state of ${oldVoiceState.member.user.username} has changed in the following ways:`);
	// console.log(diff(newVoiceState, oldVoiceState));
	var newUserChannel = newVoiceState.channelID;
	var oldUserChannel = oldVoiceState.channelID;

	if (newUserChannel && oldUserChannel == null) {
		console.log('i think is join');
		if (newVoiceState.channel.parent && newVoiceState.channel.parent.id == config.channelCategory) {
			oldVoiceState.member.roles.add([config.inVoiceRole]).catch(console.error);
		}
	}
	else if (newUserChannel && oldUserChannel && oldUserChannel != newUserChannel) {
		console.log('i think is move channels');
		if(newVoiceState.channel.parent && newVoiceState.channel.parent.id != config.channelCategory) {
			oldVoiceState.member.roles.remove([config.inVoiceRole]).catch(console.error);
			console.log('i think is move out of category?');
		}
		if(newVoiceState.channel.parent && newVoiceState.channel.parent.id == config.channelCategory) {
			oldVoiceState.member.roles.add([config.inVoiceRole]).catch(console.error);
			console.log('i think is move out of category?');
		}
	}
	else if (newUserChannel == null && oldUserChannel != null) {
		console.log('i think is leave');
		oldVoiceState.member.roles.remove([config.inVoiceRole]).catch(console.error);
	}
	else {
		console.log('i think is something else (mute/unmute/share, etc.)');
	}
	// Check if there are no other users connected to voice chats that sit underneath the category. If so, wipe the content of the #in-voice text channel
	var hasConnected = false;
	var channel = oldVoiceState.member.guild.channels.cache.get(config.inVoiceTextChannel);
	var category = channel.parent;
	var categoryVoiceChannels = category.children;

	for (var child in categoryVoiceChannels) {
		if(child.type === 'voice' && child.members.length > 0) {
			hasConnected = true;
			break;
		}
	}
	if (!hasConnected) {
		wipe(channel);
	}
});

function diff(a, b) {
	var r = {};
	_.each(a, function(v, k) {
		if(b[k] === v) return;
		r[k] = _.isObject(v)
			? _.diff(v, b[k])
			: v
		;
	});
	return r;
}
async function wipe(channel) {
	var msg_size = 100;
	while (msg_size == 100) {
		await channel.bulkDelete(100)
			.then(messages => msg_size = messages.size)
			.catch(console.error);
	}
}
client.login(config.botToken);