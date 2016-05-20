/*
    <InstaSynch - Watch Videos with friends.>
    Copyright (C) 2013  InstaSynch
    Dependencies: froogaloops.js & tubeplayer.js & io.js

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
function player(elementId) 
{ 
    var userTriggered = true; //all events are assumed to be actived by the user unless this is false
    var player = null;
    var media = $("#"+elementId);
    var thisPlayer = this;

    this.autosynch = true;
    this.loadedVideoInfo = null;
 
    var queue = null; //stores resynch limiter timeout   
    this.resynch = function()
    {
        if (queue === null && this.autosynch)
            queue = setTimeout(function() //prevent to many resynchs
            {
                sendcmd("resynch", null);
                queue = null;
            }, 500);
    }
    this.seekTo = function(time)
    {
        player.seekTo(time);
    }
    this.resume = function()
    {
        player.resume();
    }
    this.pause = function()
    {
        player.pause();
    }
    this.play = function(vidinfo, time, playing)
    {
        if (((this.loadedVideoInfo != null) && vidinfo.provider == this.loadedVideoInfo.provider && vidinfo.mediaType == this.loadedVideoInfo.mediaType) && player !== null) //player loaded
        {
            player.play(vidinfo, time, playing);
        }
        else //player not loaded
        {
                destroyPlayer();
                if (vidinfo.provider == "youtube")
                {
                    player = new youTubeVideo(vidinfo, time, playing);
                    
                }
                else if (vidinfo.provider == "vimeo")
                {
                    player = new vimeoVideo(vidinfo, time, playing);
                }
        }
        this.loadedVideoInfo = vidinfo;
    }  
    this.destroyPlayer = function(){ destroyPlayer(); };
    function destroyPlayer() 
    {
            $(media).tubeplayer('destroy');
            $(media).empty();
            $(media).html("");
            $(media).removeData();
            this.loadedVideoInfo = null;
            player = null;
    }
    function youTubeVideo(vidinfo, time, playing) {
        var player = null;
        var paused = null;
        var userTriggered = true;
        jQuery(media).tubeplayer({width: 550, height: 320, allowFullScreen: 'true', initialVideo: '', preferredQuality: 'default', showControls: 1, showinfo: true,        
            onPlayerPlaying: function () {
                if (userTriggered && !isLeader)
                {
                    thisPlayer.resynch();
                }
                if (isLeader)
                {
                    sendcmd("resume", null);
                }
                paused = false;
                userTriggered = true;
            },
            onPlayerPaused: function () {
                if (paused === true)
                {
                    if (isLeader)
                        sendcmd("seekto", {time: Math.floor(player.getCurrentTime())});
                }
                else
                {   
                    if (isLeader && player.getCurrentTime() != player.getDuration()) //if video happens to be ahead of the server, dont pause when vid stops
                    {
                        sendcmd("pause", null);
                    }
                }
                paused = true;
            },
            onPlayerBuffering: function () {
                //This apparently only gets fired by the html5 player, and very seldom if reliable. 
                //if (lastBuffer < Date.now() - 750)
                //{
                    //synchNeeded = true;
                    //lastBuffer = Date.now();
                //}
            },
            onQualityChange: function (k2) {}
        });
        $.tubeplayer.defaults.afterReady = function (k3) {
            player = jQuery(media).tubeplayer('player');
            var isHtml5Player = !player.cueVideoByFlashvars;
            if (isHtml5Player)
            {
                addMessage("","Warning: You are using the HTML5 YouTube player which is not supported. It is recomended that you visit http://www.youtube.com/html5 and click \"Use the default player.\"","","errortext");
            }
            jQuery(media).tubeplayer('play', {id: vidinfo.id,time: time});
            if (playing === false) {
                jQuery(media).tubeplayer('pause');
            }
        }
        this.play = function(vidinfo, time, playing){
            //userTriggered = false; with this commented out, every user will request a resynch right after a video plays
            jQuery(media).tubeplayer('play', {id: vidinfo.id,time: time});
        };
        this.seekTo = function(time)
        {
            if (!isLeader)
            {
                userTriggered = false;
                jQuery(media).tubeplayer('seek', time); //this doesn't cause double pause that is used to detect user seeking
            }
        }
        this.resume = function(){
            if (!isLeader)
            {
                userTriggered = false;
                jQuery(media).tubeplayer('play');
                thisPlayer.resynch();
            }
        };
        this.pause = function(){
            if (!isLeader)
            {
                jQuery(media).tubeplayer('pause');
            }
        };
    }
    function vimeoVideo(vidinfo, time, playing) { 
        alert(vidinfo.id);
        $(media).html($('<iframe/>', {
            "id": 'vimeo',
            "src": 'http://player.vimeo.com/video/' + vidinfo.id + '?api=1&player_id=vimeo',
            "width": '550',
            "height": '320',
            "frameborder": '0'
        }));
        var iframe = $('#vimeo')[0],
        player = $f(iframe);
        player.addEvent('ready', function() {
            player.addEvent('pause', onPause);
            player.addEvent('play', onPlay);
            player.addEvent('seek', onSeek);
            player.addEvent('playProgress', onPlayProgress); 
            if (playing)
            {
                player.api("play");
                userTriggered = false;
                player.api("seekTo", time);
                playing = false;
            }
        });      
        var paused = null;
        var userTriggered = true;
        function onPlay(data, id) 
        {
            if (userTriggered && !isLeader)
            {
                thisPlayer.resynch();
            }
            else if (userTriggered && isLeader)
            {
                sendcmd("resume", null);
            }
            paused = false;
            userTriggered = true;   
        }
        function onPause(data, id) {
            if (isLeader)
            {
                //Check that video hasn't ended as the player emits pause then finish
                player.api('getCurrentTime', function (time, player_id) {
                    player.api("getDuration", function(duration, player_id)
                    {
                        if (Math.round(time) != duration)
                        {
                            sendcmd("pause", null);
                        }
                    });
                }); 
            }
            paused = true;            
        }
        function onSeek(data, id) {
            if (userTriggered === true)
            {
                if (!isLeader)
                {
                    thisPlayer.resynch();
                }            
                else
                {
                   sendcmd("seekto", {time: data.seconds}); 
                }
            }
            userTriggered = true; //reset user seek to true, all seeks made when this is true are caused by the user
        }   
        var previousPlayProgress = 0;
        var buffering = false;
        function onPlayProgress(data, id) //check if buffering, if buffering resynch as soon as done buffering
        {
            if (buffering)
            {
                if (previousPlayProgress != data.seconds) //no longer buffering
                {
                    //resynch();
                    buffering = false;
                }
            }
            else if (previousPlayProgress === data.seconds)
            {
                buffering = true;
                //console.log("Buffering");
            }

            previousPlayProgress = data.seconds;
        }    
        this.play = function(vidinfo, time, playing){
            $('#vimeo').attr('src', 'http://player.vimeo.com/video/' + vidinfo.id + '?api=1&player_id=vimeo&autoplay=1&t=' + time);
        };
        this.seekTo = function(time)
        {
            if (!isLeader)
            {
                userTriggered = false;                
                player.api('seekTo', time);
            }
        }
        this.resume = function(time){
            if (!isLeader)
            { 
                //Todo maybe?
                //seekTo time
                //Play
                if (paused)
                {
                    player.api("play");
                }
                else
                {
                    thisPlayer.resynch();
                }
            }
        };
        this.pause = function(){
            if (!isLeader)
            {
                player.api("pause");
            }
        };
}
    function twitchStream(info) //{type = stream/video, channel, vidid}
    {
        var embed = '<object type="application/x-shockwave-flash" height="320" width="550" id="live_embed_player_flash" data="http://www.twitch.tv/widgets/live_embed_player.swf?channel=' + info.channel +'" bgcolor="#000000"><param name="allowFullScreen" value="true" /><param name="allowScriptAccess" value="always" /><param name="allowNetworking" value="all" /><param name="movie" value="http://www.twitch.tv/widgets/live_embed_player.swf" /><param name="flashvars" value="hostname=www.twitch.tv&channel='+info.channel+'&auto_play=true&start_volume=25" /></object>';
        $(media).html(embed);        
    }
}


















//resynch.queue = null;
//function resynch() //queue a resnch up with a delay long enough to not trigger flood protection
//{
//    if (resynch.queue === null && autosynch)
//        resynch.queue = setTimeout(function()
//        {
//            sendcmd("resynch", null);
//            resynch.queue = null;
//        }, 500);
//}
//function loadYoutubePlayer2(id, time, playing) {
//    var synchNeeded = true;
//    var lastBuffer = 0;
//    $("#media").data("UserSeek", true);
//    jQuery('#media').tubeplayer({
//        width: 550,
//        height: 320,
//        allowFullScreen: 'true',
//        initialVideo: '',
//        preferredQuality: 'default',
//        showControls: 1,
//        showinfo: true,        
//        onPlay: function (id) {},
//        onPause: function () {},
//        onStop: function () {},
//        onSeek: function (time) {
//            if ($("#media").data("UserSeek") === true)
//            {
//                //console.log("User Seeked to " + time);
//                //if (isLeader)
//                //{
//
//                //}
//                //else    
//                  //  resynch();
//            }
//            else
//            {
//                //console.log("Server seeked to " + time);
//            }
//            //$("#media").data("UserSeek", true); //reset user seek to true, all seeks made when this is true are caused by the user
//        },
//        onMute: function () {},
//        onUnMute: function () {},
//        onPlayerUnstarted: function () {},
//        onPlayerEnded: function () {},
//        onPlayerPlaying: function () {
//            if (synchNeeded) 
//            {
//                resynch();
//                synchNeeded = false;
//            }
//        },
//        onPlayerPaused: function () {
//            synchNeeded = true;
//        },
//        onPlayerBuffering: function () {
//            //limit the speed of the buffering event (Ment for the HTML5 player)
//            if (lastBuffer < Date.now() - 750)
//            {
//                synchNeeded = true;
//                lastBuffer = Date.now();
//            }
//        },
//        onPlayerCued: function () {},
//        onQualityChange: function (k2) {
//            synchNeeded = true;
//        }
//    });
//    $.tubeplayer.defaults.afterReady = function (k3) {
//        var player = jQuery('#media').tubeplayer('player');
//        player.addEventListener("onStateChange", test);
//        function test(state)
//        {
//            console.log(state);
//        }
//        jQuery('#media').tubeplayer('play', {id: id,time: time});
//        if (playing === false) {
//            jQuery('#media').tubeplayer('pause');
//        }
//    }
//    loadedPlayer = 'youtube';
//}
//function loadVimeoVideo(id, time, playing) {
//    if (loadedPlayer !== 'vimeo') {
//        destroyPlayer();
//    }    
//    $('#media').html($('<iframe/>', {
//        "id": 'vimeo',
//        "src": 'http://player.vimeo.com/video/' + id + '?api=1&player_id=vimeo&autoplay=1#t=' + time,
//        "width": '550',
//        "height": '320',
//        "frameborder": '0'
//    }));
//    var iframe = $('#vimeo')[0],
//        player = $f(iframe);
//        player['addEvent']('ready', function () {
//        player['addEvent']('pause', onPause);
//        player['addEvent']('play', onPlay);
//        player['addEvent']('seek', onSeek);
//        player['addEvent']('playProgress', onPlayProgress);        
//        $('#vimeo').data('player', player);
//    });
//    var synchNeeded = false;
//    function onPause(data, id) {
//        //synchNeeded = true;
//        //console.log("pause..");
//        //paused = true;
//    }
//    function onPlay(data, id) {
//        resynch();
//    }
//    $("#media").data("UserSeek", true);
//    function onSeek(data, id) {
//        if ($("#media").data("UserSeek") === true)
//        {
//            if (isLeader)
//            {
//                    
//            }
//            else    
//                resynch();
//        }
//        $("#media").data("UserSeek", true); //reset user seek to true, all seeks made when this is true are caused by the user
//    }   
//    
//    var previousPlayProgress = 0;
//    var buffering = false;
//    function onPlayProgress(data, id) //check if buffering, if buffering resynch as soon as done buffering
//    {
//        if (buffering)
//        {
//            if (previousPlayProgress != data.seconds) //no longer buffering
//            {
//                resynch();
//                buffering = false;
//            }
//        }
//        else if (previousPlayProgress === data.seconds)
//        {
//            buffering = true;
//            console.log("Buffering");
//        }
//        
//        previousPlayProgress = data.seconds;
//    }    
//    loadedPlayer = 'vimeo';
//}
//function loadTwitch(info) //{type = stream/video, channel, vidid}
//{
//    if (info.type == "stream") 
//    {
//        destroyPlayer();
//        var embed = '<object type="application/x-shockwave-flash" height="320" width="550" id="live_embed_player_flash" data="http://www.twitch.tv/widgets/live_embed_player.swf?channel=' + info.channel +'" bgcolor="#000000"><param name="allowFullScreen" value="true" /><param name="allowScriptAccess" value="always" /><param name="allowNetworking" value="all" /><param name="movie" value="http://www.twitch.tv/widgets/live_embed_player.swf" /><param name="flashvars" value="hostname=www.twitch.tv&channel='+info.channel+'&auto_play=true&start_volume=25" /></object>';
//        $("#media").html(embed);
//        loadedPlayer = 'twitch-stream';        
//    }    
//}
//
//
//function seekTo(time){
//    if (loadedPlayer === 'youtube') 
//    {
//        jQuery('#media').tubeplayer('seek', time);
//    } 
//    else if (loadedPlayer === 'vimeo') 
//    {
//        $('#vimeo').data('player').api('seekTo', time);
//    }
//    $("#media").data("UserSeek", false)
//}
//function resume() {
//    if (loadedPlayer === 'youtube') {
//        jQuery('#media').tubeplayer('resume');
//    } else {
//        if (loadedPlayer === 'vimeo') {
//            $('#vimeo').data('player').api('play');
//        }
//    }
//}
//function pause() {
//    if (loadedPlayer === 'youtube') {
//        jQuery('#media').tubeplayer('pause');
//    } else {
//        if (loadedPlayer === 'vimeo') {
//            $('#vimeo').data('player').api('pause');
//        }
//    }
//}