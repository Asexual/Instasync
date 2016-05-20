<?php
    //if(file_get_contents("http://www.winmxunlimited.net/utilities/api/proxy/check.php?ip=".$_SERVER['REMOTE_ADDR']) != "0")
//{
      //echo "Proxy/Tor detected! If you feel you've reached this message by error, please email admin@instasynch.com";
      //echo "Also, this could just be a temporary error with the IP resolver. Please dont panic and just wait it out :-)";
      //exit();
//}
    if(strpos($_SERVER['HTTP_HOST'], "instasynch.com") === false)
    {
        header('HTTP/1.0 404 Not Found');
	echo "Domain mismatch.";
	exit();
    }
?>
<?php 
    $roomname = str_replace("/", "", $_GET["filename"]);
    $visits = 0;
    $about = "";
    $description  = "";
    $nsfw = 0;
    $listing = "";
    
    require 'c:/wamp/www/includes/connect.php';
    mysql_select_db("bibbytube", $connection);
    //GET AND INCRIMENT VISITORS
    $query = "select * from rooms where roomname = '{$roomname}'";
    $resource = mysql_query($query);
    if ($row = mysql_fetch_array($resource, MYSQLI_ASSOC))
    {
        $visits = $row["visits"];
        $visits += 1;
        $description = $row["description"];
        $about = $row["info"];
        $nsfw = $row["NSFW"];
        $listing = $row["listing"];
    }
    else 
    {
        header("HTTP/1.0 404 Not Found");
        echo "This room does not exist.";
        exit();
    }
    $query = "UPDATE rooms SET visits = '{$visits}' WHERE rooms . roomname = '{$roomname}'";
    mysql_query($query, $connection);
    mysql_close($connection);
    //-----------
