const discord = require('discord.js')
const { Intents, CommandInteraction } = require('discord.js')
const { createAudioPlayer, createAudioResource , StreamType, demuxProbe, joinVoiceChannel, NoSubscriberBehavior, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection, PlayerSubscription } = require('@discordjs/voice')
const play = require('play-dl')
const search = require('yt-search')
const client = new discord.Client({ intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.DIRECT_MESSAGES] , partials : ['CHANNEL', 'MESSAGE']})
const token = 'XYZ' //Bot Token
const botID = 'ABC' //Box ID
const prefix = '-'
const SQLite = require("better-sqlite3");
const ytfps = require('ytfps');
const fs = require('fs');
const help = require('./help.js')
const queue = require('./queue.js')
const users = require('./users.js')
const favourites = require('./favourites.js')
const playedSongs = require('./songs.js')
const randomStuff = require('./randomStuff.js')
const playlist = require('./playlist.js')
const { getQueue } = require('./queue.js')
const { isFavourited } = require('./favourites.js')
const cocoID = '245271236630937601' //owner ID
let runningPlayQueue = false;
let guilds = {};


client.on('messageCreate', async message => {

    if(message.author.bot){
        return;
    }

    if(message.guild === null){
        return;
    }

    if(!(users.isRegistered(message.author.id, message.guild.id))){
        console.log("Not registered")
        users.registerUser(message.author.id, message.author.username, message.guild.id);
    }

    if(users.getUser(message.author.id, message.guild.id)){
        users.updateName(message.author.id, message.guild.id, message.author.username);
    }

    if(!message.content.startsWith(prefix)){
        return;
    }

    if(!(message.guild.id in guilds)){
        let newInstance = new BotInstance(message)
        guilds[message.guild.id] = { instance : newInstance }

        await guilds[message.guild.id].instance.setup(message);

        await getCommand(message);
    } else{
        await getCommand(message);
    }

})

class BotInstance{
    constructor(message){
        this.connection = null;
        this.status = "Idle";
        this.resource = null;
        this.defaultMessage = message;

        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });
        
        this.voicePlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });
    }

    async setup(message){
        this.player.on(AudioPlayerStatus.Idle, () => {
            console.log("TRIGGERING IDLE")
            this.status = "Idle";

            setTimeout(function(){ if(guilds[message.guild.id].instance.status === "Idle"){
                nextSong(message);
            }}, 2000)


            setTimeout(function() { checkIdleError(message); }, 10000);
        });
        
        this.player.on(AudioPlayerStatus.Playing, () => {
            console.log("NOW PLAYING")
            if(queue.getLength(message.guild.id) !== 0){
                this.status = "***Now Playing:***  " + queue.getFirstEntry(message.guild.id).Title;
            }
        });
        
        this.player.on(AudioPlayerStatus.Paused, () => {
            this.status = "Paused";
        });
    
        this.voicePlayer.on(AudioPlayerStatus.Idle, () => {
            this.connection.subscribe(this.player)
    
            setTimeout(function() { checkIdleError(message); }, 5000);
        });

        if(queue.getLength(message.guild.id) > 0){
            this.resource = await getResourceFromURL(queue.getFirstEntry(message.guild.id).URL);
        }
    }
}

async function getResourceFromURL(details){

    const stream = await play.stream(details);

    return createAudioResource(stream.stream, {
        inputType : stream.type, inlineVolume: true
    })
}

