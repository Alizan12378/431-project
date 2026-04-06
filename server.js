const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'users_db.json');

const configPath = path.join(__dirname, 'eth-balance-checker/src/network_config.json');
let networkConfig = { SYSTEM_BANK_KEY: "" }; 
if (fs.existsSync(configPath)) {
    networkConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:9545");
const adminWallet = new ethers.Wallet(networkConfig.SYSTEM_BANK_KEY, provider);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());


const logBankStatus = async (action) => {
    const bal = await provider.getBalance(adminWallet.address);
    console.log(`\n[${new Date().toLocaleTimeString()}] 🏦 BANK REPORT - After ${action}`);
    console.log(`💰 Remaining Balance: ${ethers.formatEther(bal)} ETH`);
    console.log(`------------------------------------------`);
};

const checkAndTopUp = async () => {
    try {
        const bal = await provider.getBalance(adminWallet.address);
        if (parseFloat(ethers.formatEther(bal)) < 10000) {
            const signer = await provider.getSigner(0);
            const tx = await signer.sendTransaction({ to: adminWallet.address, value: ethers.parseEther("50000") });
            await tx.wait();
            console.log("♻️  BANK AUTO-REFILL: Added 50,000 ETH");
        }
    } catch (e) { console.error("Bank refill error:", e.message); }
};

const initBank = async () => {
    try {
        await provider.getBlockNumber();
        await checkAndTopUp();
        await logBankStatus("Initialization");
    } catch (e) { setTimeout(initBank, 2000); }
};
initBank();

app.get('/api/config', (req, res) => res.json({ adminAddress: adminWallet.address }));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : {};
    const user = users[username];
    if (user && user.password === password) res.json({ success: true, user });
    else res.status(401).json({ success: false });
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, cardNumber, cvv, expiryDate } = req.body;

        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: "Username and password required" });
        }

        
        let users = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : {};

        
        if (users[username]) {
            return res.status(400).json({ success: false, error: "Username already exists" });
        }

        
        const wallet = ethers.Wallet.createRandom();

        
        users[username] = {
            username,
            password,
            address: wallet.address,
            privateKey: wallet.privateKey,
            cardNumber: cardNumber || "",
            cvv: cvv || "",
            expiryDate: expiryDate || "",
            createdAt: new Date().toISOString()
        };

        fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));

        console.log(`[Register] New user: ${username} | Address: ${wallet.address}`);
        res.json({ success: true, message: "Account created successfully" });

    } catch (e) {
        console.error("Register error:", e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/topup', async (req, res) => {
    try {
        const { userAddress } = req.body;
        const tx = await adminWallet.sendTransaction({ to: userAddress, value: ethers.parseEther("10") });
        await tx.wait();
        await logBankStatus(`TopUp to ${userAddress}`);
        res.json({ success: true, hash: tx.hash });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cashback', async (req, res) => {
    const { username } = req.body;
    try {
        let users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const user = users[username];
        const userWallet = new ethers.Wallet(user.privateKey, provider);
        const balWei = await provider.getBalance(user.address);
        
        const feeData = await provider.getFeeData();
        const amountToSend = balWei - (feeData.gasPrice * 21000n);
        if (amountToSend <= 0n) return res.status(400).json({ error: "Insufficient balance" });

        const tx = await userWallet.sendTransaction({ to: adminWallet.address, value: amountToSend });
        await tx.wait();
        await logBankStatus(`CashBack from ${username}`);
        res.json({ success: true, hash: tx.hash });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
