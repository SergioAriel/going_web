# Going Web: The Fair Commerce Web Application

![Going Logo](URL_DEL_LOGO_AQUI) <!-- Reemplazar con la URL de un logo cuando esté disponible -->

**Going Web** is the browser-based version of the "Going" ecosystem, our decentralized commerce network built on Solana. This web application provides a rich, accessible entry point for buyers and sellers to interact with our protocol directly from their desktop or mobile browser.

Our mission is to fix the extractive model of current e-commerce, returning power and value to the users through fair commissions and a unique rewards system.

---

## ✨ Key Features

- **Decentralized Marketplace:** Browse and purchase goods and services on a peer-to-peer network.
- **Smart Escrow:** Every purchase is protected by our audited escrow smart contract, which holds funds until delivery is confirmed.
- **Staking Rewards ($G):** Earn yield while you wait for your order. Escrowed funds are staked, and the returns are shared with both buyer and seller as $G points.
- **Secure QR Confirmation:** Securely confirm receipt of your products by scanning a QR code, releasing funds to the seller instantly.
- **Integrated Wallet:** Check your USDC balance and your $G rewards directly in the web app.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Blockchain:** Solana (using `@solana/web3.js`)
- **Authentication:** Privy.io

---

## 🚀 Getting Started (For Developers)

Follow these steps to get the project running on your local environment.

**1. Clone the Repository:**
```bash
git clone [URL_DEL_REPOSITORIO]
cd going_web
```

**2. Install Dependencies:**
```bash
# Using npm
npm install

# Or using yarn
yarn install
```

**3. Configure Environment Variables:**
Create a `.env.local` file in the project root and add the necessary keys (e.g., `NEXT_PUBLIC_PRIVY_APP_ID`).

**4. Run the Development Server:**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🤝 Contributing

Our core protocol will be open source. If you are interested in contributing to the "Going" ecosystem, please review our contribution guide (coming soon) in the main project repository.