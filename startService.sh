#!/bin/bash
echo "Getting into position..."
cd /home/pi/voicetextbot
echo "Pulling latest master..."
if git pull ; then
	echo "Starting bot..."
	/usr/bin/node bot.js
else 
	echo "Something went wrong with git pull. Have you made changes locally?"
fi	
