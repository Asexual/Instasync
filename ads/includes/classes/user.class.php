<?php
    class user
    {
        private $data = NULL;
        function __construct(){}
        public function loadByCredentials($email, $password)
        {
            $db = createDb();
            $query = $db->prepare("SELECT * FROM users WHERE email=? AND password =? limit 1");
            $query->execute(array($email, hashpw2($password)));
            if ($query->rowCount() === 1)
            {
                $this->data = $query->fetch(PDO::FETCH_ASSOC);
                if ($this->getUserInfo("verified") === "t")
                    return array("success"=>true,"error"=>"");
                else 
                    return array("success"=>false, "error"=>"You have not verified your email address yet.");
                
            }
            else
            {
                return array("success"=>false,"error"=>"Incorrect email or password.");
            }
        }
        public function loadByID($id)
        {
            $db = createDb();
            $query = $db->prepare("SELECT * FROM users WHERE userId=? limit 1");
            $query->execute(array($id));
            if ($query->rowCount() === 1)
            {
                $this->data = $query->fetch(PDO::FETCH_ASSOC);
                return true;
            }
            else
            {
                return false;
            }
        }
        public function getUserInfo($field = NULL)
        {
            if ($field === NULL) //return all fields
            {
                return $this->data;
            }
            else
            {
                if (array_key_exists($field, $this->data)) return $this->data[$field];
                else return false;
            }
        }
        public static function verifyEmail($token)
        {
            
        }
    }
?>