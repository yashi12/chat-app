require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');

const {generateMessage, generateOldMessage, generateError} = require('./utils/message');
const {isRealString} = require('./utils/isRealString');
const {Users} = require('./utils/users');

var app = express();
app.use(cors());

const con = mysql.createConnection({
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT,
    // database: process.env.RDS_DATABASE
    // host: "localhost",
    // user: "root",
    // password: "abcd1234",
    // port: 3306
});

const executeQuery = (inQuery) => {
    return con.connect((err) => {
        if (err) {
            console.log(err);
            return err;
        }
        con.query(inQuery, (error, result, fields) => {
            if (error) {
                console.log(error.message);
                return error;
            }
        });
    });
}
const publicPath = path.join(__dirname, '/../public');

let server = http.createServer(app);
let io = socketIO(server);
let users = new Users();

app.use(express.static(publicPath));

io.on('connection', (socket) => {
    socket.on('join', (params, callback) => {
        console.log("a user just connected");
        if (!isRealString(params.name) || !isRealString(params.room)) {
            callback('name and room required');
        }
        socket.join(params.room);
        users.removeUser(socket.id);
        users.addUser(socket.id, params.name, params.room);
        let query = `select *
                     from messages
                     where roomId = ${params.room};`;
        con.query(query, function (error, result, fields) {
            if (error) {
                console.log(error.message);
                return error;
            }
            result.map(row => {
                socket.emit('newMessage', generateOldMessage(row.userId, row.msg, row.date_time));
            });
        });
        // executeQuery(query);
        query = `insert into rooms (userId, roomId)
                 values ('${params.name}', '${params.room}');`;
        executeQuery(query);
        io.to(params.room).emit('updateUsersList', users.getUserList(params.room));
        socket.emit('newMessage', generateMessage('Admin', 'Welcome to chat app!'));
        callback();
    });

    socket.on('createMessage', (message, callback) => {
        let user = users.getUser(socket.id);
        const query = `select userId
                       from users
                       where userId = '${user.name}';`;
        con.query(query, function (error, result, fields) {
            if (error) {
                console.log(error.message);
            }
            console.log("result[0] start", result);
            if (result[0] != null) {
                console.log(" null")
                if (user && isRealString(message.text)) {
                    const query = `insert into messages (userId, roomId, msg)
                                   values ('${user.name}', '${user.room}', '${message.text}');`;
                    executeQuery(query);
                    io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
                }
            } else {
                socket.emit('notRegistered', generateError('User not registered'));
            }
        });

        callback('this is server...');
    });

    socket.on('disconnect', () => {
        let user = users.getUser(socket.id);
        users.removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('updateUsersList', users.getUserList(user.room));
        }
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
    con.connect((err) => {
        if (err) {
            console.log(err);
            return new Error(err.message);
        }
        con.query('CREATE DATABASE IF NOT EXISTS chat;');
        con.query('USE chat;');
        con.query('CREATE TABLE IF NOT EXISTS users (userId varchar(50) not null primary key);', function (error, result, fields) {
            if (error) {
                console.log(error.message)
            }
        });
        con.query('insert into users values ("yashi"),("sam"),("anshu"),("xyz");', function (error, result, fields) {
            if (error) {
                console.log(error.message)
            }
        });
        con.query('CREATE TABLE IF NOT EXISTS rooms ( userId varchar(50) not null constraint check (length(userId)>0) ,\n' +
            'roomId varchar(50) not null constraint check (length(roomId)>0),\n' +
            ' primary key(userId,roomId),\n' +
            ' FOREIGN KEY (userId) REFERENCES users(userId));', function (error, result, fields) {
            if (error) {
                console.log(error.message)
            }
        });
        con.query('CREATE TABLE IF NOT EXISTS messages ( userId varchar(50) not null constraint check (length(userId)>0) ,\n' +
            'roomId varchar(50) not null constraint check (length(roomId)>0), \n' +
            'msg varchar(800) not null constraint check (length(msg)>0),\n' +
            'date_time DATETIME DEFAULT CURRENT_TIMESTAMP,\n' +
            'FOREIGN KEY (userId,roomId) REFERENCES rooms(userId,roomId));', function (error, result, fields) {
            if (error) {
                console.log(error.message)
            }
        });
    });
});