?>
<!DOCTYPE html> 
<html>
    <head>
        <title><?php echo "InstaSynch: " . $roomname."'s room!"?></title>
        <meta name="description" content="<?php echo htmlspecialchars($description) ?>"/>        
        <link type="text/css" href="/styles/style.css?ver=0.9.7" rel="stylesheet">
        <link type="text/css" href="/styles/main.css?ver=0.9.7" rel="stylesheet">  
        <link href="/styles/clickable-dropdown/main.css" rel="stylesheet">         
        <link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />
        <link REL="SHORTCUT ICON" HREF="/favicon.ico">  
        <script type="text/javascript">
            var ROOMNAME = "<?php echo $roomname; ?>";
        </script>
        <script type="text/javascript" src="/js/socket.io.js"></script>
        <script type="text/javascript" src="/js/jquery-1.9.1.min.js"></script>        
        <script type='text/javascript' src="/js/jquery.linkify.js"></script>   
        <script type="text/javascript" src="/js/froogaloop.min.js"></script>
        <script type='text/javascript' src='/js/tubeplayer.js'></script>        
        <script type="text/javascript" src="/js/jquery.cookie.js"></script> 
        <script type="text/javascript" src="/js/core.js?ver=0.9.7"></script>
        <script type="text/javascript" src="/js/io.js?ver=0.9.7"></script>
        <script type='text/javascript' src='/js/player.js'></script> 
        <script type="text/javascript" src="/js/request.js?ver=0.9.7"></script>
        <script src="/js/jquery-ui.js"></script>       
        <?php
            if (file_exists("c:/wamp/www/emotes/" . $roomname . ".js"))
            {
                echo '<script type="text/javascript" src="/emotes/' . $roomname . '.js"></script>';
            }
            else
            {
                echo '<script type="text/javascript" src="/js/emotes.js"></script>';
            }
        ?>
        <?php include("c:/wamp/www/includes/analytics.php") ?>
    </head>
    <body>
        <div class="container">
            <?php include dirname(__FILE__) . "/truetop.php" ?>
            <?php //include $_SERVER["DOCUMENT_ROOT"]."advertise/includes/banner.php" ?>
            <?php 
                if ($nsfw == 0 && $listing == 'public')
                {
                    include dirname(__FILE__) . "/adsense.php";
                }
            ?>
            <div id="st-descr">
                <div class="top-descr">
                     <?php echo $roomname;?>'s room  
                        <div class="descr-stats">
                              <div class="descr-stat">
                                  <div class="descr-stat-value" id="viewercount">?</div>
                                  <div class="descr-stat-tip">viewing</div>    
                             </div>
                            <div class="descr-stat">
                                <div class="descr-stat-value"><?php echo $visits;?></div>
                                <div class="descr-stat-tip">visits</div>
                            </div>
                        </div>
                </div>
            </div>
            <div id="centerstage">    
                <div id="media-title">
                    <div id="vidTitle" class="title"></div>            
                </div>
                <div id="stage">
                    <div class="stage"> 
                        <div id="media">
                            <div class="howTo">
                                <ul>
                                    <li>1. To add videos, copy the video URL and put it in the input box.</li>
                                    <li>2. To control the player, Use the Take Lead button and use the slider and buttons that appear.</li>
                                    <li>4. Want to invite others to your room? Copy and paste the URL address in the address bar.</li>
                                    <li>4. Check out the <a href="/help.php" target="_blank">Help</a> page for more information.</li>
                                 </ul>
                            </div>
                        </div>                                                    
                        <div id="chat">        
                            <div id="chat_list">

                            </div>  
                            <div id="chat_users">
                                <!-- in the future, make this a list -->
                            </div>                           
                            <input id="cin" maxlength="240" type="text" disabled="true"/>
                            <div id="join-chat" style="display: none;">
                                <input id="join" maxlength="16" style="color: black;" class="name placeholder" placeholder="Enter a name">
                                <button id="btn-join" class="basic-btn join" tabindex="15">Join</button>
                            </div>
                            <div id="bio" style="display: none;">
                                <div class="username">
                                    <span></span>
                                </div>
                                <div class="userinfo">
                                </div>
                                <div class="avatar">
                                    <img src=""/>
                                </div>
                                <button id="mute">Mute</button>
                                <button id="unmute">Unmute</button>
                                <button id="kick" class="mod">Kick</button>
                                <button id="ban" class="mod">Ban</button>
                            </div>
                            <div id="chat_controls" style="">
                                <div class="controls" >
                                    <div id="gear" class="settings toggle">
                                        <img height="16" src="/images/gear.png" width="16"/> 
                                    </div>
                                </div>                           
                                <div class="content hide"></div>     
                            </div>                         
                        </div>             
                        <div id="playlist" style="overflow: visible;">
                            <div class="playlist">
                                <div id="playlistcontrols">
                                    <div class="sliderContainer leader" style="display: none;">  
                                        <div id="play" class="basic-button">PLAY</div><div id="pause" class="basic-button">PAUSE</div>
                                        <div id="slider" class="slider">
                                            <div class="info" style="font-size: 10px; float: right;">
                                                <span id="sliderCurrentTime">0:00</span>
                                                <span id="sliderDuration">/ 5:00</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="basic-btn-btnbar" id="playlistactions">
                                        <div id="skip" class="basic-button">Skip Video</div>
                                        <div id="skipCounter">0/0</div>
                                        <div id="addVid" style="visibility: hidden; position: relative; left: 10px;">
                                            <input name="URLinput" id="URLinput" type="text" disabled/>
                                            <div style="margin-left: 5px; margin-right: 10px; position: relative;" id="addUrl" class="basic-button" >Add Vid</div>
                                        </div>   
                                        <div id="resynch" class="basic-button">Resynch</div>
                                        <div id="reload" class="basic-button">Reload</div>                                    
                                        <div id="toggleplaylistlock"><img src="/images/lock.png"/></div>                                    
                                    </div>
                                    <div id="playlist_items">
                                             <ul id="ulPlay" class="items ui-sortable pllist">              

                                             </ul>
                                    </div>
                                    <div id="playlist_total">
                                        <span class="total-videos">0 videos</span>
                                        <span style="position: relative; left: 10px;" class="total-duration"> 00:00</span>
                                    </div>
                                </div>   
                            </div>
                        </div>
                        <div class="poll-container">
                            <div class="st-poll" style="display: none;">
                                <div class="poll-title"></div>
                                <div class="poll-results choices">              
 
                                </div>
                                <div class="close-poll x"></div>
                            </div> 
                            <div>
                                <button id="lead" class="mod">Lead Me</button> 
                                <button id="unlead" style="display:none;">Unlead</button> 
                                <button id="create-pollBtn" onclick="javascript: $('#create-poll').toggle();" class="mod">Create Poll</button>                        
                                <div id="create-poll" style="display: none;">
                                    <input class="formbox" id="title" placeholder="Poll Title"><br />
                                    <input class="formbox create-poll-option" placeholder="Option"><br />
                                    <input class="formbox create-poll-option" placeholder="Option"><br />
                                    <input class="formbox create-poll-option" placeholder="Option"><br />
                                    <button id="add-option">Add Option</button>
                                    <button id="submit-poll">Create Poll</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="roomFooter">
                <div class="roomFooter ui-widget-content ui-corner-all">
                    <span>
                        <strong>About</strong>
                    </span>
                    <p>
                        <?php echo htmlspecialchars($about); ?>
                    </p>
                </div>
            </div>
            <?php include dirname(__FILE__) . "/footer.php" ?>           
        </div>
    </body>
</html>