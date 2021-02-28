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
		oldVoiceState.member.roles.add([config.inVoiceRole]).catch(console.error);
	}
	else if (newUserChannel && oldUserChannel && oldUserChannel != newUserChannel) {
		console.log('i think is move channels');
	}
	else if (newUserChannel == null && oldUserChannel != null) {
		console.log('i think is leave');
		oldVoiceState.member.roles.remove([config.inVoiceRole]).catch(console.error);
	}
	else {
		console.log('i think is something else (mute/unmute/share, etc.)');
	}

	// Check if there are no other users connected to voice. If so, wipe the content of the #in-voice text channel
	var hasConnected = false;
	if (oldVoiceState.member.guild.members.cache.some(function(member) {
		if (member.voice.channelID) {
			return true;
		}
	})) {
		hasConnected = true;
	}
	if (!hasConnected) {
		var channel = oldVoiceState.member.guild.channels.cache.get(config.inVoiceTextChannel);
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