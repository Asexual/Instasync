<?php
    require 'c:/wamp/www/includes/connect.php';
    mysql_select_db("bibbytube");
    if (isset($_POST["room"], $_POST["description"]))
    {
        $description = mysql_real_escape_string($_POST["description"]);
        mysql_query("UPDATE rooms SET description = '{$description}' WHERE roomname = '{$_POST["room"]}'");
    }
    mysql_close($connection);
?>
