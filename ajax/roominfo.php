<?php
    require "c:/wamp/www/includes/connect.php";
    if (isset($_GET["room"]))
    {
        mysql_select_db("bibbytube", $connection);
        $room = mysql_real_escape_string($_GET["room"]);    
        $userLookup = mysql_query("select * from rooms
                           where 
                           roomname = '{$room}'");
        $output = "";
        if ($record = mysql_fetch_array($userLookup, MYSQL_ASSOC))
        {
            $output["description"] = htmlspecialchars($record["description"]);
            $output["info"] = htmlspecialchars($record["info"]);
            $output["listing"] = htmlspecialchars($record["listing"]);
        }
        else
        {
            $output["error"] = "Room not found.";           
        }
        
        echo json_encode($output);        
    }
    elseif (isset($_POST["listing"], $_POST["description"], $_POST["info"]))
    {
        if (isset($_COOKIE["username"], $_COOKIE["sessionid"]))
        {
            mysql_select_db("bibbytube", $connection);
            $output = "";
            $username = mysql_real_escape_string($_COOKIE["username"]);
            $sessionid = mysql_real_escape_string($_COOKIE["sessionid"]);        
            $listing = mysql_real_escape_string($_POST["listing"]);
            $description = mysql_real_escape_string($_POST["description"]);
            $info = mysql_real_escape_string($_POST["info"]);
            if ($row = mysql_fetch_array(mysql_query("select * from users where username = '{$username}' and cookie = '{$sessionid}' limit 1"), MYSQL_ASSOC))
            {

                $query = "update rooms set listing = '{$listing}', description='{$description}', info='{$info}' where roomname = '{$username}' limit 1";
                mysql_query($query);
                if (mysql_affected_rows() === 1)
                {
                    $output["error"] = "Changes successfully made to: {$username}.";
                }
                else
                {
                    $output["error"] = "Error saving settings, try logging back in.";
                }
            }
            else
            {
                $output["error"] = "You are not logged in.";
            }
        }
        else
        {
            $output["error"] = "You are not logged in.";
        }
        echo json_encode($output); 
    }
    mysql_close($connection);   
?>