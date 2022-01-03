const Discord = require('discord.js');
const config = require('./config/config.js');
const date = require('date-and-time');
const fs = require('fs');
const mysql = require('mysql');
// const scheduler = require('node-schedule');

const client = new Discord.Client();
let sysLog = null;
let spotifyLog = null;
let db = null;

client.on('ready', () => {
	// setting up logging
	openLog();
	appendSysLog('------- Warming up -------');
	appendSysLog(`Logged in as ${client.user.tag}`);
	const guilds = client.guilds.cache.map(guild => guild.name);
	appendSysLog(guilds);
	appendSysLog('Connecting to sql...');

	db = mysql.createConnection({
		host: config.dbCredentials.host,
		user: config.dbCredentials.user,
		password: config.dbCredentials.password,
		database: config.dbCredentials.database,
		port: config.dbCredentials.port,
	});

	db.connect(function(err) {
		if (err) throw err;
		appendSysLog('Connected sql!');
		appendSysLog('------- Finished warmup -------');
	});
});

client.on('voiceStateUpdate', function(oldVoiceState, newVoiceState) {
	const newUserChannel = newVoiceState.channelID;
	const oldUserChannel = oldVoiceState.channelID;

	if (newUserChannel && oldUserChannel == null) {
		appendSysLog(`${oldVoiceState.member.user.username} has joined ${newVoiceState.channel.name}`);
		if (newVoiceState.channel.parent && newVoiceState.channel.parent.id === config.channelCategory) {
			oldVoiceState.member.roles.add([config.inVoiceRole]).catch(console.error);
		}
	}
	else if (newUserChannel && oldUserChannel && oldUserChannel !== newUserChannel) {
		appendSysLog(`${oldVoiceState.member.user.username} has moved from ${oldVoiceState.channel.name} to ${newVoiceState.channel.name}`);
		if(newVoiceState.channel.parent && newVoiceState.channel.parent.id !== config.channelCategory) {
			oldVoiceState.member.roles.remove([config.inVoiceRole]).catch(console.error);
			appendSysLog('-- not in category');
		}
		if(newVoiceState.channel.parent && newVoiceState.channel.parent.id === config.channelCategory) {
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

function persistReminders(reminders) {
	const query = `INSERT INTO ${config.dbCredentials.database}.${config.dbCredentials.table} (triggerDate, targetUser, guild, msgUrl, dm, msgSummary) VALUES ?`;
	db.query(query, [reminders], function(err, result) {
		if (err) throw err;
		console.log(`${result.affectedRows} reminder(s) inserted`);
	});
}

client.on('message', function(message) {
	if (message.content === '.wipe' && message.channel === config.inVoiceTextChannel) {
		wipe(client.channels.cache.get(config.inVoiceTextChannel));
		appendSysLog(`channel wiped by ${message.author.username} at ${message.createdAt}`);
		message.channel.send('Welcome to the In-Voice text channel. You may use the `.wipe` command to wipe the contents of this channel at any time. Further improvements to the bot (including auto-wiping on empty voice channels) will be added progressively. ');
		return;
	}
	if (message.content === '.wipe' && message.member.hasPermission('ADMINISTRATOR')) {
		wipe(message.channel).then(() => {
			appendSysLog(`channel ${message.channel.name} wiped by ${message.author.username} at ${message.createdAt}`);
		}).then(() => {
			return;
		});
	}
	if (message.content.startsWith('.remindme')) {
		const userDelta = getTimeFromMessage(message.content);

		// if its not a valid input, get out
		if (userDelta === null) {
			message.reply('not a valid remindme :/').catch(console.error);
			return;
		}

		// add the time period to the current date to get our reminder time
		const reminderDate = new Date(Date.now() + userDelta);
		const reminderRow = [[reminderDate, message.author.id, message.guild.id, message.url, 0, message.content.substring(0, 100)]];
		persistReminders(reminderRow);
		message.reply(reminderDate.toString()).catch(console.error);

	}
	// graceful shutdown - admin only
	if (message.content === '..shutdown' && message.member.hasPermission('ADMINISTRATOR')) {
		message.react('👋').then (() => {
			sysLog.end();
			spotifyLog.end();
			client.destroy();
			process.exit(0);
		});
	}
	if (message.channel == config.bopOfTheDayChannel) {
		tryParseSongIntoList(message).then(() => {
			message.react('✅');
		});
		return;
	}
});

async function wipe(channel) {
	let msg_size = 100;
	do {
		console.log(msg_size);
		const fetched = await channel.messages.fetch({ limit: 100 });
		const notPinned = fetched.filter(fetchedMsg => !fetchedMsg.pinned);
		await channel.bulkDelete(notPinned, true)
			.then(messages => msg_size = messages.size)
			.catch(console.error);
	} while (msg_size == 100);
}

async function tryParseSongIntoList(message) {
	const messageContent = message.content;
	// eslint-disable-next-line no-useless-escape
	const regex = '(https:\/\/open.spotify.com\/track\/[A-Za-z0-9]{22})';
	const found = messageContent.match(regex);
	const uniqueSongs = [... new Set(found)];
	if (uniqueSongs.length > 0) {
		uniqueSongs.forEach((element) => {
			appendSpotifyLog(element);
		});
	}
}

function appendSysLog(message, timestamp = date.format(new Date(), 'ddd DD MMM YYYY hh:mm:ss')) {
	sysLog.write(`${timestamp}: ${message}\n`);
	console.log(message);
}

async function appendSpotifyLog(song) {
	await spotifyLog.write(`${song}\n`);
}

function openLog() {
	sysLog = fs.createWriteStream(config.logFilePath, { flags: 'a' });
	spotifyLog = fs.createWriteStream(config.logFilePathSpotify, { flags: 'a' });
}

/**
	 Converts the user's message containing length of time information into a number of ms
	@param {String} content The remindme command message string
	@returns {Number} A number in milliseconds of how much time was supplied
 **/
function getTimeFromMessage(content) {
	const regex = /\b(?<num>\d+(.\d+)?) ?(?<length>(y(ears?)?)|(mon(th)?s?)|(w(eeks?)?)|(d(ays?)?)|(h(ours?)?)|(m(in(ute)?s?)?)|(s(ec(ond)?s?)?))\b/gm;
	if(!regex.test(content)) {
		return null;
	}
	// reset regex position
	regex.lastIndex = 0;

	// all possible accepted variations on time lengths
	const validTimes = {
		seconds: ['s', 'sec', 'secs', 'second', 'seconds'],
		minutes: ['m', 'min', 'mins', 'minute', 'minutes'],
		hours: ['h', 'hour', 'hours'],
		days: ['d', 'day', 'days'],
		years: ['y', 'year', 'years'],
	};

	let match = null;
	const timeObj = {};
	try{
		while(match = regex.exec(content)) {
			// find full version of time length string
			let length = null;
			for(const time in validTimes) {
				if(validTimes[time].includes(match.groups.length)) length = time;
			}

			// check if property is duplicate
			if(timeObj[length]) throw new Error(`cannot have multiple values for time length ${length}`);

			// add duration to length property
			timeObj[length] = parseFloat(match.groups.num);
		}
	}
	catch(err) {
		return null;
	}
	return convertToMs(timeObj);
}

// Yoinked from SleepBotExe (cheers)
/**
 * Converts an Object containing length of time information into a number of ms
 *
 * @param {Object} timeObj An Object containing information about the length of time to wait
 * @returns {Number} A number in milliseconds of how much time was supplied
 */
function convertToMs(timeObj) {
	let output = 0;

	if(timeObj.years) output += parseInt(timeObj.years * 1000 * 60 * 60 * 24 * 365);
	if(timeObj.months) output += parseInt(timeObj.months * 1000 * 60 * 60 * 24 * 31);
	if(timeObj.weeks) output += parseInt(timeObj.weeks * 1000 * 60 * 60 * 24 * 7);
	if(timeObj.days) output += parseInt(timeObj.days * 1000 * 60 * 60 * 24);
	if(timeObj.hours) output += parseInt(timeObj.hours * 1000 * 60 * 60);
	if(timeObj.minutes) output += parseInt(timeObj.minutes * 1000 * 60);
	if(timeObj.seconds) output += parseInt(timeObj.seconds * 1000);

	return output;
}

client.login(config.botToken);