async function getCommand(message){
    if(users.getUser(message.author.id, message.guild.id).Revoked === true){
        return message.channel.send(`You have no rights ${message.author.username}!`);
    }

    if(message.content === '-queue'){
        if(queue.getLength(message.guild.id) === 0){
            return message.channel.send("The Queue is currently empty")
        }
        printQueue(message);
    }

    if(message.content.startsWith('-move ')){

        const position = parseInt(message.content.substring(6));

        if((position > playlist.getLength(message.author.id, message.guild.id)) || position <= 0){
            return message.channel.send("Invalid Index")
        }

        playlist.move(message, position);
    }

    if(message.content === '-playlist'){
        playlist.print(message);
    }

    if(message.content === '-count'){
        if(getSongCount(message) === 0){
            return message.channel.send(`There are no songs`)
        }

        if(getSongCount(message) === 1){
            return message.channel.send(`There is currently ${getSongCount(message)} song`)
        }

        if(getSongCount(message) > 1){
            return message.channel.send(`There are currently ${getSongCount(message)} songs`)
        }
    }

    if(message.content === '-favourite'){
        if(queue.getLength(message.guild.id) === 0){
            return message.channel.send("No song to favourite")
        }

        if(favourites.isFavourited(queue.getFirstEntry(message.guild.id))){
            return message.channel.send("You have already favourited this song!")
        }

        favourites.createFavouritesEntry(message.author.id, queue.getFirstEntry(message.guild.id));

        message.channel.send(`Favourited: ${queue.getFirstEntry(message.guild.id).Title}`)
    }

    if(message.content === '-favourites'){
        favourites.print(message);
    }

    if(message.content === '-pause'){
        if(!(isUserInVoice(message))){
            return message.channel.send("You must be connected to a Voice Channel to do that")
        }

        if(guilds[message.guild.id].instance.status.startsWith('***Now Playing')){
            guilds[message.guild.id].instance.player.pause();
            message.channel.send(guilds[message.guild.id].instance.status);
        }
    }

    if(message.content === '-unpause'){
        if(!(isUserInVoice(message))){
            return message.channel.send("You must be connected to a Voice Channel to do that")
        }

        if(guilds[message.guild.id].instance.status === "Paused"){
            guilds[message.guild.id].instance.player.unpause();
        } else if(guilds[message.guild.id].instance.status === 'Idle'){
            message.channel.send("There is nothing to play!")
        } else{
            message.channel.send("I'm not in a Voice Channel!");
        }
    }

    if(message.content.startsWith('-revoke ')){
        if(message.author.id !== '245271236630937601'){
            return message.channel.send("You do not have that right!");
        }

        let user = message.content.substring(8);

        if(!(users.isRegistered(user, message.guild.id))){
            return message.channel.send("Could not find user");
        }

        users.getUser(user, message.guild.id).Revoked = 'True';
        
        message.channel.send(`${users.getUser(user, message.guild.id).Name}, your Playlist privileges have been fucking revoked!`);

    }

    if(message.content.startsWith('-unrevoke ')){
        if(message.author.id !== '245271236630937601'){
            return message.channel.send("You do not have that right!");
        }

        let user = message.content.substring(10);

        if(!(users.isRegistered(user, message.guild.id))){
            return message.channel.send("Could not find user");
        }

        users.getUser(user, message.guild.id).Revoked = 'False';

        message.channel.send(`${users.getUser(user, message.guild.id).Name}, your Playlist privileges have been restored!`);

    }

    if(message.content.startsWith('-mute ')){
        bongoID = '416598439900741633'
        xanderID = '470658472963342336'
        admins = [cocoID, '326790113809924096', '280716898222604288', '184715745316438016', '409029674241622016', '257176908247072769', bongoID]

        if(admins.indexOf(message.author.id) <= -1){
            return message.channel.send("Missing Perms!");
        }

        let user = message.content.substring(6);
    
        if(message.author.id === bongoID && user !== xanderID){
            return message.channel.send("Missing Perms!");
        }

        if(!(users.isRegistered(user, message.guild.id))){
            return message.channel.send("Could not find user");
        }

        const userInfo = message.guild.members.cache.get(user)

        userInfo.voice.setMute(true);

        if(userInfo.voice?.channel){
            userInfo.voice.setMute(true);
        } else{
            return message.channel.send("User is not in a Voice Channel.")
        }
        
        message.channel.send(`${users.getUser(user, message.guild.id).Name} has been muted!`);
    }

    if(message.content.startsWith('-unmute ')){
        bongoID = '416598439900741633'
        xanderID = '470658472963342336'
        admins = [cocoID, '326790113809924096', '280716898222604288', '184715745316438016', '409029674241622016', '257176908247072769', bongoID]

        if(admins.indexOf(message.author.id) <= -1){
            return message.channel.send("Missing Perms!");
        }

        let user = message.content.substring(8);

        if(message.author.id === bongoID && user !== xanderID){
            return message.channel.send("Missing Perms!");
        }

        if(!(users.isRegistered(user, message.guild.id))){
            return message.channel.send("Could not find user");
        }

        const userInfo = message.guild.members.cache.get(user)

        if(userInfo.voice?.channel){
            userInfo.voice.setMute(false);
        } else{
            return message.channel.send("User is not in a Voice Channel.")
        }
        
        message.channel.send(`${users.getUser(user, message.guild.id).Name} has been unmuted!`);
    }

    if(message.content.startsWith('-disconnect ')){
        admins = [cocoID, '326790113809924096', '280716898222604288', '184715745316438016', '409029674241622016', '257176908247072769']
        if(admins.indexOf(message.author.id) <= -1){
            return message.channel.send("Missing Perms!");
        }

        let user = message.content.substring(12);

        if(!(users.isRegistered(user, message.guild.id))){
            return message.channel.send("Could not find user");
        }

        const userInfo = message.guild.members.cache.get(user)

        if(userInfo.voice?.channel){
            userInfo.voice.disconnect();
        } else{
            return message.channel.send("User is not in a Voice Channel.")
        }
        
        message.channel.send(`${users.getUser(user, message.guild.id).Name} has been disconnected!`);
    }

    if(message.content.startsWith('-silence ')){
        admins = [cocoID, '326790113809924096', '280716898222604288', '184715745316438016', '409029674241622016', '257176908247072769']
        if(admins.indexOf(message.author.id) <= -1){
            return message.channel.send("Missing Perms!");
        }

        let user = message.content.substring(9);

        if(!(users.isRegistered(user, message.guild.id))){
            return message.channel.send("Could not find user");
        }

        const userInfo = message.guild.members.cache.get(user)

        if(userInfo.voice?.channel){
            userInfo.voice.setMute(true);
            userInfo.voice.setDeaf(true);
        } else{
            return message.channel.send("User is not in a Voice Channel.")
        }
        
        message.channel.send(`${users.getUser(user, message.guild.id).Name} has been silenced!`);
    }

    if(message.content.startsWith('-unsilence ')){
        admins = [cocoID, '326790113809924096', '280716898222604288', '184715745316438016', '409029674241622016', '257176908247072769']
        if(admins.indexOf(message.author.id) <= -1){
            return message.channel.send("Missing Perms!");
        }

        let user = message.content.substring(11);

        if(!(users.isRegistered(user, message.guild.id))){
            return message.channel.send("Could not find user");
        }

        const userInfo = message.guild.members.cache.get(user)

        if(userInfo.voice?.channel){
            userInfo.voice.setMute(false);
            userInfo.voice.setDeaf(false);
        }
        
        message.channel.send(`${users.getUser(user, message.guild.id).Name} has been unsilenced!`);
    }

    if(((message.content.startsWith('-add p '))) || (message.content.startsWith('-add p s '))){
        let playlistURL = null;
        if(message.content.startsWith('-add p s ')){
            playlistURL = message.content.substring(10);
        } else{
            playlistURL = message.content.substring(8);
        }

        let added = 0;
        await ytfps(playlistURL).then(playlist => {
            for(i = 0; i < playlist.videos.length; i++){
                if((playlist.videos[i].milis_length/1000) > 600 || (playlist.videos[i].milis_length/1000) < 10){
                    continue;
                }
                if(i === 0){
                    console.log(playlist.videos[i]);
                }
                try{
                    getAndAddPlaylist(message, playlist.videos[i].title, (playlist.videos[i].milis_length/1000), playlist.videos[i].url, message.author.id, 0);
                    added += 1;
                } catch(error){
                    continue;
                }
            }

            if(added !== 0){
                message.channel.send(`Added ${added} songs to ${message.author.username}'s Playlist.`);
            }
        }).catch(err => {
            //Do nothing
        });

        if(added === 0){
                return message.channel.send("Couldn't add any songs from this playlist");
        }

        if(message.content.startsWith('-add p s ')){
            playlist.shuffle(message)
        }


        if(canAddSong(message.author.id, message.guild.id)){
            addToQueue(message, message.author.id)
        } 

        setTimeout(function() {
            if(shouldQueuePlay(guilds[message.guild.id].instance.defaultMessage)){
                playQueue(guilds[message.guild.id].instance.defaultMessage);
            }
        }, 4000)
    }

    if(message.content.startsWith('-remove p ')){

        const position = parseInt(message.content.substring(10));

        if((position > playlist.getLength(message.author.id, message.guild.id)) || position <= 0){
            return message.channel.send("Invalid Index")
        }

        playlist.removeEntry(message, position);
    }

    if(message.content.startsWith('-remove f ')){

        const position = parseInt(message.content.substring(10));

        if((position > favourites.getLength(message.author.id, message.guild.id)) || position <= 0){
            return message.channel.send("Invalid Index")
        }

        favourites.removeEntry(message, position);
    }

    if(message.content === ('-shuffle')){
        if(playlist.isEmpty(message.author.id, message.guild.id)){
            return message.channel.send("Your Playlist is empty!");
        }
        playlist.shuffle(message);
        message.channel.send("Your playlist has been shuffled.");
    }

    if(message.content === '-leave'){
        if(!(isUserWithBot(message.author.id, message.guild.id)) && message.author.id !== cocoID){
            return message.channel.send("You must be connected to the same Voice Channel to do that")
        }

        if(guilds[message.guild.id].instance.connection != null){
            guilds[message.guild.id].instance.player.pause();
            guilds[message.guild.id].instance.connection.destroy();
            guilds[message.guild.id].instance.connection = null;
        }
    }

    // if(message.content === '-loop'){
    //     if(users.getUser(message.author.id, message.guild.id).loopEnabled === 'True'){
    //         users.disableLoop(message.author.id, message.guild.id);
    //         message.channel.send(`Looping disabled for ${message.author.username}`);
    //     } else{
    //         users.enableLoop(message.author.id, message.guild.id)
    //         message.channel.send(`Looping enabled for ${message.author.username}`);
    //     }
    // }

    if(message.content.startsWith('-play ')){
        message.channel.send("***-add***")
    }

    if(message.content === '-play'){

        if(!(users.hasActivePlaylist(message.author.id, message.guild.id))){
            users.activatePlaylist(message.author.id, message.guild.id)
            message.channel.send("Your Playlist is now active.")
        } else{
            return message.channel.send("Your Playlist is already active.")
        }
        
        if(canAddSong(message.author.id, message.guild.id)){
            addToQueue(message, message.author.id)
        } 

        setTimeout(function() {
            if(shouldQueuePlay(guilds[message.guild.id].instance.defaultMessage)){
                playQueue(guilds[message.guild.id].instance.defaultMessage);
            }
        }, 4000)
    }

    if(message.content === '-stop'){
        if(users.hasActivePlaylist(message.author.id, message.guild.id)){
            users.deactivatePlaylist(message.author.id, message.guild.id)
            message.channel.send("Your Playlist has been deactivated.")
        } else{
            message.channel.send("Your Playlist is already inactive")
        }
    }

    if(message.content.startsWith('-stop ')){
        if(message.author.id === cocoID){

            let id = message.content.substring(6);

            if(users.hasActivePlaylist(id, message.guild.id)){
                users.deactivatePlaylist(id, message.guild.id)
                message.channel.send("Playlist has been deactivated.")
            } else{
                message.channel.send("Playlist is already inactive")
            }
        }
    }

    if(message.content === '-skip'){

        if(isQueueEmpty(message.guild.id)){
            return message.channel.send("The Queue is empty!");
        }

        if(message.author.id !== '245271236630937601'){
            if(message.author.id !== queue.getFirstEntry(message.guild.id).User){
                return message.channel.send(`Only ${users.getUser(queue.getFirstEntry(message.guild.id).User, message.guild.id).Name} can skip this song`)
            }
        }

        skipSong(message);
    }

    if(message.content === '-switch'){

        if(playlist.getLength(message.author.id, message.guild.id) === 0){
            return message.channel.send(`${message.author.username}, your Playlist is empty!`);
        }

        if((users.hasSongInQueue(message.author.id, message.guild.id))){
            if(queue.getFirstEntry(message.guild.id).User === message.author.id){
                return message.channel.send("Cannot switch a song that is currently playing!")
            }

            playlist.switchQueued(message);
        }
    }

    if(message.content === '-set'){
        guilds[message.guild.id].instance.defaultMessage = message;
        message.channel.send("Set default channel");
    }

    if(message.content === '-join'){
        if(isUserInVoice(message)){
            joinVoice(message);
        } else{
            message.channel.send("You must be in a Voice Channel to do that.");
        }
    }

    if(message.content.startsWith('-cube ')){
        randomStuff.cube(message);
    }

    if(message.content.startsWith('-clear ')){
        if(message.author.id === cocoID){
            let id = message.content.substring(7);

            playlist.clear(id, message.guild.id)
            message.channel.send(`Playlist has been cleared.`);
        }
    }

    if(message.content === '-clear'){
        if(users.isRegistered(message.author.id, message.guild.id)){
            playlist.clear(message.author.id, message.guild.id)
            message.channel.send(`${message.author.username}, your Playlist has been cleared!`);
        } else{
            users.registerUser(message.author.id, message.author.username, message.guild.id)
            message.channel.send(`${message.author.username}, your Playlist is empty!`);
        }
    }

    if(message.content === '-status'){
        message.channel.send(guilds[message.guild.id].instance.status);
    }

    if(message.content.startsWith('-add ')){

        let keyword = message.content.substring(5);
        
        search(keyword, async function(err, res){

            if(err) return console.log(err);

            let results = res.videos.slice(0, 10);

            try{
                if(results[0].url === null){
                    return message.channel.send("Error");
                }
            } catch (error){
                return message.channel.send("Error fetching video.");
            }

            await getAndAdd(message, results[0].url, message.author.id);

            if(canAddSong(message.author.id, message.guild.id)){
                addToQueue(message, message.author.id)
            } 

            setTimeout(function() {
                if(shouldQueuePlay(guilds[message.guild.id].instance.defaultMessage)){
                    playQueue(guilds[message.guild.id].instance.defaultMessage);
                }
            }, 4000)
        });
    
	}

    if(message.content === "-help"){
        help.printCommands(message);
    }

    if(message.content === '-test'){
       //SOMETHING
    }

    if(message.content === '-views'){

        let songList = playedSongs.getPlayedSongs(message.author.id);

        let songRanks = [];
        index = 1;

        if(songList.length > 10){
            limit = 10
        } else{
            limit = songList.length
        }

        for(i = 0; i < limit; i++){
            songRanks.push(`${index}. *${songList[i].Title}* - ***Views: ${songList[i].Count}***\n`)
            index++;
        }

        if(songRanks.length === 0){
            return
        }

        message.channel.send(`${songRanks.join('')}`);
    }

    if(message.content.startsWith('-purge ')){
        admins = [cocoID, '280716898222604288', '326790113809924096'];
        if(admins.indexOf(message.author.id) <= -1){
            return message.channel.send("Missing Perms!");
        }

        let amount = message.content.substring(7)
        amount = parseInt(amount);

        if(amount < 0){
            return message.channel.send('Invalid Number.')
        }

        if(amount <= 0){
            return message.channel.send('Invalid Number.')
        }

        if(amount > 10){
            return message.channel.send("Excessive Amount.")
        }

        message.channel.bulkDelete(amount+1);
    }

    if(message.content === '-bassboost'){
        if(queue.getLength(message.guild.id) <= 0){
            return;
        }

        if(message.author.id === queue.getFirstEntry(message.guild.id).User){
            guilds[message.guild.id].instance.resource.volume.setVolume(100);
            message.channel.send("Boosted");
        }
    }

    if(message.content === '-unbassboost'){
        if(queue.getLength(message.guild.id) <= 0){
            return;
        }

        if(message.author.id === queue.getFirstEntry(message.guild.id).User){
            guilds[message.guild.id].instance.resource.volume.setVolume(1);
            message.channel.send("Unboosted");
        }
    }
    
    if(message.content === "-fix"){
        if(queue.getLength(message.guild.id) === 0){
            return message.channel.send("Queue is empty!");
        }
        if(guilds[message.guild.id].instance.status === "Idle"){
            search(queue.getFirstEntry(message.guild.id).Title, async function(err, res){

                if(err) return console.log(err);
    
                let results = res.videos.slice(0, 10);
    
                try{
                    if(results[0].url === null){
                        return message.channel.send("Error");
                    }
                } catch (error){
                    return message.channel.send("Error fetching video.");
                }

                console.log("Fixed URL: " + results[0].url);

                try{
                    guilds[message.guild.id].instance.resource = await getResourceFromURL(results[0].url);

                    guilds[message.guild.id].instance.player.play(guilds[message.guild.id].instance.resource);
                } catch(error){
                    console.log(error);
                    message.channel.send("Critical Error. Skipping song.")
                    nextSong(message);
                }
            });
        }
    }
}

