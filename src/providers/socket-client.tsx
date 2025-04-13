/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { ReactNode, useContext, useMemo } from "react";
import { io, Socket } from 'socket.io-client';

const socketContext: React.Context<Socket | null> = React.createContext<Socket | null>(null);

export const useSocket = () => {
    const socket = useContext(socketContext);
    return { socket }
}

export const SocketProvider = ({ children }: { children: ReactNode }) => {

    const socket: Socket = useMemo(() => io("http://localhost:3000"), []);

    socket.on("messageRecieve", (data: any) => {
        console.log("CLIENT   - server:", data.message);
    })

    return <socketContext.Provider value={socket} >
        {children}
    </socketContext.Provider >
}

