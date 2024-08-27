import {
  Program,
  AnchorProvider,
  Idl,
  setProvider,
} from "@project-serum/anchor"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet"
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js"
import { IDL, ScavengerHunt } from "../idl/scavenger_hunt"

// Create a placeholder wallet to set up AnchorProvider
let wallet = new NodeWallet(Keypair.generate())

// Create a connection to the devnet cluster
export const connection = new Connection(clusterApiUrl("devnet"))

// Create an AnchorProvider instance with the connection and mock wallet
const provider = new AnchorProvider(connection, wallet, {})

// Set the provider as the default provider
setProvider(provider)

// Create a program object with the specified program ID
const programId = new PublicKey("9gQfxMKfELeAjLmAoriLpkVPSHd7xb36cBfYXDXX27xE")

export const program = new Program(
  IDL as Idl,
  programId
) as unknown as Program<ScavengerHunt>

export const gameId = Keypair.generate().publicKey