async function getAndAddPlaylist(message, title, duration, searchQuery){
    try{
        createPlaylistEntryQuietly(message, title, duration, searchQuery);
    } catch (error){
        console.log(error)
        return message.channel.send("Error while processing link, age restriced videos are currently not supported");
    }
}

async function getAndAdd(message, searchQuery, id){
    let yt_info;

    try{
        yt_info = await play.video_info(searchQuery)
    } catch (err){
        return;
    }

    let duration = yt_info.video_details.durationInSec;
    let title = yt_info.video_details.title;

    if(duration > 600){
        let mins = Math.floor(duration/60);
        let secs = duration%60;
        if(secs < 10){
            secs = '0' + secs;
        }
        return message.channel.send(`Songs longer than 10 minutes are a bit excessive for a shared Playlist. (${mins}:${secs})`)
    }

    try{
        createPlaylistEntry(message, title, duration, searchQuery);
    } catch (error){
        return message.channel.send("Error while processing link, age restriced videos are currently not supported");
    }
}

function isUserInVoice(message){
    return !!(message.member.voice?.channel);
}

function isUserDeafened(userID, guildID){
    const guild = client.guilds.cache.get(guildID)
    const userInfo = guild.members.cache.get(userID);

    return userInfo.voice.deaf;
}

function isQueueEmpty(guildID){
    return queue.getLength(guildID) === 0;
}

