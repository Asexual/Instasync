<?php
    //if(file_get_contents("http://www.winmxunlimited.net/utilities/api/proxy/check.php?ip=".$_SERVER['REMOTE_ADDR']) != "0")
//{
      //$output["error"] = "Proxy/Tor detected!";
      //echo json_encode($output);
     // exit();
//}
?>
<?php
    include 'c:/wamp/www/includes/connect.php';
    
    if (isset($_POST["username"],$_POST["password"],$_POST["email"]))
    {
        $ip = $_SERVER["REMOTE_ADDR"];
        $username = mysql_real_escape_string($_POST["username"]);
        $password = hashpw($_POST["password"]);   
        $email = mysql_real_escape_string($_POST["email"]);
        $output = "";
        mysql_select_db("bibbytube", $connection);        
        if (preg_match("/^([A-Za-z0-9]|([-_](?![-_]))){5,16}$/", $username))
        {
            if (preg_match('/[^a-z0-9+_.@-]/i', $email) !== 0)
            {
                $output["error"] = "Invalid Email Format";
            }
            elseif (!mysql_fetch_array(mysql_query("select * from users where username = '{$username}'")))
            {
                //check IP limit
                $ipcount = 0;
                $query = "select * from ips where ip = '{$ip}'";
                if ($record = mysql_fetch_array(mysql_query($query), MYSQL_ASSOC))
                {
                    $ipcount = $record["count"];
                }
                else
                {
                    $ipcount = 0;
                }
                if ($ipcount <= 5)
                {
                    $sessionid = generateSingleToken();
                    $query = "insert into users (username, hashpw, cookie, email) VALUES ('{$username}', '{$password}', '{$sessionid}', '{$email}')";
                    mysql_query($query, $connection);
                    $query = "insert into ips (ip, count) VALUES ('{$ip}', 1) on duplicate key update count=count+1";
                    mysql_query($query);
                    setcookie("username", $username, time() + (60*60*24*7), "/");
                    setcookie("sessionid", $sessionid, time() + (60*60*24*7), "/");

                    //create room files
                    mysql_select_db("bibbytube", $connection);
                    mysql_query("insert into rooms (roomname, description, users, thumbnail, visits, title)
                                 values('{$username}', 'No Description', 0, 'none', 0, 'No Videos' )");

                    $output["success"] = true;
                }
                else
                {
                    $output["success"] = false;
                    $output["error"] = "Max users registered.";
                }
            }
            else
            {
                $output["success"] = false;
                $output["error"]= "That name is unavailable.";
            }
        }
        else
        {
            $output["success"] = false;
            $output["error"]= "5-16 char, A-Z, 1-9, - _";            
        }
        echo json_encode($output);
    }
    mysql_close($connection);
?>

