/*
    <InstaSynch - Watch Videos with friends.>
    Copyright (C) 2013  InstaSynch

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    http://opensource.org/licenses/GPL-3.0
*/

$(function () {
    var room = new webSocket();
    sendcmd = room.sendcmd;
    var sendMsg = function () {
        if ($('#cin').val().trim() != '') 
        {
            room.sendmsg(($('#cin').val()));
            $('#cin').val('');
        }
    };
    var handleKeyPress = function (e) {
        if (e.which == 13) {
            if ($('#join').is(':focus')) 
            {
                join();
            } 
            else 
            {
                if ($('#loginUsername')['is'](':focus')) 
                {
                    //login();
                } 
                else 
                {
                    if ($('#loginPassword')['is'](':focus')) 
                    {
                        //login();
                    } 
                    else 
                    {
                        sendMsg();
                    }
                }
            }
        }
    };
    var join = function () 
    {
        if (validateJoin($('#join').val())) 
        {
            room.rename($('#join').val());
        } 
        else 
        {
            $('#join').val('');
        }
    };
    function validateJoin(username) 
    {
        if (username == '') 
        {
            return false;
        }
        if (username['match'](/^([A-Za-z0-9]|([-_](?![-_]))){1,16}$/) != null) 
        {
            for (var i = 0; i < users['length']; i++) 
            {
                if (username['toLowerCase']() == users[i]['username']['toLowerCase']()) 
                {
                    alert('Name in use.');
                    return false;
                }
            }
            return true;
        } 
        else 
        {
            alert('Input was not a-z, A-Z, 1-16 characters.');
            return false;
        }
    }
    $(document).ready(function () 
    {      
        $('#addUrl').click(function () {
            var url = $('#URLinput').val();
            if ($('#URLinput').val().trim() != '')
            {
                sendcmd('add', {URL: url});
            }
            $('#URLinput').val('');
        });
        $('#toggleplaylistlock').click(function () {
            room.sendcmd('toggleplaylistlock', null);
        });
        $('#btn-join').click(function () {
            join();
        });
        $('#skip').click(function () {
            room.sendcmd('skip', null);
        });
        $('#resynch').click(function () {
            room.sendcmd('resynch', null);
        });
        $('#reload').click(function () {
            video.destroyPlayer();
            room.sendcmd('reload', null);
        });
        $('#cin')['focus'](function () {
            document['title'] = 'InstaSynch';
            newMsg = false;
        });
        $('#ban').click(function () {
            sendcmd('ban', { userid: $(this)['data']('id')});
        });
        $('#kick').click(function () {
            sendcmd('kick', {userid: $(this)['data']('id') });
        });
        //POLL STUFF
        $(".close-poll").click(function()
        {
            sendcmd("poll-end", null);
        });
        $("#add-option").click(function()
        {
            $('<input/>',{
            'class':'formbox create-poll-option',
            'placeholder':'Option'}).insertBefore($(this)); 
            $('<br>',{}).insertBefore($(this));
        })
        $("#submit-poll").click(function()
        {
            var poll = new Object();
            poll.title = $("#title").val();
            poll.options = new Array();
            $(".create-poll-option").each(function(index){
                var option = $(this).val();
                if (option.trim() != "")
                    poll.options.push(option);
            });
            sendcmd("poll-create", poll);
        });
        $('#bio').hover(function () {
            mouseOverBio = true;
        }, function () {
            $('#bio').hide();
            mouseOverBio = false;
        });
        //Player Controller
        $( "#slider" ).slider(
        {
            "slide":function(event, ui)
            {
                $("#sliderCurrentTime").html(secondsToTime(ui.value));
                
            },
            "start": function(event, ui)
            {
                $("#slider").data("sliding", true);
            },
            "stop":function(event, ui)
            {
                //sendcmd("seekTo", ui.valie)
                sendcmd("seekto", {time: ui.value});
                $(this).data("sliding", false);
            }
        });
        $("#slider").data("sliding", false); //do not update timer while sliding
        $("#play").click(function()
        {
            sendcmd("resume", null);
        });
        $("#pause").click(function()
        {
            sendcmd("pause", null);
        });
        $("#lead").click(function()
        {
            sendcmd("lead", null);
        })
        $("#unlead").click(function()
        {
            sendcmd("unlead", null);
        })
        $('#mute').click(function()
        {
            mute($(this).data('ip'));
            $("#mute").hide();
            $("#unmute").show();
        });
        $("#unmute").click(function()
        {
            unmute($(this).data('ip'));
            $("#mute").show();
            $("#unmute").show();
        });
        //(C) BibbyTube, (C) Faqqq
        //https://github.com/Bibbytube/Instasynch/blob/master/Chat%20Additions/Autoscroll%20Fix/autoscrollFix.js
        $('#chat_list').on('scroll',function()
        {
            var scrollHeight = $(this)[0].scrollHeight,
                scrollTop = $(this).scrollTop(),
                height = $(this).height();

            //scrollHeight - scrollTop will be 290 when the scrollbar is at the bottom
            //height of the chat window is 280, not sure where the 10 is from
            if ((scrollHeight - scrollTop) < height*1.1){
                autoscroll = true;
            }else{
                autoscroll = false;
            }
        });
        //-----------------------
        room.connect();
    });
    $(document)['keypress'](handleKeyPress);
    
    var filterGreyname = false; 
    function webSocket() {
        var server = window.location.hostname + ":38000";
        var lastMsg = null;
        var delay = 0;
        var socket = null;      
        socket = io.connect(server, 
        {
            reconnect: true,
            "force new connection": false,
            "try multiple transports": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 5,
            "auto connect": false
        });
        this.sendmsg = function (message) {
            var d = new Date();
            message = message.substring(0, 240);
            if (d.getTime() > lastMsg + delay) 
            {
                if (message[0] == "'") 
                {
                    var arguments = message['split'](' ');
                    if (commands[arguments[0]['toLowerCase']()] != undefined) {
                        commands[arguments[0]['toLowerCase']()](arguments);
                    }
                }
                else
                {
                    socket.emit('message', {message: message}); 
                }
                lastMsg = d['getTime']();
            }
        };
        this.sendcmd = function (command, data) {
            socket.emit('command', {command: command, data: data});
        };
        this.rename = function (username) {
            socket.emit('rename', {username: username});
        };
        this.disconnect = function () {
            socket.disconnect();
        };
        this.connect = function () {
            socket.socket.connect();
        };
        socket.on('sys-message', function (data) {
            addMessage('', data.message, '', 'hashtext');
        });
        socket.on('rename', function (data) {
            renameUser(data.id, data.username);
            if (data['id'] == userInfo['id']) {
                userInfo['username'] = data['username'];
                join = null;
                $('#btn-join')['unbind']('click');
                $('#join-chat')['remove']();
                $('#addVid')['css']('visibility', 'visible');
                $('#cin')['removeClass']('hide');
                $('#cin')['removeAttr']('disabled');
                $('#cin')['focus']();
                $('#URLinput')['removeAttr']('disabled');               
            }
        });
        socket.on('connecting', function () {
            addMessage('', 'Connecting..', '', 'hashtext');
        });
        socket.on('connect', function () {
            addMessage('', 'Connection Successful!', '', 'hashtext');
            if ($['cookie']('username') === undefined || $['cookie']('sessionid') === undefined) 
            {
                socket.emit('join', { username: '', cookie: '', room: ROOMNAME});
            } 
            else 
            {
                socket.emit('join', {username: $['cookie']('username'),cookie: $['cookie']('sessionid'), room: ROOMNAME});
            }
        });
        socket.on('reconnecting', function (data) {
            addMessage('', 'Reconnecting...', 'system-msg');
        });
        socket.on('reconnected', function (data) {});
        socket.on('disconnect', function (data){
        });
        socket.on('userinfo', function (data) {
            if (userInfo == null) 
            {
                userInfo = data;
                if (data['loggedin']) 
                {
                    join = null;
                    $('#btn-join')['unbind']('click');
                    $('#join-chat')['remove']();
                    $('#addVid')['css']('visibility', 'visible');
                    $('#cin')['removeClass']('hide');
                    $('#cin')['removeAttr']('disabled');
                    $('#cin')['focus']();
                    $('#URLinput')['removeAttr']('disabled');
                }
                else 
                {
                    $('#join-chat')['show']();
                    $('#addVid')['css']('visibility', 'hidden');
                    $('#cin')['show']();
                    $('#cin')['attr']('disabled', 'true');
                    $('#URLinput')['attr']('disabled', 'true');
                }
                if (data['permissions'] > 0) 
                {
                    $('.mod')['css']('visibility', 'visible');
                    //$( "#ulPlay" ).disableSelection(); I don't think this did anything               
                    isMod = true;
                }
            } 
            else 
            {
                if (userInfo['loggedin'] == false && userInfo['username'] != 'unnamed') 
                {
                    //socket.emit('rename', {username: userInfo['username']});
                }
                userInfo = data;
            }
        });
        socket.on('playlist', function (data) {
            loadPlaylist(data.playlist);
        });
        socket.on('userlist', function (data) {
            loadUserlist(data.userlist);
        });
        socket.on('room-event', function (data) 
        {
            if (data.action === 'playlistlock') 
            {
                playlistlock(data['data']);
            }
            if (data.action === 'poll-create') 
            {
                createPoll(data.poll);
            }
            if (data.action === 'poll-end') 
            {
                endPoll();
            }
            if (data.action === 'poll-addVote') 
            {
                addPollVote(data.option);
            }
            if (data.action === 'poll-removeVote')
            {
                removePollVote(data.option);
            }
            if (data.action === 'leader')
            {
                makeLeader(data.userId);
                if (data.userId === userInfo.id)
                {
                    isLeader = true;
                    $(".leader").show();
                    $( "#ulPlay" ).sortable(
                    {
                        update : function (event, ui){
                                    sendcmd('move', {info: ui.item.data("info"), position: ui.item.index()});
                                    $( "#ulPlay" ).sortable( "cancel" );
                                 },
                         start: function(event,ui)
                         {
                             //Prevents click event from triggering when sorting videos
                             $("#ulPlay").addClass('noclick');
                         }
                        
                    });
                    sliderTimer = setInterval(function()
                    {
                       video.time(function(time)
                       {
                           if ($("#slider").data("sliding") === false)
                           {
                               time = Math.round(time);
                               $( "#slider" ).slider("option", "value", time);
                               $("#sliderCurrentTime").html(secondsToTime(time));
                           }
                       });
                    }, 1000);
                    
                    $("#lead").hide();
                    $("#unlead").show();
                }
                else
                {
                    if (isLeader)
                    {
                        isLeader = false;
                        if (sliderTimer != false)
                        {
                            clearTimeout(sliderTimer);
                            sliderTimer = false;
                        }
                        $(".leader").css("display", "none");
                        $("#ulPlay").sortable("disable");
                        $("#unlead").hide();
                        if (isMod)
                        {
                            $("#lead").show();
                        }
                    }
                }
            }
        });
        socket.on('add-user', function (data) 
        {
            var user = data['user'];
            var room7 = '';
            if (user['loggedin']) {
                room7 += 'b ';
                if (user['permissions'] > 0) {
                    room7 += 'm ';
                }
            }
            addUser(data['user'], room7, true);
        });
        socket.on('remove-user', function (data) 
        {
            removeUser(data['userId']);
        });
        socket.on('chat', function (data) 
        {
            var user = data['user'];
            if (filterGreyname === true) 
            {
                if (user.loggedin === false) 
                {
                    return;
                }
            }
            if (isMuted(user.ip))
            {
                return;
            }
            var userstyle = '';
            if (user.loggedin) {
                userstyle += 'r ';
            }
            addMessage(user.username, data.message, userstyle, '');
        });
        socket.on('add-vid', function (data) {
            addVideo(data.info);
        });
        socket.on('remove-vid', function (data) {
            removeVideo(data.info);
        });
        socket.on('move-vid', function (data) {
            moveVideo(data.info, data.position);
        });
        socket.on('play', function (data) {
            playVideo(data.info, data.time, data.playing);
        });
        socket.on('resume', function (data) {
            resume();
        });
        socket.on('pause', function (data) {
            pause();
        });
        socket.on('seekTo', function (data) {
            seekTo(data.time);
        });
        socket.on('skips', function (data) {
            skips(data.skips, data.skipsneeded);
        });
        socket.on('purge', function (data) {
            purge(data.username);
        });
        socket.on('log', function (data) {
            console.log(data.message);
        });
    }
    var commands = {
        "'ban": function (data) {
            var banUserID = null;
            for (var i = 0; i < users['length']; i++) {
                if (users[i].username.toLowerCase() === data[1].toLowerCase()) {
                    banUserID = users[i].id;
                }
            }
            sendcmd('ban', {userid: banUserID});
        },
        "'unban": function (data) {
            sendcmd('unban', {username: data[1]});
        },
        "'clearbans": function (data) {
            sendcmd('clearbans', null);
        },
        "'kick": function (data) {
            var kickUserID = null;
            for (var i = 0; i < users['length']; i++) {
                if (users[i]['username']['toLowerCase']() === data[1]['toLowerCase']()) {
                    kickUserID = users[i]['id'];
                }
            }
            sendcmd('kick', {userid: kickUserID});
        },
        "'next": function (data) {
            sendcmd('next', null);
        },
        "'remove": function (data) {
            if (!isNaN(data[1])) {
                sendcmd('remove', {info: playlist[data[1]].info});
            }
        },
        "'purge": function (data) {
            sendcmd('purge', {username: data[1]});
        },
        "'play": function (data) {
            if (!isNaN(data[1])) {
                sendcmd('play', {
                    info: playlist[data[1]].info
                });
                
            }
        },
        "'pause": function (data) {
            sendcmd('pause', null);
        },
        "'resume": function (data) {
            sendcmd('resume', null);
        },
        "'seekto": function (data) {
            if (!isNaN(data[1])) {
                sendcmd('seekto', {time: data[1]});
            }
        },
        "'seekfrom": function (data) {
            if (!isNaN(data[1])) {
                sendcmd('seekfrom', {time: data[1]});
            }
        },
        "'setskip": function (data) {
            if (!isNaN(data[1])) {
                sendcmd('setskip', {skip: data[1]});
            }
        },
        "'resynch": function (data) {
            sendcmd('resynch', null);
        },
        "'motd": function (data) {
            data.splice(0, 1);
            sendcmd('motd', {MOTD: data.join(' ')});
        },
        "'mod": function (data) {
            sendcmd('mod', {username: data[1]});
        },
        "'demod": function (data) {
            sendcmd('demod', {username: data[1]});
        },
        "'banlist": function (data) {
            sendcmd('banlist', null);
        },
        "'modlist": function (data) {
            sendcmd('modlist', null);
        },
        "'description": function (data) {
            data['splice'](0, 1);
            sendcmd('description', {description: data['join'](' ')});
        },
        "'move": function (data) {
            if (!isNaN(data[1]) && !isNaN(data[2])) {
                sendcmd('move', {info: playlist[data[1]].info,position: data[2]});
            }
        },
        "'clean": function (data) {
            sendcmd('clean', null);
        },
        "'togglefilter": function (data) {
            filterGreyname = !filterGreyname;
        },      
        "'save": function (data) {
            sendcmd("save", null);
        },     
        "'toggleautosynch": function (data) {
            toggleAutosynch();
        },
        "'leaverban": function (data) {
            sendcmd("leaverban", {username: data[1]});
        },        
        "'lead": function (data) {
            sendcmd("lead", null);
        },   
        "'unlead": function (data) {
            sendcmd("unlead", null);
        }           
    };
});