async function createPlaylistEntry(message, videoTitle, duration, url){
    playlist.createPlaylistEntry(message, videoTitle, duration, url);
    message.channel.send(`***Added to ${users.getUser(message.author.id, message.guild.id).Name}\'s Playlist:*** ${videoTitle} at Index ${playlist.getLength(message.author.id, message.guild.id)}`);
}

function createPlaylistEntryQuietly(message, videoTitle, duration, url){
    playlist.createPlaylistEntry(message, videoTitle, duration, url);
}

function isBotInVC(guildID){
    return guilds[guildID].instance.connection !== null;
}

function isUserWithBot(id, guildID){
    const guild = client.guilds.cache.get(guildID)
    const userInfo = guild.members.cache.get(id)
    const botInfo = guild.members.cache.get(botID)

    if(guilds[guildID].instance.connection === null){
        return;
    }

    try{
        if(userInfo.voice.channel.id === null || botInfo.voice.channel.id === null){
            return false;
        }
    } catch(err){
        return false;
    }

    return userInfo.voice.channel.id === botInfo.voice.channel.id;
}

function addToQueue(message, id){
    if(!(isBotInVC(message.guild.id))){
        message.channel.send("Not adding Queue")
        return;
    }

    playlistEntry = playlist.getFirstEntry(id, message.guild.id);
    queue.createQueueEntry(playlistEntry.User, playlistEntry.Title, playlistEntry.Duration, playlistEntry.URL, message.guild.id)
    message.channel.send(`***Added to Queue:*** ${playlistEntry.Title}`);
    playlist.deleteFirstEntry(id, message.guild.id);

    setTimeout(function() {
        if((queue.getLength(message.guild.id)) !== 0 && guilds[message.guild.id].instance.status === 'Idle'){
            playQueue(message);
        }
    }, 1000)
}

