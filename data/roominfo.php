<?php
    require("c:/wamp/www/includes/connect.php");
    mysql_select_db("bibbytube", $connection);
    if (isset($_POST["room"])) // get specific information about this room
    {
        $query = "select * from rooms where roomname = '{$_POST["room"]}'";
        $resource = mysql_query($query);
        $output = "";
        if ($row = mysql_fetch_array($resource, MYSQLI_ASSOC))
        {
            //output room info
        }
        else
        {
            $output["error"] = "Room does not exist.";
        }
        echo json_encode($output);
    }
    mysql_close($connection);
?>
