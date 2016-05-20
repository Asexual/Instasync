    <?php  
      
    //mysql_connect("localhost", "user", "password") or die(mysql_error());  
    //mysql_select_db("PayPal") or die(mysql_error());  
      
    // read the post from PayPal system and add 'cmd'  
    $req = 'cmd=_notify-validate';  
    foreach ($_POST as $key => $value) {  
    $value = urlencode(stripslashes($value));  
    $req .= "&$key=$value";  
    }  
    // post back to PayPal system to validate  
         
    $header .="POST /cgi-bin/webscr HTTP/1.1\r\n";
    $header .="Content-Type: application/x-www-form-urlencoded\r\n";
    $header .="Host: www.sandbox.paypal.com\r\n";
    $header .="Connection: close\r\n";
    $header .= "Content-Length: " . strlen($req) . "\r\n\r\n";
    
    $errstr = "";
    $fp = fsockopen ('ssl://sandbox.paypal.com', 443, $errno, $errstr, 30);  
    if (!$fp) 
    {  
        file_put_contents("text.txt", $errstr);
    } 
    else 
    {
        fputs ($fp, $header . $req);
        //file_put_contents("text.txt", $fp);
        while (!feof($fp)) 
        {  
            $res = fgets ($fp, 1024);  
            if (strcmp (trim($res), "VERIFIED") == 0) 
            {  

                //file_put_contents("text.txt", $req);
                $a;
                foreach ($_POST as $key => $value) 
                {  
                    $a[$key] = $value;
                }  
                $f = fopen("file.txt", "w");
                fwrite($f, print_r($a, true));
                fclose($f);
            }  

            else if (strcmp (trim($res), "INVALID") == 0) {  

                // PAYMENT INVALID & INVESTIGATE MANUALY!  
                file_put_contents("text.txt", "Invalid");      
            }  
        }
        fclose ($fp);  
    }  
    ?>  