<?php
    require "c:/wamp/www/includes/connect.php";
    require "c:/wamp/www/includes/email.php";
    if (isset($_POST["email"], $_POST["username"]))
    {
        mysql_select_db("bibbytube", $connection);
        $username = mysql_real_escape_string($_POST["username"]); 
        $email = mysql_real_escape_string($_POST["email"]);         
        $userLookup = mysql_query("select * from users 
                           where 
                           username = '{$username}' and email = '$email'");
        $output = "";
        if ($user = mysql_fetch_array($userLookup, MYSQL_ASSOC))
        {
            if (mysql_num_rows(mysql_query("select * from resets where time > " . (time() - 60*60) . " and ip = '{$_SERVER["REMOTE_ADDR"]}'")) > 2) 
            {
                $output["error"] = "Max reset request already used. Please try again later.";
            }
            else
            {
                $token = generateDoubleToken();
                $time = time();
                mysql_query("insert into resets (token, username, time, ip) values('{$token}', '{$username}', {$time}, '{$_SERVER["REMOTE_ADDR"]}')");
                email($email, "DoNotReply@instasynch.com", "", "InstaSynch Password Recovery", "Please click the link below to reset your InstaSynch account password for {$username}: http://instasynch.com/settings/reset.php?token={$token}");
                $output["error"] = "An email with a reset link has been sent. If you don't recieve an email shortly, check your spam folder. Also whitelist 'DoNotReply@instasynch.com'.";
            }
        }
        else
        {
            $output["error"] = "Username and email do not match.";           
        }
        echo json_encode($output);
    }
    
    mysql_close($connection);
?>