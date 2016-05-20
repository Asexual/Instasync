<?php
    require_once('phpmailer/class.phpmailer.php');
    function email($to, $from, $from_name, $subject, $body) { 
            global $error;
            $mail = new PHPMailer();  // create a new object
            $mail->IsSMTP(); // enable SMTP
            $mail->SMTPDebug = 0;  // debugging: 1 = errors and messages, 2 = messages only
            $mail->SMTPAuth = false;  // authentication enabled
            $mail->Host = 'instasynch.com';
            $mail->Port = 25252; 
            $mail->Username = "";  
            $mail->Password = "";           
            $mail->SetFrom($from, $from_name);
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->AddAddress($to);
            if(!$mail->Send()) {
                    $error = 'Mail error: '.$mail->ErrorInfo; 
                    //echo $error;
                    return false;
            } else {
                    $error = 'Message sent!';
                    return true;
            }
    }   
?>