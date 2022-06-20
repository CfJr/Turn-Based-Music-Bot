const discord = require('discord.js')
const { Intents } = require('discord.js')
const { createAudioPlayer, createAudioResource , StreamType, demuxProbe, joinVoiceChannel, NoSubscriberBehavior, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection, PlayerSubscription } = require('@discordjs/voice')
const play = require('play-dl')
const search = require('yt-search')
const { publicEncrypt } = require('crypto')
const client = new discord.Client({ intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.DIRECT_MESSAGES] , partials : ['CHANNEL', 'MESSAGE']})
const token = 'NTMzMDI0OTQzNzYwMjExOTg5.XDewKQ.b3OoDrRwFqX7EoBCPPxb4YFufPI'
//const token = 'NTMyOTc0NzQxMjk3MDM3MzMz.XDeBaA.JZ92WmGk0FmGbAMx3zNOxZwu8g4' //Foxy
//const botID = '532974741297037333' //Foxy
const botID = '533024943760211989'
const prefix = '-'
const SQLite = require("better-sqlite3");
const ytfps = require('ytfps');
const txtomp3 = require("text-to-mp3");
const fs = require('fs');
const help = require('./help.js')
const queue = require('./queue.js')
const users = require('./users.js')
const randomStuff = require('./randomStuff.js')
const memer = require('random-jokes-api');
const playlist = require('./playlist.js')
const gacha = require('./gacha.js');
const sqlUserCurrency = new SQLite('./userCurrency.sqlite');
const sqlWeapons = new SQLite('./weapons.sqlite');
const sqlCharacters = new SQLite('./characters.sqlite');
const sqlUserItems = new SQLite('./userItems.sqlite');
const sqlGlobalWishes = new SQLite('./globalWishes.sqlite');
const sqlUserPityData = new SQLite('./userPityData.sqlite');
const cocoID = '245271236630937601'
let connection = null;
let status = "Idle";
let shutdown = false;
let resource = null;

txtomp3.attributes.tl ="en";



















































let player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
    }
});

let voicePlayer = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
    }
});

let firstRun = true;
let bonus = 25;

//STARTGACHA
//let threeStar = ["Amber Catalyst", "Black Tassel", "Bloodtainted Greatsword", "Cool Steel", "Dark Iron Sword", "Debate Club", "Ebony Bow", "Emerald Orb", "Ferrous Shadow", "Fillet Blade", "Halberd", "Harbinger of Dawn", "Magic Guide", "Messenger", "Otherwordly Story", "Quartz", "Raven Bow", "Recurve Bow", "Sharpshooter's Oath", "Skyrider Greatsword", "Skyrider Sword", "Slingshot", "Thrilling Tales of Dragon Slayers", "Traveler's Handy Sword", "Twin Nephrite", "White Iron Greatsword", "White Tassel"];
//let fourStar = ["The Catch", "Alley Hunter", "Amenoma Kageuchi", "Blackcliff Agate", "Blackcliff Longsword", "Blackcliff Pole", "Blackcliff Slasher", "Blackcliff Warbow", "Compound Bow", "Crescent Pike", "Deathmatch", "Dodoco Tales", "Dragon's Bane", "Dragonspine Spear", "Eye of Perception", "Favonius Codex", "Favonius Greatsword", "Favonius Lance", "Favonius Sword", "Favonius Warbow", "Festering Desire", "Frostbearer", "Hakushin Ring", "Hamayumi", "Iron Sting", "Katsuragikiri Nagamasu", "Kitain Cross Spear", "Lion's Roar", "Lithic Blade", "Lithic Spear", "Luxurious Sea-Lord", "Mappa Mare", "Mitternachts Waltz", "Predator", "Prototype Amber", "Prototype Archaic", "Prototype Crescent", "Prototype Rancour", "Prototype Starglitter", "Rainslasher", "Royal Bow", "Royal Greatsword", "Royal Grimoire", "Royal Longsword", "Royal Spear", "Rust", "Sacrificial Bow", "Sacrificial Fragments", "Sacrificial Greatsword", "Sacrificial Sword", "Serpent Spine", "Snow-Tombed Starsilver", "Solar Pearl", "Sword of Descension", "The Alley Flash", "The Bell", "The Black Sword", "The Flute", "The Stringless", "The Viridescent Hunt", "The Widsith", "Whiteblind", "Windblume Ode", "Wine and Song"];
//let fiveStar = ["Amos' Bow", "Aquila Favonia", "Elegy for the End", "Engulfing Lightning", "Everlasting Moonglow", "Freedom-Sword", "Lost Prayer to the Sacred Winds", "Memory of Dust", "Mistsplitter Reforged", "Primordial Jade Cutter", "Primordial Jade Winged-Spear", "Skyward Atlas", "Skyward Blade", "Skyward Harp", "Skyward Pride", "Skyward Spine", "Song of Broken Pines", "Staff of Homa", "Summit Shaper", "The Unforged", "Thundering Pulse", "Vortex Vanguisher", "Wolf's Gravestone"];

