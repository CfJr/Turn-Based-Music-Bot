const SQLite = require("better-sqlite3");
const sqlGlobalFavourites = new SQLite('./globalFavourites.sqlite');

module.exports = {
    createFavouritesEntry : createFavouritesEntry,
    getLength : getLength,
    getFavourites : getFavourites,
    print : print,
    isEmpty : isEmpty,
    isFavourited : isFavourited,
    removeEntry :removeEntry,
    clear : clear
}

function createFavouritesEntry(userID, queueEntry){
    let addGlobalFavourites = sqlGlobalFavourites.prepare("INSERT INTO globalFavourites (User, Title, Duration, URL) VALUES (@User, @Title, @Duration, @URL);");
    
    FavouritesEntry = {
        User : userID,
        Title : queueEntry.Title,
        Duration : queueEntry.Duration,
        URL : queueEntry.URL
    }

    addGlobalFavourites.run(FavouritesEntry);
}

function isFavourited(queueEntry){
    getUserFavourites = sqlGlobalFavourites.prepare('SELECT * FROM globalFavourites WHERE (User = ?) AND (URL = ?);');

    entry = getUserFavourites.get(queueEntry.User, queueEntry.URL)

    return !(!entry);
}


function getLength(id){
    let getUserEntries = sqlGlobalFavourites.prepare('SELECT * FROM globalFavourites WHERE (User = ?);');

    entries = getUserEntries.all(id);

    if(!entries){
        return 0;
    }

    return entries.length;

}

function getFavourites(id){
    getUserEntries = sqlGlobalFavourites.prepare('SELECT * FROM globalFavourites WHERE (User = ?);');

    return getUserEntries.all(id)
}

function print(message){
    let favouritesHolder = [];
    if(isEmpty(message.author.id)){
        return message.channel.send("You have no Favourites");
    }

    message.channel.send(`***${message.author.username}\'s Favourites:***`)
    let length = getLength(message.author.id)
    if(length > 15){
        length = 15;
    }
    for(let i = 0; i < length; i++){
        favouritesHolder.push((i+1) + '. ' + getFavourites(message.author.id)[i].Title + '\n')
    }

    message.channel.send(`${favouritesHolder.join('')}`);
}

function isEmpty(id){
    return getLength(id) === 0;
}

function clear(id){
    deleteAll = sqlGlobalFavourites.prepare('DELETE FROM [globalFavourites] WHERE (User = ?);')

    deleteAll.run(id);
}

function removeEntry(message, position){
    addGlobalFavourites = sqlGlobalFavourites.prepare("INSERT INTO globalFavourites (User, Title, Duration, URL) VALUES (@User, @Title, @Duration, @URL);");
    let favourites = getFavourites(message.author.id);

    if(!favourites){
        return;
    }

    message.channel.send(`Removed: ${favourites[position-1].Title}`)
    favourites.splice(position-1, 1);
    clear(message.author.id);


    for(i = 0; i < favourites.length; i++){
        favouritesEntry = {
            User : favourites[i].User,
            Title : favourites[i].Title,
            Duration : favourites[i].Duration,
            URL : favourites[i].URL,
        }
        addGlobalFavourites.run(favouritesEntry)
    }
}