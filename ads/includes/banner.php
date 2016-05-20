<?php
    require_once($_SERVER["DOCUMENT_ROOT"] . "includes/connect.php");
    require_once($_SERVER["DOCUMENT_ROOT"] . "advertise/includes/classes/banner.class.php");
    if (isset($_GET["click"]))
    {
        $banner = new banner($_GET["click"]);
        if ($banner->click())
        {
            header('location: '. $banner->get("destination")); //output buffering must be turned on, on WAMP
        }
        else
        {
            header('location: /advertise/404');
        }
    }
    else
    {
        $banner = new banner(); //random banner
        $banner->view();
    }
?>