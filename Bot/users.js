const SQLite = require("better-sqlite3");
const { Message } = require("discord.js");
const sqlUsers = new SQLite('./users.sqlite');
const sqlGlobalQueue = new SQLite('./globalQueue.sqlite');

module.exports = {
    registerUser : registerUser,
    isRegistered : isRegistered,
    getUser : getUser,
    revokeUser : revokeUser,
    unrevokeUser : unrevokeUser,
    enableLoop : enableLoop,
    disableLoop : disableLoop,
    setWinStreak : setWinStreak,
    activatePlaylist : activatePlaylist,
    deactivatePlaylist : deactivatePlaylist,
    hasSongInQueue : hasSongInQueue,
    hasActivePlaylist : hasActivePlaylist,
    test : test,
    updateName : updateName,
}

function registerUser(user, name, guildID){
    addUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    
    user = {
        User : user,
        Guild : guildID,
        loopEnabled : 'False',
        Revoked : 'False',
        winStreak : 0,
        activePlaylist : 'No',
        Name : name
    }

    addUser.run(user);
}


function isRegistered(userID, guildID){
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");
    let user = findUser.get(userID, guildID);

    return !(!user);
}

function updateName(userID, guildID, name){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.Name = name
    setUser.run(user);
}

function getUser(userID, guildID){
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    return findUser.get(userID, guildID);
    
}

function revokeUser(userID, guildID){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.Revoked = 'True'
    setUser.run(user);
    
}

function unrevokeUser(userID, guildID){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.Revoked = 'False'
    setUser.run(user);
    
}

function enableLoop(userID, guildID){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.loopEnabled = 'True'
    setUser.run(user);
}

function disableLoop(userID, guildID){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.loopEnabled = 'False'
    setUser.run(user);
    
}

function setWinStreak(userID, guildID, amount){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.winStreak = amount;
    setUser.run(user);
    
}

function enableLoop(userID, guildID){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.loopEnabled = 'True'
    setUser.run(user);
}

function activatePlaylist(userID, guildID){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.activePlaylist = 'True'
    setUser.run(user);

}

function deactivatePlaylist(userID, guildID){
    let setUser = sqlUsers.prepare("INSERT OR REPLACE INTO users (User, Guild, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @Guild, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");

    user = findUser.get(userID, guildID);
    user.activePlaylist = 'False';
    setUser.run(user);
    
}

function hasSongInQueue(id, guildID){
    getUserEntries = sqlGlobalQueue.prepare('SELECT * FROM globalQueue WHERE (User = ?) AND (Guild = ?);');
    userEntries = getUserEntries.get(id, guildID)

    return !(!userEntries);
}

function hasActivePlaylist(id, guildID){
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = ? AND Guild = ?");
    user = findUser.get(id, guildID);

    if (!user) {
        return false;
    }

    return user.activePlaylist === 'True';
}

function test(resource){
    console.log(resource)
    let setUser = sqlUsers.prepare("REPLACE INTO users (User, hasSongInQueue, loopEnabled, Revoked, winStreak, activePlaylist, Name) VALUES (@User, @hasSongInQueue, @loopEnabled, @Revoked, @winStreak, @activePlaylist, @Name);");
    findUser = sqlUsers.prepare("SELECT * FROM users WHERE User = 0");
    user = findUser.get();

    user.activePlaylist = resource
    setUser.run(user);
}