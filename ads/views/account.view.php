<div class="window">
    <div class="account">
        <?php include "navigation.view.php" ?>
        <div class="stats">
            <ul>
                <li>
                    <div class="left">Total Views:</div>
                    <div class="right"><?php echo $this->user->getUserInfo("totalViews"); ?></div>
                </li>
                <li>
                    <div class="left">Total Clicks:</div>
                    <div class="right"><?php echo $this->user->getUserInfo("totalClicks"); ?></div>
                </li>
                <li>
                    <div class="left">Remaining Views:</div>
                    <div class="right"><?php echo $this->user->getUserInfo("remaining"); ?></div>
                </li>
                <li>
                    <div class="left">Email:</div>
                    <div class="right"><?php echo $this->user->getUserInfo("email"); ?></div>
                </li>                
            </ul>
            <div style="clear:both;"></div>
        </div>
    </div>
</div>