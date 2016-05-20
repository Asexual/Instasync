<?php
    class error extends controller
    {
        private $header = "";
        protected static $loginOnly = false;
        public function __construct($error)
        {
           $reason = "Generic Error";
           if ($error === 404)
           {
                $this->set("title", "Page not found.");
                $this->header = "HTTP/1.0 404 Not Found";
                $reason = "The requested document was not found.";
           }
           else
           {
                $this->set("title", "An error has occured.");
                $this->header = "HTTP/1.1 500 Internal Server Error";
                $reason = "An internal server error has occured.";
           }
           $this->view = "window";
           $this->set("heading", "Error Code: " . $error);
           $this->set("text", $reason);
        }
        public function view()
        {
            header($this->header);
            parent::view();
        }
    }
?>