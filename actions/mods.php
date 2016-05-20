
<?php
//actions add, remove
    require 'c:/wamp/www/includes/connect.php';
    mysql_select_db("bibbytube", $connection);
    if (isset($_POST["username"], $_POST["room"], $_POST["action"]) && (strtolower($_POST["username"]) != strtolower($_POST["room"])))
    {   
        if ($_POST["action"] == "add")
        {
            $username = mysql_real_escape_string($_POST["username"]);
            $query = "insert into mods (room, username, permissions) 
                      values ('{$_POST["room"]}','{$username}', 1)";
            mysql_query($query);
        }
        elseif ($_POST["action"] == "remove")
        {
            $username = mysql_real_escape_string($_POST["username"]); //username is provided by user, not nodejs
            mysql_query("delete from mods where username = '{$username}' and room = '{$_POST["room"]}'");
        }    
    }
    mysql_close($connection); 
?>