<?php
    define("SERVER_ADD", "127.0.0.1");
    define("SERVER_USER", "root");
    define("SERVER_PASS", "");
    
    //$connection = mysql_connect(SERVER_ADD, SERVER_USER, SERVER_PASS) or die("NO SERVER");
    $db = new PDO('mysql:host='.SERVER_ADD.';dbname=advertise;charset=utf8', SERVER_USER, SERVER_PASS);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    function createDb()
    {
        global $db;
        return $db;
    }
    function generateSingleToken() //40 characters
    {
        return sha1(mt_rand() . 'sl' . crypt(uniqid(true)) . microtime(true));
    }
    function generateDoubleToken() //73 characters
    {
        return md5(base_convert(mt_rand(), 10, mt_rand(20,36))) . "_" . generateSingleToken();
    }
    function randomPassword()
    {
        return base_convert(mt_rand(),10, mt_rand(20,36)).base_convert(mt_rand(),10, mt_rand(20,36));
    }
    function hashpw($pass)
    {
        return sha1($pass);
    }
    function hashpw2($pass)
    {
        return $pass;
        //return hashpw($pass);
    }
?>