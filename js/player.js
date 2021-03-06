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
        console.log("Resynch requested..")
        if (queue === null && this.autosynch)
            queue = setTimeout(function() //prevent to many resynchs
            {
                sendcmd("resynch", null);
                queue = null;
            }, 1000);
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
                else if (vidinfo.provider == "twitch")
                {
                    player = new twitchStream(vidinfo, time, playing);
                }
                setTimeout(function(){ thisPlayer.resynch(); }, 250); //emits resynch in the event that the player should of. This will just get ignored if it already called resynch
        }
        this.loadedVideoInfo = vidinfo;
    }  
    this.time = function(callback) //callback is used as the vimeo player does not return the exact time, its asynch
    {
        if (this.loadedVideoInfo === null)
        {
            callback(0);
        }
        else
        {
            player.time(callback);
        }
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
                if (userTriggered)
                {
                    thisPlayer.resynch();
                }
                paused = false;
                userTriggered = true;
            },
            onPlayerPaused: function () {
                paused = true;
            },
            onPlayerBuffering: function () {

            },
            onQualityChange: function (k2) {}
        });
        $.tubeplayer.defaults.afterReady = function (k3) {
            player = jQuery(media).tubeplayer('player');
//            var isHtml5Player = player.cueVideoByFlashvars;
//            if (isHtml5Player)
//            {
//                console.log("Using HTML5 player is not recomended.");
//                addMessage("","Warning: You are using the HTML5 YouTube player which is not supported. It is recomended that you visit http://www.youtube.com/html5 and click \"Use the default player.\"","","errortext");
//            }
            jQuery(media).tubeplayer('play', {id: vidinfo.id,time: time}); //NOTE: Consider playing the video at 0 and just calling resynch
            if (playing === false) {
                jQuery(media).tubeplayer('pause');
            }
            else
            {
                thisPlayer.resynch();
            }
        }
        this.play = function(vidinfo, time, playing){
            //userTriggered = false; with this commented out, every user will request a resynch right after a video plays
            jQuery(media).tubeplayer('play', {id: vidinfo.id,time: time});
        };
        this.seekTo = function(time)
        {
            userTriggered = false;
            jQuery(media).tubeplayer('seek', time);
        }
        this.resume = function(){
            userTriggered = false;
            jQuery(media).tubeplayer('play');
            thisPlayer.resynch();
        };
        this.pause = function(){
                jQuery(media).tubeplayer('pause');
        };
        this.time = function(callback)
        {
            callback(player.getCurrentTime());
        }
    }
    function vimeoVideo(vidinfo, time, playing) { 
        var autoplay = playing ? 1 : 0;
        $(media).html($('<iframe/>', {
            "id": 'vimeo',
            "src": 'http://player.vimeo.com/video/' + vidinfo.id + '?api=1&autoplay='+ autoplay +'&player_id=vimeo',
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
//            if (playing)
//            {
//                player.api("play");
//                userTriggered = false;
//                player.api("seekTo", time);
//                playing = false;
//            }
        });      
        var paused = null;
        var userTriggered = true;
        function onPlay(data, id) 
        {
            thisPlayer.resynch();
            paused = false;
            userTriggered = true;   
        }
        function onPause(data, id) {
            paused = true;            
        }
        function onSeek(data, id) {
            if (userTriggered === true)
            {
                thisPlayer.resynch();
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
            userTriggered = false;        
            if (time == 0) //The vimeo player freezes up on firefox when doing seekTo 0;
                time = 1;
            player.api('seekTo', time);
        }
        this.resume = function(time)
        {
                if (paused)
                {
                    player.api("play");
                }
                else
                {
                    thisPlayer.resynch();
                }
            
        };
        this.pause = function(){
                player.api("pause");
        };
        this.time = function(callback)
        {
            player.api("getCurrentTime", callback);
        }
}
    function twitchStream(info) //{type = stream/video, channel, vidid}
    {
        var embed = '<object type="application/x-shockwave-flash" height="320" width="550" id="live_embed_player_flash" data="http://www.twitch.tv/widgets/live_embed_player.swf?channel=' + info.channel +'" bgcolor="#000000"><param name="allowFullScreen" value="true" /><param name="allowScriptAccess" value="always" /><param name="allowNetworking" value="all" /><param name="movie" value="http://www.twitch.tv/widgets/live_embed_player.swf" /><param name="flashvars" value="hostname=www.twitch.tv&channel='+info.channel+'&auto_play=true&start_volume=25" /></object>';
        $(media).html(embed);   
        this.time = function(callback)
        {
            callback(0);
        }
        
    }
}