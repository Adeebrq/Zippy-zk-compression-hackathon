# Zippy – Compressed Proof-of-Participation DApp

![Zippy Demo](https://drive.google.com/uc?export=view&id=1AoihE7WZ2UsifAqxGblqlLC-44659WKq)


## 🚨 Known issues

If the token creation page returns an error, please try again later, the error is occuring because the Helius devnet RPC would be experiencing issues at that given moment, the app is not broken.

## ⚠️ Browser Compatibility

The live project may not function correctly in Brave browser due to certain security settings.  
For the best experience, please use **Google Chrome with phantom wallet**.

## Overview

Zippy is a decentralized web application (dApp) built on Solana devnet network that empowers event organizers to mint compressed tokens as Proof-of-Participation (cPOPs), which attendees can claim by simply scanning a QR code. By leveraging zero-knowledge compression via Light Protocol, Zippy delivers a highly scalable, low-cost, and privacy-friendly experience for both creators and participants. This project was developed as part of the ZK Compression Track in the Solana Hackathon to showcase real-world utility for compressed tokens.

## Features


- 🎯 **Mint Compressed Proof-of-Participation (cPOP) Tokens**  
  Event organizers can mint **compressed NFTs** to verify user attendance or engagement, reducing costs and improving scalability.

- 📱 **QR Code-Based Claiming System**  
  Attendees can seamlessly claim their cPOPs by scanning a QR code linked to their wallet—no extra steps needed.

- ⚡ **Solana Compressed Token Integration**  
  Built on **Light Protocol** to utilize Solana's **compressed NFT** system, enabling efficient and affordable on-chain storage.

- 🔐 **Zero-Knowledge Compression (ZK Compression)**  
  Ensures maximum scalability and privacy using **ZK-based data compression**, optimized for modern dApp requirements.

- 🌐 **Dual Interfaces: Creator & Attendee**  
  Cleanly separated workflows for event **creators** and **attendees**, with intuitive and responsive UI/UX for each.

  ![Zippy Screenshot](https://drive.google.com/uc?export=view&id=1OR6_8Um4H_BJOfLpzJ0dFXEcWRnMKZsB)



## Tech Stack

* **Frontend**: React, Vite, TypeScript
* **Backend**: Firebase
* **Blockchain**: Solana, Light Protocol

## Setup Instructions

### Prerequisites
- Node.js
- Solana CLI
- Phantom wallet
- React

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Adeebrq/Zippy-zk-compression-hackathon
   cd Zippy-zk-compression-hackathon
   ```

2. **Install Dependencies:**
   ```bash
   npm install --force
   ```

3. **Environment Variables:**
   Create a `.env` file at the root of the project and add the required variables:
   ```bash
   cp .env.example .env
   ```
   
   Then, fill in the actual values:
   ```
   VITE_HELIUS_API_KEY=your_helius_api_key
   VITE_BURNER_SECRET_KEY=[your_secret_key_array]
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   ```

4. **Firebase Setup:**
   - Set up a new project in the Firestore database using Firebase
   - Store a key pair which will sign all the airdrops on your behalf
   - Fetch the credentials for the database in project settings and paste them in the `.env` file as shown above
  
 5.  **Store Solana Keypair in Firebase Firestore**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your newly created project
- Navigate to **Firestore Database** > **Start Collection**


- Collection ID: `adminKeys`
- Document ID: `keys`

| Field Name  | Type   | Value                                                                                                 |
|-------------|--------|-------------------------------------------------------------------------------------------------------|
| `publicKey` | string | `"your publickey"`                                                        |
| `secretKey` | string | `"hex coded private key"` |

✅ Now your keypair is securely stored and can be retrieved in your local app.



6. **Run the Development Server:**
   ```bash
   npm run dev
   ```


## 🎥 Watch the Demo

Check out the demo video of the project below:

[![Watch the demo](https://drive.google.com/uc?export=view&id=1spyqmhFtnzSsrLhsWmUSqq5V73JRRUmF)](https://www.youtube.com/watch?v=2ggIDx1ZQXA)



## 📁 Project Structure

```
zk/
├── src/
│   ├── assets/
│   │   ├── BackgroundVideo.mp4
│   │   └── Bring_Race.otf
│   ├── components/
│   │   ├── BackgroundVideo.tsx
│   │   ├── CustomButton.tsx
│   │   ├── LandingPageInfo.tsx
│   │   ├── Metrics.tsx
│   │   ├── Modal.tsx
│   │   ├── ParticlesBackground.tsx
│   │   ├── TokenClaim.tsx
│   │   └── theme.ts
│   ├── config/
│   │   └── firebase.ts
│   ├── hooks/
│   │   ├── useAnimatedValue.ts
│   │   ├── useFetchMetadataTokens.tsx
│   │   ├── useThemeContext.tsx
│   │   └── useWalletContext.tsx
│   ├── layout/
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── pages/
│   │   ├── ClaimPage.tsx
│   │   ├── CreatorPage.tsx
│   │   └── LandingPage.tsx
│   ├── styles/
│   │   ├── BackgroundVideo.css
│   │   ├── CreatorPage.css
│   │   └── customButton.css
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   ├── index.css
│   ├── buffer.d.ts
│   ├── styled.d.ts
│   ├── vite-env.d.ts
│   └── protocolStats.json
├── public/
├── dist/
├── node_modules/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tsconfig.app.tsbuildinfo
├── vite.config.ts
├── encode.ts
├── vercel.json
├── eslint.config.js
├── .gitignore
└── README.md
```

## 🏁 Hackathon

This project was developed as part of the **ZK Compression Track** at the Solana Breakpoint Hackathon, organized by **Light Protocol**, **Helius**, and the **Solana Foundation**.

The goal of the track was to explore the capabilities of **zero-knowledge compression** on **Solana**, allowing developers to build scalable and efficient on-chain applications. By using **compressed tokens** and **accounts**, projects significantly reduce state costs while maintaining the performance and security of Solana L1.


## 🚀 Thanks for Checking Out Zippy!

I hope this project helps you explore the possibilities of zero-knowledge compression and compressed tokens on Solana. Have fun building, and don’t forget to stay curious!

Feel free to reach out if you have any questions or ideas. Happy hacking! 😄
