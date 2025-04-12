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
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();


app.prepare().then(() => {

  const httpServer = createServer(handler);
  const userToPeerConnection = new Map();
  // const socketTouserMapping = new Map();
  const rooms = []
  const io = new Server(httpServer);
  const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
  let senderStream;

  io.on("connection", (socket) => {

    socket.on("create-room", async (data) => {
      //  accepting offer and creating answer
      const { offer, username } = data;
      const { answer, peer } = await creatingAnswer(offer)

      // mapping peer connectino with user
      userToPeerConnection.set(username, peer)

      //  creating a room...
      let roomId = rooms.length === 0 ? 1 : rooms[rooms.length - 1].id + 1
      peer.addEventListener('track', async (event) => {
        const [remoteStream] = event.streams;
        senderStream = remoteStream;

        // Log the tracks in the senderStream
        if (senderStream) {
          console.log("Tracks in senderStream:", senderStream.getTracks());
        } else {
          console.error("No senderStream available");
        }
        console.log("broadcasting sender stream to user: ", { username, senderStream });
        remoteStream.getTracks().forEach(track => {
          peer.addTrack(track, remoteStream);
        });
      });

      await socket.join(roomId);
      const createRoom = {
        id: roomId,
        connections: [peer],
      }
      rooms.push(createRoom)

      // responding with answer
      io.to(roomId).emit("room-answer", { answer, forUser: username, room: createRoom })
    })


    socket.on("ice-candidate", async ({ candidate, to }) => {
      const peer = userToPeerConnection.get(to)
      await peer.addIceCandidate(candidate)
    })


    socket.on('join-room', async ({ roomId, username, offer }) => {
      //  finding room with given id
      const finedRoom = rooms.find((room) => room.id === roomId)
      if (!finedRoom) {
        socket.emit('error', { message: "room not found while joining room" })
        return;
      }
      //  joining socket channel with room
      await socket.join(roomId);

      // creating new webrtc project
      const { answer, peer } = await creatingAnswer(offer)
      userToPeerConnection.set(username, peer)

      // listening for tracks
      // peer.addEventListener('track', async (event) => {
      // const [remoteStream] = event.streams;
      // });

      // sharing room streams
      console.log("broadcasting sender stream to user: ", { username, senderStream });
      const remoteStream = new wrtc.MediaStream();
      senderStream.getTracks().forEach(track => {
        remoteStream.addTrack(track)
        peer.addTrack(track, remoteStream);
      });

      // adding user to the room
      finedRoom.connections.push(peer)
      io.to(roomId).emit("room-answer", {
        answer,
        forUser: username,
        room: finedRoom,
      })
    })


    socket.on('negotiation', async ({ offer, username }) => {
      const userPeer = userToPeerConnection.get(username);
      if (!userPeer) return;
      const { answer } = await negotiationAnswer(offer, userPeer);
      socket.emit('negotiation-answer', { answer, username })
    })

    socket.on('listen-room-stream', async ({ roomId }) => {
      // const userPeer = userToPeerConnection.get(username);
      // console.log("sharing sender stream with user: ", { username, userPeer });
      // if (!userPeer) return;
      // if (!senderStream) {
      //   console.error("No senderStream available to share");
      //   return;
      // }
      console.log("room to find", { roomId });

      const room = rooms.find(room => room.id === roomId);
      if (!room) return;

      console.log("finded: ", { room });


      room.connections.forEach((peer, index) => {
        console.log("looping through all connected peers: ", { index, peer });
        senderStream.getTracks().forEach((track) => {
          peer.addTrack(track, testStream);
          console.log("Added track to userPeer:", track);
        });
      })
    });

  });


  //  helper functions
  const creatingAnswer = async (offer) => {
    const peer = new wrtc.RTCPeerConnection(configuration)
    await peer.setRemoteDescription(new wrtc.RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(new wrtc.RTCSessionDescription(answer))
    return { answer, peer };
  }

  const negotiationAnswer = async (offer, peer) => {
    await peer.setRemoteDescription(new wrtc.RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(new wrtc.RTCSessionDescription(answer))
    return { answer, peer };
  }


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


