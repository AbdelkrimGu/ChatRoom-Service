const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const axios = require('axios');
const cors = require('cors');



const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
      origin: '*'
    }
});

users = [];




const PORT = 3000;
//const ngrokurl = " https://3f0f-41-101-206-187.ngrok-free.app";
const url = "https://secondservice.onrender.com"

io.on('error', (error) => {
    console.error('Socket error:', error.message);
});

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Handle token verification and group joining
  socket.on('teacher', async ({token , meetingId}) => {
    const url = 'https://userservice-production-dd99.up.railway.app'
    const url2 = 'https://secondservice.onrender.com'
    const response = await axios.get(url+ '/api/v1/any', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
    });

    const teacher = response.data;

    await axios.get(url2+'/api/courses/' + meetingId, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      // handle success
      console.log(response.data);
      //activeMeetings[meetingId] = socket;

      // Join the teacher to the meeting room
      socket.join(`meeting-${meetingId}`);

      users[socket.id] = teacher;
      console.log(users[socket.id]);
      // Add the teacher's socket to the list of sockets for the meeting
      //activeMeetings[meetingId].sockets.push(socket);
      socket.emit('tokenVerified', {message : true});
    })
    .catch(error => {
      // handle error
      console.log(error);
      // Disconnect the socket
      socket.disconnect();
    });
  });
  socket.on('student', async ({token , meetingId} , callback) => {
    const url = 'https://userservice-production-dd99.up.railway.app'
    const url2 = 'https://secondservice.onrender.com'
    const response = await axios.get(url+ '/api/v1/any', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
    });

    console.log("done 1");
    console.log(meetingId);
    console.log(token);
    const student = response.data;

    await axios.get(url2+'/api/students/cours/' + meetingId, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      // handle success
      //console.log(response.data);
      //activeMeetings[meetingId] = socket;
      console.log("done 2");

      // Join the teacher to the meeting room
      socket.join(`meeting-${meetingId}`);
      users[socket.id] = student;
      console.log(users[socket.id]);

      // Add the teacher's socket to the list of sockets for the meeting
      //activeMeetings[meetingId].sockets.push(socket);
      callback({message : true});
      socket.emit('tokenVerified', {message : true});
    })
    .catch(error => {
      // handle error
      console.log("error 3");
      console.log(error);
      // Disconnect the socket
      socket.disconnect();
    });
  });
  

  /*socket.on('askQuestion', ({meetingId}) => {
    const teacherSocket = activeMeetings[meetingId];
    if (teacherSocket) {
      questionSockets[socket.id] = socket;
      teacherSocket.emit('askQuestion' , {socketId : socket.id});
    }
  });


  socket.on('permissionAccepted', ({socketId}) => {
    const studentSocket = questionSockets[socketId];
    console.log(studentSocket);
    if (studentSocket) {
      delete questionSockets[socketId];
      studentSocket.emit('permissionAccepted');
    }
  });*/

  

  socket.on('message', ({ meetingId, message}) => {
    console.log("here",message);
    socket.broadcast.to(`meeting-${meetingId}`).emit('newMessage', { socketId: socket.id, message: message ,nom : users[socket.id].nom , prenom : users[socket.id].prenom ,imageUrl : users[socket.id].imageUrl});
    
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    // Get the meeting ID from the socket object
    const meetingId = socket.meetingId;

    // If the socket was not part of a meeting, do nothing
    if (!meetingId) return;

    socket.broadcast.to(`meeting-${meetingId}`).emit('userDisconnected', { socketId: socket.id, meetingId });
    console.log(`Socket ${socket.id} left meeting ${meetingId}`);
    socket.leave(`meeting-${meetingId}`);
    

  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
