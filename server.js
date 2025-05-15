/* room {
  id: string,
  connections: {peers},
  streamData: string
}*/

"use server"

import { createServer } from "node:http";
import { Server } from "socket.io";
import next from "next";
import wrtc from 'wrtc'

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();


app.prepare().then(() => {

  const httpServer = createServer(handler);
  // const socketTouserMapping = new Map();
  const io = new Server(httpServer);

  // const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }


  io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
      console.log({ roomId, userId })
      socket.join(roomId)
      socket.to(roomId).emit('user-connected', userId)

      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId)
      })

      socket.on('connection-request', (roomId, userId) => {
        io.to(roomId).emit('new-user-connected', userId);
      })
    })
  })



  //  helper functions
  // const creatingAnswer = async (offer) => {
  //   const peer = new wrtc.RTCPeerConnection(configuration)
  //   await peer.setRemoteDescription(new wrtc.RTCSessionDescription(offer));
  //   const answer = await peer.createAnswer();
  //   await peer.setLocalDescription(new wrtc.RTCSessionDescription(answer))
  //   return { answer, peer };
  // }

  // const negotiationAnswer = async (offer, peer) => {
  //   await peer.setRemoteDescription(new wrtc.RTCSessionDescription(offer));
  //   const answer = await peer.createAnswer();
  //   await peer.setLocalDescription(new wrtc.RTCSessionDescription(answer))
  //   return { answer, peer };
  // }


  // starting server
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});


