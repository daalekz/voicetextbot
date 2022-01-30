/* eslint-disable no-var */
const Discord = require('discord.js'),
	config = require('./config/config.js'),
	perms = config.permissions,
	glob = require('glob'),
	path = require('path'),
	fs = require('fs'),
	{ appendSysLog } = require('./utils.js'),
	client = new Discord.Client();

client.prefix = config.prefix;
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

glob.sync('./commands/*.js').forEach(function(file) {
	const command = require(path.resolve(file));
	client.commands.set(command.name, command);
});


client.on('ready', () => {
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
});

client.on('message', function(message) {
	if (message.channel == config.bopOfTheDayChannel) {
		tryParseSongIntoList(message);
		return;
	}
	if (message.channel == config.wordleChannel) {
		var result = tryParseWordle(message);
		if (result) {
			tryAddWordleEntry(result);
			message.react('✅');
		} else {
			message.reply('You\'ve already sent one today...');
		}
		return;
	}
	if(message.channel.type === 'DM') return;
	if(!message.content.startsWith(client.prefix) || message.author.bot) return;
	const args = message.content.slice(client.prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if(!command) return;
	if(command.channels && !command.channels.includes(message.channel.id)) return;

	const userPerms = [];
	const roles = message.member.roles.cache.map(r => r.id);
	for(const role in perms) {
		if(roles.some(r=> perms[role].includes(r))) {
			userPerms.push(role);
		}
	}
	if(!command.permissions || command.permissions.some(p=> userPerms.includes(p))) {
		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
		const cooldownlength = (command.cooldown || 2) * 1000;

		if(timestamps.has(message.author.id)) {
			const expiration = timestamps.get(message.author.id) + cooldownlength;
			if(now < expiration) {
				const timeLeft = (expiration - now) / 1000;
				return message.reply(`⌛ That command is on cooldown, Please wait ${timeLeft.toFixed(1)} seconds before trying again.`);
			}
		}
		timestamps.set(message.author.id, now);

		const cooldownTimeout = setTimeout(() => timestamps.delete(message.author.id), cooldownlength);

		// execute command
		try {
			// command returns true if successful, false if user error
			const commandSuccess = command.execute(message, args, client, userPerms);

			// clear user cooldown if command was unsuccessful
			if(typeof commandSuccess === 'boolean' && commandSuccess === false) {
				timestamps.delete(message.author.id);
				clearTimeout(cooldownTimeout);
			}
		}
		catch (err) {
			appendSysLog(err);
		}
	}
	else{
		message.reply('You don\'t have the permissions for that');
	}
});

async function tryParseWordle(message) {
	var messageContent = message.content;
	// eslint-disable-next-line no-useless-escape
	const regex = /^Wordle\s\d\d\d\s.\/\d/m;
	if (regex.test(message.content)) {
		const split = messageContent.split(' ', 3);
		const attempt = split[2].substring(0, 1);
		var wordleEntry = {
			timeStamp: Date.now(),
			compositeKey : split[1] + '_' + message.author.id,
			id : split[1],
			submitterId : message.author.id,
			attempt : attempt,
			isHardMode : split[2].substring(3, 4) == '*',
			success : attempt != 'X',
		};
		//todo better defensive coding because alex is an idiot --
		// ie reasonable no. guesses, confirm that it is actually today's wordle, etc. 
		return wordleEntry;
	}
	return null;
}

function tryAddWordleEntry(entry) {
// retrieve, deserialise, append, reserialise, persist
	var data = JSON.parse(fs.readFileSync('./wordle.json'));
	// data integrity checks --if someone's already submitted we're not going to let them do it again.

	const found = data.entries.some(el => el.compositeKey === entry.compositeKey);
	if (found) {
		return false;
	}
	data.entries.push(entry);
	var updatedData = JSON.stringify(data);
	fs.writeFileSync('./wordle.json', updatedData);
	return true;
}

//gets the score for a user (total capture period possible guesses - how many they took)
async function getWordleTotalGuesses(authorId) {
	var data = JSON.parse(fs.readFileSync('./wordle.json'));
	data.entries.filter(entry=>entry.authorId == authorId)
}
async function getNumDistinctWordles() {
	var data = JSON.parse(fs.readFileSync('./wordle.json'));
	const wordlesPossibleDuringCapturePeriod = data.hasMax(id) - data.hasMin(id);
	return wordlesPossibleDuringCapturePeriod;
}
function getNumPossibleAttempts(numWordle) {
	return numwordle * 6;
}
Array.prototype.hasMin = function(attrib) {
	return (this.length && this.reduce(function(prev, curr){ 
		return prev[attrib] < curr[attrib] ? prev : curr; 
	})) || null;
 }
 Array.prototype.hasMax = function(attrib) {
	return (this.length && this.reduce(function(prev, curr){ 
		return prev[attrib] > curr[attrib] ? prev : curr; 
	})) || null;
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

function appendSpotifyLog(song) {
	const spotifyLog = fs.createWriteStream(config.logFilePathSpotify, { flags: 'a' });
	spotifyLog.write(`${song}\n`);
	spotifyLog.end();
}

client.login(config.botToken);