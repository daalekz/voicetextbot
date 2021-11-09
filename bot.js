/* eslint-disable comma-dangle */
/* eslint-disable no-var */
const Discord = require('discord.js');
const config = require('./config/config.js');
const date = require('date-and-time');
const fs = require('fs');
const client = new Discord.Client();
var sysLog = null;
var spotifyLog = null;

client.on('ready', () => {
	// setting up logging
	openLog();
	appendSysLog('------- Warming up -------');
	appendSysLog(`Logged in as ${client.user.tag}`);
	const guilds = client.guilds.cache.map(guild => guild.name);
	appendSysLog(guilds);
	appendSysLog('------- Finished warmup -------');
});

client.on('voiceStateUpdate', function(oldVoiceState, newVoiceState) {
	var newUserChannel = newVoiceState.channelID;
	var oldUserChannel = oldVoiceState.channelID;

	if (newUserChannel && oldUserChannel == null) {
		appendSysLog(`${oldVoiceState.member.user.username} has joined ${newVoiceState.channel.name}`);
		if (newVoiceState.channel.parent && newVoiceState.channel.parent.id == config.channelCategory) {
			oldVoiceState.member.roles.add([config.inVoiceRole]).catch(console.error);
		}
	}
	else if (newUserChannel && oldUserChannel && oldUserChannel != newUserChannel) {
		appendSysLog(`${oldVoiceState.member.user.username} has moved from ${oldVoiceState.channel.name} to ${newVoiceState.channel.name}`);
		if(newVoiceState.channel.parent && newVoiceState.channel.parent.id != config.channelCategory) {
			oldVoiceState.member.roles.remove([config.inVoiceRole]).catch(console.error);
			appendSysLog('-- not in category');
		}
		if(newVoiceState.channel.parent && newVoiceState.channel.parent.id == config.channelCategory) {
			oldVoiceState.member.roles.add([config.inVoiceRole]).catch(console.error);
		}
	}
	else if (newUserChannel == null && oldUserChannel != null) {
		appendSysLog(`${oldVoiceState.member.user.username} has left ${oldVoiceState.channel.name}`);
		oldVoiceState.member.roles.remove([config.inVoiceRole]).catch(console.error);
	}
	else {
		appendSysLog(`${oldVoiceState.member.user.username} mute/unmute/share, etc.`);
	}
});

client.on('message', function(message) {
	if (message.content === '.wipe' && message.channel == config.inVoiceTextChannel) {
		wipe(client.channels.cache.get(config.inVoiceTextChannel));
		appendSysLog(`channel wiped by ${message.author.username} at ${message.createdAt}`);
		message.channel.send('Welcome to the In-Voice text channel. You may use the `.wipe` command to wipe the contents of this channel at any time. Further improvements to the bot (including auto-wiping on empty voice channels) will be added progressively. ');
		return;
	}
	// graceful shutdown - admin only
	if (message.content === '.shutdown' && message.member.hasPermission('ADMINISTRATOR')) {
		sysLog.end();
		spotifyLog.end();
		client.destroy();
		message.react('👋');
		return;
	}
	if (message.channel == config.bopOfTheDayChannel) {
		tryParseSongIntoList(message);
		return;
	}
});

async function wipe(channel) {
	var msg_size = 100;
	do {
		console.log(msg_size);
		var fetched = await channel.messages.fetch({ limit: 100 });
		var notPinned = fetched.filter(fetchedMsg => !fetchedMsg.pinned);
		await channel.bulkDelete(notPinned, true)
			.then(messages => msg_size = messages.size)
			.catch(console.error);
	} while (msg_size == 100);
}
async function yoink(channel) {
	var msg_size = 100;
	do {
		console.log(msg_size);
		var fetched = await channel.messages.fetch({ limit: 100 });
		var notPinned = fetched.filter(fetchedMsg => !fetchedMsg.pinned);
		await channel.bulkDelete(notPinned, true)
			.then(messages => msg_size = messages.size)
			.catch(console.error);
	} while (msg_size == 100);
}

async function tryParseSongIntoList(message) {
	var messageContent = message.content;
	// eslint-disable-next-line no-useless-escape
	const regex = '(https:\/\/open.spotify.com\/track\/[A-Za-z0-9]{22})';
	var found = messageContent.match(regex);
	const uniqueSongs = [... new Set(found)];
	if (uniqueSongs.length > 0) {
		uniqueSongs.forEach((element) => {
			appendSpotifyLog(element);
		});
		message.react('✅');
	}
}

function appendSysLog(message, timestamp = date.format(new Date(), 'ddd DD MMM YYYY hh:mm:ss')) {
	sysLog.write(`${timestamp}: ${message}\n`);
	console.log(message);
}

function appendSpotifyLog(song) {
	spotifyLog.write(`${song}\n`);
}

function openLog() {
	sysLog = fs.createWriteStream(config.logFilePath, { flags: 'a' });
	spotifyLog = fs.createWriteStream(config.logFilePathSpotify, { flags: 'a' });
}

client.login(config.botToken);