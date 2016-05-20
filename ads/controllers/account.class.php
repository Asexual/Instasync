<?php
    class account extends controller
    {
        protected $user = NULL;
        public function __construct() 
        {
            $this->set("title", "InstaSynch - Advertise - My Account");
            $this->set("navTitle", "Account Management");
            if (session_status() == PHP_SESSION_NONE) { session_start();}
            $user = new user();
            if ($user->loadByID($_SESSION["user"]))
            {
                $this->user = $user;
            }       
        }
        public function logout()
        {
            setcookie(session_name(), '', time() - 42000);
            session_destroy();
            $this->view = "redirect";
            $this->set("location", "/ads/login");
        }
    }
?>