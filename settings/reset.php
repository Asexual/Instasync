<?php
    include 'c:/wamp/www/includes/connect.php';
    mysql_select_db("bibbytube", $connection);
    if (!isset($_GET["token"]))
    {
        header('HTTP/1.0 404 Not Found');
        echo "No Token!";
        exit();
    }
?>
<!DOCTYPE html> 
<html>
    <head>
        <title>InstaSynch - Account Settings</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="description" content=""/>
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
        <link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />
        <?php include("c:/wamp/www/includes/analytics.php"); ?>
    </head>
    <body>   
        <div class="container"> 
            <?php include "../includes/truetop.php" ?>
            <div>
                <div class="ui-widget-content ui-corner-all" style="height: 130px; width: 720px; margin: 50px auto 0px auto">
                    <p style="padding: 5px;">
                        <?php
                            $token = mysql_real_escape_string($_GET["token"]);
                            if ($row = mysql_fetch_array(mysql_query("select * from resets where token = '{$token}'"), MYSQL_ASSOC))
                            {
                                if ($row["time"] > (time() - 60*60*3)) //three hour expiration
                                {
                                    $randomPass = randomPassword();
                                    mysql_query("update users set hashpw = '". hashpw($randomPass) ."' where username = '{$row["username"]}' limit 1");
                                    echo "This accounts password has been changed to: <strong>{$randomPass}</strong><br />";
                                    echo "You may log in and change your password in the account settings page.<br />";
                                    echo "For security reasons, the username is not displayed. The username can be found in the email that brought you here.";
                                }
                                else 
                                {
                                    echo "This token is either not valid or has expired.";
                                }
                                mysql_query("delete from resets where token = '{$token}' limit 1");
                            }
                            else
                            {
                                echo "This token is either not valid or has expired.";
                            }
                        ?>
                    </p>
                </div>
            </div>
            <?php include "../includes/footer.php"; ?>    
        </div>
    </body>
</html>
<?php
    mysql_close($connection);
?>
