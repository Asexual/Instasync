<?php
    class controller
    {
        private $data = array();
        protected $view;
        protected static $loginOnly = true; 
                
        public function __construct()
        {
           $this->set("title", "Default Controller");
        }
        public function view() //default view
        {
            include ROOT . "views/header.php";
            if (empty($this->view))
                include ROOT . "views/" . get_class($this) . ".view.php";
            else
                include ROOT . "views/" . $this->view . ".view.php";   
            include ROOT . "views/footer.php";
        }
        protected function set($attr = "empty", $value = "")
        {
            $this->data[$attr] = $value;
        }
        protected function get($attr = "")
        {
            if (!isset($this->data[$attr]))
            {
                return "";
            }
            else
            {
                return $this->data[$attr];
            }
        }
        public static function loginOnly()
        {
            return static::$loginOnly;
        }
    }
?>