//let catalog = {3 : threeStar, 4 : fourStar, 5 : fiveStar};




// function getItemsByRarity(id, rarity){
//     let items = getUserItemsByRarity.all(id, rarity);

//     message.channel.send(`You currently have ${items.length} different ${rarity} Stars`);
// }
//ENDGACHA

client.on('messageCreate', async message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    if(message.guild === null){
        return;
    }

    if(firstRun === true){
        console.log("Setting Up")
        await setup(message);
    }

    if(!(users.isRegistered(message.author.id))){
        console.log("Not registered")
        users.registerUser(message.author.id);
    }

    checkBonus(message);

    getCommand(message);
})

function checkBonus(message){
    
    let userData = getUserCurrency.get(message.author.id);

    if (!userData) {
        userData = {
            User: message.author.id,
            Primogems: 1600,
            Stardust: 0,
            Starglitter: 0,
            GotBonus: 'No',
            PrimoBoxes: 0,
            FlipWins: 0,
            FlipLosses: 0,
            FlipGain: 0,
            FlipLoss: 0
        }

        setUserCurrency.run(userData)
    }

    userData = getUserCurrency.get(message.author.id);

    if(userData.GotBonus === "No"){
        userData.PrimoBoxes += bonus;
        userData.GotBonus = "Yes";
        setUserCurrency.run(userData)
        message.channel.send(`${message.author.username}, you have received a bonus of ${bonus} <:Primobox:910684550605197352>!`)
    }
}

async function isAgeRestricted(details){
    try{
        let yt_info = await play.video_info(details)
        return false
    } catch (error){
        return true
    }
}

async function getResourceFromURL(details){

    const stream = await play.stream(details);

    return createAudioResource(stream.stream, {
        inputType : stream.type, inlineVolume: true
    })
}

async function setup(message){
    if(queue.getLength() > 0){
        resource = await getResourceFromURL(queue.getFirstEntry().URL);
        playQueue(message);
    }
    player.on(AudioPlayerStatus.Idle, () => {
        status = "Idle";
        client.user.setActivity("Nothing", {type: 'LISTENING'});
    
        nextSong(message);

        setTimeout(function() { checkIdleError(message); }, 5000);
    });
    
    player.on(AudioPlayerStatus.Playing, () => {
        console.log("Setting status: " + queue.getFirstEntry().Title)
        status = "***Now Playing:***  " + queue.getFirstEntry().Title;
        client.user.setActivity(queue.getFirstEntry().Title, {type: 'LISTENING'});
    });
    
    player.on(AudioPlayerStatus.Paused, () => {
        status = "Paused";
    });

    voicePlayer.on(AudioPlayerStatus.Idle, () => {
        connection.subscribe(player)

        setTimeout(function() { checkIdleError(message); }, 5000);
    });

    firstRun = false;
}

