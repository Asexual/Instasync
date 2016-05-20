<?php
    require 'c:/wamp/www/includes/connect.php';
    if (isset($_POST["room"]))
    {
        mysql_select_db("bibbytube");
        $output = "";
        $resource = mysql_query("select username from bans where room = '{$_POST["room"]}'");
        while($row = mysql_fetch_array($resource, MYSQL_ASSOC))
        {
            $output .= $row["username"] . " ";
        }
        echo $output;
    }
    mysql_close($connection);
?>
