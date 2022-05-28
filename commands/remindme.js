const errorhandler 		= require('../bin/errorhandler.js');
const embed 			= require('../bin/embed_template.js');
const schedule          = require('node-schedule');
//thank u sleepdotexe :)
module.exports = {
	name: 'remindme',
	description: `sets a reminder for a specified length of time. the bot will ping you once the time expires \n\ndefaults to 24 hours if no time value supplied.\n\n**valid lengths of time include:**\nsecond(s)\nminute(s)\nhour(s)\nday(s)\nweek(s)\nmonth(s)\nyear(s)\n\n**some examples:**\n5 hours\n5h\n3.5 days\n2 hours 45 min\n 3h 4m 25s\n original code by sleepdotexe`,
	usage: `[number] [length]`,
	aliases: ['remind', 'reminder', 'rm'],
	cooldown: 10,
	permissions: null,
    channels: null,

    /**
	 * Runs the command logic.
	 * 
	 * @param {Discord.Message} message The original message sent which triggered this command to be run
	 * @param {Array} args An array of arguments passed after the command by the user
	 * @param {String} prefix The bot's prefix which triggers commands (e.g. !)
	 * @returns {Boolean} True if command has executed correctly (applies command cooldown to the user), False if command has not executed correctly (cooldown should not be applied)
	 */
	execute(message,args,prefix){
        //default length of 24h
        const time = 8.64e7;
        //no args, default length
        if(args.length < 1){
            setUpReminder(time);
            return true;
        }
        const regex = /\b(?<num>\d+(.\d+)?) ?(?<length>(y(ears?)?)|(mon(th)?s?)|(w(eeks?)?)|(d(ays?)?)|(h(ours?)?)|(m(in(ute)?s?)?)|(s(ec(ond)?s?)?))\b/gm
        const str = args.join(' ');

        //test if contains valid match
        if(!regex.test(str)){
            const embedData = {
                color: '#b00c00',
                author: {
                    name: message.client.user.username,
                    avatar: message.client.user.avatarURL()
                },
                title: `that message had fewer numbers than my phone's contact list`,
                description: `whatever you just typed was simply not acceptable. **i could not determine a valid length of time from those inputs** (and i'm usually pretty good at doing that)\n\nplease provide your time in the format \`${prefix}remindme [number] [length]\`\n\ntype \`${prefix}help remindme\` for assistance`,
            };

            reply(embedData);
            return false;
        }

        //reset regex position
        regex.lastIndex = 0;

        //all possible accepted variations on time lengths
        const validTimes = {
            seconds: ['s', 'sec', 'secs', 'second', 'seconds'],
            minutes: ['m', 'min', 'mins', 'minute', 'minutes'],
            hours: ['h', 'hour', 'hours'],
            days: ['d', 'day', 'days'],
            weeks: ['w', 'week', 'weeks'],
            months: ['mon', 'month', 'months'],
            years: ['y', 'year', 'years']
        };

        let match = null;
        let timeObj = {};
        try{
            while(match = regex.exec(str)){
                //find full version of time length string
                let length = null;
                for(const time in validTimes){
                    if(validTimes[time].includes(match.groups.length)) length = time;
                }

                // check if property is duplicate
                if(timeObj[length]) throw new Error(`cannot have multiple values for time length ${length}`);

                //add duration to length property
                timeObj[length] = parseFloat(match.groups.num);
            }
        } catch(err){
            const embedData = {
                color: '#b00c00',
                author: {
                    name: message.client.user.username,
                    avatar: message.client.user.avatarURL()
                },
                title: `time, dr freeman, time...`,
                description: `i regret to inform you that you ${err.message}.\n\nplease provide only **one** value for each time duration in the format \`${prefix}remindme [number] [length]\`\n\ntype \`${prefix}help remindme\` for assistance`,
            };

            reply(embedData);
            return false;
        }

        setUpReminder(convertToMs(timeObj));
        return true;

        /**
		 * Sends the embed data to the embed handler to either send a new message or update an existing message.
		 * 
		 * @param {Object} embedData an Object containing the data to inlcude in the embed
		 * @returns {Promise<Discord.Message>} The new, updated, or error message sent by the client
		 */
        function reply(embedData){
            try{
                return embed.execute(message, embedData);
            }catch(error){
                return errorhandler.execute(message, error);
            } 
        }

        /**
         * Converts an Object containing length of time information into a number of ms
         * 
         * @param {Object} timeObj An Object containing information about the length of time to wait
         * @returns {Number} A number in milliseconds of how much time was supplied
         */
        function convertToMs(timeObj){
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

        /**
         * Sets up the sending of a reminder message.
         * 
         * @param {Number} ms the number of milliseconds to wait before sending the reminder
         * @returns A message object to update when the reminder is sent.
         */
        function setUpReminder(ms){
            const endTime = Intl.DateTimeFormat('en-AU',{
                weekday: 'long',
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZone: 'Australia/Sydney'
            }).format(new Date(Date.now() + ms));

            const embedData = {
                color: '#ff6700',
                author: {
                    name: message.client.user.username,
                    avatar: message.client.user.avatarURL()
                },
                title: `reminder set ⏳`,
                description: `your request for a reminder has been received. ${message.guild.emojis.cache.find(emoji => emoji.name === 'pausechamp')}\n\nyou will receive a notification in this channel on **${endTime}**`,
                fields: [
                    {
                        name: 'made a mistake?',
                        value: 'react to this message with ❌ to cancel the reminder'
                    }
                ]
            };

            //post initial message
            return reply(embedData).then(msg =>{
                //set up reminder job
                const date = new Date(Date.now() + ms); //end
                let j = schedule.scheduleJob(date, function(){
                    //post reminder
                    const remindEmbed = {
                        color: '#ff6700',
                        author: {
                            name: message.client.user.username,
                            avatar: message.client.user.avatarURL()
                        },
                        title: `ding dong reminder here`,
                        description: `<@${message.author.id}>, your reminder is served.\n\n[click here to jump to the original message](${message.url})`,
                        outside: `<@${message.author.id}>`,
                        image:{
                            url: "attachment://reminder.jpg"
                        },
                        attach: ['./media/reminder.jpg']
                    };
                    reply(remindEmbed);
                });

                //await reactions to cancel
                msg.react('❌')
                .then(() =>{
                    const filter = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;
                    const maxWait = ms < 2147483647 ? ms : 2147483647;
                    msg.awaitReactions({ filter, max: 1, time: maxWait, errors: ['time'] })
                    .then(()=>{
                        //cancel reminder
                        j.cancel();

                        const newEmbed = {
                            color: '#ff6700',
                            author: {
                                name: message.client.user.username,
                                avatar: message.client.user.avatarURL()
                            },
                            title: 'reminder cancelled! 🚮',
                            description: 'you will no longer be notified by this reminder.'
                        };
                        embed.execute(msg, newEmbed);
                        msg.reactions.removeAll();
                    })
                    .catch(() =>{
                        //message timed out
                        const newEmbed = {
                            color: '#ff6700',
                            author: {
                                name: message.client.user.username,
                                avatar: message.client.user.avatarURL()
                            },
                            title: `reminder finished!  ✅`,
                            description: `<@${message.author.id}> has been notified.`,
                        };
                        embed.execute(msg, newEmbed);
                        msg.reactions.removeAll();
                    });
                });
            });
        }
	}
};