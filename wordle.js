const fs = require('fs');


exports.tryParseWordle = function tryParseWordle(message) {
	var messageContent = message.content;
	// eslint-disable-next-line no-useless-escape
	const regex = /^Wordle\s\d\d\d(\d)?\s[1-6X]\/\d/m;
	if (regex.test(message.content)) {
		const split = messageContent.split(' ', 3);
		const attempt = split[2].substring(0, 1);
		var wordleEntry = {
			timeStamp: Date.now(),
			compositeKey: split[1] + '_' + message.author.id,
			id: split[1],
			submitterId: message.author.id,
			attempt: attempt,
			isHardMode: split[2].substring(3, 4) == '*',
			success: attempt != 'X',
		};
		return validateWordleObj(wordleEntry) ? wordleEntry : null;
	}
	return null;
}

function validateWordleObj(entry) {
	// //is from the last 2 days of wordles
	// var validationDate = Date.now.days() - entry.id;
	// const wordleAbsoluteStartDate = Date.parse('19-6-2021');
	// if (validationDate - wordleAbsoluteStartDate <= 2) return true;
	return true;
}

exports.tryAddWordleEntry = function(entry) {
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
//further aspects to account for:
// streaks - get today then while decrement id has value && success, add to counter 
// outperforming the pack or better than the average. 
// hardmode = 5% bonus

async function getWordleTotalGuesses(authorId) {
	var data = JSON.parse(fs.readFileSync('./wordle.json'));
	data.entries.filter(entry => entry.authorId == authorId)
}
async function getNumDistinctWordles() {
	var data = JSON.parse(fs.readFileSync('./wordle.json'));
	const wordlesPossibleDuringCapturePeriod = data.hasMax(id) - data.hasMin(id);
	return wordlesPossibleDuringCapturePeriod;
}
function getNumPossibleAttempts(numWordle) {
	return numwordle * 6;
}
Array.prototype.hasMin = function (attrib) {
	return (this.length && this.reduce(function (prev, curr) {
		return prev[attrib] < curr[attrib] ? prev : curr;
	})) || null;
}
Array.prototype.hasMax = function (attrib) {
	return (this.length && this.reduce(function (prev, curr) {
		return prev[attrib] > curr[attrib] ? prev : curr;
	})) || null;
}