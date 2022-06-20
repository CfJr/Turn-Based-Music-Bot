const SQLite = require("better-sqlite3");
const { Message } = require("discord.js");
const sqlGlobalQueue = new SQLite('./globalQueue.sqlite');
const playlist = require('./playlist.js')
const users = require('./users.js')

module.exports = {
    createQueueEntry : createQueueEntry,
    getFirstEntry : getFirstEntry,
    deleteFirstEntry : deleteFirstEntry,
    getLength : getLength,
    getQueue : getQueue,
    replace : replace,
    removeEntry : removeEntry,
    clear : clear
}

async function createQueueEntry(user, videoTitle, duration, url, guild){
    addGlobalQueue = sqlGlobalQueue.prepare("INSERT INTO globalQueue (User, Title, Duration, URL, Guild) VALUES (@User, @Title, @Duration, @URL, @Guild);");
    
    queueEntry = {
        User : user,
        Title : videoTitle,
        Duration : duration,
        URL : url,
        Guild : guild
    }

    addGlobalQueue.run(queueEntry);

    //deleteFirst.run(message.author.id)

    //message.channel.send(`${entry.Title}`)
}

function getFirstEntry(guildID){
    getFirst = sqlGlobalQueue.prepare('SELECT * FROM [globalQueue] WHERE Guild = ? LIMIT 1;');

    return getFirst.get(guildID)
}

function deleteFirstEntry(guildID){
    removeEntry(1, guildID)
}

function getLength(guildID){
    getUserEntries = sqlGlobalQueue.prepare('SELECT * FROM globalQueue WHERE Guild = ?;');

    entries = getUserEntries.all(guildID)

    return entries.length
}

function getQueue(guildID){
    getUserEntries = sqlGlobalQueue.prepare('SELECT * FROM globalQueue WHERE Guild = ?;');

    return getUserEntries.all(guildID)
}

function replace(entry){
    addGlobalQueue = sqlGlobalQueue.prepare("INSERT INTO globalQueue (User, Title, Duration, URL, Guild) VALUES (@User, @Title, @Duration, @URL, @Guild);");
    let queue = getQueue(entry.Guild);
    clear(entry.Guild);


    for(i = 0; i < queue.length; i++){
        if(queue[i].User === entry.User){
            queueEntry = {
                User : entry.User,
                Title : entry.Title,
                Duration : entry.Duration,
                URL : entry.URL,
                Guild : entry.Guild
            }
        } else{
            queueEntry = {
                User : queue[i].User,
                Title : queue[i].Title,
                Duration : queue[i].Duration,
                URL : queue[i].URL,
                Guild : queue[i].Guild
            }
        }
        addGlobalQueue.run(queueEntry)
    }
}

function removeEntry(position, guildID){
    addGlobalQueue = sqlGlobalQueue.prepare("INSERT INTO globalQueue (User, Title, Duration, URL, Guild) VALUES (@User, @Title, @Duration, @URL, @Guild);");
    let queue = getQueue(guildID);
    queue.splice(position-1, 1);
    clear(guildID);


    for(i = 0; i < queue.length; i++){
        queueEntry = {
            User : queue[i].User,
            Title : queue[i].Title,
            Duration : queue[i].Duration,
            URL : queue[i].URL,
            Guild : guildID
        }
        addGlobalQueue.run(queueEntry)
    }
}

function clear(guildID){
    deleteAll = sqlGlobalQueue.prepare('DELETE FROM [globalQueue] WHERE Guild = ?;')

    deleteAll.run(guildID);
}