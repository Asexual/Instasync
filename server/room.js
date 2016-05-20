var request  =  require('request');
var fs = require('fs');
function room(roomName)
{
    this.roomName = roomName;
    this.users = new Array();
    this.recentUsers = new Array(); //stores last 10 or so users who left, allowing the to still be banned even after leaving
    this.roomLock = false;
    this.playListLock = true;
    this.chatLock = false;
    this.poll = null;
    this.autoclean = false;
    
    this.leader = null; //socket id of leader

    this.numberOfRegisteredUsers = 0;
    this.totalSkips = 0;
    this.skipsNeeded = 0;
    this.skipThreshold = 0.5;    
    
    this.playing = false; //if playlist is dead or no users in room pause everything   
    this.playlist = new Array(); //vidinfostores: title, vidcode, duration, addedby vidinfo: provider mediaType id channel
    this.maxVids = 300;
    this.nowPlaying = {info: null, timeStarted: 0, duration: 0, title: "No Videos", stoppedTime: 0}; //paused time stores the time the playlist was at during the last pause
    this.MOTD = "Welcome to " + this.roomName + "!";
    
    this.playTimeout = null;
    this.playlist.move = function (old_index, new_index) //Code is property of Reid from stackoverflow
    { 
        if (new_index >= this.length) {
            var k = new_index - this.length;
            while ((k--) + 1) {
                this.push(undefined);
            }
        }
        this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    };    
}
room.prototype.tryJoin = function(socket)
{
    if (this.roomLock)//check if room is locked, if so, only allow mods in
        if (!socket.info.permissions > 0)
        {
            socket.emit('sys-message', "Room is locked. Your permissions were too low to enter.");
            socket.disconnect();
            return;
        }
    if (socket.info.username.toLowerCase() == "unnamed")
    {
        if (socket.info.username == "unnamed")
            this.join(socket);
        else //some how, the user may have hijacked the join and put unnamed in a variation of caps
            socket.disconnect(); 
    }
    else
    {
        for (var i = 0; i < this.users.length; i++)
        {
            if (this.users[i].username.toLowerCase() == socket.info.username.toLowerCase())
            {
                var connectedSocket = chat_room.sockets.sockets[this.users[i].id];
                if (connectedSocket != undefined)
                {
                    if (socket.info.loggedin) //socket is a registered user, thus he has higher precendence over the already connected socket
                    {
                        connectedSocket.emit('sys-message', {message: "A registered user has entered with your name."})
                        //this.leave(connectedSocket); //make the connected socket leave the userlist (possible fix for user clone)
                        connectedSocket.disconnect();
                    }
                    else //name is already in use
                    {
                        socket.emit('sys-message', {message: "Name is in use. Disconnected."});
                        socket.disconnect();
                        return;
                    }                     
                }
            }
        }
        this.join(socket);
    }
};
room.prototype.leave = function(socket)
{
    var indexOfUser = this.indexOfUserByID(socket.id);
    if (indexOfUser > -1)
    {
        chat_room.sockets.in(this.roomName).emit('remove-user', {userId: this.users[indexOfUser].id});     
        this.users.splice(indexOfUser, 1);
    }
    if (this.users.length == 0)
    {
        this.stop();
    }
    if (socket.info.loggedin)
    {
        this.numberOfRegisteredUsers--;
        if (socket.info.skipped)
            this.removeSkip();
        else
            this.updateSkips();
        if (socket.info.voteinfo.voted === true)
        {
            this.removePollVote(socket.info.voteinfo.option);
        }
    }
    if (this.isLeader(socket.id))
    {
        this.leader = null;
        chat_room.sockets.in(this.roomName).emit('leader', {userId: null});
        if (!this.playing) //if leader paused video before leaving/disconnecting, resume video
        {
            this.resume();
        }
        
    }
    this.updateRoomInfo();
    socket.leave(this.roomName);
    if (this.recentUsers.length > 20)
    {
        this.recentUsers.splice(0,1);
    }
    this.recentUsers.push({username: socket.info.username, ip: socket.info.ip});
};
room.prototype.join = function(socket)
{
    var user = {id: socket.id, ip: socket.info.hashedIp, username: socket.info.username, permissions: socket.info.permissions, room: socket.info.room, loggedin: socket.info.loggedin};
    this.users.push(user);
    socket.join(this.roomName);
    socket.emit('userinfo', {id: socket.id, username: socket.info.username, permissions: socket.info.permissions, room: socket.info.room, loggedin: socket.info.loggedin, ip: socket.info.hashedIp});
    socket.emit('playlist', {playlist: this.playlist});
    socket.emit('userlist', {userlist: this.users}); //NOTE: session ID is sent with this, be sure that sessionIDs are worthless
    socket.emit('room-event', {action: "playlistlock", data: this.playListLock});        
    socket.broadcast.to(this.roomName).emit('add-user', {user: user});
    socket.emit('sys-message', {message: this.MOTD});
    if (this.nowPlaying.info === null)
    {
        socket.emit('sys-message', {message: "playlist is empty."});
    }
    if (this.poll !== null)
    {
        chat_room.sockets.in(this.roomName).emit('room-event', {action: "poll-create", poll: this.poll.data});
    }
    socket.joined = true;    
    if (this.leader != null)
    {
        chat_room.sockets.in(this.roomName).emit('room-event', {action: "leader", userId: this.leader});
    }
    if (socket.info.loggedin)
    {
        this.numberOfRegisteredUsers++;
        this.updateSkips();
    }
    //socket.emit('messages', {message: JSON.stringify(this.messages)}); recent messages   
    if (this.users.length == 1){
        this.start(); //resume playlist
    }
    socket.emit('play', {info: this.nowPlaying.info, time: this.time(), playing: this.playing});    
    this.updateRoomInfo();
};
room.prototype.kickAllByIP = function(ip) //called after kicking a specific user or banning a user by server.js (TODO: mitigate ban and kick functions to room.js
{
    for (var i = this.users.length - 1; i > -1; i--) //itterate backwards as disconnected sockets splice the array
    {
        var socket = chat_room.sockets.sockets[this.users[i].id];
        if (socket != undefined)
        {
            if (socket.info != undefined && socket.info.ip === ip && !(socket.info.permissions > 0))
            {
                socket.emit('sys-message', {message: "A user with your ip address has been kicked/banned."})
                socket.disconnect();                  
            }            
        }
    }
}
room.prototype.updateRoomInfo = function()
{
    var thumbnail = "http://i1.ytimg.com/vi/2312/default.jpg"; //default blank youtube thumbnail
    if (this.nowPlaying.info !== null)
        thumbnail = this.nowPlaying.info.thumbnail;
    request.post("http://localhost/actions/updateroominfo.php", 
        {form:{users: this.users.length, thumbnail: thumbnail, title: this.nowPlaying.title, roomname: this.roomName}}, function(error, response, msg){});
};
room.prototype.chatmessage = function(socket, message)
{
    message = message.toString().substring(0, 240);
    var buf = new Buffer(message);
    if (buf.length > 300) //max 300 byte sized message
    {
        
    }
    chat_room.sockets.in(this.roomName).emit('chat', {user: {id: socket.id, username: socket.info.username, permissions: socket.info.permissions, room: socket.info.room, loggedin: socket.info.loggedin, ip: socket.info.hashedIp}, message: message});

};
room.prototype.indexOfUser = function(username)
{
    for (var i = 0; i < this.users.length; i++)
    {
        if (this.users[i].username.toLowerCase() === username.toLowerCase())
            return i;
    }
    return -1;
};
room.prototype.indexOfUserByID = function(id)
{
    for (var i = 0; i < this.users.length; i++)
    {
        if (this.users[i].id === id)
            return i;
    }
    return -1;
};
room.prototype.lastIpByUsername = function(username)
{
    for (var i = this.recentUsers.length - 1; i > -1; i--)
    {
        if (this.recentUsers[i].username.toLowerCase() == username.toLowerCase())
            return this.recentUsers[i].ip;
    }
    return -1;
};
room.prototype.rename = function(socket, newname)
{
    if (newname.toLowerCase() == "mewte")
    {
        socket.emit("sys-message", {message: "b-but you are not Mewte...<img src='/images/notsure.jpg' width='50' height='50' >"});
        return;
    }
    var indexOfUser = this.indexOfUserByID(socket.id);
    if ((this.indexOfUser(newname) === -1) && newname.match(/^([A-Za-z0-9]|([-_](?![-_]))){1,16}$/) != null) //is name already taken?
    {
        this.users[indexOfUser].username = newname;
        socket.info.username = newname;
        chat_room.sockets.in(this.roomName).emit('rename', {username: newname, id: socket.id}); 
    } 
};
room.prototype.indexOfVid = function(vidinfo)
{
    for (var i = 0; i < this.playlist.length; i++)
    {
        if (JSON.stringify(this.playlist[i].info) === JSON.stringify(vidinfo))//properties must be in the same order
        {
            return i;
        }
    }
    return -1;
};
room.prototype.setMOTD = function(MOTD)
{
    this.MOTD = MOTD;
    chat_room.sockets.in(this.roomName).emit('sys-message', {message: this.MOTD});  
};
room.prototype.isLeader = function(id)
{
    return (id === this.leader);
}
room.prototype.makeLead = function(id)
{
    this.leader = id; 
    chat_room.sockets.in(this.roomName).emit('room-event', {action: "leader", userId: this.leader});
}
//player
room.prototype.start = function()
{ 
    this.resetSkips();
    if (this.nowPlaying.info === null) //not playing anything
    {
        if (this.playlist[0] != undefined)
        {
            this.playing = true;
            this.nowPlaying = {info: this.playlist[0].info, timeStarted: new Date().getTime(), duration: this.playlist[0].duration, title: this.playlist[0].title};
            chat_room.sockets.in(this.roomName).emit('play', {info: this.nowPlaying.info, time: this.time(), playing: this.playing});
            this.setTimer(); 
            this.updateRoomInfo();  
        }//else: nothing to play, playlist empty
    }
    else
    { //resuming
        this.playing = true;
        this.nowPlaying.timeStarted = new Date().getTime() - (this.nowPlaying.stoppedTime * 1000);        
        //chat_room.sockets.in(this.roomName).emit('play', {info: this.nowPlaying.info, time: this.time(), playing: this.playing});
        this.setTimer(); 
        chat_room.sockets.in(this.roomName).emit('resume', {time: this.time()});        
    }
};
room.prototype.stop = function()
{ 
    this.nowPlaying.stoppedTime = this.time();
    this.playing = false;
    clearTimeout(this.playTimeout);  
};
room.prototype.nextVid = function()
{
    if (this.nowPlaying.info !== null)
    {    
        var indexOfVid = this.indexOfVid(this.nowPlaying.info);
        if (indexOfVid >= (this.playlist.length - 1))//last vid in playlist
        {
            this.nowPlaying = {info: this.playlist[0].info, timeStarted: new Date().getTime(), duration: this.playlist[0].duration, title: this.playlist[0].title}
        }
        else //next vid
        {
            this.nowPlaying = {info: this.playlist[indexOfVid+1].info, timeStarted: new Date().getTime(), duration: this.playlist[indexOfVid+1].duration, title: this.playlist[indexOfVid+1].title};
        }
        clearTimeout(this.playTimeout);
        this.resume(); //resume will check if video is paused, if so, itll resume it
        this.setTimer();
        chat_room.sockets.in(this.roomName).emit('play', {info: this.nowPlaying.info, time: this.time(), playing: this.playing});
        this.resetSkips();
        this.updateRoomInfo();        
    }
};
room.prototype.addVideo = function(vidinfo)
{
    if (this.indexOfVid(vidinfo.info) != -1)
    {
        return "Video is already in playlist.";        
    }
    else
    {
        if (this.playlist.length > this.maxVids)
            return "playlist full.";
        this.playlist.push(vidinfo);
        chat_room.sockets.in(this.roomName).emit('add-vid', {info: vidinfo});
        if (this.playlist.length === 1) //first video added to playlist, autostart it
        {
            this.start();
        }
        return "Video added successfully.";
    }
};
room.prototype.removeVideo = function(vidinfo, emitToSocket) //if true, emits the removal to the socket, if false it won't. (For efficient purging)
{  
    var index = this.indexOfVid(vidinfo);
    if (index > -1)
    {
        if (this.nowPlaying.info === this.playlist[index].info) //if vid is deleted while playing, start the next one, or stop
        {
            if (this.playlist.length === 1) //only vid in playlist
            {
                this.nowPlaying = {info: null, timeStarted: new Date().getTime(), duration:0, title: "No Videos"};
                this.updateRoomInfo();
                this.stop();
            }    
            else
            {
                this.nextVid();                
            }    
        }
        if (emitToSocket)
            chat_room.sockets.in(this.roomName).emit('remove-vid', {info: vidinfo});      
        this.playlist.splice(index, 1);
    }
};
room.prototype.moveVideo = function(vidinfo, position)
{
    if (position > -1 && position < this.playlist.length)
    {
        var vidPosition = this.indexOfVid(vidinfo);
        if (vidPosition > -1)
        {
            this.playlist.move(vidPosition, position);
            chat_room.sockets.in(this.roomName).emit('move-vid', {info: vidinfo, position: position});
        } 
    }     
};
room.prototype.purge = function(username) //this purge is very inefficient as it requires extra loops per keycode, TODO; FIx that
{
    for (var i = this.playlist.length - 1; i > -1; i--) //loop backwards (length-1) to 0
    {
        if (this.playlist[i].addedby.toLowerCase() == username.toLowerCase())
            this.removeVideo(this.playlist[i].info, false); //dont emit
    }
    chat_room.sockets.in(this.roomame).emit('purge', {username: username});
};
room.prototype.clean = function()
{
    var indexOfPlaying = this.indexOfVid(this.nowPlaying.info);
    if (indexOfPlaying > -1)
    {
        for (var i = indexOfPlaying - 1; i >= 0; i--)
        {
            this.removeVideo(this.playlist[i].info, true);
        }
    }
};
room.prototype.time  = function()
{
    if (this.playing)
        return (new Date().getTime() - this.nowPlaying.timeStarted) / 1000;
    else
    {
        return this.nowPlaying.stoppedTime;
    }
};
room.prototype.setTimer = function()
{
    clearTimeout(this.playTimeout);
    var thisRoom =  this;
    this.playTimeout = setTimeout(function()
    {
        thisRoom.nextVid();
    }, (this.nowPlaying.duration - this.time()) * 1000);
}
room.prototype.togglePlaylistLock = function()
{
    this.playListLock = !(this.playListLock)
    chat_room.sockets.in(this.roomName).emit('room-event', {action: "playlistlock", data: this.playListLock});    
};
//--
//skips
room.prototype.resetSkips = function()
{
    for (var i = 0; i < this.users.length; i++)
    {
        var user = chat_room.sockets.sockets[this.users[i].id];
        if (user != undefined)
        {
            if (user.info.skipped)
                user.info.skipped = false;
        }
    }
    this.totalSkips = 0;
    this.updateSkips();  
};
room.prototype.addSkip = function()
{
    this.totalSkips++;
    this.updateSkips();
};
room.prototype.removeSkip = function()
{
    this.totalSkips--;
    this.updateSkips();
};
room.prototype.updateSkips = function()
{
    this.skipsNeeded = Math.ceil(this.numberOfRegisteredUsers * this.skipThreshold);
    chat_room.sockets.in(this.roomName).emit('skips', {skips: this.totalSkips, skipsneeded: this.skipsNeeded});
    if ((this.skipsNeeded > 0) && this.totalSkips >= this.skipsNeeded) //dont evalulate if 0/0
    { 
            this.nextVid(); 
    }
};
room.prototype.setSkip = function(decimal)
{
    this.skipThreshold = decimal;
    this.updateSkips();
};
//--
//player actions
room.prototype.seekTo = function(time)
{
    if (time >= 0 && time < this.nowPlaying.duration)
    {
        if (this.playing)
        {
            this.nowPlaying.timeStarted = new Date().getTime() - (time * 1000);
            this.setTimer();
        }
        else
        {
            this.nowPlaying.stoppedTime = time;
        }
        chat_room.sockets.in(this.roomName).emit('seekTo', {time: time});         
    }
};
room.prototype.seekFrom = function(time)
{
    var newtime = this.time() + time;
    return this.seekTo(newtime);
};
room.prototype.play = function(info)
{
    var position = this.indexOfVid(info);
    if (position > -1 && position < this.playlist.length)
    {
        this.nowPlaying = {info: this.playlist[position].info, timeStarted: new Date().getTime(), duration: this.playlist[position].duration, title: this.playlist[position].title};
        this.updateRoomInfo(); 
        this.resetSkips();
        this.resume(); //if vid was paused, this will resume it
        this.setTimer();
        chat_room.sockets.in(this.roomName).emit('play', {info: this.nowPlaying.info, time: this.time(), playing: this.playing });  
     }   
};
room.prototype.pause = function()
{
    if (this.playing)
    {
        this.stop();
        chat_room.sockets.in(this.roomName).emit('pause', {});    
    }
};
room.prototype.resume = function()
{
    if (!this.playing)
    {
        this.start();        
        //chat_room.sockets.in(this.roomName).emit('resume', {});    
    }
};
//--
//Polls
room.prototype.createPoll = function(info) //poll.data = {title = string, options = {option, votes}}
{
    if (this.poll != null)
    {
        this.endPoll();
    }
    this.poll = new poll(info);
    chat_room.sockets.in(this.roomName).emit('room-event', {action: "poll-create", poll: this.poll.data});    
};
room.prototype.endPoll = function()
{
    if (this.poll != null)
    {
        this.poll = null;
        for (var i = 0; i < this.users.length; i++)
        {
            var user = chat_room.sockets.sockets[this.users[i].id];
            if (user != undefined)
            {
                if (user.info.voteinfo.voted === true)
                    user.info.voteinfo.voted = false;
            }
        }
        chat_room.sockets.in(this.roomName).emit('room-event', {action: "poll-end"});        
    }
};
room.prototype.addPollVote = function(vote)
{
    if (this.poll != null)
    {
        this.poll.addVote(vote);
        chat_room.sockets.in(this.roomName).emit('room-event', {action: "poll-addVote", option: vote});        
    }
};
room.prototype.removePollVote = function(vote)
{
    if (this.poll != null)
    {
        this.poll.removeVote(vote);
        chat_room.sockets.in(this.roomName).emit('room-event', {action: "poll-removeVote", option: vote});        
    }
};
//playlist dump
room.prototype.savePlaylist = function()
{
    if (this.playlist.length > 0)
    {
        var filename = "C:/wamp/www/server/playlistdump/" + this.roomName.toString() + ".playlist";
        fs.writeFile(filename, JSON.stringify(this.playlist), function (err) {
            if (err) throw err;
        });
    }
};
room.prototype.loadPlaylist = function()
{
    var thisRoom = this; //because you can't use this in a callback function, welcome to callback hell -___-
    var filename = "playlistdump/" + this.roomName.toLowerCase() + ".playlist";
    fs.exists(filename, function(exists){
        if (exists)
        {
            fs.readFile(filename, function (err, data) {
                if (err) throw err;
                var playlist = null;
                try {playlist = JSON.parse(data)} catch(e) {console.log("JSON from playlist invalid?"); return;}
                thisRoom.playlist = playlist;
                thisRoom.playlist.move = function (old_index, new_index) //Code is property of Reid from stackoverflow
                { 
                    if (new_index >= this.length) {
                        var k = new_index - this.length;
                        while ((k--) + 1) {
                            this.push(undefined);
                        }
                    }
                    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
                };  
                //chat_room.sockets.in(this.roomName).emit('playlist', {playlist: thisRoom.playlist});                
            });
        }
    });
};
//---
function poll(poll)
{
    this.data = new Object();
    this.data.title = poll.title;
    this.data.options = new Array();
    for (var i = 0; i < poll.options.length; i ++)
    {
        this.data.options[i] = {option: poll.options[i], votes: 0};
    }
}
poll.prototype.addVote = function(vote)
{
    if (vote >= 0 && vote < this.data.options.length)
    {
        this.data.options[vote].votes++;
    }
};
poll.prototype.removeVote = function(vote)
{
    if (vote >= 0 && vote < this.data.options.length)
    {
        this.data.options[vote].votes--;
    }    
};

module.exports.create = function(roomName)
{
    var thisroom = new room(roomName);
    thisroom.loadPlaylist();
    return thisroom;
}