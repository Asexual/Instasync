<?php
    class template
    {
        private $controller;
        function __construct($controller)
        {
            if (class_exists($controller) && (__DIR__ != dirname($this->getFileName($controller)))) //check if controller exists and not in same folder (with all the other non controller classes
            {                                                                                       //was too lazy to use reflector class AND check if the class doesnt exists then show 404

                if (session_status() == PHP_SESSION_NONE) { session_start();}
                if ($controller::loginOnly())
                {
                    if (isset($_SESSION['user'])) //can user see this controller?
                    {
                            $this->controller = new $controller();
                    }
                    else //show login screen instead
                    {
                        $this->controller = new login();
                    }
                }
                elseif ((isset($_SESSION['user'])) && ($controller === "login" || $controller === "register")) //redirect to account page if already logged in
                    $this->controller = new account();
                else
                    $this->controller = new $controller();
                
            }
            else
                $this->controller = new error(404);
            
            $action = NULL;
            if (isset($_GET["action"]))
                $action = $_GET["action"];
            if ($action !== NULL && method_exists($this->controller, $action))
                $this->controller->$action();
            
        }
        public function render()
        {
            $this->controller->view();
        }
        private function getFileName($class)
        {
            $reflector = new ReflectionClass($class);
            return $reflector->getFileName();
        }
    }
?>