var request  =  require('request');
var io =  require('socket.io'),
connect = require('connect');
var commandQueue = require("./commandQueue");
var room = require("./room");
var commands = require("./commands");
var parser = require("./parsers");
var app = connect().use(connect.static('public')).listen(38000);
var crypto = require('crypto');


global.chat_room = io.listen(app, {"log level": 2, "heartbeat timeout": 20, "heartbeat interval": 5, "close timeout": 20, "transports": ['websocket']});

global.phploc = "http://127.0.0.1/";
var systemName = "System";
app.setMaxListeners(0);

global.rooms = new Array();
/*------------------------------
    [SOCKET RELATED STUFF]
*/
var fs = require('fs');
process.on('uncaughtException', function (error) {
    console.log("UNHANDLED ERROR! Logged to file.");
    fs.appendFile("crashlog.txt", error.stack + "---END OF ERROR----");
});

var iptable = new Object();

chat_room.sockets.on('connection', function(socket)
{
        var ip = "";
        try {(ip = socket.manager.handshaken[socket.id].address.address)} catch (e) {console.log("Error with socket IP address"); socket.disconnect(); return;}
        if (iptable[ip] != undefined)
        {
            if (iptable[ip] > 4)
            {
                socket.emit('sys-message', { message: "Max users online with this IP."});
                socket.disconnect();
                return;
            }
            else
            {
                iptable[ip]++; 
            }
        }
        else
        {
            iptable[ip] = 1;
        }
        
        socket.lastMsg = 0;
        socket.lastCmd = 0;

    socket.joined = false;
    socket.connected = true;
    socket.joinEmitted = false;
    socket.on('join', function(data) //data to send on join: username, current user cookie, room name
    {    
//        //flood
//        var delay = 50;
//        if (socket.lastCmd + delay > new Date().getTime())
//        {
//            socket.emit('sys-message', { message: "Possible flood detected. Disconnected."});
//            socket.disconnect();
//
//            console.log("USER DISCONNECTED FOR FLOODING");
//            return;
//        }      
//       socket.lastCmd = new Date().getTime();
//       //-flood          
        if (!socket.joined && socket.joinEmitted == false)
        {// this is a one time emit per socket connection
            if (data.username != undefined && data.cookie != undefined && data.room != undefined)
            {
                data.room = data.room.toLowerCase();
                if (rooms[data.room] == undefined) //room not in memory
                {
                    request.post(phploc + 'data/roominfo.php', {form:{ room: data.room}}, function(e, r, msg)     
                    {
                        //data to send back from php file: username, permissions, class, style
                        if (socket.connected == false) //socket no longer connected
                            return;
                        try {var result = JSON.parse(msg)} catch(e) {console.log("Room JSON not valid?"); return;}
                        if (result.error == undefined )
                        {
                            if (rooms[data.room] == undefined) //check to be sure the room is still undefined
                            {
                                rooms[data.room] = room.create(data.room);
                                socket.emit('sys-message', { message: "Room loaded into memory, refresh page."});
                                socket.disconnect();
                            }
                        }
                        else
                        {
                            socket.emit('sys-message', { message: "This room does not exist."});
                            socket.disconnect();
                        }
                    });                  
                }
                else //room in memory
                {
                    var socketIp = "";
                    try {(socketIp = socket.manager.handshaken[socket.id].address.address)} catch (e) {console.log("Error with socket IP address"); return;}
                    request.post(phploc + 'data/parseuser.php', {form:{username: data.username, cookie: data.cookie, ip: socketIp, 
                                                                       room: data.room}}, function(e, r, msg)     
                    {
                        //data to send back from php file: username, permissions, class, style
                        if (socket.connected == false) //if the socket disconnected by the time this runs, stop
                            return;
                        try {var user = JSON.parse(msg)} catch(e) {console.log("JSON from parseuser.php not valid?" + msg); return;}
                        if (user.error != "none")
                        {
                            socket.emit('sys-message', {message: user.error});
                            socket.disconnect();
                        }
                        else
                        {       
                            var hashedIp = crypto.createHash('md5').update("Random Salt Value: $33x!20" + ip).digest("hex").substring(0, 11);
                            socket.info = {username: user.username, permissions: user.permissions, room: user.room, 
                                           loggedin: user.loggedin, ip: socketIp, hashedIp: hashedIp,
                                           skipped: false, voteinfo: {voted: false, option: null}};
                            if (rooms[socket.info.room] != undefined)    
                            {
                                rooms[socket.info.room].tryJoin(socket);
                            }
                        }
                    });
                }
                socket.joinEmitted = true;
            }
        }       
    });
    socket.on('rename', function(data)
    { 
        //flood
        var delay = 50;
        if (socket.lastCmd + delay > new Date().getTime())
        {
            socket.emit('sys-message', { message: "Possible flood detected. Disconnected."});
            socket.disconnect();

            console.log("USER DISCONNECTED FOR FLOODING");
            return;
        }      
       socket.lastCmd = new Date().getTime();
       //-flood  
        if (socket.joined)
        {
            if (socket.info.username == "unnamed")
            {
                rooms[socket.info.room].rename(socket, data.username);
            }
        }
    });
    socket.on('disconnect', function(){ 
        socket.connected = false;
        //if socket joined disconnect, otherwise really do nothing
        iptable[ip]--;
        if (iptable[ip] === 0)
        {
            delete iptable[ip];
        }
        if (socket.joined)
        {
            if (rooms[socket.info.room] != undefined)
            {
                rooms[socket.info.room].leave(socket);
            }
        }
    });
    socket.on('message', function(data) //validate that both username and message are htmlsafe
    {
        //flood
        var delay = 250;
        if (socket.lastMsg + delay > new Date().getTime())
        {
            socket.emit('sys-message', { message: "Possible flood detected. Disconnected."});
            socket.disconnect();

            console.log("USER DISCONNECTED FOR FLOODING");
            return;
        }      
       socket.lastMsg = new Date().getTime();
       //-flood    
       
        if ((data.message != undefined) && (socket.joined) && (data.message.trim() != "") && (socket.info.username.toLowerCase() != "unnamed")){
            rooms[socket.info.room].chatmessage(socket, parser.replaceTags(data.message));
        }
    });
    
    var queue = commandQueue.create(4);
    socket.on('command', function(data) //validate that both username and message are htmlsafe
    {
        queue.addCommand();
        if (queue.checkFlood()) //too many commands
        {
            socket.emit('sys-message', { message: "Too many commands. Disconnected."});
            socket.disconnect();
            return;
        }
        if (socket.joined){
            handleCommand(socket, data);
        }
    });
});
function handleCommand(socket, data)
{
    if (data.command != undefined && commands.commands[data.command] !=  undefined)
    {
        if (data.data !== undefined) //TODO: Check if data is not null for certain commands
            commands.commands[data.command](data.data, socket);
    }
}