<?php
    class login extends controller
    {
        protected static $loginOnly = false;
        public function __construct()
        {
            $this->view = "form";
            $this->set("title", "InstaSynch - Advertising - Log In");
            $this->set("action", "/ads/login?action=submit");
            $this->set("submitText", "Log In");
            $fields = array
            (
                array("name"=>"email", "label"=>"EMAIL ADDRESS", "type"=>"text"),
                array("name"=>"password", "label"=>"PASSWORD", "type"=>"password"),
                array("name"=>"TOS", "label"=>"I agree to the <a href='/advertise/terms' target='_blank'>Terms Of Service.</a>", "type"=>"checkbox"),
                
            );
            $this->set("formMessage", "<a href='/ads/recover/'> Forgot Password? </a>");
            $this->set("fields", $fields);
            $this->set("formTitle", "Advertiser Login");
        }
        public function submit()
        {
            //TODO: VERIFY CHECKBOX IS CHECKED
            if (isset($_POST["email"], $_POST["password"]))
            {
                $user = new user();
                $login = $user->loadByCredentials($_POST["email"], $_POST["password"]);
                if ($login["success"])
                {
                    if (session_status() == PHP_SESSION_NONE) { session_start();}
                    $_SESSION['user'] = $user->getUserInfo("userId");
                    $this->view = "redirect";
                    $this->set("location", "/ads/account");                    
                }
                else
                {
                    $this->set("error", $login["error"]);
                }
            }
            else
            {
                $this->set("error", "Missing parameters.");
            }
        }
    }
?>