<?php
    //TODO: Add limit to login requests per IP
    require "c:/wamp/www/includes/connect.php";
    if (isset($_POST["username"], $_POST["password"])) //check if trying to login
    {
        mysql_select_db("bibbytube", $connection);
        $username = mysql_real_escape_string($_POST["username"]);
        $password = sha1($_POST["password"]);        
        $userLookup = mysql_query("select * from users 
                           where 
                           username = '{$username}' 
                           and hashpw = '{$password}' limit 1");
        $output = "";
        if (mysql_fetch_array($userLookup))//correct login credentials
        {
            $sessionid = generateSingleToken();
            $query = "update users set cookie = '{$sessionid}' where username = '{$username}' limit 1";
            mysql_query($query);
            setcookie("username", $username, time() + (60*60*24*7), "/");
            setcookie("sessionid", $sessionid, time() + (60*60*24*7), "/");            
            $output["success"] = true;
            $output["username"] = $username;
        }
        else //invalid username or password
        {
            $output["success"] = false; 
            $output["error"] = "Invalid userame or password.";
            $output["username"] = "";
        }
        echo json_encode($output);
    }
    mysql_close($connection);
?>
