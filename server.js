"use server"

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { Socket } from "socket.io-client";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();


app.prepare().then(() => {

  const httpServer = createServer(handler);
  const userToSocketMapping = new Map();
  const socketTouserMapping = new Map();
  const io = new Server(httpServer);


  io.on("connection", (socket) => {

    socket.on('join-room', ({ roomId, username }) => {
      socket.join(roomId);
      //  mapping user it's socket
      userToSocketMapping.set(username, socket.id);
      socketTouserMapping.set(socket.id, username)
      console.log("some one enter", { username, roomId });
      io.to(roomId).emit('enter-room', { roomId, who: username })
    })

    socket.on('offer', ({ from, to, offer, roomId }) => {
      console.log('forwading offer: ', { to, roomId, offer, from });
      setTimeout(() =>
        io.to(roomId).emit('incoming-offer', { from, roomId, to, offer }),
        1000
      )
    })

    socket.on('answer', ({ to, answer, from, roomId }) => {
      console.log('forwading answer: ', { to, answer });
      io.to(roomId).emit('incoming-answer', { to, roomId, from, answer })
    })

    socket.on('candidate', ({ to, candidate, from, roomId }) => {
      console.log('forwading cnadidate: ', { to, from });
      io.to(roomId).emit('incoming-candidate', { to, roomId, from, candidate })
    })



  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});