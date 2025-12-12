const { Connection, Keypair, clusterApiUrl, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');

(async () => {
    // Connect to Devnet
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Generate a new Keypair for the Mint Authority
    const payer = Keypair.generate();
    const mintAuthority = payer;
    const freezeAuthority = payer;

    console.log("Requesting Airdrop for Payer...");
    const requestAirdrop = async () => {
        for (let i = 0; i < 3; i++) {
            try {
                const airdropSignature = await connection.requestAirdrop(
                    payer.publicKey,
                    2 * LAMPORTS_PER_SOL
                );
                await connection.confirmTransaction(airdropSignature);
                console.log("Airdrop successful!");
                return true;
            } catch (e) {
                console.log(`Airdrop attempt ${i + 1} failed. Retrying in 2s...`);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        return false;
    };

    if (!await requestAirdrop()) {
        console.error("Airdrop failed after 3 attempts.");
        process.exit(1);
    }

    console.log("Creating Mint...");
    const mint = await createMint(
        connection,
        payer,
        mintAuthority.publicKey,
        freezeAuthority.publicKey,
        6 // 6 decimals like USDC
    );

    console.log("--------------------------------------------------");
    console.log("Token Created Successfully!");
    console.log("Mint Address:", mint.toBase58());
    console.log("Mint Authority Secret Key (Keep this safe!):", `[${payer.secretKey.toString()}]`);
    console.log("--------------------------------------------------");
})();
