<?php
    class banner
    {
        private $data = NULL;
        public function __construct($id = NULL)
        {
            $db = createDb();
            if ($id !== NULL) //load specific ID
            {
                $query = $db->prepare("SELECT * FROM banners where bannerId = ?");
                $query->execute(array($id));
                if ($query->rowCount() === 1)
                {
                    $this->data = $query->fetch(PDO::FETCH_ASSOC);
                }                
            }
            else //else load random
            {
                $query = $db->query("SELECT a.* FROM banners a JOIN users b USING(userId) 
                                        where a.approval = 'approved' 
                                        AND b.remaining > 0 
                                        Order By Rand() limit 1 ");
                if ($query->rowCount() === 1)
                {
                    $this->data = $query->fetch(PDO::FETCH_ASSOC);
                }
            }
        }
        public function view() //default view
        {
            if ($this->data === NULL)
                return; //no banner loaded
            $db = createDb();
            $query = $db->prepare("update users tblUsers join banners tblBanners
                                   ON 
                                   tblUsers.userId = tblBanners.userId
                                   SET 
                                   tblBanners.impressions = tblBanners.impressions + 1,
                                   tblUsers.totalViews = tblUsers.totalViews + 1,
                                   tblUsers.remaining = tblUsers.remaining - 1
                                   Where tblBanners.bannerId = ?;");        
            $query->execute(array($this->get("bannerId")));
            
            include "views/banner.view.php";
        }
        public function click()
        {
            if ($this->data === NULL)
            {
                return false;
            }
            else
            {
                $db = createDb();
                $query = $db->prepare("update users tblUsers join banners tblBanners
                                       ON 
                                       tblUsers.userId = tblBanners.userId
                                       SET 
                                       tblBanners.clicks = tblBanners.clicks + 1,
                                       tblUsers.totalClicks = tblUsers.totalClicks + 1
                                       Where tblBanners.bannerId = ?;");        
                $query->execute(array($this->get("bannerId")));                
                return true;
            }
        }
        public function set($attr = "empty", $value = "")
        {
            $this->data[$attr] = $value;
        }
        public function get($attr = "")
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
        
    }
?>