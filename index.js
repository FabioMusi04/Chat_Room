/**
 * Module dependencies.
 */
const express = require("express");
const app = express();
const port = 3001;
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const server = http.Server(app);
const io = require("socket.io")(server);

/**
 * Serve static files from the 'public' directory.
 */
app.use(express.static(path.join(__dirname, "public")));


/**
 * Keep track of connected users.
 * @type {Array}
 */
let connectedUsers = [];


/**
 * Serve the default index.html file on the '/' route.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});


/**
 * Redirect the '/index' route to the '/' route.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get("/index", (req, res) => {
  res.redirect("/");
});


/**
 * Handle a new socket connection.
 *
 * @param {Object} socket - Socket.io socket object
 */
io.on("connection", (socket) => {


  /**
   * Handle a "user_join" event.
   * Add the user to the list of connected users and broadcast the updated
   * list of users to all connected sockets.
   *
   * @param {Object} data - Event data
   * @param {string} data.username - The username of the user joining the room
   */
  socket.on("user_join", (data) => {
    connectedUsers.push({ username: data, socket: socket.id });
    io.emit("roomUsers", connectedUsers);
    socket.broadcast.emit("user_join", data);
  });


  /**
   * Handle a "msg" event.
   * Broadcast the message to all connected sockets, if the message is not
   * empty.
   *
   * @param {Object} data - Event data
   * @param {string} data.message - The message to be broadcasted
   */
  socket.on("msg", (data) => {
    if (data.message && data.message.trim()) {
      socket.broadcast.emit("chat_message", data);
    }
  });


  /**
   * Handle a socket disconnection.
   * Remove the user from the list of connected users and broadcast the updated
   * list of users to all connected sockets.
   */
  socket.on("disconnect", () => {
    Object.values(connectedUsers).forEach((user) => {
      if (user.socket == socket.id) {
        socket.broadcast.emit("user_leave", user.username);
        connectedUsers = connectedUsers.filter(
          (user) => user.socket !== socket.id
        );
        io.emit("roomUsers", connectedUsers);
      }
    });
  });
});


/**
 * Start the server on the specified port.
 */
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
