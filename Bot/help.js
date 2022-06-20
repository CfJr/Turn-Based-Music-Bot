module.exports = {
    printCommands : printCommands
};

function printCommands(message){
    message.channel.send("\
***Music Features***\n\
\n\
Songs in your Playlist will automatically play as long as the bot is not paused.\n\
Each user has their own personal Playlist.\n\
Songs will be added to the Queue from each user's Playlist.\n\
The first song in a user's Playlist will automatically be added to the Queue when they have no song in the Queue.\n\
\n\
***-play X*** : Adds the YouTube song \'X\' to your Playlist. (Can be a Title or URL)\n\
***-play p X*** : Adds a YouTube Playlist with URL \'X\' to your Playlist.\n\
***-play p s X*** : Adds and shuffles a YouTube Playlist with URL \'X\' to your Playlist.\n\
***-playlist*** : Shows your Playlist.\n\
***-shuffle*** : Shuffles your Playlist.\n\
***-queue*** : Shows the Queue.\n\
***-move X*** : Moves the song at index \'X\' in your Playlist to the top.\n\
***-remove X*** : Removes the song at index \'X\' from your Playlist.\n\
***-switch*** : Switches your queued song with the first in your Playlist.\n\
***-skip*** : Skips the currently playing song if you added it.\n\
***-clear*** : Clears your Playlist.\n\
***-pause*** : Pauses the current song.\n\
***-unpause*** : Unpauses the current song.\n\
***-loop*** : Loops your Playlist\n\
***-status*** : Shows the status of the bot.\n\
***-fix*** : Can be used to attempt to fix the bot if it fails to play a song.\n\
***-leave*** : Disconnects the bot.\n\
\n\
");
}