function checkIdleError(message){
    console.log("Checking Idle Error")
    if(queue.getLength(message.guild.id) === 0){
        console.log("No songs left in Queue");
        return;
    }

    if(guilds[message.guild.id].instance.status !== "Idle"){
        console.log("Bot is not Idle")
        return;
    }

    message.channel.send("Idle Error detected, retrying current song");

    search(queue.getFirstEntry(message.guild.id).Title, async function(err, res){

        if(err) return console.log(err);

        let results = res.videos.slice(0, 10);

        try{
            if(results[0].url === null){
                return message.channel.send("Error");
            }
        } catch (error){
            return message.channel.send("Error fetching video.");
        }


        console.log(results[0].url);

        guilds[message.guild.id].instance.resource = await getResourceFromURL(results[0].url)

        guilds[message.guild.id].instance.player.play(guilds[message.guild.id].instance.resource);
    });
}

async function playQueue(message){
    if(runningPlayQueue){
        return;
    }

    if((queue.getLength(message.guild.id) === 0) || !(isBotInVC(message.guild.id))){
        return;
    }

    if(guilds[message.guild.id].instance.status !== 'Idle'){
        return;
    }

    if(!(isUserWithBot(queue.getFirstEntry(message.guild.id).User, message.guild.id))){
        message.channel.send("User is not in VC, skipping song")
        skipSong(message);
        return;
    }
    if(isUserDeafened(queue.getFirstEntry(message.guild.id).User, message.guild.id)){
        message.channel.send("User is deafened, skipping song")
        skipSong(message);
        return;
    }
    try{
        runningPlayQueue = true;
        if(queue.getFirstEntry(message.guild.id).User === 'Some User'){
            guilds[message.guild.id].instance.resource = await getResourceFromURL('https://www.youtube.com/watch?v=j0lN0w5HVT8&t=1s&ab_channel=OblivionFallAfterDark')
        }else{
            guilds[message.guild.id].instance.resource = await getResourceFromURL(queue.getFirstEntry(message.guild.id).URL)
        }
        guilds[message.guild.id].instance.player.play(guilds[message.guild.id].instance.resource)
        message.channel.send("***Now Playing:***  " + queue.getFirstEntry(message.guild.id).Title)
    } catch(error){
        console.log(error)
        message.channel.send("Unable to play current song")
        skipSong(message)
    }

    runningPlayQueue = false;
}

