const SQLite = require("better-sqlite3");
const sqlPlayedSongs = new SQLite('./playedSongs.sqlite');

module.exports = {
    createPlayedSongEntry : createPlayedSongEntry,
    getPlayedSongs : getPlayedSongs
}

function createPlayedSongEntry(queueEntry){
    let addPlayedSong = sqlPlayedSongs.prepare("INSERT OR REPLACE INTO playedSongs (User, Title, Duration, URL, Guild, Count) VALUES (@User, @Title, @Duration, @URL, @Guild, @Count);");
    let getPlayedSong = sqlPlayedSongs.prepare("SELECT * FROM playedSongs WHERE (User = ?) AND (URL = ?) AND (Guild = ?);");

    if(!isPlayed(queueEntry)){
        
        playedSong = {
            User : queueEntry.User,
            Title : queueEntry.Title,
            Duration : queueEntry.Duration,
            URL : queueEntry.URL,
            Guild : queueEntry.Guild,
            Count : 1
        }

        addPlayedSong.run(playedSong);

    } else{
        let song = getPlayedSong.get(queueEntry.User, queueEntry.URL, queueEntry.Guild)
        song.Count += 1;

        addPlayedSong.run(song);

    }
}

function isPlayed(queueEntry){
    // getUserPlayed = sqlPlayedSongs.prepare('SELECT * FROM playedSongs WHERE (User = ?) AND (URL = ?) AND (Guild = ?);');
    getUserPlayed = sqlPlayedSongs.prepare('SELECT * FROM playedSongs WHERE (User = ?) AND (URL = ?) AND (Guild = ?);');

    entry = getUserPlayed.get(queueEntry.User, queueEntry.URL, queueEntry.Guild)

    return !(!entry);
}

function getPlayedSongs(id){
    getUserEntries = sqlPlayedSongs.prepare('SELECT * FROM playedSongs WHERE (User = ?) ORDER BY Count DESC;');

    return getUserEntries.all(id)
}

// function getLength(id){
//     let getUserEntries = sqlGlobalFavourites.prepare('SELECT * FROM globalFavourites WHERE (User = ?);');

//     entries = getUserEntries.all(id);

//     if(!entries){
//         return 0;
//     }

//     return entries.length;

// }

// function getFavourites(id){
//     getUserEntries = sqlGlobalFavourites.prepare('SELECT * FROM globalFavourites WHERE (User = ?);');

//     return getUserEntries.all(id)
// }

// function print(message){
//     let favouritesHolder = [];
//     if(isEmpty(message.author.id)){
//         return message.channel.send("You have no Favourites");
//     }

//     message.channel.send(`***${message.author.username}\'s Favourites:***`)
//     let length = getLength(message.author.id)
//     if(length > 15){
//         length = 15;
//     }
//     for(let i = 0; i < length; i++){
//         favouritesHolder.push((i+1) + '. ' + getFavourites(message.author.id)[i].Title + '\n')
//     }

//     message.channel.send(`${favouritesHolder.join('')}`);
// }

// function isEmpty(id){
//     if(getLength(id) === 0){
//         return true;
//     }

//     return false;
// }

// function clear(id){
//     deleteAll = sqlGlobalFavourites.prepare('DELETE FROM [globalFavourites] WHERE (User = ?);')

//     deleteAll.run(id);
// }

// function removeEntry(message, position){
//     addGlobalFavourites = sqlGlobalFavourites.prepare("INSERT INTO globalFavourites (User, Title, Duration, URL) VALUES (@User, @Title, @Duration, @URL);");
//     let favourites = getFavourites(message.author.id);

//     if(!favourites){
//         return;
//     }

//     message.channel.send(`Removed: ${favourites[position-1].Title}`)
//     favourites.splice(position-1, 1);
//     clear(message.author.id);


//     for(i = 0; i < favourites.length; i++){
//         favouritesEntry = {
//             User : favourites[i].User,
//             Title : favourites[i].Title,
//             Duration : favourites[i].Duration,
//             URL : favourites[i].URL,
//         }
//         addGlobalFavourites.run(favouriteEntry)
//     }
// }