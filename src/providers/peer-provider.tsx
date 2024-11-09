
"use client"

import React, { ReactNode, useContext, useMemo } from 'react' 
import { PeerCertificate } from 'tls';

interface PeerType {
    peer :RTCPeerConnection,
    createOffer:  () => Promise<RTCSessionDescriptionInit | undefined> ,
    createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | undefined>,
}


const peerContext: React.Context<PeerType | undefined> = React.createContext<PeerType | undefined>(undefined);
const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
export const usePeer = (): PeerType  => {
    const context = useContext(peerContext);
    if (!context) {
        throw new Error("usePeer must be used within a PeerProvider");
    }
    return context;
};

export const PeerProvider = ({children}: {children: ReactNode}) => {
    const peerConect = useMemo(() => {
        if (typeof window !== "undefined") {
            return new RTCPeerConnection(configuration);
        }
        return ;
    }, []);

    const createOffer = async (): Promise<RTCSessionDescriptionInit | undefined> => {    
        const offer = await peerConect?.createOffer();
        await peerConect?.setLocalDescription(offer);
        return offer;
    }

    const createAnswer = async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | undefined> => {
      peerConect?.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConect?.createAnswer()
      peerConect?.setLocalDescription(answer)
      return answer;
    }

    peerConect?.addEventListener('connectionstatechange', event => {
        if (peerConect?.connectionState === 'connected') {
            console.log("peers have been connected");
        }
    });
    
    return (
        <peerContext.Provider value={{peer: peerConect!, createAnswer, createOffer}}>
            {children}
        </peerContext.Provider>
    )
}
