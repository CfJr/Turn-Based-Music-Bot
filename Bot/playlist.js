const SQLite = require("better-sqlite3");
const sqlGlobalPlaylist = new SQLite('./globalPlaylist.sqlite');

module.exports = {
    createPlaylistEntry : createPlaylistEntry,
    getFirstEntry : getFirstEntry,
    getLength : getLength,
    getPlaylist : getPlaylist,
    deleteFirstEntry : deleteFirstEntry,
    getTotalLength : getTotalLength,
    getTopEntry : getTopEntry,
    clear : clear,
    print : print,
    isEmpty : isEmpty,
    shuffle : shuffle,
    switchQueued : switchQueued,
    replace : replace,
    removeEntry : removeEntry,
    move : move
}

function createPlaylistEntry(message, videoTitle, duration, url){
    let addGlobalPlaylist = sqlGlobalPlaylist.prepare("INSERT INTO globalPlaylist (User, Title, Duration, URL, Guild) VALUES (@User, @Title, @Duration, @URL, @Guild);");
    
    playlistEntry = {
        User : message.author.id,
        Title : videoTitle,
        Duration : duration,
        URL : url,
        Guild : message.guild.id
    }

    addGlobalPlaylist.run(playlistEntry);

}

function getFirstEntry(id, guildID){
    getFirst = sqlGlobalPlaylist.prepare('SELECT * FROM globalPlaylist WHERE (User = ?) AND (Guild = ?) LIMIT 1;');

    return getFirst.get(id, guildID);
}

function getTopEntry(guildID){
    getTop = sqlGlobalPlaylist.prepare('SELECT * FROM globalPlaylist WHERE Guild = ? LIMIT 1;');

    return getTop.get(guildID);
}

function getLength(id, guildID){
    let getUserEntries = sqlGlobalPlaylist.prepare('SELECT * FROM globalPlaylist WHERE (User = ?) AND (Guild = ?);');

    entries = getUserEntries.all(id, guildID);

    if(!entries){
        return 0;
    }

    return entries.length;

}

function getTotalLength(guildID){
    getUserEntries = sqlGlobalPlaylist.prepare('SELECT * FROM globalPlaylist WHERE Guild = ?;');

    entries = getUserEntries.all(guildID)

    return entries.length

}

function getPlaylist(id, guildID){
    getUserEntries = sqlGlobalPlaylist.prepare('SELECT * FROM globalPlaylist WHERE (User = ?) AND (Guild = ?);');

    return getUserEntries.all(id, guildID)
}

function deleteFirstEntry(id, guildID){
    deleteFirst = sqlGlobalPlaylist.prepare('DELETE FROM [globalPlaylist] WHERE (User = ?) AND (Guild = ?) LIMIT 1;')

    deleteFirst.run(id, guildID);
}

function clear(id, guildID){
    deleteAll = sqlGlobalPlaylist.prepare('DELETE FROM [globalPlaylist] WHERE (User = ?) AND (Guild = ?);')

    deleteAll.run(id, guildID);
}

function print(message){
    let playlistHolder = [];
    if(isEmpty(message.author.id, message.guild.id)){
        return message.channel.send("Your playlist is empty");
    }

    message.channel.send(`***${message.author.username}\'s Playlist:***`)
    let length = getLength(message.author.id, message.guild.id)
    if(length > 15){
        length = 15;
    }
    for(let i = 0; i < length; i++){
        playlistHolder.push((i+1) + '. ' + getPlaylist(message.author.id, message.guild.id)[i].Title + '\n')
    }

    message.channel.send(`${playlistHolder.join('')}`);
}

function isEmpty(id, guildID){
    return getLength(id, guildID) === 0;
}