function shiftQueue(message){

    let currentID = queue.getFirstEntry(message.guild.id).User
    let currentURL = queue.getFirstEntry(message.guild.id).URL

    //If user has looping enabled
    if(users.getUser(queue.getFirstEntry(message.guild.id).User, message.guild.id).loopEnabled === 'True'){
        message.channel.send("Looped Song");
        getAndAdd(message, currentURL, currentID);
    }

    queue.deleteFirstEntry(message.guild.id);

}

function canAddSong(userID, guildID){
    return !!(playlist.getLength(userID, guildID) > 0 && isUserWithBot(userID, guildID) && !(isUserDeafened(userID, guildID)) && !(users.hasSongInQueue(userID, guildID)) && users.hasActivePlaylist(userID, guildID));
}

function shouldQueuePlay(message){
    return !!((queue.getLength(message.guild.id) !== 0) && (guilds[message.guild.id].instance.status === 'Idle'));
}

function joinVoice(message){
    guilds[message.guild.id].instance.connection = joinVoiceChannel({
        channelId : message.member.voice.channel.id,
        guildId : message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
    })

    guilds[message.guild.id].instance.connection.subscribe(guilds[message.guild.id].instance.player)

    guilds[message.guild.id].instance.player.unpause();
}

function printQueue(message){
    totalSecondsPlayed = Math.floor(guilds[message.guild.id].instance.resource.playbackDuration/1000)
    totalSecondsLeft = queue.getFirstEntry(message.guild.id).Duration - totalSecondsPlayed
    if(totalSecondsLeft%60 < 10){
        secondsLeft = '0' + totalSecondsLeft % 60
    } else{
        secondsLeft = totalSecondsLeft % 60
    }

    minutesLeft = Math.floor(totalSecondsLeft/60)

    //Start played time

    minsPlayed = Math.floor(totalSecondsPlayed/60);
    secsPlayed = Math.floor(totalSecondsPlayed%60);;
    if(secsPlayed < 10){
        secsPlayed = '0' + secsPlayed;
    }

    timePlayed = minsPlayed + ':' + secsPlayed

    //End played time

    message.channel.send(`***Global Queue:***`)
    for(let i = 0; i < queue.getLength(message.guild.id); i++){
        seconds = queue.getQueue(message.guild.id)[i].Duration%60
        if(queue.getQueue(message.guild.id)[i].Duration%60 < 10){
            seconds = '0' + queue.getQueue(message.guild.id)[i].Duration%60
        }

        if(i === 0){
            message.channel.send((i+1) + `. ` + queue.getQueue(message.guild.id)[i].Title + ` - (Played: ${timePlayed}) - (Remaining: ${minutesLeft}:${secondsLeft}) - (${users.getUser(queue.getFirstEntry(message.guild.id).User, message.guild.id).Name})`);
        } else{
            message.channel.send((i+1) + `. ` + queue.getQueue(message.guild.id)[i].Title + ` - (${Math.floor(queue.getQueue(message.guild.id)[i].Duration/60)}:${seconds}) - (${users.getUser(queue.getQueue(message.guild.id)[i].User, message.guild.id).Name})`);
        }
    }
}

