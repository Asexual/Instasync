<?php
    if(strpos($_SERVER['HTTP_HOST'], "instasync.com") === false)
    {
        header('HTTP/1.0 404 Not Found');
        echo "Domain mismatch.";
	exit();
    }	
    include 'c:/wamp/www/includes/connect.php';
    mysql_select_db("bibbytube", $connection);
    $title = "InstaSynch - Watch videos with friends!";
    $description = "Watch synchronized videos with friends and strangers!";
?>
<!DOCTYPE html> 
<html>
    <?php include "includes/header.php" ?>
    <body style="background-image: url('/images/test.jpg');"> 
        <div class="container"> 
            <?php include "includes/truetop.php" ?>   
            <?php //include $_SERVER["DOCUMENT_ROOT"]."advertise/includes/banner.php" ?>
            <div align="center" style="margin-top: 5px; margin-bottom: 5px;">
                <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
                <!-- Index Top center -->
                <ins class="adsbygoogle"
                     style="display:inline-block;width:728px;height:90px"
                     data-ad-client="ca-pub-1233304810199283"
                     data-ad-slot="6877028655"></ins>
                <script>
                (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            </div>
            <div class="index-content">
                <div class="content-header">
                    <div class="left">
                        <h1>What is InstaSynch?</h1>
                        <p>
                        InstaSynch (Inspired by SynchTube) is a place that allows users to watch synchronized videos with each other and chat in real time, fully synchronized!
                        </p>
                        <h1>Awesome! But how do I get started?</h1>
                        <p>
                            Simply visit any room you'd like and you can begin chatting as an unregistered user. 
                            If you'd like to have all the features (adding videos, voting, and profile) you must register.
                        </p>
                        <h1>
                            What about my own room?
                        </h1>
                        <p>
                            When you register, you also create a room in your name. To access this room,
                            log in and click My Room from the settings drop down menu (accessed by clicking on your name in the top right corner.)
                        </p>
                        <h1>But I need more help than that!</h1>
                        <p>
                            Check out the <a href="help.php">Help</a> page!<br />
                            Questions/Comments? Email me at: admin@instasynch.com
                        </p>
                        <div class="social">
                            <span class="media">
                                  <a target="_blank" href="http://youtube.com"><img width="32" border="0" height="32" alt="facebook" src="/images/youtube.png"></img></a>                          
                            </span>
                            <span class="media">
                                <a target="_blank" href="http://vimeo.com"><img width="32" border="0" height="32" alt="facebook" src="/images/vimeo.png"></img></a>                            
                            </span>
                            <span class="media">
                                <a target="_blank" href="http://twitch.tv"><img width="32" border="0" height="32" alt="facebook" src="/images/twitch.png"></img></a>                            
                            </span>                            
                            <span class="network">
                                <a target="_blank" href="https://www.facebook.com/instasynch"><img width="32" border="0" height="32" alt="facebook" src="/images/facebook.png"></img></a>
                            </span>            
                            <span class="network">
                                <a target="_blank" href="http://twitter.com/instasynch"><img width="32" border="0" height="32" alt="twitter" src="/images/twitter.png"></img></a>
                            </span>  
                        </div>
                    </div>
                    <div class="right">
                        <div>
                            <a class="twitter-timeline"  href="https://twitter.com/InstaSynch"  data-widget-id="364186530270543872" height="200" width="250">Tweets by @InstaSynch</a>
                            <script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+"://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
                        </div>
                        <div>
                            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" style="text-align: center">
                            <input type="hidden" name="cmd" value="_s-xclick">
                            <input type="hidden" name="hosted_button_id" value="PPYMXEF8LXWGE">
                            <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
                            <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
                            </form>
                        </div> 
                    </div>
                </div>
                <div class="content-body">
                    <?php
                        $query = "select * from rooms where users > 0 and listing = 'public' and (NSFW = 0 or NSFW = 1) order by users desc limit 24";
                        $roomlist = mysql_query($query, $connection);
                        while ($room = mysql_fetch_array($roomlist, MYSQLI_ASSOC))
                        {
                            echo "<div class='room'>";
                                echo "<div class='left'>";
                                    echo "<a href='/rooms/{$room["roomname"]}'>";
                                        echo "<img width='120px' height='90px' src='{$room["thumbnail"]}'></img>";
                                    echo "</a>";
                                    echo "<div class='title'>".htmlspecialchars($room["title"])."</div>";
                                    echo "<div class='viewers'>{$room["users"]} Viewing</div>";
                                echo "</div>";
                                echo "<div class='right'>";
                                    echo "<div class='name'><a href='/rooms/{$room["roomname"]}'>{$room["roomname"]}</a></div>";
                                    echo "<p class='about'>". htmlspecialchars($room["description"]) . "</p>";
                                echo "</div>";
                            echo "</div>";  
                            echo PHP_EOL;
                        }   
                    ?>
<!--                    <div class="room">
                        <div class="left">
                            <a href="google.com">
                            <img width="120px" height="90px" src="http://img.youtube.com/vi/Dho-FCabHsw/0.jpg"></img>
                            </a>
                            <div class="title">Awesome Video</div>
                            <div class="viewers">19 Viewers</div>
                        </div>
                        <div class="right">
                            <div class="name"><a>bibby</a></div>
                            <div class="about">EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE</div>
                        </div>
                    </div>-->
                </div>
            </div>
            <?php include "includes/footer.php"; ?>
        </div>      
    </body>
</html>
<?php
    mysql_close($connection);
?>