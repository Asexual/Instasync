<form action="<?php echo $this->get("action") ?>" method="post">
    <h1><?php echo $this->get("formTitle"); ?></h1>
    <div class="inset">
        <?php
            foreach($this->get("fields") as $field)
            {
                echo "<p>";
                if ($field["type"] != "checkbox")
                {
                        echo "<label for='{$field["name"]}'>{$field["label"]}</label>";
                        echo "<input type='{$field["type"]}' name='{$field["name"]}' id='{$field["name"]}'>";
                }
                else
                {
                        echo "<label for='{$field["name"]}'>{$field["label"]}</label>";
                        echo "<input type='{$field["type"]}' name='{$field["name"]}' id='{$field["name"]}' checked>";      
                }
                echo "</p>";
            }
        ?>
    </div>
    <div style=" width: 200px; margin-left: 20px; color: red"><?php echo $this->get("error"); ?></div>
    <p class="p-container">
        <span><?php echo $this->get("formMessage") ?></span>
        <input type="submit" name="go" id="go" value="<?php echo $this->get("submitText") ?>">
    </p>
</form>