async function getCommand(message){
    if(users.getUser(message.author.id).Revoked === true){
        return message.channel.send(`You have no rights ${message.author.username}!`);
    }

    if(message.content === '-queue'){
        if(queue.getLength() === 0){
            return message.channel.send("The Queue is currently empty")
        }
        printQueue(message);
    }

    if(message.content.startsWith('-move ')){

        const position = parseInt(message.content.substring(6));

        if((position > playlist.getLength(message.author.id)) || !(position > 0)){
            return message.channel.send("Invalid Index")
        }

        playlist.move(message, position);
    }

    if(message.content === '-playlist'){
        //playlist.deleteFirstEntry(message.author.id);
        playlist.print(message);
    }

    if(message.content === '-restart'){
        if(message.author.id !== '245271236630937601'){
            return;
        }

        //disable loops

        shutdown = true;
    }

    if(message.content === '-count'){
        if(getSongCount() === 0){
            return message.channel.send(`There are no songs`)
        }

        if(getSongCount() === 1){
            return message.channel.send(`There is currently ${getSongCount()} song`)
        }

        if(getSongCount() > 1){
            return message.channel.send(`There are currently ${getSongCount()} songs`)
        }
    }

    if(message.content === '-pun'){
        message.channel.send(memer.pun())
    }

    if(message.content === '-joke'){
        message.channel.send(memer.joke())
    }

    if(message.content === '-roast'){
        message.channel.send(memer.roast())
    }

    if(message.content === '-antijoke'){
        message.channel.send(memer.antijoke())
    }

    if(message.content === '-bunny'){
        message.channel.send({ files: ['./bunny.gif'] });
    }

    if(message.content === '-pause'){
        if(!(isUserInVoice(message))){
            return message.channel.send("You must be connected to a Voice Channel to do that")
        }

        if(status.startsWith('***Now Playing')){
            player.pause();
            message.channel.send(status);
        }
    }

    if(message.content === '-unpause'){
        if(!(isUserInVoice(message))){
            return message.channel.send("You must be connected to a Voice Channel to do that")
        }

        if(status === "Paused"){
            player.unpause();
        } else if(status === 'Idle'){
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

        if(!(users.isRegistered(user))){
            return message.channel.send("Could not find user");
        }

        users.getUser(user).Revoked = 'True';
        
        message.channel.send(`${client.users.cache.get(user).username}, your Playlist privileges have been fucking revoked!`);

    }

    if(message.content.startsWith('-unrevoke ')){
        if(message.author.id !== '245271236630937601'){
            return message.channel.send("You do not have that right!");
        }

        let user = message.content.substring(10);

        if(!(user in users)){
            return message.channel.send("Could not find user");
        }

        users.getUser(user).Revoked = 'False';

        message.channel.send(`${client.users.cache.get(user).username}, your Playlist privileges have been restored!`);

    }

    if(message.content === '-testRate'){
        let ones = 0;
        let twos = 0;
        for(i = 0; i < 10000; i++){
            var d = Math.random();
            if (d >= 0.5){
                ones += 1;
            }
            else {
                twos += 1;
            }
        }

        message.channel.send(`Wins: ${ones}`);
        message.channel.send(`Losses: ${twos}`);
    }

    if(message.content === '-rate'){
        let wins = gacha.getFlipWins(message.author.id)
        let losses = gacha.getFlipLosses(message.author.id)
        let winAmount = gacha.getFlipGains(message.author.id)
        let lossAmount = gacha.getFlipLoss(message.author.id)

        message.channel.send(`Wins: ${wins}\nLosses: ${losses}\n<:Primogem:910667252569878598> Won: ${winAmount}\n<:Primogem:910667252569878598> Lost: ${lossAmount}\nWinstreak: ${users.getUser(message.author.id).winStreak}`)
    }

    if(message.content === '-pot'){

        message.channel.send(`${getPrimogems('0')}`)
    }

    if(message.content.startsWith('-give ')){


        let details = message.content.substring(6)

        details = details.split(" ")

        if(details.length !== 2){
            return message.channel.send("Invalid format")
        }

        let userCurrency = getUserCurrency.get(details[0]);

        if (!userCurrency) {
            return message.channel.send("Unable to find given user")
        }

        let amount = details[1]
        amount = parseInt(amount);
        let primos = getPrimogems(message.author.id);

        if(amount < 0){
            return message.channel.send('Invalid amount of <:Primogem:910667252569878598>')
        }

        if(! (amount > 0)){
            return message.channel.send('Invalid amount')
        }

        if(amount > primos){
            return message.channel.send(`${message.author.username}, you do not have enough <:Primogem:910667252569878598>.`)
        }

        gacha.givePrimogems(details[0], amount);
        gacha.removePrimogems(message.author.id, amount);

        return message.channel.send(`${message.author.username}, you sent <@` + details[0] + `> ${amount} <:Primogem:910667252569878598>.`)
        
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

        if(message.content.startsWith('-play p s ')){
            playlist.shuffle(messageur)
        }

        if(!(users.hasSongInQueue(message.author.id)) && users.hasActivePlaylist(message.author.id)){
            addUsersNextSong(message, message.author.id);
        }
        if(status === "Idle"){
            playQueue(message);
            client.user.setActivity(queue.getFirstEntry().Title, {type: 'LISTENING'});
        }

        // if(connection != null){
        //     player.pause();
        //     connection.destroy();
        //     connection = null;
        // }

        // joinVoice(message)
    }

    if(message.content === '-view5'){

        let itemsTable = sqlUserItems.prepare("SELECT * FROM userItems WHERE User = ?");
        let weaponsTableItem = sqlWeapons.prepare("SELECT * FROM weapons WHERE Name = ?");
        let charactersTableItem = sqlCharacters.prepare("SELECT * FROM characters WHERE Name = ?");


        let items = itemsTable.all(message.author.id)
        let weapons = []
        let characters = []

        if(!items.length === 0){
            return;
        }

        for(i = 0; i < items.length; i++){
            let weapon = weaponsTableItem.get(items[i].Item);
            if(weapon){
                if(weapon.Rarity === '5'){
                    weapons.push(' ' + weapon.Name + ` (${items[i].Count})`);
                    //message.channel.send(`${weapon.Name}`);
                }
            } 
            else{
                let character = charactersTableItem.get(items[i].Item);
                if(character.Rarity === '5'){
                    characters.push(' ' + character.Name + ` (${items[i].Count})`);
                    //message.channel.send(`${character.Name}`);
                }
            }
        }
        message.channel.send(`${message.author.username}'s Weapons:\n${weapons}`);
        message.channel.send(`${message.author.username}'s Characters:\n${characters}`);
    }

    if(message.content === '-view4'){

        let itemsTable = sqlUserItems.prepare("SELECT * FROM userItems WHERE User = ?");
        let weaponsTableItem = sqlWeapons.prepare("SELECT * FROM weapons WHERE Name = ?");
        let charactersTableItem = sqlCharacters.prepare("SELECT * FROM characters WHERE Name = ?");


        let items = itemsTable.all(message.author.id)
        let weapons = []
        let characters = []

        if(!items.length === 0){
            return;
        }

        for(i = 0; i < items.length; i++){
            let weapon = weaponsTableItem.get(items[i].Item);
            if(weapon){
                if(weapon.Rarity === '4'){
                    weapons.push(' ' + weapon.Name + ` (${items[i].Count})`);
                    //message.channel.send(`${weapon.Name}`);
                }
            } 
            else{
                let character = charactersTableItem.get(items[i].Item);
                if(character.Rarity === '4'){
                    characters.push(' ' + character.Name + ` (${items[i].Count})`);
                    //message.channel.send(`${character.Name}`);
                }
            }
        }
        message.channel.send(`${message.author.username}'s Weapons:\n${weapons}`);
        message.channel.send(`${message.author.username}'s Characters:\n${characters}`);
    }

    if(message.content.startsWith('-remove ')){

        const position = parseInt(message.content.substring(7));

        if((position > playlist.getLength(message.author.id)) || !(position > 0)){
            return message.channel.send("Invalid Index")
        }

        playlist.removeEntry(message, position);
    }

    if(message.content === ('-shuffle')){
        if(playlist.isEmpty(message.author.id)){
            return message.channel.send("Your Playlist is empty!");
        }
        playlist.shuffle(message);
        message.channel.send("Your playlist has been shuffled.");
    }

    if(message.content === '-leave'){
        if(!(isUserInVoice(message))){
            return message.channel.send("You must be connected to a Voice Channel to do that")
        }

        if(connection != null){
            player.pause();
            connection.destroy();
            connection = null;
        }
    }

    if(message.content === '-loop'){
        if(shutdown === true){
            return message.channel.send("Restart required, waiting for current queue to finish.")
        }
        if(users.getUser(message.author.id).loopEnabled){
            users.disableLoop(message.author.id);
            message.channel.send(`Looping disabled for ${message.author.username}`);
        } else{
            users.enableLoop(message.author.id)
            message.channel.send(`Looping enabled for ${message.author.username}`);
        }
    }

    if(message.content.startsWith('-yeet ')){
        let id = message.content.substring(6);

        joinGivenVoice(id);
    }

    if(message.content.startsWith('-flip ')){
        gacha.flip(message);
    }

    if(message.content === '-announcement'){
        if(message.author.id !== '245271236630937601'){
            return;
        }

        message.channel.send("\`\`\`ANNOUNCING -flip\nGamble away your hard earned <:Primogem:910667252569878598> using this new command followed by the amount of Primos you want to gamble.\n50/50 chance of winning, doing so will double the amount gambled, losing returns nothing.\nFeed your addiction, you know you want to.\`\`\`")
    }

    if(message.content === '-play'){
        if(!(isUserInVoice(message))){
            return message.channel.send("You must be connected to a Voice Channel to do that")
        }

        if(playlist.isEmpty(message.author.id)){
            return message.channel.send("Your Playlist is empty.")
        }


        if(!(users.hasActivePlaylist(message.author.id))){
            users.activatePlaylist(message.author.id)
            message.channel.send("Your Playlist is now active.")
        } else{
            if(isUserWithBot(message.author.id, message.guild.id) && (users.hasSongInQueue(message.author.id))){
                return message.channel.send("Your Playlist is already active.")
            }
        }

        joinVoice(message);
        if(status === 'Paused'){
            player.unpause();
            return;
        }

        if(!(users.hasSongInQueue(message.author.id))){
            addUsersNextSong(message, message.author.id);
        }

        if(queue.getLength() > 0 && status === 'Idle'){
            playQueue(message);
        }
    }

    if(message.content === '-stop'){
        if(users.hasActivePlaylist(message.author.id)){
            users.deactivatePlaylist(message.author.id)
            message.channel.send("Your Playlist has been deactivated.")
        }
    }

    // if(message.content.startsWith('-say ')){
    //     //randomStuff.say(message);
    //     owners = ['245271236630937601', '257176908247072769', '326790113809924096', '280716898222604288', '416598439900741633']

    //     if(!(owners.indexOf(message.author.id) > -1)){
    //         return
    //     }

    //     if(!(isUserInVoice(message))){
    //         return;
    //     }

    //     let words = message.content.substring(5);
    //     txtomp3.getMp3(words, function(err, binaryStream){
    //         if(err){
    //           console.log(err);
    //           return;
    //         }
    //         const file = fs.createWriteStream("FileName.mp3"); // write it down the file
    //         file.write(binaryStream);
    //         file.end();
    //         joinVoice(message);
    //         connection.subscribe(voicePlayer)
    //         const voiceResource = createAudioResource('FileName.mp3')
    //         voicePlayer.play(voiceResource)
    //         //connection.subscribe(player)
    //       });
    // }

    if(message.content === '-skip'){

        if(isQueueEmpty()){
            return message.channel.send("The Queue is empty!");
        }

        if(queue.getLength() === 1 && ((playlist.getLength(message.author.id) === 0) || !(users.hasActivePlaylist(message.author.id)) || !(isUserWithBot(message.author.id, message.guild.id)))){
            return message.channel.send("There are no songs to skip to!");
        }

        if(message.author.id !== '245271236630937601'){
            if(message.author.id !== queue.getFirstEntry().User){
                return message.channel.send(`Only ${client.users.cache.get(message.author.id).username} can skip this song`)
            }
        }

        skipSong(message);
    }

    if(message.content === '-switch'){

        if(playlist.getLength(message.author.id) === 0){
            return message.channel.send(`${message.author.username}, your Playlist is empty!`);
        }

        if((users.getUser(message.author.id).hasSongInQueue)){
            if(queue.getFirstEntry().User === message.author.id){
                return message.channel.send("Cannot switch a song that is currently playing!")
            }

            playlist.switchQueued(message);
        }
    }

    if(message.content === '-join'){
        if(isUserInVoice(message)){
            joinVoice(message);
        }
    }

    if(message.content.startsWith('-cube ')){
        randomStuff.cube(message);
    }

    if(message.content.startsWith('-clear ')){
        if(message.author.id === cocoID){
            let id = message.content.substring(7);

            playlist.clear(id)
            message.channel.send(`Playlist has been cleared.`);
        }
    }

    if(message.content === '-clear'){
        if(users.isRegistered(message.author.id)){
            playlist.clear(message.author.id)
            message.channel.send(`${message.author.username}, your Playlist has been cleared!`);
        } else{
            users.registerUser(message.author.id)
            message.channel.send(`${message.author.username}, your Playlist is empty!`);
        }
    }

    if(message.content === '-status'){
        message.channel.send(status);
    }

    if(message.content === '-primoboxes'){
        message.channel.send(`${message.author.username}, you have ${gacha.getPrimoBoxes(message.author.id)} <:Primobox:910684550605197352>`)
    }

    if(message.content.startsWith('-blackjack ')){
        gacha.blackjack(message);
    }

    if(message.content === '-hit'){
        gacha.hit(message);
    }

    if(message.content === '-stand'){
        gacha.stand(message);
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

            if(await isAgeRestricted(results[0].url)){
                return message.channel.send("Video is age restricted.");
            }

            getAndAdd(message, results[0].url, message.author.id);
        });
    
	}

    if(message.content === "-wish"){

        let primos = gacha.getPrimogems(message.author.id);
        if(primos < 160){
            return message.channel.send(`${message.author.username}, you need ${160 - primos} more <:Primogem:910667252569878598> to wish`)
        }

        let pull = gacha.wish(message);

        message.channel.send(pull);
    }

    if(message.content === "-pity"){
        let pity4 = gacha.getPity4(message.author.id);
        let pity5 = gacha.getPity5(message.author.id);

        message.channel.send(`${message.author.username}, your 4-Star pity is ${pity4}`);
        message.channel.send(`${message.author.username}, your 5-Star pity is ${pity5}`);
        
    }

    if(message.content === "-wish10"){

        wishes = []

        let primos = gacha.getPrimogems(message.author.id);
        if(primos < 1600){
            return message.channel.send(`${message.author.username}, you need ${1600 - primos} more <:Primogem:910667252569878598> to wish`)
        }

        for(let i = 0; i < 10; i++){
            wishes.push((i+1) + '. ' + gacha.wish(message) + '\n')
        }

        message.channel.send(`${wishes.join('')}`);
    }

    if(message.content === "-primos"){
        let primos = gacha.getPrimogems(message.author.id);

        return message.channel.send(`${message.author.username}, you currently have ${primos} <:Primogem:910667252569878598>!`);
        
    }
    
    if(message.content === "-help"){
        help.printCommands(message);
    }

    if(message.content === '-test'){
        // let dateTime = new Date();
        // console.log(dateTime);

        // if(users.hasActivePlaylist(message.author.id)){
        //     message.channel.send("Active");
        // } else{
        //     message.channel.send("Inactive");
        // }

        //console.log(resource)
        //console.log(resource.encoder['_options'].rate)
        //message.channel.send(`${resource.encoder['_buffer'].toString()}`)
        //resource.encoder['_readableState'].length += 10
        // users.test(resource);
        //resource.edges[1].cost = 100

    }

    if(message.content === '-bassboost'){
        if(queue.getLength() <= 0){
            return;
        }

        if(message.author.id === queue.getFirstEntry().User){
            resource.volume.setVolume(100);
            message.channel.send("Boosted");
        }
    }

    if(message.content === '-unbassboost'){
        if(queue.getLength() <= 0){
            return;
        }

        if(message.author.id === queue.getFirstEntry().User){
            resource.volume.setVolume(1);
            message.channel.send("Unboosted");
        }
    }

    if(message.content === "-test2"){

        const guild = client.guilds.cache.get('715977983193514028')
        const userInfo = guild.members.cache.get(cocoID)
        const botInfo = guild.members.cache.get(botID)

        console.log(userInfo);

        try{
            if(userInfo.voice.channel.id === null || botInfo.voice.channel.id === null){
                return false;
            }
        } catch(err){
            return false;
        }

        if(userInfo.voice.channel.id === botInfo.voice.channel.id){
            message.channel.send(`True, ${userInfo.voice.channel.id}, ${botInfo.voice.channel.id}`);
        } else{
            message.channel.send("False");
        }
    }

    if(message.content === '-open'){
        if(gacha.getPrimoBoxes(message.author.id) === 0){
            return message.channel.send(`${message.author.username}, you have 0 <:Primobox:910684550605197352>!`)
        }

        gacha.openPrimoBox(message)
    }
    
    if(message.content === "-fix"){
        if(queue.getLength() === 0){
            return message.channel.send("Queue is empty!");
        }
        if(status === "Idle"){
            search(queue.getFirstEntry().Title, async function(err, res){

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
                    resource = await getResourceFromURL(results[0].url);

                    player.play(resource);
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

    if(!(users.hasSongInQueue(message.author.id)) && users.hasActivePlaylist(message.author.id)){
        addUsersNextSong(message, message.author.id);
    }
}

async function createPlaylistEntry(message, videoTitle, duration, url){
    playlist.createPlaylistEntry(message, videoTitle, duration, url);
    //message.channel.send(`***Added to ${users[id].name}\'s Playlist:*** ${videoTitle} *- (Index: ${users[id].playlist.length})*`);
    message.channel.send(`***Added to ${client.users.cache.get(message.author.id).username}\'s Playlist:*** ${videoTitle}`);
}

function createPlaylistEntryQuietly(message, videoTitle, duration, url){
    playlist.createPlaylistEntry(message, videoTitle, duration, url);
}

function isUserWithBot(id, guildID){
    console.log("isUserWithBot ID: " + id)
    console.log("isUserWithBot guildID: " + guildID);
    const guild = client.guilds.cache.get(guildID)
    const userInfo = guild.members.cache.get(id)
    const botInfo = guild.members.cache.get(botID)

    try{
        if(userInfo.voice.channel.id === null || botInfo.voice.channel.id === null){
            return false;
        }
    } catch(err){
        return false;
    }

    if(userInfo.voice.channel.id === botInfo.voice.channel.id){
        return true;
    } else{
        return false;
    }
}

function addToQueue(message, id){
    console.log("Adding to queue");
    playlistEntry = playlist.getFirstEntry(id);
    message.channel.send(`***Added to Queue:*** ${playlistEntry.Title}`);
    queue.createQueueEntry(playlistEntry.User, playlistEntry.Title, playlistEntry.Duration, playlistEntry.URL, message.guild.id)
    playlist.deleteFirstEntry(id);
}

function checkIdleError(message){
    console.log("Checking Idle Error")
    if(queue.getLength() === 0){
        console.log("No songs left in Queue");
        return;
    }

    if(status !== "Idle"){
        console.log("Bot is not Idle")
        return;
    }

    message.channel.send("Idle Error detected, retrying current song");

    search(queue.getFirstEntry().Title, async function(err, res){

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

        resource = await getResourceFromURL(results[0].url)

        player.play(resource);
    });
}

async function playQueue(message){
    try{
        resource = await getResourceFromURL(queue.getFirstEntry().URL)
        player.play(resource);
        message.channel.send("***Now Playing:***  " + queue.getFirstEntry().Title)
        .then(function (message) {
            message.react("<a:qiqi_fallen:911076827357921351>")
            message.react("<a:childe_growe:911081875513176074>")
            message.react("<a:dains_dance:911079447854198835>")
            message.react("<a:huwowe:911081039814885407>")
            message.react("<a:klee_hype:911077841779703848>")
            playingID = message.id
           // message.channel.send(`${playingID}`)
          //   message.pin()
          //   message.delete()
          }).catch(function() {
            //Something
           });
    } catch(error){
        console.log(error)
        message.channel.send("Unable to play current song")
        skipSong(message)
    }
}

function shiftQueue(message){

    if(resource !== null){

        //Only give primos if the video length >= 2:30
        gacha.givePrimogems(queue.getFirstEntry().User, Math.floor(resource.playbackDuration/1000));

        if(Math.floor(resource.playbackDuration/1000) >= 150){
            let chance = Math.random()
            if(chance < 0.2){
                gacha.givePrimoBoxes(queue.getFirstEntry().User, 1)
                message.channel.send(`${client.users.cache.get(queue.getFirstEntry().User).username}, you just received a <:Primobox:910684550605197352>!`)
            }
        }
    }

    //If user has looping enabled
    if(users.getUser(queue.getFirstEntry().User).loopEnabled === 'True'){
        message.channel.send("Looped Song");
        getAndAdd(message, queue.getFirstEntry().URL, queue.getFirstEntry().User);
    }

    // if(playlist.getLength(queue.getFirstEntry().User) === 0){
    //     users.deactivatePlaylist(queue.getFirstEntry().User);
    // }

    queue.deleteFirstEntry();

}

function addUsersNextSong(message, id){
    if(playlist.getLength(id) > 0 && isUserWithBot(id, message.guild.id)){
        addToQueue(message, id);
    }
    else if(!(isUserWithBot(id, message.guild.id))){
        users.deactivatePlaylist(id);
    } 
}

function joinVoice(message){
    connection = joinVoiceChannel({
        channelId : message.member.voice.channel.id,
        guildId : message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
    })

    connection.subscribe(player)
}

function joinGivenVoice(voiceChannel){
    guild = client.guilds.cache.get('715977983193514028')
    connection = joinVoiceChannel({
        channelId : voiceChannel,
        guildId : '715977983193514028',
        adapterCreator: guild.voiceAdapterCreator
    })

    connection.subscribe(player)
}

function printQueue(message){
    totalSecondsPlayed = Math.floor(resource.playbackDuration/1000)
    totalSecondsLeft = queue.getFirstEntry().Duration - totalSecondsPlayed
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
    for(let i = 0; i < queue.getLength(); i++){
        seconds = queue.getQueue()[i].Duration%60
        if(queue.getQueue()[i].Duration%60 < 10){
            seconds = '0' + queue.getQueue()[i].Duration%60
        }

        if(i === 0){
            //message.channel.send((i+1) + `. ` + queue[i].title + ` - (Played: ${timePlayed}) - (Remaining: ${minutesLeft}:${secondsLeft}) - (${users[queue[i].id].name})`);
            message.channel.send((i+1) + `. ` + queue.getQueue()[i].Title + ` - (Played: ${timePlayed}) - (Remaining: ${minutesLeft}:${secondsLeft}) - (${client.users.cache.get(queue.getFirstEntry().User).username})`);
        } else{
            //message.channel.send((i+1) + `. ` + queue[i].title + ` - (${Math.floor(queue[i].duration/60)}:${seconds}) - (${users[queue[i].id].name})`);
            message.channel.send((i+1) + `. ` + queue.getQueue()[i].Title + ` - (${Math.floor(queue.getQueue()[i].Duration/60)}:${seconds}) - (${client.users.cache.get(queue.getQueue()[i].User).username})`);
        }
    }
}

function skipSong(message){

    if(queue.getLength() === 0){
        return message.channel.send("There are no songs to skip!");
    }

    message.channel.send(`***Skipped:*** ${queue.getFirstEntry().Title}`);

    nextSong(message)

}

function getSongCount(){
    return (playlist.getTotalLength() + queue.getLength())
}

function nextSong(message){
    if(queue.getLength() !== 0){
        let currentID = queue.getFirstEntry().User;
        shiftQueue(message);

        if(users.hasActivePlaylist(currentID) && !(users.hasSongInQueue(currentID))){
            addUsersNextSong(message, currentID);
        }
    }
    
    // setTimeout(function() { if(queue.getLength() > 0){ playQueue(message);}}, 2000);
    message.channel.send("Checking for Top Song");
    if(queue.getLength() > 0){
        message.channel.send("Playing Top Song");
        playQueue(message);
    }
}

client.on('ready', () => {
    console.log(`We have logged in as ${client.user.tag}!`)
    client.user.setActivity('Nothing', {type: 'LISTENING'});

    // And then we have two prepared statements to get and set the score data.
    getUserCurrency = sqlUserCurrency.prepare("SELECT * FROM userCurrency WHERE user = ?");
    setUserCurrency = sqlUserCurrency.prepare("INSERT OR REPLACE INTO userCurrency (User, Primogems, Stardust, Starglitter, GotBonus, PrimoBoxes, FlipWins, FlipLosses, FlipGains, FlipLoss) VALUES (@User, @Primogems, @Stardust, @Starglitter, @GotBonus, @PrimoBoxes, @FlipWins, @FlipLosses, @FlipGains, @FlipLoss);");
    getWeapons = sqlWeapons.prepare("SELECT * FROM weapons WHERE Rarity = ? AND Availability = ?;");
    getCharacters = sqlCharacters.prepare("SELECT * FROM characters WHERE Rarity = ? AND Availability = ?;");
    getWeapon = sqlWeapons.prepare("SELECT * FROM weapons WHERE Name = ?;");
    getCharacter = sqlCharacters.prepare("SELECT * FROM characters WHERE Name = ?;");
    addUserItem = sqlUserItems.prepare("INSERT OR REPLACE INTO userItems (ID, User, Item, Count) VALUES (@ID, @User, @Item, @Count);");
    getUserItem = sqlUserItems.prepare("SELECT * FROM userItems WHERE User = ? AND Item = ?");
    //getUserItemsByRarity = sqlUserItems.prepare("SELECT * FROM userItems WHERE User = ? AND Rarity = ?");
    addGlobalWish = sqlGlobalWishes.prepare("INSERT INTO globalWishes (User, Item) VALUES (@User, @Item);");
    getUserPityData = sqlUserPityData.prepare("SELECT * FROM userPityData WHERE user = ?");
    setUserPityData = sqlUserPityData.prepare("INSERT OR REPLACE INTO userPityData (User, FOURSTARPITY, FOURSTARTYPE, FIVESTARPITY, FIVESTARTYPE) VALUES (@User, @FOURSTARPITY, @FOURSTARTYPE, @FIVESTARPITY, @FIVESTARTYPE);");
    console.log("Done")
});

client.login(token);

//TO DO
// Add (Black/White)List
// Will be playing in x turns
// Wish Info Table
// Playlist Table