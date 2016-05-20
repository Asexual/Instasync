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
var users = new Array();
var playlist = new Array();
playlist.move = function (old_index, new_index) //Code is property of Reid from stackoverflow
{ 
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
};
var totalTime = 0;
var messages = 0;
var MAXMESSAGES = 175;
var mouseOverBio = false;
var autoscroll = true;
var isMod = false;
var isLeader = false;
var sendcmd = null;
var video = null;
var sliderTimer = false;
var mutedIps = new Array();
var userInfo = null;

//TODO: Put globals into a global object
$(document).ready(function()
{
   video = new player("media");

});
function addMessage(username, message, userstyle, textstyle) {
    message = linkify(message, false, true);
    $('<span/>', {
        "class": 'cun c1m ' + userstyle,
        "id": '',
        "css": {
            "padding-left": '10px'
        },
        "html": username + ':'
    }).appendTo('#chat_list');
    if (message[0] == '/' && $codes[message.substring(1)] != undefined) 
    {
        var emote = message['substring'](1);
        $('<span/>', {
            "class": 'cm',
            "html": $codes[emote]
        }).appendTo('#chat_list');
    } 
    else 
    {
        if (message['substring'](0, 4) == '&gt;') {
            textstyle = 'greentext';
        }
        if (message[0] == '#') {
            textstyle = 'hashtext';
        }
        $('<span/>', {
            "class": 'cm ' + textstyle,
            "id": '',
            "css": {},
            "html": message
        }).appendTo('#chat_list');
    }
    $('#chat_list').append($('<br/>'));
    if (autoscroll === true) {
        var textarea = document.getElementById('chat_list');
        textarea.scrollTop = textarea.scrollHeight;
    }
    if (!$('#cin')['is'](':focus')) {
        document.title = ' New message! :)';
        newMsg = true;
    }
    messages++;
    cleanChat();
}
function cleanChat() 
{
    //(C) Faqqq, (C) BibbyTube 
    //https://github.com/Bibbytube/Instasynch/blob/master/Chat%20Additions/Autoscroll%20Fix/autoscrollFix.js
    var max = MAXMESSAGES;
    //increasing the maximum messages by the factor 2 so messages won't get cleared
    //and won't pile up if the user goes afk with autoscroll off
    if(!autoscroll){
        max = max*2;
    }
    while(messages > max){
        $('#chat_list > :first-child').remove(); //span user
        $('#chat_list > :first-child').remove(); //span message
        $('#chat_list > :first-child').remove(); //<br>
        messages--;
    }
}
function addUser(user, css, sort) {
    user.css = css;
    var muted = isMuted(user.ip) ? "muted" : "";
    users.push(user);
    var userElement = $('<div/>', {
        "class": "user_list " + muted,
        "data": {username: String(user.username), id: user.id, css: css
        },
        "click": function () {
            $('#cin')['val']($('#cin')['val']() + $(this).data('username'));
            $('#cin')['focus']();
        },
        "css": {
            "cursor": 'default'
        }
    }).append($('<div/>', {"class": css})
    .append($('<span/>', {"html": user.username})));
    userElement.hover(function () 
    {
        var thisElement = $(this);
        $(this).data('hover', setTimeout(function () 
        {
            $('#bio .username span').html(thisElement.data('username'));
                                                          //$("#chat").offset().top is the offten from the top of the page, Use turnary operation: If bio goes above chat, minus some pixels
            $('#bio').css('top', ((thisElement.offset().top - $("#chat").offset().top - 15) < -10 ? -10 : thisElement.offset().top - $("#chat").offset().top - 15)); //cant be less than -10 pixels
            $('#bio .avatar img').attr('src', '');
            $('#bio .userinfo').html('');
            $('#bio').show();
            if (thisElement.data('css').indexOf('b') != -1) 
            {
                getUserInfo(thisElement.data('username'), function (avatar, bio) {
                    $('#bio .avatar img').attr('src', avatar);
                    $('#bio .userinfo').html(bio);
                });
            } else {
                $('#bio .userinfo').html('<span style=\'color: grey;\'>Unregistered</span>');
            }
            $('#ban').data('id', user['id']);
            $('#kick').data('id', user['id']);
            $('#mute').data('ip', user.ip);
            $('#unmute').data('ip', user.ip)
            //show or hide mute/unmute buttons
            if (isMuted(user.ip))
            {
                $("#unmute").show();
                $("#mute").hide();
            }
            else
            {
                $("#mute").show();
                $("#unmute").hide();                
            }
        }, 600));
    }, function () {
        clearTimeout($(this).data('hover'));
        setTimeout(function () {
            if (!mouseOverBio) {
                $('#bio').hide();
            }
        }, 50);
    });
    $('#chat_users').append(userElement);
    $('#viewercount').html(users.length);
    if (sort === true) {
        sortUserlist();
    }
}
function removeUser(id) {
    for (var i = 0; i < users.length; i++) 
    {
        if (id === users[i].id) 
        {
            users['splice'](i, 1);
            $($('#chat_users').children('div')[i]).remove();
            break;
        }
    }
    $('#viewercount').html(users.length);
}
function makeLeader(userId)
{
    $("#leaderSymbol").remove();
    for (var i = 0; i < users.length; i++) 
    {
        if (users[i].id == userId) 
        {
            var leaderElement = $("<img />", {
                "id":"leaderSymbol",
                "src":"/images/leader.png",
                "height":"16px",
                "width":"16px"
            });
            $($("#chat_users .user_list div")[i]).prepend(leaderElement);
            break;
        }
    }    
}
function renameUser(id, username) {
    for (var i = 0; i < users.length; i++) 
    {
        if (users[i].id == id) 
        {
            users[i].username = username;
            $($('#chat_users div span')[i]).html(username);
            $($('#chat_users .user_list')[i]).data('username', username);
            break;
        }
    }
    sortUserlist();
}
function sortUserlist() {
    var userlist = $('#chat_users .user_list')['clone'](true);
    userlist.sort(function (a, b) {
        var keyA = $(a).data('username').toLowerCase();
        var keyB = $(b).data('username').toLowerCase();
        if (keyA < keyB) {
            return -1;
        }
        if (keyA > keyB) {
            return 1;
        }
        return 0;
    });
    userlist.sort(function (a, b) {
        var keyA = $(a).data('css');
        var keyB = $(b).data('css');
        if (keyA > keyB) {
            return -1;
        }
        if (keyA < keyB) {
            return 1;
        }
        return 0;
    });
    $('#chat_users').empty();
    $('#chat_users').html(userlist);
    users.sort(function (a, b) {
        var keyA = a.username.toLowerCase();
        var keyB = b.username.toLowerCase();
        if (keyA < keyB) {
            return -1;
        }
        if (keyA > keyB) {
            return 1;
        }
        return 0;
    });
    users.sort(function (a, b) {
        var keyA = a.css;
        var keyB = b.css;
        if (keyA > keyB) {
            return -1;
        }
        if (keyA < keyB) {
            return 1;
        }
        return 0;
    });
}
function addVideo(vidinfo) {
    playlist.push({info: vidinfo.info, title: vidinfo.title, addedby: vidinfo.addedby, duration: vidinfo.duration});
    if (vidinfo.title.length > 55) 
    {
        vidinfo.title = vidinfo.title.substring(0, 55);
        vidinfo.title += '...';
    }
    var li = $('<li/>', {"data": {info: vidinfo.info}});
    var plinfo = $('<div/>', {"class": 'pl-info'});
        var plinfo_title = $('<div/>', 
        {
            "class": 'play title',
            "title": vidinfo.title,
            "html": vidinfo.title,
            "data": {
                info: vidinfo.info
            },
            "click": function () 
            {
                if ($("#ulPlay").hasClass("noclick"))
                {
                    $("#ulPlay").removeClass('noclick');
                }
                else
                {
                    if (isLeader)
                    {
                        sendcmd('play', {info: $(this).data("info")});
                    }
                    else
                    {
                        $('#cin').val($('#cin').val() + getVideoIndex($(this).parent().parent().data('info')) + ' ');
                        $('#cin').focus();
                    }
                }
            }
        }).append($('<span/>', {
            "class": 'via',
            "html": ' via ' + vidinfo.addedby
        }));
        var plinfo_duration = $('<div/>', {
            "class": 'duration',
            "html": secondsToTime(vidinfo.duration)
        });
        var vidlink = '';
        if (vidinfo.info.provider === 'youtube') {
            vidlink = 'http://www.youtube.com/watch?v=' + vidinfo.info.id;
        } 
        else if (vidinfo.info.provider === 'vimeo') {
            vidlink = 'http://vimeo.com/' + vidinfo.info.id;
        }
        else if (vidinfo.info.provider === 'twitch') {
            if (vidinfo.info.mediaType === "stream")
                vidlink = 'http://twitch.tv/' + vidinfo.info.channel;
        }        
        var expand = $('<div/>', {
            "class": 'expand'
        }).append($('<a/>', {
            "href": vidlink,
            "target": '_blank'
        }).append($('<img/>', {
            "src": '/images/expand.png'
        })));
        var removeBtn = $('<div/>', {
            "class": 'removeBtn x',
            "html": '',
            "click": function () {
                sendcmd('remove', {info: $(this).parent().parent().data('info')});
            }
        });
    $('#ulPlay').append(li.append(plinfo.append(plinfo_title).append(plinfo_duration).append(expand).append(removeBtn)));
    totalTime += vidinfo.duration;
    $('.total-videos').html(playlist.length + ' videos');
    $('.total-duration').html(secondsToTime(totalTime));
}
function removeVideo(vidinfo) {
    var indexOfVid = getVideoIndex(vidinfo);
    if (indexOfVid > -1 && indexOfVid < playlist.length) {
        totalTime -= playlist[indexOfVid].duration;
        playlist.splice(indexOfVid, 1);
        $($('#ulPlay').children('li')[indexOfVid]).remove();
    }
    $('.total-videos').html(playlist.length + ' videos');
    $('.total-duration').html(secondsToTime(totalTime));
}
function moveVideo(vidinfo, position) {
    var indexOfVid = getVideoIndex(vidinfo);
    if (indexOfVid > -1) {
        playlist.move(indexOfVid, position);
        var playlistElements = $('#ulPlay li').clone(true);
        playlistElements.move = function (old_index, new_index) {
            if (new_index >= this.length) {
                var k = new_index - this.length;
                while ((k--) + 1) {
                    this.push(undefined);
                }
            }
            this.splice(new_index, 0, this.splice(old_index, 1)[0]);
        };
        playlistElements.move(indexOfVid, position);
        $('#ulPlay').empty();
        $('#ulPlay').html(playlistElements);
    }
}
function getVideoIndex(vidinfo) {
    for (var i = 0; i < playlist.length; i++) {
        if (JSON['stringify'](playlist[i]['info']) === JSON['stringify'](vidinfo)) {
            return i;
        }
    }
    return -1;
}
function playlistlock(value) {
    if (value == true) {
        $('#toggleplaylistlock img')['attr']('src', '/images/lock.png');
    } else {
        $('#toggleplaylistlock img')['attr']('src', '/images/unlock.png');
    }
}
function toggleAutosynch()
{
    video.autosynch = !video.autosynch;
}
function playVideo(vidinfo, time, playing) {
    var addedby = '';
    var title = '';
    var indexOfVid = getVideoIndex(vidinfo);
    if (indexOfVid > -1) 
    {
        title = playlist[indexOfVid].title;
        addedby = playlist[indexOfVid].addedby;
        $('.active').removeClass('active');
        $($('#ulPlay').children('li')[indexOfVid]).addClass('active');
        $('#vidTitle').html(title + '<div class=\'via\'> via ' + addedby + '</div>');
        video.play(vidinfo, time, playing);   
        $( "#slider" ).slider("option", "max", playlist[indexOfVid].duration);
        $("#sliderDuration").html("/" + secondsToTime(playlist[indexOfVid].duration))
    }
}
function resume() {
        video.resume();
}
function pause() {
        video.pause();
}
function seekTo(time){
        video.seekTo(time);
}
function purge(username) {
    for (var i = playlist.length - 1; i >= 0; i--) 
    {
        if (playlist[i].addedby.toLowerCase() == username.toLowerCase()) {
            removeVideo(playlist[i].info);
        }
    }
}
function skips(skips, skipsNeeded) {
    $('#skipCounter').html(skips + '/' + skipsNeeded);
}
function loadPlaylist(data) {
    playlist.length = 0;
    totalTime = 0;
    $('#ulPlay').html('');
    if (data != undefined && data.length != 0) {
        for (var i = 0; i < data.length; i++) {
            addVideo(data[i]);
        }
    }
}
function loadUserlist(userlist) {
    users = new Array();
    $('#chat_users').html('');
    for (var i = 0; i < userlist.length; i++) {
        var user = userlist[i];
        var css = '';
        if (user['loggedin']) {
            css += 'b ';
            if (user['permissions'] > 0) {
                css += 'm ';
            }
        }
        addUser(user, css, false);
        sortUserlist();
    }
}
function secondsToTime(num) 
{
    var hours   = Math.floor(num / 3600);
    var minutes = Math.floor((num - (hours * 3600)) / 60);
    var seconds = num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time = "";
    if (hours != 0){ time+= hours + ':' }
    time += minutes+':'+seconds;
    return time;
}
function createPoll(poll) //poll.title, poll.options = array of {option, votes}
{    
    $(".st-poll").css('display', '');    
    $(".poll-title").html(poll.title);
    var choices = $(".poll-results.choices");  
    $(choices).empty();
    for(var i = 0; i < poll.options.length; i++)
    {
        var choice = 
        $("<div/>",
        {
            "class":"poll-item choice"
        }).append($("<span/>",
        {
            "class":"poll-vote-btn basic-btn vote_choice",
            "html":poll.options[i].votes,
            "data":{option: i},
            "click": function(){ 
                if (userinfo.loggedin)
                {
                    
                }
                else
                {
                    sendcmd("poll-vote", {vote: $(this).data("option")});
                }
            }
        })).append($("<span/>",
        {
            "class":"poll-vote-text",
            "html":linkify(poll.options[i].option, false, true)
        }));
        $(choices).append(choice);
    }
}
function addPollVote(vote)
{
    var element = $(".vote_choice")[vote];
    $(element).html(parseInt($(element).html(), 10) + 1);
}
function removePollVote(vote)
{
    var element = $(".vote_choice")[vote];
    $(element).html(parseInt($(element).html(), 10) - 1);    
}
function endPoll()
{
    $(".st-poll").css('display', 'none');    
}
function mute(ip)
{
    mutedIps[ip] = ip;
    for (var i = 0; i < users.length; i++)
    {
        if (users[i].ip == ip)
        {
            $($(".user_list")[i]).addClass("muted");
        }
    }
}
function unmute(ip)
{
    mutedIps[ip] = undefined;
    for (var i = 0; i < users.length; i++)
    {
        if (users[i].ip == ip)
        {
            $($(".user_list")[i]).removeClass("muted");
        }
    }
}
function isMuted(ip)
{
    if (mutedIps[ip] != undefined)
    {
        return true;
    }
    else
    {
        return false;
    }
}