function shuffle(message){
    let playlist = getPlaylist(message.author.id, message.guild.id);
    clear(message.author.id, message.guild.id);

    addGlobalPlaylist = sqlGlobalPlaylist.prepare("INSERT OR REPLACE INTO globalPlaylist (User, Title, Duration, URL, Guild) VALUES (@User, @Title, @Duration, @URL, @Guild);");

    let currentIndex = playlist.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [playlist[currentIndex], playlist[randomIndex]] = [
        playlist[randomIndex], playlist[currentIndex]];
    }
  
    for(i = 0; i < playlist.length; i++){
        //delete playlist[i].ID
        playlistEntry = {
            //ID : playlist[i].ID,
            User : playlist[i].User,
            Title : playlist[i].Title,
            Duration : playlist[i].Duration,
            URL : playlist[i].URL,
            Guild : playlist[i].Guild
        }
        addGlobalPlaylist.run(playlistEntry)
    }
}

function replace(entry){
    replaceGlobalPlaylist = sqlGlobalPlaylist.prepare("REPLACE INTO globalPlaylist (ID, User, Title, Duration, URL, Guild) VALUES (@ID, @User, @Title, @Duration, @URL, @Guild);");
    replaceGlobalPlaylist.run(entry);
}

function switchQueued(message){
    const queue = require('./queue.js');

    for(i = 0; i < queue.getLength(message.guild.id); i++){
        if(queue.getQueue(message.guild.id)[i].User === message.author.id){

            let newPlaylistEntry = {
                ID : getFirstEntry(message.author.id, message.guild.id).ID,
                User : queue.getQueue(message.guild.id)[i].User,
                Title : queue.getQueue(message.guild.id)[i].Title,
                Duration : queue.getQueue(message.guild.id)[i].Duration,
                URL : queue.getQueue(message.guild.id)[i].URL,
                Guild : queue.getQueue(message.guild.id)[i].Guild
            }

            let newQueueEntry = {
                User : getFirstEntry(message.author.id, message.guild.id).User,
                Title : getFirstEntry(message.author.id, message.guild.id).Title,
                Duration : getFirstEntry(message.author.id, message.guild.id).Duration,
                URL : getFirstEntry(message.author.id, message.guild.id).URL,
                Guild : getFirstEntry(message.author.id, message.guild.id).Guild
            }

            replace(newPlaylistEntry);
            queue.replace(newQueueEntry);
            message.channel.send("Succesfully switched songs!")
            return;
        }
    }
}

function removeEntry(message, position){
    addGlobalPlaylist = sqlGlobalPlaylist.prepare("INSERT INTO globalPlaylist (User, Title, Duration, URL, Guild) VALUES (@User, @Title, @Duration, @URL, @Guild);");
    let playlist = getPlaylist(message.author.id, message.guild.id);

    if(!playlist){
        return;
    }

    message.channel.send(`Removed: ${playlist[position-1].Title}`)
    playlist.splice(position-1, 1);
    clear(message.author.id, message.guild.id);


    for(i = 0; i < playlist.length; i++){
        playlistEntry = {
            User : playlist[i].User,
            Title : playlist[i].Title,
            Duration : playlist[i].Duration,
            URL : playlist[i].URL,
            Guild : playlist[i].Guild
        }
        addGlobalPlaylist.run(playlistEntry)
    }
}

function move(message, position){
    addGlobalPlaylist = sqlGlobalPlaylist.prepare("INSERT INTO globalPlaylist (User, Title, Duration, URL, Guild) VALUES (@User, @Title, @Duration, @URL, @Guild);");
    let playlist = getPlaylist(message.author.id, message.guild.id);
    let copy = playlist[position-1];
    playlist.unshift(copy);
    playlist.splice(position, 1);
    clear(message.author.id, message.guild.id);


    for(i = 0; i < playlist.length; i++){
        playlistEntry = {
            User : playlist[i].User,
            Title : playlist[i].Title,
            Duration : playlist[i].Duration,
            URL : playlist[i].URL,
            Guild : playlist[i].Guild
        }
        addGlobalPlaylist.run(playlistEntry)
    }

    message.channel.send(`Moved ${playlist[0].Title} to the top of your Playlist`)
}