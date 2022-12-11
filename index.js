const express = require("express");
const app = express();
const port = 3001;
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const server = http.Server(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, "public")));

let connectedUsers = [];

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/index", (req, res) => {
    res.redirect("/");
});

io.on("connection", (socket) => {
    socket.on("user_join", (data) => {
        connectedUsers.push({username:data, socket: socket.id});
        io.emit("roomUsers", connectedUsers);
        socket.broadcast.emit("user_join", data);
    });

    socket.on("msg", (data) => {
        if (data.message && data.message.trim()) {
            socket.broadcast.emit("chat_message", data);
        }
    });

    socket.on("disconnect", () => {
        Object.values(connectedUsers).forEach(user => {
            if (user.socket == socket.id) {
                socket.broadcast.emit("user_leave", user.username);
                connectedUsers = connectedUsers.filter(user => user.socket !== socket.id);
                io.emit("roomUsers", connectedUsers);
            }
        });
    });
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
