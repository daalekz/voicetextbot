/* eslint-disable comma-dangle */
/* eslint-disable no-var */
const Discord = require('discord.js');
const _ = require('underscore');
const config = require('./config/config.js');
const date = require('date-and-time');
const fs = require('fs');
const client = new Discord.Client();
const PastebinAPI = require('pastebin-ts');
var log = null;

client.on('ready', () => {
	// setting up logging
	openLog();
	appendLine('------- Warming up -------');
	appendLine(`Logged in as ${client.user.tag}`);
	const guilds = client.guilds.cache.map(guild => guild.name);
	appendLine(guilds);
	appendLine('------- Finished warmup -------');
});

client.on('voiceStateUpdate', function(oldVoiceState, newVoiceState) {
	var newUserChannel = newVoiceState.channelID;
	var oldUserChannel = oldVoiceState.channelID;

	if (newUserChannel && oldUserChannel == null) {
		appendLine(`${oldVoiceState.member.user.username} has joined ${newVoiceState.channel.name}`);
		if (newVoiceState.channel.parent && newVoiceState.channel.parent.id == config.channelCategory) {
			oldVoiceState.member.roles.add([config.inVoiceRole]).catch(console.error);
		}
	}
	else if (newUserChannel && oldUserChannel && oldUserChannel != newUserChannel) {
		appendLine(`${oldVoiceState.member.user.username} has moved from ${oldVoiceState.channel.name} to ${newVoiceState.channel.name}`);
		if(newVoiceState.channel.parent && newVoiceState.channel.parent.id != config.channelCategory) {
			oldVoiceState.member.roles.remove([config.inVoiceRole]).catch(console.error);
			appendLine('-- not in category');
		}
		if(newVoiceState.channel.parent && newVoiceState.channel.parent.id == config.channelCategory) {
			oldVoiceState.member.roles.add([config.inVoiceRole]).catch(console.error);
		}
	}
	else if (newUserChannel == null && oldUserChannel != null) {
		appendLine(`${oldVoiceState.member.user.username} has left ${oldVoiceState.channel.name}`);
		oldVoiceState.member.roles.remove([config.inVoiceRole]).catch(console.error);
	}
	else {
		appendLine('i think is something else (mute/unmute/share, etc.)');
	}
});

client.on('message', function(message) {
	if (message.content === '.wipe' && message.channel == config.inVoiceTextChannel) {
		wipe(client.channels.cache.get(config.inVoiceTextChannel));
		appendLine(`channel wiped by ${message.author.username} at ${message.createdAt}`);
		message.channel.send('Welcome to the In-Voice text channel. You may use the `.wipe` command to wipe the contents of this channel at any time. Further improvements to the bot (including auto-wiping on empty voice channels) will be added progressively. ');
		return;
	}
	// graceful shutdown - admin only
	if (message.content === '.shutdown' && message.member.hasPermission('ADMINISTRATOR')) {
		log.end();
		client.destroy();
	}
	if (message.content === '.logs' && message.member.hasPermission('ADMINISTRATOR')) {
		log.end();
		// uploadLogs(message);
		openLog();
		appendLine(`Logs requested by ${message.member.user.username}`);
	}
});

async function wipe(channel) {
	var msg_size = 100;
	while (msg_size == 100) {
		await channel.bulkDelete(100)
			.then(messages => msg_size = messages.size)
			.catch(console.error);
	}
}

async function isInCategory(channel) {
	return (channel.parent.id == config.channelCategory)
}


function appendLine(message, timestamp = date.format(new Date(), 'ddd DD MMM YYYY hh:mm:ss')) {
	log.write(`${timestamp}: ${message}\n`);
	console.log(message);
}

function uploadLogs(message) {
	// 0=public, 1=unlisted, 2=private
	const privateValue = 2;
	const pastebin = new PastebinAPI({
		'api_dev_key' : config.pastebinAPIKey,
		'api_user_name' : config.pastebinUsername,
		'api_user_password' : config.pastebinPassword,
		'api_paste_private' : privateValue
	});
	pastebin.createPasteFromFile({
		'file': config.logFilePath,
		'title': `logs ${getdateTime()}`
	})
		.then((data) => {
			message.reply(`your logs are available here: ${data}`);
		})
		.catch((err) => {
			appendLine(`Error in pastebin upload: ${err}`);
		});
}
function openLog() {
	log = fs.createWriteStream(config.logFilePath, { flags: 'a' });
}
function getdateTime() {
	return date.format(new Date(), 'ddd DD MMM YYYY hh:mm:ss');
}
client.login(config.botToken);