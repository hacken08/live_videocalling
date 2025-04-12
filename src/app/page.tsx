'use client'

import { UserIcon, VideoIcon, UsersIcon, MessageCircleIcon, MicIcon, } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useSocket } from '@/providers/socket-client'
import { usePeer } from '@/providers/peer-provider'



export default function Home() {
  const [roomId, setRoomId] = useState<string>('')
  const router = useRouter()
  const { socket } = useSocket()
  const peer  = usePeer()
  const {username, setUsername} = peer;

  function init() {
    socket!.on("room-answer", async ({answer, forUser, room}) => {
      if (username !== forUser) return;
      console.log("step 2: Rooom created and connection established: ");
      await peer?.peer.setRemoteDescription(new RTCSessionDescription(answer));
      router.push(`/room/${room.id}`)
    })

    // peer.peer.addEventListener("track", (track) => {
    //   console.log("Tracking recieve: ", {track});
    // })
    
    socket?.on('error', (data) => console.error(data))
  }
  
  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username) {
      const offer = await peer.createOffer()
      console.log("step 1: creating room", {createdBy: username, offer});
      socket!.emit("create-room", { offer, username })
      // router.push(`/room`)
    }
  }

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (roomId) {
      const offer = await peer.createOffer()
      console.log("step 1: ", {createdBy: username, offer});
      socket!.emit("join-room", { offer, username, roomId: parseInt(roomId) })
      // router.push(`/room`)
    }
  }

  useEffect(() => {
    init();
  }, [username])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-white shadow-lg rounded-2xl overflow-hidden">

          <CardHeader className="bg-gradient-to-br from-amber-100 to-teal-100 text-white p-6">
            <CardTitle className="text-3xl text-teal-800 font-bold text-center mb-2">Join the Call</CardTitle>
            <p className="text-teal-800 text-center">Connect with your team in high-quality video</p>
          </CardHeader>
          <form onSubmit={createRoom}>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">Username</Label>
                <div className="relative">
                  <UserIcon size={22} className="absolute text-xs left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="px-12 py-5 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomId" className="text-gray-700">Room ID</Label>
                <div className="relative">
                  <VideoIcon size={22} className="absolute left-3 text-xs top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="roomId"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    required
                    className="px-12 py-5 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 p-6">
              <Button
                onClick={joinRoom}
                className="w-full bg-gradient-to-br from-amber-100 to-teal-100 hover:from-amber-200 hover:to-teal-200 text-teal-800 transition-all duration-300 ease-in-out rounded-lg"
              >
                Join Room
                <VideoIcon className="ml-2 h-4 w-4 text-teal-800" />
              </Button>
              <p className='mx-5'>OR</p>
              <Button
                type="submit"
                className="w-full bg-gradient-to-br from-amber-100 to-teal-100 hover:from-amber-200 hover:to-teal-200 text-teal-800 transition-all duration-300 ease-in-out rounded-lg"
              >
                Create room
                <VideoIcon className="ml-2 h-4 w-4 text-teal-800" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-amber-100 to-teal-100 items-center justify-center p-8">
        <div className="text-white max-w-md">
          <h2 className="text-4xl font-bold text-teal-800 mb-6">Welcome to VideoConnect</h2>
          <p className="text-xl mb-8 text-teal-800">Experience seamless video conferencing with crystal-clear audio and HD video quality.</p>
          <div className="grid grid-cols-2 gap-6">
            <FeatureCard icon={UsersIcon} title="Group Calls" description="Connect with up to 50 participants" />
            <FeatureCard icon={MessageCircleIcon} title="Chat" description="Built-in text chat for easy communication" />
            <FeatureCard icon={MicIcon} title="Audio" description="Crystal-clear audio with noise cancellation" />
            <FeatureCard icon={VideoIcon} title="HD Video" description="High-definition video for all calls" />
          </div>
        </div>
      </div>
    </div>
  )
}


function FeatureCard({ icon: Icon, title, description }: FeatureCardType) {
  return (
    <div className="bg-amber-300 bg-opacity-10 p-4 rounded-xl backdrop-blur-lg">
      <Icon className="h-8 w-8 mb-2 text-teal-800" />
      <h3 className="font-semibold mb-1 text-teal-800">{title}</h3>
      <p className="text-sm text-teal-800">{description}</p>
    </div>
  )
}

interface FeatureCardType { 
  icon: React.ElementType, 
  title: string, 
  description: string,
};