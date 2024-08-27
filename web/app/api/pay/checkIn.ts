import { NextApiRequest, NextApiResponse } from "next"
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair
} from "@solana/web3.js"
import { locationAtIndex, Location, locations } from "@/utils/locations"
import { connection, gameId, program } from "@/utils/programSetup"

const eventOrganizer = getEventOrganizer()

function getEventOrganizer() {
  const eventOrganizer = JSON.parse(
    process.env.EVENT_ORGANIZER ?? ""
  ) as number[]
  if (!eventOrganizer) throw new Error("EVENT_ORGANIZER not found")

  return Keypair.fromSecretKey(Uint8Array.from(eventOrganizer))
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return get(res)
  } else if (req.method === "POST") {
    return await post(req, res)
  }
  res.status(405).json({ error: "Method not allowed" })
}

function get(res: NextApiResponse) {
  res.status(200).json({
    label: "Scavenger Hunt!",
    icon: "https://solana.com/src/img/branding/solanaLogoMark.svg",
  })
}

async function post(req: NextApiRequest, res: NextApiResponse) {
  const { account } = req.body
  const { reference, id } = req.query

  if (!account || !reference || !id) {
    res.status(400).json({ error: "Missing required parameter(s)" })
    return
  }

  try {
    const transaction = await buildTransaction(
      new PublicKey(account),
      new PublicKey(reference),
      id.toString()
    )

    res.status(200).json({
      transaction: transaction,
      message: `You've found location ${id}!`,
    })
  } catch (err) {
    console.log(err)
    let error = err as any
    if (error.message) {
      res.status(200).json({ transaction: "", message: error.message })
      return
    }
    res.status(500).json({ error: "error creating transaction" })
  }
}

async function buildTransaction(
  account: PublicKey,
  reference: PublicKey,
  id: string
): Promise<string> {
  const userState = await fetchUserState(account)

  const currentLocation = locationAtIndex(new Number(id).valueOf())

  if (!currentLocation) {
    throw { message: "Invalid location id" }
  }

  if (!verifyCorrectLocation(userState, currentLocation)) {
    throw { message: "You must visit each location in order!" }
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash()

  // Create a new transaction object
  const transaction = new Transaction({
    feePayer: account,
    blockhash,
    lastValidBlockHeight,
  })

  if (!userState) {
    transaction.add(await createInitUserInstruction(account))
  }

  transaction.add(
    await createCheckInInstruction(account, reference, currentLocation)
  )

  transaction.partialSign(eventOrganizer)

  const serializedTransaction = transaction.serialize({
    requireAllSignatures: false,
  })

  const base64 = serializedTransaction.toString("base64")

  return base64
}

interface UserState {
  user: PublicKey
  gameId: PublicKey
  lastLocation: PublicKey
}

async function fetchUserState(account: PublicKey): Promise<UserState | null> {
  const userStatePDA = PublicKey.findProgramAddressSync(
    [gameId.toBuffer(), account.toBuffer()],
    program.programId
  )[0]

  try {
    return await program.account.userState.fetch(userStatePDA)
  } catch {
    return null
  }
}

function verifyCorrectLocation(
  userState: UserState | null,
  currentLocation: Location
): boolean {
  if (!userState) {
    return currentLocation.index === 1
  }

  const lastLocation = locations.find(
    (location) => location.key.toString() === userState.lastLocation.toString()
  )

  const locationHasChanged = !lastLocation || currentLocation.index !== lastLocation.index + 1
  return !locationHasChanged
}

async function createInitUserInstruction(
  account: PublicKey
): Promise<TransactionInstruction> {
  const initializeInstruction = await program.methods
    .initialize(gameId)
    .accounts({ user: account })
    .instruction()

  return initializeInstruction
}

async function createCheckInInstruction(
  account: PublicKey,
  reference: PublicKey,
  location: Location
): Promise<TransactionInstruction> {
  const checkInInstruction = await program.methods
    .checkIn(gameId, location.key)
    .accounts({
      user: account,
      eventOrganizer: eventOrganizer.publicKey,
    })
    .instruction()

  checkInInstruction.keys.push({
    pubkey: reference,
    isSigner: false,
    isWritable: false,
  })

  return checkInInstruction
}
