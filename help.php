<?php
    if(strpos($_SERVER['HTTP_HOST'], "instasynch.com") === false)
    {
        header('HTTP/1.0 404 Not Found');
        echo "Domain mismatch.";
	exit();
    }	
    include 'c:/wamp/www/includes/connect.php';
    mysql_select_db("bibbytube", $connection);
    
    $title = "InstaSynch - Help & Information";
    $description = "Variety of helpful information to get you well on your way to enjoying YouTube, Vimeo, and TwitchTV with friends.";
?>
<!DOCTYPE html> 
<html>
    <?php include "includes/header.php" ?>
    <body style="background-image: url('/images/test.jpg');"> 
        <div class="container"> 
            <?php include "includes/truetop.php" ?>   
            <?php //include $_SERVER["DOCUMENT_ROOT"]."advertise/includes/banner.php" ?>
            <div class="help-content">
                <h1>Help</h1>
                <p>
                    Coming soon I promise! For now, just use <a href="/commands.txt">the command.txt</a> file for reference.
                </p>
            </div>
            <?php include "includes/footer.php"; ?>
        </div>      
    </body>
</html>
<?php
    mysql_close($connection);
?>