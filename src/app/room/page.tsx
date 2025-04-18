/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePeer } from "@/providers/peer-provider"
import { useSocket } from "@/providers/socket-client"
import { Mic, MicOff, PhoneOff, Video, VideoOff, MessageCircle, Smile, Coffee, Send } from "lucide-react"
import { useRouter } from "next/navigation"

import React, { useEffect, useRef, useState } from 'react'

const page = () => {
    const route = useRouter()
    const [roomId, setRoomId] = useState<number | undefined>();
    const [username, setUsername] = useState<string | undefined>();
    const [user2, setUser2] = useState<string | undefined>();
    const [isMicOn, setIsMicOn] = useState(true)
    const [isVideoOn, setIsVideoOn] = useState(true)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [newMessage, setNewMessage] = useState("")
    const [messages, setMessages] = useState([
      { sender: "Friend", content: "Hey there! How's it going?" },
      { sender: "You", content: "Pretty good! Just chilling. You?" },
      { sender: "Friend", content: "Same here. Loving this relaxed vibe!" },
    ])
    const {socket} = useSocket()
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const videoRef2 = React.useRef<HTMLVideoElement>(null)
    const { peer, createOffer, createAnswer } = usePeer();
    const isIceCandidateAdded = useRef(true)


    const sendMessage = (e: React.FormEvent) => {
      e.preventDefault()
      if (newMessage.trim()) {
        setMessages([...messages, { sender: "You", content: newMessage.trim() }])
        setNewMessage("")
      }
    }

    function init () {
      console.log("this room", {username, user2, roomId});
      
      socket?.on('enter-room', async ({roomId, who}) => {
        if (who === username) return;
        console.log("some one joined", {roomId, who});
        const offer = await createOffer();
        setUser2(who);
        socket?.emit("offer", {roomId, from: username, offer, to: who});
      })

      socket?.on('incoming-offer', async ({from, roomId, offer, to}) => {
        if (to !== username) return;
        console.log('offer received at remote peer', {from, offer, check: to !== username});
        const answer = await createAnswer(offer);
        setUser2(from)
        socket?.emit("answer", {to: from, from: to, answer, roomId})
      })

      socket?.on('incoming-answer', async ({answer, to}) => {
        if (to !== username) return;
        console.log('answer received at local peer', {answer});
        await peer.setRemoteDescription(new RTCSessionDescription(answer))
        console.log('peer connection established');
      })

      peer!.addEventListener('negotiationneeded', async () => {
        // if (!isNegotiationNeeded.current) return;
        // isNegotiationNeeded.current = false;
        console.log('negotiation needed');
        const offer = await peer.createOffer();
        socket?.emit("offer", {roomId, from: username, offer, to: user2})
      })

      peer!.addEventListener('icecandidate', (event) => {
        // if (!isIceCandidateAdded.current) return;
        // isIceCandidateAdded.current = false;
        console.log('ice candidate', {event});
        if (event.candidate) {
          socket?.emit("candidate", {roomId, from: username, candidate: event.candidate, to: user2})
        }
      })

      socket?.on('incoming-candidate', async ({candidate, to}) => {
        if (to !== username) return;
        
        console.log('candidate received at remote peer', {candidate});
        if (!candidate || !candidate.candidate) {
          console.error('Invalid ICE candidate received:', candidate);
          return;
        }
        await peer.addIceCandidate(new RTCIceCandidate(candidate))
      })
      
      peer!.addEventListener('track', (track) => {
        console.log('track received at remote peer', {track});
        videoRef2.current!.srcObject = track.streams[0];
      })
    }
     
    const handleVideoOn = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current!.srcObject = stream;
      console.log('sharing localt stream over peer', {stream});
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      })
    }

    
    useEffect(() => {
      socket?.removeAllListeners();
      if (username) init()
    }, [username, user2, roomId, isIceCandidateAdded.current])
    useEffect(() => {
      if (localStorage != undefined) {
        setRoomId(parseInt(localStorage.getItem("roomId") ?? "0"))
        setUsername(localStorage.getItem("username") ?? "")
      }
    }, [])
    
    return (
       <div className="flex flex-col h-screen bg-gradient-to-br from-amber-100 to-teal-100 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MiIgaGVpZ2h0PSI1MiI+CjxwYXRoIGQ9Ik0yNiAwIEExIDEgMCAwIDAgMjYgNTIgQTEgMSAwIDAgMCAyNiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNFNUU3RUIiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] opacity-30" />
      
      <header className="relative z-10 p-6">
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
          <div className={`flex flex-col md:flex-row gap-8 transition-all duration-300 ease-in-out ${isChatOpen ? 'w-2/3' : 'w-full'}`}>
            <Card className="flex-1 relative aspect-video bg-white/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-4 border-white">
              <img
                src="/placeholder.svg?height=360&width=640"
                alt="Your video feed"
                className="w-full h-full object-cover"
              />
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover absolute top-0" />
              <div className="absolute bottom-4 left-4 bg-teal-800/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                You
              </div>
            </Card>
            <Card className="flex-1 relative aspect-video bg-white/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-4 border-white">
              <img
                src="/placeholder.svg?height=360&width=640"
                alt="Friend's video feed"
                className="w-full h-full object-cover"
              />
              <video ref={videoRef2} autoPlay muted className="w-full h-full object-cover absolute top-0" />
              <div className="absolute bottom-4 left-4 bg-amber-600/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                Friend
              </div>
            </Card>
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
              <form onSubmit={sendMessage} className="p-4 bg-teal-100/50 border-t border-teal-200">
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
            onClick={() => setIsMicOn(!isMicOn)}
          >
            {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            <span className="sr-only">{isMicOn ? 'Mute' : 'Unmute'}</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/80 border-2 border-teal-300 text-teal-800 hover:bg-teal-100 transition-colors rounded-full shadow-md"
            onClick={() => {setIsVideoOn(!isVideoOn); handleVideoOn()}}
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            <span className="sr-only">{isVideoOn ? 'Stop Video' : 'Start Video'}</span>
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

