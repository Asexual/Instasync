<?php
    require "c:/wamp/www/includes/connect.php";
    if (isset($_GET["username"]))
    {
        mysql_select_db("bibbytube", $connection);
        $username = mysql_real_escape_string($_GET["username"]);    
        $userLookup = mysql_query("select avatar, bio from users 
                           where 
                           username = '{$username}'");
        $output = "";
        if ($user = mysql_fetch_array($userLookup, MYSQL_ASSOC))
        {
            $output["avatar"] = "http://i.imgur.com/" . $user["avatar"] . ".jpg";
            $output["bio"] = htmlspecialchars($user["bio"]);
        }
        else
        {
            $output["error"] = "User not found.";           
        }        
    }
    elseif (isset($_POST["avatar"], $_POST["bio"]))
    {
        if (isset($_COOKIE["username"], $_COOKIE["sessionid"]))
        {
            mysql_select_db("bibbytube", $connection);
            $output = "";
            $username = mysql_real_escape_string($_COOKIE["username"]);
            $sessionid = mysql_real_escape_string($_COOKIE["sessionid"]);        
            $avatar = imgurCode(mysql_real_escape_string($_POST["avatar"]));
            $bio = mysql_real_escape_string($_POST["bio"]);
            if ($avatar != false && $bio != "")
            {
                $query = "update users set avatar = '{$avatar}', bio='{$bio}' where username = '{$username}' and cookie = '{$sessionid}' limit 1";
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
            elseif ($avatar === false)
            {
                $output["error"] = "Invalid IMGUR URL.";
            }
            elseif ($bio === "")
            {
                $output["error"] = "Bio cannot be empty.";
            }
            
        }
        else
        {
            $output["error"] = "Cookies not set. Please log in again.";
        }
    }
    echo json_encode($output);
    
    mysql_close($connection);
    function imgurCode($url)
    {
        return preg_replace("/(https?:\/\/)?(www\.)?(i\.)?imgur\.com\/(gallery\/)?([a-zA-Z0-9]+)(\.(jpg|jpeg|png|gif))?/i","$5", $url);    
    }    
?>