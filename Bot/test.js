const discord = require('discord.js')
const { Intents } = require('discord.js')
const { createAudioPlayer, createAudioResource , StreamType, demuxProbe, joinVoiceChannel, NoSubscriberBehavior, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection, PlayerSubscription } = require('@discordjs/voice')
const play = require('play-dl')
const client = new discord.Client({ intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.DIRECT_MESSAGES] , partials : ['CHANNEL', 'MESSAGE']})
const token = 'NTMyOTc0NzQxMjk3MDM3MzMz.XDeBaA.JZ92WmGk0FmGbAMx3zNOxZwu8g4'
const prefix = '-'
let user_queue = []
let idle = true;
let currentUser = 0;
let connection = null;

const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
    }
});

let globalQ = [];
let globalTitle = []
let songCount = 0;

client.on('messageCreate', async message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    if(message.content.startsWith('-show')){
        showQueue(message);
    }

    if(message.content.startsWith('-pause')){
        player.pause();
    }

    if(message.content.startsWith('-unpause')){
        player.unpause();
    }

    if(message.content.startsWith('-leave')){
        if(connection != null){
            player.pause();
            connection.destroy();
        }
        connection = null;
    }

    if(message.content.startsWith('-join')){
        joinVoice(message);
    }

	if(message.content.startsWith('-play ')){
        
		if(!message.member.voice?.channel) return message.channel.send('You must be connected to a Voice Channel')

        const details = message.content.split('play ')[1].split(' ')[0];

        try{
            const stream = await play.stream(details);

            let yt_info = await play.video_info(details)
            let videoTitle = yt_info.video_details.title + " -------- (Added by " + message.author.username + ")";

            const resource = createAudioResource(stream.stream, {
                inputType : stream.type
            })

            checkAuthor(message, resource, videoTitle);

            if(connection === null){
                setup(message, resource, videoTitle);
            }
        } catch{
            message.channel.send('Keyword searches are not currently supported.')
        }
	}
})

function checkAuthor(message, resource, videoTitle){
    if(!user_queue.includes(message.author.id)){
        user_queue.push(message.author.id);
        globalQ.push([resource]);
        globalTitle.push([videoTitle]);
        songCount++;
    } else{
        for(j = 0; j < user_queue.length; j++){
            if(user_queue[j] === message.author.id){
                globalQ[j].push(resource);
                globalTitle[j].push(videoTitle);
                songCount++;
            }
        }
    }
}

function joinVoice(message){
    connection = joinVoiceChannel({
        channelId : message.member.voice.channel.id,
        guildId : message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
    })
    connection.subscribe(player)
    player.unpause();
}

function setup(message, resource, videoTitle){
    joinVoice(message);

    player.play(globalQ[currentUser][0]);

    player.on(AudioPlayerStatus.Idle, () => {
        globalQ[currentUser].shift();
        songCount--;
        globalTitle[currentUser].shift();
        if(songCount != 0){
            nextUser();
            player.play(globalQ[currentUser][0]);
        } else{
            idle = true;
            if(songCount === 0){
                connection.destroy();
            }
        }
    });

    player.on(AudioPlayerStatus.Playing, () => {
        idle = false;
    });
}

function nextUser(){

    if(currentUser < user_queue.length-1){
        currentUser++;
    }
    else{
        currentUser = 0;
    }

    if(globalQ[currentUser].length === 0){
        nextUser();
    }
}

function showQueue(message){
    let count = 0;
    if(songCount === 0) return;
        for(j = 0; j < 10; j++){
            for(i = currentUser; i < globalTitle.length + currentUser; i++){
                let index = i % globalTitle.length;
                if(globalTitle[index][j] != null){
                    message.channel.send(`${globalTitle[index][j]}`);
                    count++;
                    if(count === 10 || count === songCount){
                        return;
                    }
                }
            }
        }
}

client.on('ready', () => {
    console.log(`We have logged in as ${client.user.tag}!`)
})

client.login(token);
























// client.on('messageCreate', async message => {
//     if(!message.content.startsWith(prefix) || message.author.bot) return;

// 	if(message.content.startsWith('-play')){
// 		if(!message.member.voice?.channel) return message.channel.send('You must be connected to a Voice Channel')

//         if(!message.author.id in user_queue) user_queue.push(message.author.id);

//         if(idle === true){

//             const connection = joinVoiceChannel({
//                 channelId : message.member.voice.channel.id,
//                 guildId : message.guild.id,
//                 adapterCreator: message.guild.voiceAdapterCreator
//             })
            
//             const details = message.content.split('play ')[1].split(' ')[0]
//             const stream = await play.stream(details)

//             const resource = createAudioResource(stream.stream, {
//                 inputType : stream.type
//             })

//             const player = createAudioPlayer({
//                 behaviors: {
//                     noSubscriber: NoSubscriberBehavior.Play
//                 }
//             });

//             connection.subscribe(player)

//             queue.push(resource);
//             player.play(queue[0]);

//             player.on(AudioPlayerStatus.Idle, () => {
//                 queue.shift();
//                 console.log(queue.length)
//                 if(queue.length > 0){
//                     player.play(queue[0]);
//                 }
//                 idle = true;
//             });

//             player.on(AudioPlayerStatus.Playing, () => {
//                 idle = false;
//             });
//         }
//         else{
//             const details = message.content.split('play ')[1].split(' ')[0];
//             const stream = await play.stream(details);
//             const resource = createAudioResource(stream.stream, {
//                 inputType : stream.type
//             })
//             queue.push(resource);
//             console.log(queue.length)
//         }
// 	}
// })

// client.on('ready', () => {
//     console.log(`We have logged in as ${client.user.tag}!`)
// })

// client.login(token);