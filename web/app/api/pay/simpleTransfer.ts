import { NextApiRequest, NextApiResponse } from "next"
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js"

// API endpoint
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return get(res)
  }
  if (req.method === "POST") {
    return await post(req, res)
  }
  res.status(405).json({ error: "Method not allowed" })
}

// "res" is Text and Image that displays when wallet first scans
function get(res: NextApiResponse) {
  res.status(200).json({
    label: "Store Name",
    icon: "https://solana.com/src/img/branding/solanaLogoMark.svg",
  })
}

// "req" is public key of wallet scanning QR code
// "res" is transaction built for wallet to approve, along with a message
async function post(req: NextApiRequest, res: NextApiResponse) {
  const { account } = req.body
  if (!account) {
    res.status(400).json({ error: "No account provided" })
    return
  }

  const { reference } = req.query
  if (!reference) {
    res.status(400).json({ error: "No reference provided" })
    return
  }

  try {
    const accountKey = new PublicKey(account)
    const referenceKey = new PublicKey(reference)
    const connection = new Connection(clusterApiUrl('devnet'));

    // Airdrop devnet SOL to fund mobile wallet
    connection.requestAirdrop(accountKey, 2 * LAMPORTS_PER_SOL)

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash()

    const transaction = new Transaction({
      feePayer: accountKey,
      blockhash,
      lastValidBlockHeight,
    })

    const instruction = SystemProgram.transfer({
      fromPubkey: accountKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 0.001 * LAMPORTS_PER_SOL,
    })

    instruction.keys.push({
      pubkey: referenceKey,
      isSigner: false,
      isWritable: false,
    })

    transaction.add(instruction)

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
    })
    const base64 = serializedTransaction.toString("base64")

    const message = "Approve to transfer 0.001 Devnet SOL"

    res.status(200).json({ transaction: base64, message })
  } catch (error) {
    res.status(500).json({ error: "error creating transaction" })
  }
}
