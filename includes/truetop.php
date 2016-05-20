            <div id="truetop">
                <div class="room-top" id="top">  
                    <a href="/"><img src="/images/logoNoBG.png" height="55" width="172"></a>
                    <div id="loginfrm">
                        <div class="hide" id="login">
                            <input maxlength="16" name="username" type="text" placeholder="Username" id="loginUsername"/>
                            <input name="password" type="password" placeholder="Password" id="loginPassword"/>
                            <button onclick="login()">Login</button>
                            <br />
                            <a href="javascript:void(0);" onclick="$('#register-form').fadeIn('slow');">Register</a>  
                            <span style="color: white;">|</span>
                            <a href="/settings/index.php#tabs-3">Forgot My Password</a>  
                        </div>
                        <div class="hide" id="register-form">
                            <div class="closeform" onclick="$('#register-form').fadeOut('fast');"></div>
                            <input class="formbox" type="text" id="username" placeholder="Username"/><br>
                            <input class="formbox" type="password" id="password" placeholder="Password"/><br>
                            <input class="formbox" type="password" id="confirmPassword" placeholder="Confirm Password"/><br>    
                            <input class="formbox" type="text" id="email" placeholder="Email"/><br>                         
                            <span class="formmsg"></span>
                            <button onclick="register()" class="formsubmit">Register</button>
                        </div>                    
                        <div class="hide" id="loggedInAs" style=" color: white; float: right; padding-top: 5px;">
                            <div class="click-nav">
                                    <ul class="no-js">
                                            <li>
                                                    <a class="clicker" id="myName"><img src="/images/clickable-dropdown/i-1.png" alt="Icon"></a>
                                                    <ul>						
                                                            <li><a href="#" id="myRoomLink"><img src="/images/clickable-dropdown/i-2.png" alt="Icon">My Room</a></li>
                                                            <li><a href="/settings/"><img src="/images/clickable-dropdown/i-3.png" alt="Icon">Settings</a></li>
                                                            <li><a href="/help.php"><img src="/images/clickable-dropdown/i-5.png" alt="Icon">Help</a></li>
                                                            <li><a href="" onclick="$.cookie('username', '', {expires: -1, path: '/'}); $.cookie('sessionid', '', {expires: -1, path: '/'} );"><img src="/images/clickable-dropdown/i-6.png" alt="Icon">Sign out</a></li>
                                                    </ul>
                                            </li>
                                    </ul>
                            </div>
                        </div>
                        <span id="loginerror" style="color:red; display: none;"></span>
                    </div>  
                </div>  
                <script type="text/javascript">
                    $(document).ready(function()
                    {
                        $(document).keypress(function(e)
                        {
                                if (e.which == 13)
                                {
                                if ($("#loginUsername").is(":focus"))
                                {
                                    login();
                                }
                                else if ($("#loginPassword").is(":focus"))
                                {
                                    login();
                                }
                            }
                        }); 
                        checkLogin(function(loggedin, username, avatar, bio)
                        {
                            if (loggedin === true)
                            {
                                $("#loggedInAs").removeClass("hide");
                                $("#settingsAvatarUrl").val(avatar);
                                $("#settingsBio").val(bio);
                                //Drop down
                                $("#myName").html('<img src="/images/clickable-dropdown/i-1.png" alt="Icon">' + $.cookie("username"));
                                $("#myRoomLink").attr("href", "/rooms/" + $.cookie("username"));

                                $('.click-nav > ul').toggleClass('no-js js');
                                $('.click-nav .js ul').hide();
                                $('.click-nav .js').click(function(e) {
                                    $('.click-nav .js ul').slideToggle(200);
                                    $('.clicker').toggleClass('active');
                                    e.stopPropagation();
                                });
                                $(document).click(function() {
                                    if ($('.click-nav .js ul').is(':visible')) {
                                            $('.click-nav .js ul', this).slideUp();
                                            $('.clicker').removeClass('active');
                                    }
                                });
                                }
                            else
                            {
                                $("#login").removeClass("hide");
                            }
                            //--
                        });
                    });
                </script>
            </div>