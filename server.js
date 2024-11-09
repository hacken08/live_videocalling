"use server"

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { Socket } from "socket.io-client";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();


app.prepare().then(() => {

  const httpServer = createServer(handler);
  const userToSocketMapping = new Map();
  const socketTouserMapping = new Map();
  const io = new Server(httpServer);


  io.on("connection", (socket) => {

    socket.on("join-room", async (data) => {
      const { roomId, username } = data;
      await socket.join(roomId);

      userToSocketMapping.set(username, socket.id);
      socketTouserMapping.set(socket.id, username);
      console.log("member has been joined ", data);

      io.to(data.roomId).emit("room-joined", { ...data, status: true })
    })

    socket.on("outgoinng-offer", data => {
      const { offer, username, roomId } = data;
      console.log("to ", username);

      const socketId = userToSocketMapping.get(username)
      const fromUser = socketTouserMapping.get(socket.id);

      console.log("outgoing call from ->", data);
      console.log("socketId ->", socketId);

      io.to(roomId).emit("incoming-offer", { from: fromUser, offer });
    })

    socket.on("answered", data => {
      const { roomId, answer, username } = data;
      console.log("answering call to ->", data);
      const socketId = userToSocketMapping.get(username)
      io.to(socketId).emit("offer-accepted", { from: username, answer })
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