/**
 * Generate Ed25519 key pair for Strix Governance SDK.
 *
 * Usage:
 *   npx tsx scripts/generate-strix-keys.ts
 *
 * Output:
 *   STRIX_SIGNING_KEY=<hex>
 *   STRIX_PUBLIC_KEY=<hex>
 *
 * Add these to your .env file.
 */

async function main() {
  const ed = await import("@noble/ed25519");
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  const signingKeyHex = Buffer.from(privateKey).toString("hex");
  const publicKeyHex = Buffer.from(publicKey).toString("hex");

  console.log("\n# Strix Governance SDK — Ed25519 Key Pair");
  console.log("# Generated:", new Date().toISOString());
  console.log("# Add these to your .env file\n");
  console.log(`STRIX_SIGNING_KEY=${signingKeyHex}`);
  console.log(`STRIX_PUBLIC_KEY=${publicKeyHex}`);
  console.log(`STRIX_EVIDENCE_PATH=./evidence/audit.jsonl`);
  console.log("");
}

main().catch(console.error);
