"use client"
import { checkTransaction } from "@/utils/checkTransaction"
import { createQRCode } from "@/utils/createQrCode/simpleTransfer"
import { Box, Heading, VStack, Container } from "@chakra-ui/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Keypair } from "@solana/web3.js"
import { useEffect, useRef, useState } from "react"



const SolanaPayDefaultTransfer = () => {
     // Create a ref to the QR code element and a state variable for the reference
     const qrRef = useRef<HTMLDivElement>(null)
     const [reference, setReference] = useState(Keypair.generate().publicKey)
 
     // Create the QR code when the `reference` changes
     useEffect(() => {
         createQRCode(qrRef, reference)
     }, [reference])
 
     // Periodically check the transaction status and reset the `reference` state variable once confirmed
     useEffect(() => {
         const interval = setInterval(() => {
             checkTransaction(reference, setReference)
         }, 1500)
 
         return () => {
             clearInterval(interval)
         }
     }, [reference])
     return (
         <VStack className="m-10" justifyContent="center">
             <Heading>SOL Transfer</Heading>
             <Box ref={qrRef} />
             <Container>
                 This simply transfers 0.001 Devnet SOL from your wallet to a randomly
                 generated wallet. Since most people don't have Devnet SOL in their
                 wallet, we've also set it up to automatically airdrop you 2 SOL on
                 Devnet to make it easier to test :)
             </Container>
         </VStack>
     )
}

export default SolanaPayDefaultTransfer;