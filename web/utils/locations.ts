import { Keypair, PublicKey } from "@solana/web3.js"

export interface Location {
  index: number
  key: PublicKey
}
// Export an array of locations created by the createLocationsArray function
export const locations: Location[] = createLocationsArray(3)

export function locationAtIndex(index: number): Location | undefined {
  return locations.find((l) => l.index === index)
}

// Function that creates an array of locations with a specified number of locations
function createLocationsArray(numLocations: number): Location[] {
  // Initialize empty array
  let locations = []

  // Loop through the specified number of locations
  for (let i = 1; i <= numLocations; i++) {
    // Generate a new public key and push a new location object to the array
    locations.push({
      index: i,
      key: Keypair.generate().publicKey,
    })
  }

  // Return the array of locations
  return locations
}
