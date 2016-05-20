<?php
    define("ROOT", "C:/wamp/www/ads/");
    require_once("includes/connect.php");
    function __autoload($class_name) 
    {
        $className = strtolower($class_name);
        if(file_exists(ROOT . "controllers/" . $className . ".class.php"))
        {
            require_once(ROOT . "controllers/" . $className . ".class.php");            
        }
        if(file_exists(ROOT . "includes/classes/" . $className . ".class.php"))
        {
            require_once(ROOT . "includes/classes/" . $className . ".class.php");            
        }
    }
    //$controller = trim($_GET["filename"], "/")
       
    $controller = isset($_GET["filename"]) ? $_GET["filename"] : "";
    if ($controller == "")
        $controller = "login";
    $template = new template(strtolower($controller));
    $template->render();
    //mysql_close($connection);
?>