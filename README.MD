# Voicetext bot

A bot for discord written in the discordJs library. 

This bot does one main thing, which is to give/take a role based off if a user is in a voice chat. There are several customisations built off of this for the use of my personal discord server.

The primary use-case of this bot is to give users access to a text channel only when they are in a voice call together, so they can share content with one another without users not in voice with them stickybeaking.

Limitations:
- this is a one-hosted-instance-per-guild setup at the moment, and I have no plans at present to modify this. Much of the functionality is highly specific to the setup of my guild. 


Configuration:
- config/environments/local.json 

Available Commands:
- admin only: `.shutdown`
- `.wipe` 
  - will delete all messages in the channel configured under 'inVoiceTextChannel' in config. Can only be called from that channel.
  - will skip pinned messages 

Future feature ideas:
- Friends-in-voice auto ping feature 
 configurable per-user 
Feature ideas (contd. -Nice to haves): 
- Improve configuration options 
  - refactor most user-facing messaging into config file
  - allow for explicit allow/block channel lists for various functions
- allow users to set up 1:1 role/channel links rather than 1:many as it is currently 
