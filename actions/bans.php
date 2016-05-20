<?php
//actions add, remove, purge
    require 'c:/wamp/www/includes/connect.php';
    mysql_select_db("bibbytube", $connection);
    if (isset($_POST["username"], $_POST["ip"], $_POST["room"], $_POST["action"]))
    {   
        //$reason = ""; TODO: add reason
        //if (isset($_POST["reason"]))
        if ($_POST["action"] == "add")
        {
            $username = mysql_real_escape_string($_POST["username"]);
            $query = "insert into bans (room, ip, username) 
                      values ('{$_POST["room"]}', '{$_POST["ip"]}', '{$username}')";
            mysql_query($query);
        }
        elseif ($_POST["action"] == "remove")
        {
            $username = mysql_real_escape_string($_POST["username"]); //username is provided by user, not nodejs
            mysql_query("delete from bans where username = '{$username}' and room = '{$_POST["room"]}'");
        }
        elseif ($_POST["action"] == "purge")
        {
            mysql_query("delete from bans where room = '{$_POST["room"]}'");
        }        
    }
    mysql_close($connection); 
?>
