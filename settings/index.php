<?php
    include 'c:/wamp/www/includes/connect.php';
    mysql_select_db("bibbytube", $connection);
?>
<!DOCTYPE html> 
<html>
    <head>
        <title>InstaSynch - Account Settings</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="description" content="Customize your InstaSynch user account settings."/>
        <meta name="keywords" content="YouTube, SynchTube, watch, videos, friends, Social, bibbytube, bibby tube, babby, babbytube, bibby, InstaSynch"/>
        <META http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link type="text/css" href="/styles/style.css" rel="stylesheet">
        <link type="text/css" href="/styles/main.css" rel="stylesheet">
        <link href="/styles/clickable-dropdown/main.css" rel="stylesheet">        
        <link REL="SHORTCUT ICON" HREF="/favicon.ico">   
        <script type="text/javascript" src="/js/jquery-1.9.1.min.js"></script>
        <script type="text/javascript" src="/js/jquery.cookie.js"></script>      
        <script type="text/javascript" src="/js/request.js"></script>  
        <script src="/js/jquery-ui.js"></script>  
        
        <?php include("c:/wamp/www/includes/analytics.php"); ?>
        <script type="text/javascript">
            $(document).ready(function()
            {
                $("input").val(""); //clear all inputs
                $("textarea").html("");
                $("#listing").attr("checked", false);
            
                checkLogin(function(loggedin, username, avatar, bio)
                {
                    if (loggedin === true)
                    {
                        $(".NotLoggedIn").hide();
                        $(".LoggedIn").show();
                        $("#avatar").val(avatar);
                        $("#userinfo").html(bio);
                        getRoomInfo(username, function(listing, description, info, error)
                        {
                            if (listing === "public")
                            {
                                $("#listing").prop("checked", "true");
                            }
                            $("#roomDescription").html(description);
                            $("#roomInfo").html(info);
                        });
                    }
                });
                
                $("#changePw").click(function()
                {
                    if ($("#changePwNew").val() === $("#changePwConfirm").val())
                    {    
                        $.post("/ajax/changepassword.php", {current: $("#changePwPassword").val(), newpass: $("#changePwNew").val()}).done(function(data)
                        {
                            var result = JSON.parse(data);
                            $("#changePwMsg").html(result.error);
                        });
                    }
                    else
                    {
                       $("#changePwMsg").html("Passwords do not match.");
                    }
                });
                $("#changeUserinfo").click(function()
                {
                    setUserInfo($("#avatar").val(), $("#userinfo").val(), function(error)
                    {
                        $("#changeUserinfoMsg").html(error)
                    });
                });     
                $("#passwordReset").click(function()
                {
                    $("#resetEmailMsg").html("Sending..");
                    $.post("/ajax/passwordreset.php", {"username":$("#recoverUsername").val(), "email":$("#recoverEmail").val()}).done(function(data)
                    {
                        var response = JSON.parse(data);
                        $("#resetEmailMsg").html(response.error);
                    });
                });
                $("#changeRoomInfo").click(function()
                {
                    $.post("/ajax/roominfo.php", {"listing":$("#listing").is(':checked') ? "public" : "private", "description": $("#roomDescription").val(), "info":$("#roomInfo").val()}).done(function(data)
                    {
                        var response = JSON.parse(data);
                        $("#changeRoomInfoMsg").html(response.error);
                    });
                });                
            });
        </script>
        <link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />
        <style type="text/css">
        /* Vertical Tabs
        ----------------------------------*/
        .ui-tabs-vertical { width: 55em; }
        .ui-tabs-vertical .ui-tabs-nav { padding: .2em .1em .2em .2em; float: left; width: 12em; }
        .ui-tabs-vertical .ui-tabs-nav li { clear: left; width: 100%; border-bottom-width: 1px !important; border-right-width: 0 !important; margin: 0 -1px .2em 0; }
        .ui-tabs-vertical .ui-tabs-nav li a { display:block; }
        .ui-tabs-vertical .ui-tabs-nav li.ui-tabs-selected { padding-bottom: 0; padding-right: .1em; border-right-width: 1px; border-right-width: 1px; }
        .ui-tabs-vertical .ui-tabs-panel { padding: 1em; float: right; width: 40em;}
        
        .ui-tooltip
        {
            font-size: 12px;
        }
        </style> 
        <script>
            $(document).ready(function() {
                $("#tabs").tabs().addClass('ui-tabs-vertical ui-helper-clearfix');
                $("#tabs li").removeClass('ui-corner-top').addClass('ui-corner-left');
                $( document ).tooltip();
            });
        </script>
    </head>
    <body>   
        <div class="container"> 
            <?php include "../includes/truetop.php" ?>
            <div>
                <div id="tabs" style="min-width:580px; max-width: 1000px; margin: 50px auto 0px auto">
                    <ul>
                        <li><a href="#tabs-1">Account Settings</a></li>
                        <li><a href="#tabs-2">Room Settings</a></li>
                        <li><a href="#tabs-3">Password Reset</a></li>
                    </ul>
                    <div id="tabs-1">
                        <p class="NotLoggedIn">
                            You are not logged in.
                        </p>
                        <div class="LoggedIn">
                            <div class="section">
                                <h3>Change Password</h3>
                                <div class="option">
                                    <span>Current Password:</span>
                                    <input id="changePwPassword" type="password"/>
                                </div>
                                <div class="option">
                                    <span for="changePwNew">New Password:</span>
                                    <input id="changePwNew" type="password"/>
                                </div>
                                <div class="option">
                                    <span for="changePwConfirm">Confirm Password:</span>
                                    <input id="changePwConfirm" type="password"/>
                                </div>    
                                <button id="changePw">Change</button>

                                <span id="changePwMsg" class="error"></span>
                            </div>
                            <div class="section">
                                <h3>User Info</h3>
                                <div class="option">
                                    <span>Avatar:</span>
                                    <input title="Only IMGUR URL links are accepted for images. You can upload images to imgur at http://imgur.com." id="avatar" type="text"/>
                                </div>
                                <div class="option">
                                    <span for="userinfo">Bio:</span>
                                    <textarea id="userinfo"></textarea>
                                </div>
                                <button id="changeUserinfo">Update</button>
                                <span id="changeUserinfoMsg" class="error"></span>     
                            </div>
                        </div>
                    </div>
                    <div id="tabs-2">
                        <p class="NotLoggedIn">
                            You are not logged in.
                        </p>
                        <div class="LoggedIn">
                            <div class="section">
                                <div class="option">
                                    <span>Public:</span>
                                    <input title="Uncheck to hide your room from the front page." id="listing" type="checkbox"/>
                                </div>
                                <div class="option">
                                    <span>Description:</span>
                                    <textarea id="roomDescription" maxlength="160" title="This appears next to your room on the front page."></textarea>
                                </div>
                                <div class="option">
                                    <span>Info:</span>
                                    <textarea id="roomInfo" maxlength="2048" title="This appears at the bottom of your room page."></textarea>
                                </div>
                                <button id="changeRoomInfo">Update</button>
                                <span id="changeRoomInfoMsg" class="error"></span> 
                            </div>
                        </div>
                    </div>
                    <div id="tabs-3">
                        <div class="section">
                            <div class="option">
                                <span>Username:</span>
                                <input id="recoverUsername" type="text"/>
                            </div>
                            <div class="option">
                                <span>Email:</span>
                                <input id="recoverEmail" type="text"/>
                            </div>
                            <button id="passwordReset">Submit</button>
                            <span id="resetEmailMsg" class="error"></span>
                        </div>
                    </div>
                </div>
            </div>
            <?php include "../includes/footer.php"; ?>    
        </div>
    </body>
</html>
<?php
    mysql_close($connection);
?>