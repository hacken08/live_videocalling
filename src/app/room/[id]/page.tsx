/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSocket } from "@/providers/socket-client"
import { Mic, MicOff, PhoneOff, VideoOff, MessageCircle, Smile, Coffee, Send, Video } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Peer, { MediaConnection } from 'peerjs'
import { v4 as uuid } from "uuid"
import React, { FC, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const page = () => {
    // const route = useRouter()
    // const [username, setUsername] = useState<string | undefined>();
    // const [user2, setUser2] = useState<string | undefined>();
    // const [isMicOn, setIsMicOn] = useState(true)
    // const [isVideoOn, setIsVideoOn] = useState(true)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [newMessage, setNewMessage] = useState("")
    const [messages, setMessages] = useState([
      { sender: "Friend", content: "Hey there! How's it going?" },
      { sender: "You", content: "Pretty good! Just chilling. You?" },
      { sender: "Friend", content: "Same here. Loving this relaxed vibe!" },
    ])
    const {socket} = useSocket()
    // const isNegotiated = useRef(false)
    // const videoRef = useRef<any>(null);
    // const friendVideoRef = useRef<any>(null);
  
  const params  = useParams()

  // const [, setCopied] = useClipboard(window.location.href);
  const [peers, setPeers] = useState<{ id: string, call: MediaConnection }[]>([])
  const userVideoRef = useRef<HTMLVideoElement>(null)

  const peer = useMemo(() => new Peer("", {
    host: 'localhost',
    port: 9000
  }), [])

  const [mute, setMute] = useState(false)
  const [blind, setBlind] = useState(false)


  useEffect(() => {
    const onOpen = (id: string): void => {
      console.log(`Peer Connection Open: ${id}`)
      socket?.emit('join-room', params.id, id);
    };
    const onPeerError: (err: any) => void = (err) => {
      alert("Failed to init peer");
      console.error("[peer-js]:", err);
    };
    const onSocketConnectError = (err: Error): void => {
      alert("Failed to connect socket");
      console.error("[socket-io]:", err);
    };

    peer.on('open', onOpen)
    peer.on("error", onPeerError)
    socket?.on("connect_error", onSocketConnectError)
    return () => {
      peer.off('open', onOpen)
      peer.off('error', onPeerError)
      socket?.off("connect_error", onSocketConnectError)
    }
  }, [])

  useEffect(() => {
    if (userVideoRef.current) {
      navigator.mediaDevices.getUserMedia({
        audio: !mute, video: !blind ? {
          width: { min: 320, max: 1280 },
          height: { min: 180 },
          frameRate: 25,
          facingMode: "user"
        } : false,
      }).then((stream) => {
        // local user video stream
        if (userVideoRef?.current) userVideoRef.current.srcObject = stream

        // if calling from another browser then answer with my stream
        peer.on('call', call => {
          console.log("Somebody's calling: ", call)
          call.answer(stream)
          setPeers(prev => [...prev, { id: uuid(), call }])
        })

        socket?.on('user-connected', userId => {
          console.log('New user connection:', userId)
          connectToNewUser(userId, stream)
        })

        socket?.on('new-user-connected', userId => {
          if (userId != peer.id) {
            console.log("new-user-connected (2): ", userId);
            connectToNewUser(userId, stream);
          }
        })

        socket?.emit('connection-request', params.id, peer.id);
      })
      return () => {
        peer.destroy()
      }
    }
  }, [blind, mute])

  useEffect(() => {
    const onUserDisconnected = (userId: string) => {
      console.log(`User disconnected ${userId}`)
      peers.find(({ id }) => id === userId)?.call.close();
      setPeers(peers.filter(({ id }) => id === userId))
    };
    socket?.on('user-disconnected', onUserDisconnected)
    return () => {
      socket?.off("user-disconnected", onUserDisconnected)
    }
  }, [peers])



  const connectToNewUser = (userId: string, stream: MediaStream) => {
    const call = peer.call(userId, stream)
    setPeers((prev) => {
      // ensuring no duplicates
      prev = prev.filter(({ id }) => id !== userId)
      return [...prev, { id: userId, call }]
    })
  }

  function handleListenForStream() {
    throw new Error("Function not implemented.")
  }

    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-amber-100 to-teal-100 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MiIgaGVpZ2h0PSI1MiI+CjxwYXRoIGQ9Ik0yNiAwIEExIDEgMCAwIDAgMjYgNTIgQTEgMSAwIDAgMCAyNiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNFNUU3RUIiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] opacity-30" />
      
      <header  className="relative z-10 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-teal-800 flex items-center">
            <Coffee className="h-8 w-8 mr-2 text-amber-600" />
            Chill Chat
          </h1>
          <Button variant="ghost" className="text-teal-800 hover:text-teal-600">
            <Smile className="h-6 w-6 mr-2" />
            Feeling Good!
          </Button>
        </div>
      </header>

      <main className="relative flex-grow p-6 flex flex-col justify-center items-center z-10">
        <div className="w-full max-w-7xl flex gap-8 h-full">
          <div
            className={`flex flex-wrap justify-center gap-6 transition-all duration-300 ease-in-out ${
              isChatOpen ? 'w-2/3' : 'w-full'
            }`}
          >

          <Card
            className="w-[300px] aspect-[16/9] relative bg-white/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-4 border-white"
          >
            <img
              src="/placeholder.svg?height=360&width=640"
              // alt={index === 0 ? "Your video feed" : "Friend's video feed"}
              alt="user pic"
              className="w-full h-full object-cover"
            />
            <video
              className="w-full h-full absolute top-0 bg-green-200"
              ref={userVideoRef}
              autoPlay
            ></video>
            <div
              className={`absolute bottom-4 left-4 ${ 'bg-amber-600/70'
                // index === 0 ? 'bg-teal-800/70' : 'bg-amber-600/70'
              } text-white px-4 py-2 rounded-full text-sm font-medium`}
            >
              {/* {index === 0 ? 'You' : 'Friend'} */}
              {/* {username} */}
            </div>
          </Card>
          
          {peers.map(({ id, call }) => <VideoCard key={id} call={call} />)}
          </div>
          {isChatOpen && (
            <Card className="w-1/3 bg-white/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border-4 border-white flex flex-col">
              <div className="p-4 bg-teal-100/50 border-b border-teal-200">
                <h2 className="text-2xl font-bold text-teal-800">Chat</h2>
              </div>
              <ScrollArea className="flex-grow p-4">
                {messages.map((message, index) => (
                  <div key={index} className={`mb-4 ${message.sender === "You" ? "text-right" : "text-left"}`}>
                    <div className={`inline-block px-4 py-2 rounded-2xl ${message.sender === "You" ? "bg-teal-200 text-teal-800" : "bg-amber-200 text-amber-800"}`}>
                      <p className="font-medium">{message.sender}</p>
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <form onSubmit={e=>{}} className="p-4 bg-teal-100/50 border-t border-teal-200">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow bg-white/50 border-teal-200 focus:border-teal-400 rounded-full"
                  />
                  <Button type="submit" size="icon" className="bg-teal-500 hover:bg-teal-600 rounded-full">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </main>

      <footer className="relative z-10 p-6">
        <div className="container mx-auto flex justify-center space-x-6">
          <Button
            variant="outline"
            size="lg"
            className="bg-white/80 border-2 border-teal-300 text-teal-800 hover:bg-teal-100 transition-colors rounded-full shadow-md"
            onClick={() => setMute(!mute)}
          >
            {mute ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            <span className="sr-only">{mute ? 'Mute' : 'Unmute'}</span>
          </Button>
          <Button
            variant="outline" 
            size="lg"
            className="bg-white/80 border-2 border-teal-300 text-teal-800 hover:bg-teal-100 transition-colors rounded-full shadow-md"
            onClick={() => {setBlind(!blind); handleListenForStream();}}
          >
            {blind ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            <span className="sr-only">{blind ? 'Stop Video' : 'Start Video'}</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/80 border-2 border-teal-300 text-teal-800 hover:bg-teal-100 transition-colors rounded-full shadow-md"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">Toggle Chat</span>
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="bg-red-500 hover:bg-red-600 transition-colors rounded-full shadow-md"
          >
            <PhoneOff className="h-6 w-6" />
            <span className="sr-only">End Call</span>
          </Button>
        </div>
      </footer>
    </div>
    )
}

export default page

interface VideoProps {
  call: MediaConnection
};

const VideoCard: FC<VideoProps> = ({ call }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const onCallStream = (stream: MediaStream): void => {
      console.log("Call streaming: ", stream)
      if (videoRef?.current)
        videoRef.current.srcObject = stream;
    };
    const onCallClose = () => {
      console.log("Call ended")
      videoRef.current!.srcObject = null;
    };

    call.on('stream', onCallStream)
    call.on('close', onCallClose)

    return () => {
      call.off('stream', onCallStream)
      call.off('close', onCallClose)
    }

  }, [call, videoRef])

  return (
    <Card
      className="w-[300px] aspect-[16/9] relative bg-white/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-4 border-white"
    >
      <img
        src="/placeholder.svg?height=360&width=640"
        // alt={index === 0 ? "Your video feed" : "Friend's video feed"}
        alt="user pic"
        className="w-full h-full object-cover"
      />
      <video
        className="w-full h-full absolute top-0 bg-green-200"
        ref={videoRef}
        autoPlay
      ></video>
      <div
        className={`absolute bottom-4 left-4 ${ 'bg-amber-600/70'
          // index === 0 ? 'bg-teal-800/70' : 'bg-amber-600/70'
        } text-white px-4 py-2 rounded-full text-sm font-medium`}
      >
        {/* {index === 0 ? 'You' : 'Friend'} */}
        {/* {username} */}
      </div>
    </Card>
  )
}
