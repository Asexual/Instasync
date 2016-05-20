<?php
/*
 * THIS FILE PARSES INFO IT RECIEVES AND RETURNS A JSON OBJECT OF THAT USER
*/
   require 'c:/wamp/www/includes/connect.php';
   function roomExist($name, $connection)
   {
       mysql_select_db("bibbytube", $connection);
       $query = "select * from rooms where roomname = '{$name}'";
       if (mysql_fetch_array(mysql_query($query)))
       {
           //room exist
           return true;
       }
       else
       {
           return false;
       }
   }
   function isBanned($IP, $roomname, $connection)
   {
        mysql_select_db("bibbytube", $connection);
        $query = "select * from bans where ip = '{$IP}' and room = '{$roomname}'";
        $resource = mysql_query($query);  
        if (mysql_fetch_array($resource)) return true;
        else return false;
   }
   function isToxic($ip)
   {
       $variable = file_get_contents('bannedips.csv');
       //$ip2 = ',' . $ip . ',';
       if (substr_count($variable,$ip))
       {
           return true;
       }
   }
   if (isset($_POST["username"], $_POST["ip"], $_POST["cookie"], $_POST["room"]))
   {
        $username = trim(mysql_real_escape_string($_POST["username"]));   
        $cookie = mysql_real_escape_string($_POST["cookie"]);         
        $room = mysql_real_escape_string($_POST["room"]);         
        $ip = $_POST["ip"];
        $output = array();
        
        $output["error"] = "none";
        //error checking
        if (!roomExist($room, $connection)){$output["error"] = "Room does not exist.";} //does room exist?
        if ($output["error"] == "none") //no errors
        {
            $output["username"] = "unnamed";
            $output["permissions"] = 0;  
            $output["room"] = $room;
            //if logged in, check permissios too
            //check if loggedin
            mysql_select_db("bibbytube", $connection);
            $userLookup = mysql_query("select * from users 
                                       where 
                                       username = '{$username}' 
                                       and cookie = '{$cookie}'");      
            if ($user = mysql_fetch_array($userLookup, MYSQLI_ASSOC)) //if true, user is logged in.
            {
                $output["loggedin"] = true;
                $output["username"] = $username;
                //get permissions
                mysql_select_db("bibbytube",$connection);
                $query = "select permissions from mods where room = '{$room}' and username = '{$username}'";
                $getPermissions = mysql_query($query);
                if ($permissions = mysql_fetch_array($getPermissions)) //in mod database 
                {
                    $output["permissions"] = $permissions["permissions"];
                }
                else
                {
                    if (strtolower($username) === strtolower($room))
                    {
                        $output["permissions"] = 10;    
                    }
                }
                if (isBanned($ip, $room, $connection))
                {
                    if (!($output["permissions"] > 0)) //user isnt mod, thus banned.
                        $output["error"] = "Banned";
                }
            }
            else //not logged in
            {
                if (isBanned($ip, $room, $connection))
                {
                    $output["error"] = "Banned";
                }               
                else
                {
                    $output["username"] = "unnamed";
                    $output["loggedin"] = false;
                }
            }  
            if (isToxic($ip))
            {
                $output["error"] = "Your IP is toxic. Email admin@instasynch.com if you feel this is an error.";
            }
        }
        echo json_encode($output);
   }
   mysql_close($connection); 
?>
