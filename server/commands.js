//Note for comparing permissions with eachother, Use if (parseInt(socket.info.permissions) > parseInt(OTHERSOCKET.info.permissions))
//Also, Alot of problems with comparisons.. using parseInt(num,10) for alot of stuff to be sure they're getting casted properly
//I.E. 10 is not greater than 0, but 9 is?
var parser = require("./parsers");
var request  =  require('request');
var youtube = require('youtube-feeds');

var video = require('n-vimeo').video;

//Array.prototype.isArray = true; //use to check if variable is an array - WHY DOES THIS ALWAYS BREAK EVERYTHING

module.exports.commands = 
    {
        "broadcast":function(data, socket)
        {
            if (socket.info.username.toLowerCase() === "mewte" && socket.info.loggedin)
            {
                if (data.message !== undefined)
                {
                    chat_room.sockets.emit('sys-message', {message: data.message});
                }
            }
                
        },    
        "reload":function(data, socket)
        {
            socket.emit('play', {info: rooms[socket.info.room].nowPlaying.info, time: rooms[socket.info.room].time(), playing: rooms[socket.info.room].playing});
        },  
        "add":function(data, socket)
        {
            if (data.URL === undefined)
            {
                return;
            }
            if (socket.info.loggedin)
            {
                if (rooms[socket.info.room].playListLock)
                {
                    if (!(socket.info.permissions > 0)) //if user isn't mod
                    {
                        socket.emit('sys-message', {message: "Playlist locked."});
                        return;
                    }
                }
                if (data.URL != "") //trim it now that we know it's not undefined
                {
                    
                    var vidinfo = parser.parseURL(data.URL);
                    if (vidinfo)
                    {
                        if (vidinfo.provider === "youtube")
                        {
                            youtube.video(vidinfo.id).details(function( err, data ) {            
                            if( err instanceof Error )
                            {
                                console.log("Failed to add video error: " + err.message);
                                socket.emit('sys-message', {message: 'Failed to add video.. :-/'});
                            } 
                            else 
                            {
                                if (data.accessControl.embed != 'allowed')
                                {
                                    socket.emit('sys-message', {message: 'That video does not allow embeding.'});
                                }
                                else
                                { 
                                    if (data.duration === 0)
                                        data.duration = 86400; //It's a live stream, make it 24 hours
                                    var info = 
                                    {
                                        info: 
                                        {
                                            provider: vidinfo.provider,
                                            mediaType: vidinfo.mediaType,
                                            id: vidinfo.id,
                                            channel: vidinfo.channel,
                                            thumbnail: "http://img.youtube.com/vi/" + vidinfo.id + "/0.jpg"
                                        },
                                        addedby: socket.info.username,
                                        duration: data.duration,
                                        title: parser.replaceTags(data.title)
                                    }
                                    socket.emit('sys-message', {message: rooms[socket.info.room].addVideo(info)});
                                }
                            }
                            });                               
                        }
                        else if (vidinfo.provider === "vimeo")
                        {
                            video(vidinfo.id, function(err,data)
                            {
                                if(err !== null)
                                {
                                    console.log("Failed to add video error: " + err.message);
                                    socket.emit('sys-message', {message: 'Failed to add video.. :-/'});
                                } 
                                else
                                {
                                    if (data.statusCode !== 200) //404 = not found
                                    {
                                        socket.emit('sys-message', {message: 'Video not found.'});    
                                    }
                                    else
                                    {
                                        var info = 
                                        {
                                            info: 
                                            {
                                                provider: vidinfo.provider,
                                                mediaType: vidinfo.mediaType,
                                                id: vidinfo.id,
                                                channel: vidinfo.channel,
                                                thumbnail: data.raw.thumbnail_small
                                            },
                                            addedby: socket.info.username,
                                            duration: data.raw.duration, //millieconds
                                            title: parser.replaceTags(data.raw.title)
                                        }
                                        socket.emit('sys-message', {message: rooms[socket.info.room].addVideo(info)});
                                    }
                                }
                            })
                        }
                        else if (vidinfo.provider === "twitch")
                        {
                            if (vidinfo.mediaType === "stream")
                            {
                                var request = require('request')
                                var url = 'http://api.twitch.tv/channels/' + vidinfo.channel // input your url here

                                // use a timeout value of 10 seconds
                                var timeoutInMilliseconds = 10*1000
                                var opts = {
                                  url: url,
                                  timeout: timeoutInMilliseconds
                                }

                                request(opts, function (err, res, body) {
                                  if (err) {
                                    socket.emit('sys-message', {message: "Failed to add video."});
                                    return;
                                  }
                                  var statusCode = res.statusCode
                                  if (statusCode !== 200)
                                  {
                                      socket.emit("sys-message", {message: "Video not found."});
                                  }
                                  else
                                  {
                                        var info = 
                                        {
                                            info: 
                                            {
                                                provider: vidinfo.provider,
                                                mediaType: vidinfo.mediaType,
                                                id: vidinfo.id,
                                                channel: vidinfo.channel,
                                                thumbnail: "http://www-cdn.jtvnw.net/images/xarth/header_logo.png"
                                            },
                                            addedby: socket.info.username,
                                            duration: 60*60*24,
                                            title: parser.replaceTags(vidinfo.channel)
                                        }
                                        socket.emit('sys-message', {message: rooms[socket.info.room].addVideo(info)});                                      
                                  }
                                })       
                            }
                            else
                            {
                                socket.emit('sys-message', {message: "Twitch.tv non stream media is not supported yet."});
                            }
                        }
                    }     
                    else
                    {
                        socket.emit('sys-message', {message: "Invalid URL."});
                    }
                }
            }
            else
            {
                socket.emit('sys-message', {message: "You must be logged in to add videos."});
            }            
        },
        "ban":function(data, socket)
        {
            if (data.userid === undefined){ return;} 
            var indexOfUser = rooms[socket.info.room].indexOfUserByID(data.userid);
            if (indexOfUser > -1)
            {
                var banSocket = chat_room.sockets.sockets[data.userid];
                if (banSocket === undefined)
                    return; //Can cause issue where socket is undefined (For now on, anytime accessing sockets.sockets[socket.id] check for undefined)
                if (parseInt(socket.info.permissions,10) > parseInt(banSocket.info.permissions,10))                
                {        
                  
                    banSocket.emit('sys-message', {message: "You've been banned."});
                    request.post(phploc + 'actions/bans.php', {form:{ip: banSocket.info.ip, username: banSocket.info.username,
                                                                    room: banSocket.info.room, reason: "", action: "add" }}, function(error, response, msg){});
                    banSocket.disconnect();
                    rooms[socket.info.room].kickAllByIP(banSocket.info.ip);
                    chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " has banned a user."});   
                }
            }
        },
        "leaverban":function(data, socket)
        {
            if (data.username === undefined){ return;} 
            if (socket.info.permissions > 0)                
            {    
                var IpOfUser = rooms[socket.info.room].lastIpByUsername(data.username);
                if (IpOfUser != -1)
                {    
                        request.post(phploc + 'actions/bans.php', {form:{ip: IpOfUser, username: data.username,
                                                                        room: socket.info.room, reason: "", action: "add" }}, function(error, response, msg){});
                        rooms[socket.info.room].kickAllByIP(IpOfUser);
                        chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " leaverbanned a user."});  
                        socket.emit("sys-message", {message: "Leaver ban successful."});
                }
                else
                {
                    socket.emit("sys-message", {message: "Username not found."});
                }
            }
        },        
        "unban":function(data, socket)
        { //COMMAND, USERNAME, REASON
            if (data.username === undefined){ return;} //argument 1 missing
            if (socket.info.permissions > 0)                
            {
                request.post(phploc + 'actions/bans.php', {form:{ip:"", username: data.username,
                                                                room: socket.info.room, reason: "", action: "remove" }}, function(error, response, msg){
                                                            socket.emit('sys-message', {message: "If username was banned, it has been removed."});
                                                                });
            chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " has unbanned a user."});                                                                   
            }

        },
        "clearbans":function(data, socket)
        {
            if (socket.info.permissions > 0)
            {
                request.post(phploc + 'actions/bans.php', {form:{ username: "", ip: "", room: socket.info.room, action: "purge"}}, function(error,response,msg){
                    socket.emit('sys-message', {message: "Bans cleared."})
                });
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " has cleared the ban list"});
            }
        },         
        "kick":function(data, socket)
        {
            if (data.userid === undefined){ return;} 
            var indexOfUser = rooms[socket.info.room].indexOfUserByID(data.userid)
            if (indexOfUser > -1)
            {
                var kickSocket = chat_room.sockets.sockets[data.userid];
                if (kickSocket === undefined)
                    return; //Can cause issue where socket is undefined (For now on, anytime accessing sockets.sockets[socket.id] check for undefined)
                if (parseInt(socket.info.permissions,10) > parseInt(kickSocket.info.permissions,10))                
                {        
                  
                    kickSocket.emit('sys-message', {message: "You've been kicked."});
                    kickSocket.disconnect();
                    rooms[socket.info.room].kickAllByIP(kickSocket.info.ip);
                    chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " has kicked a user."});
                }
            }            

        },
        "skip":function(data, socket)
        {
            if (socket.info.loggedin && socket.info.skipped === false)
            {
                socket.info.skipped = true;                
                rooms[socket.info.room].addSkip();
            } 
        },
        "next":function(data, socket)
        {
            if (socket.info.permissions > 0)
            {
                rooms[socket.info.room].nextVid();  
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " used next."});
            }            
        },                 
        "remove":function(data, socket)
        {
            if (socket.info.permissions > 0)
            {
                if (data.info != undefined)
                {
                    rooms[socket.info.room].removeVideo(data.info, true);
                    chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " removed a video."});
                }
            }            
        },
        "purge":function(data, socket)
        {
            if (socket.info.permissions > 0)
            {
                if (data.username != undefined)
                {
                    rooms[socket.info.room].purge(data.username);
                    chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " has purged " + data.username + "'s videos."});                    
                }              
            }     
        },   
        "toggleplaylistlock":function(data, socket)
        {
            if (socket.info.permissions > 0)
            {
                rooms[socket.info.room].togglePlaylistLock();
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " toggled playlist lock."});
            }
        },                            
        "setskip":function(data, socket)
        {
            if (socket.info.permissions > 0)
            {
                if ((data.skip != undefined) && (!isNaN(data.skip)) && (parseInt(data.skip,10) > 0) && (parseInt(data.skip[1]),10) < 100)
                {//defined, a number, 1-100
                    rooms[socket.info.room].setSkip(parseInt(data.skip, 10) / 100);
                    chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " modified skip ratio."});     
                }
            }
        },   
        "resynch":function(data, socket)
        {
            if (rooms[socket.info.room].playing)
                socket.emit('seekTo', {time: rooms[socket.info.room].time()})
            else
            {
                
            }
        },   
        "motd":function(data, socket)
        {
            
            if (data.MOTD != undefined && socket.info.permissions > 0 )
            {   
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " changed the MOTD."});  
                rooms[socket.info.room].setMOTD("MOTD:" + parser.replaceTags(data.MOTD).substring(0,240));
            }
        }, 
        //TEMPORARY COMMANDS (HOPEFULLY) ------------------------------------
        "mod":function(data, socket)
        {
            if (data.username != undefined && socket.info.username.toLowerCase() === socket.info.room.toLowerCase() && socket.info.loggedin) //room owner
            {    
                var username = data.username.split(" "); //be sure name doesnt have spaces
                if (data.username.toLowerCase() != socket.info.username.toLowerCase()) //be sure user doesnt try to mod/unmod themself
                request.post(phploc + 'actions/mods.php', {form:{room: socket.info.room, username: username[0], action: "add"}}, function(error,response,msg){
                    if (chat_room.sockets.sockets[socket.id] != undefined) //check for rare instance that socket disconnected
                    {
                        socket.emit('sys-message', {message: "Mod added."});
                    }             
                });                
                
            }
        },        
        "demod":function(data, socket)
        {
            if (data.username != undefined && socket.info.username.toLowerCase() === socket.info.room.toLowerCase() && socket.info.loggedin) //room owner
            {    
                var username = data.username.split(" "); //be sure name doesnt have spaces
                if (data.username.toLowerCase() != socket.info.username.toLowerCase()) //be sure user doesnt try to mod/unmod themself
                request.post(phploc + 'actions/mods.php', {form:{room: socket.info.room, username: username[0], action: "remove"}}, function(error,response,msg){
                    if (chat_room.sockets.sockets[socket.id] != undefined) //check for rare instance that socket disconnected
                    {
                        socket.emit('sys-message', {message: "Mod remove."});
                    }             
                });                
                
            }
        },   
        "banlist":function(data, socket)
        { 
            if (socket.info.permissions > 0)
            {
                request.post(phploc + 'data/banlist.php', {form:{room: socket.info.room}}, function(error,response,msg){
                    if (chat_room.sockets.sockets[socket.id] != undefined) //check for rare instance that socket disconnected
                    {
                        if (msg == undefined) //list empty
                            msg = "Ban list is empty.";
                        socket.emit('sys-message', {message: msg});
                    }             
                });
            }
        },
        "modlist":function(data, socket)
        {
            if (socket.info.permissions > 0)
            {
                request.post(phploc + 'data/modlist.php', {form:{room: socket.info.room}}, function(error,response,msg){
                    if (chat_room.sockets.sockets[socket.id] != undefined) //check for rare instance that socket disconnected
                    {
                        if (msg == undefined) //list empty
                            msg = "Ban list is empty.";                        
                        socket.emit('sys-message', {message: msg});
                    }             
                });
            }
        },
        "description":function(data, socket)
        { //COMMAND, USERNAME, REASON
            if (data.description != undefined && socket.info.username.toLowerCase() === socket.info.room.toLowerCase() && socket.info.loggedin && (data.description.length < 241))
            {
                request.post(phploc + 'actions/description.php', {form:{room: socket.info.room, description: data.description}}, function(error,response,msg){});
            }
        },
        "move":function(data, socket) 
        { 
            if ((data.info != undefined && data.position != undefined) && (!isNaN(data.position)) && (socket.info.permissions > 0))
            {
                rooms[socket.info.room].moveVideo(data.info, parseInt(data.position));
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " moved a video."});  
            }
        },    
        "clean":function(data, socket)
        { 
            if (socket.info.permissions > 0)
            {
                rooms[socket.info.room].clean();
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " cleaned the playlist."});  
            }
        },
        "save":function(data, socket)
        {
            if (socket.info.permissions > 0 )
            {                   
                rooms[socket.info.room].savePlaylist();
                socket.emit('sys-message', {message: "Playlist saved."});                  
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " has saved the playlist."});                 
            }            
        },
        "poll-create":function(data, socket)
        {
            if (socket.info.permissions > 0 )
            {                   
                if (data.title != undefined && data.title.trim() != "" && data.options != undefined && data.options instanceof Array && data.options.length > 0 && data.options.length <= 10)
                {
                    var title = parser.replaceTags(data.title.toString().substring(0, 240)); //validate title text
                    var options = new Array();
                    for (var i = 0; i < data.options.length; i++)
                    {
                        if (data.options[i].trim() != "")
                            options.push(parser.replaceTags(data.options[i].toString().substring(0, 240)));
                    }
                    var poll = {title: title, options: options};
                    rooms[socket.info.room].createPoll(poll);             
                    chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " created a poll."}); 
                }
            }            
        },
        "poll-vote":function(data, socket)
        {
            if (socket.info.loggedin === true && socket.info.voteinfo.voted === false && data.vote != undefined)
            {
                socket.info.voteinfo.voted = true;
                socket.info.voteinfo.option = data.vote;
                rooms[socket.info.room].addPollVote(data.vote)                
            }            
        },
        "poll-end":function(data, socket)
        {
            if (socket.info.permissions > 0 )
            {
                rooms[socket.info.room].endPoll();  
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " ended a poll."});                
            }
        },
        "lead": function(data, socket)
        {
            if (socket.info.permissions > 0)
            {
                rooms[socket.info.room].makeLead(socket.id);
            }
        },
        "unlead": function(data, socket)
        {
            if (socket.info.permissions > 0 && rooms[socket.info.room].isLeader(socket.id)) //is user leader of room
            {
                rooms[socket.info.room].makeLead(null);
            }            
        },
        "seekto":function(data, socket)
        {
            if (socket.info.permissions > 0 && rooms[socket.info.room].isLeader(socket.id))
            {
                if ((data.time !== undefined) && (!isNaN(data.time)))
                {    
                    rooms[socket.info.room].seekTo(parseInt(data.time));
                    chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " seekedto."});                    
                }
            }
        },
        "seekfrom":function(data, socket)
        {
            if (socket.info.permissions > 0 && rooms[socket.info.room].isLeader(socket.id))
            {
                if ((data.time !== undefined) && (!isNaN(data.time)))
                {
                    rooms[socket.info.room].seekFrom(parseInt(data.time,10));
                    chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " seekedfrom."});                         
                }
            }
        },           
        "play":function(data, socket)
        {
            if (data.info === undefined){ return;}
            if (socket.info.permissions > 0 && rooms[socket.info.room].isLeader(socket.id))
            {
                rooms[socket.info.room].play(data.info);
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " played a video."});
            }
        },
        "pause":function(data, socket)
        {
            if (socket.info.permissions > 0 && rooms[socket.info.room].isLeader(socket.id))
            {
                rooms[socket.info.room].pause(); 
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " paused the video."});
            }
        }, 
        "resume":function(data, socket)
        {
            if (socket.info.permissions > 0 && rooms[socket.info.room].isLeader(socket.id))
            {
                rooms[socket.info.room].resume();
                chat_room.sockets.in(socket.info.room).emit('log', {message: socket.info.username + " resumed the video."});
            }
        }    
        //---
    }