function skipSong(message){

    if(queue.getLength(message.guild.id) === 0){
        return message.channel.send("There are no songs to skip!");
    }

    message.channel.send(`***Skipped:*** ${queue.getFirstEntry(message.guild.id).Title}`);

    guilds[message.guild.id].instance.resource = createAudioResource('skip.mp3')
    guilds[message.guild.id].instance.player.play(guilds[message.guild.id].instance.resource);

}

function getSongCount(message){
    return (playlist.getTotalLength(message.guild.id) + queue.getLength(message.guild.id))
}

function nextSong(message){
    if(queue.getLength(message.guild.id) !== 0){
        let currentID = queue.getFirstEntry(message.guild.id).User;
        playedSongs.createPlayedSongEntry(queue.getFirstEntry(message.guild.id))
        shiftQueue(message);

        setTimeout(function() {
            if(canAddSong(currentID, message.guild.id)){
                addToQueue(message, currentID)
            } 
        }, 2000)

        setTimeout(function() {
            if(shouldQueuePlay(guilds[message.guild.id].instance.defaultMessage)){
                playQueue(guilds[message.guild.id].instance.defaultMessage);
            }
        }, 6000)
    }
}

client.on('ready', () => {
    console.log(`We have logged in as ${client.user.tag}!`)

    play.setToken({
        youtube : {
            cookie : "VISITOR_INFO1_LIVE=td1E2WM4y8A; CONSENT=YES+IE.en+20160214-16-0; LOGIN_INFO=AFmmF2swRgIhALV1i0iiWd9CLnEg5lLNSkEeF7ILCOWq1opMz16ID5AhAiEA05yAqXzjZJac3hg7sDnuFAMym61UClwGx1YgM4EsnIQ:QUQ3MjNmeUtvQmhKeDJsdUVJYVhsTmVCQ21xQUpXX056UnJSRm91STk5U1lESHh2YUFGeGlXcmtERjJnQUNrVl9JS0dsOHJVaWYyQ1o3c0ZVSXR2LXd5LWM2YU03TXpJOEJpT3owLUNCVm16cVNVX3JhbzRuNWZyc0VPY01FQlhKX0xTSVlKNE9rWFlQeUxjTml3TFkwcExiUDBtV3hOUWRlVHg0WFQ5RWFJUnJrQTZYT3llMnJz; PREF=f6=40000000&tz=Europe.Dublin&al=en&f4=4000000&f5=30000; HSID=AzS3iFucVA7NuVgGN; SSID=AVCxPEPMykqkIy6V1; APISID=VR_SPWEvEQN85e4K/AH_jQsCLGSQYRnQTj; SAPISID=5BQR0PI9UINSE8LP/AL7bqJkJjZqhD4Qrj; __Secure-1PAPISID=5BQR0PI9UINSE8LP/AL7bqJkJjZqhD4Qrj; __Secure-3PAPISID=5BQR0PI9UINSE8LP/AL7bqJkJjZqhD4Qrj; YSC=I4lS0pdHXms; wide=0; SID=EQg2YQLR0f0FCx0GbuqJbBZrmYM6uVc7aB9Nv5XZKMTWmsdfK7YJBY_SQJ3Svhc6sS_TNQ.; __Secure-1PSID=EQg2YQLR0f0FCx0GbuqJbBZrmYM6uVc7aB9Nv5XZKMTWmsdf8OO_lZ4fMiX-L3dL9iQBSQ.; __Secure-3PSID=EQg2YQLR0f0FCx0GbuqJbBZrmYM6uVc7aB9Nv5XZKMTWmsdfrROpH9X-LonkEBR6p2-qvA.; SIDCC=AJi4QfGhMQMHvkim2Xyt9Uvb3IJKDWlJu4QieQuk7rhaL9ZkLtmX-mgzGiMHJu1jlYbofUbih5E; __Secure-3PSIDCC=AJi4QfHoILtNKvAHolFVePckqmMVsPw1cDZGuzkT48pRNTJ3KivCxPsbDPB2f9GJj9Jmgye491g"
        }
    })
});

client.on('voiceStateUpdate', (oldState, newState) => {

    const guild = client.guilds.cache.get(newState.guild.id);
    const botInfo = guild.members.cache.get(botID);

    if(!(newState.guild.id in guilds )){
        return;
    }

    if(guilds[newState.guild.id].instance.connection === null){
        return;
    }

    if(!(botInfo.voice.channel)){
        return;
    }

    if(botInfo.voice.channel.members.size === 1){
        guilds[newState.guild.id].instance.connection.destroy();
        guilds[newState.guild.id].instance.connection = null;
    }

    botInfo.voice.channel.members.forEach((member) => {
        if(member.id === botID){
            return;
        }

        if(canAddSong(member.id, newState.guild.id)){
            addToQueue(guilds[newState.guild.id].instance.defaultMessage, member.id)
        }
    });

    setTimeout(function() {
        if(shouldQueuePlay(guilds[newState.guild.id].instance.defaultMessage)){
            playQueue(guilds[newState.guild.id].instance.defaultMessage);
        }
    }, 4000)

})

client.login(token);
