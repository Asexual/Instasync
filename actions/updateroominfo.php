<?php
    require("c:/wamp/www/includes/connect.php");
    if (isset($_POST["users"], $_POST["thumbnail"], $_POST["title"], $_POST["roomname"]))
    {
        $title = mysql_real_escape_string($_POST["title"]);
        mysql_select_db("bibbytube", $connection);
        mysql_query("update rooms set users = {$_POST["users"]}, 
                     thumbnail = '{$_POST["thumbnail"]}',
                     title = '{$title}'
                      where roomname = '{$_POST["roomname"]}'");
                      
    }
    mysql_close($connection);
?>
