#!/bin/bash

# --- PATH ---
BASE_DIR="/home/user/Downloads/donation-truffle/donation-truffle"
REACT_DIR="$BASE_DIR/eth-balance-checker"
DB_DIR="$BASE_DIR/blockchain_db"
CONFIG_PATH="$REACT_DIR/src/network_config.json"

# BANK KEY
MNEMONIC="web3 magic logic stone harvest budget skill spy gap tool basic middle"
FIXED_ADMIN_KEY="0x0211ada8c2a017549bee7ecc6b82653d284b379efb2fe0dff08f0059a1bf1f08"

echo "------------------------------------------"
echo "🏦 Web3 Bank "
echo "------------------------------------------"

# --- 2. Kill other Apps ---
echo "🧹 Kill other Apps..."
fuser -k 5000/tcp 2>/dev/null
fuser -k 9545/tcp 2>/dev/null

# --- 💡 Delete/Remains User data ---
echo "------------------------------------------"
read -p "Need to delete all user and blockchains (y/N): " reset_all

if [[ "$reset_all" == "y" || "$reset_all" == "Y" ]]; then
    echo "🗑️  Delete Blockchain & Users DB)..."
    rm -rf "$DB_DIR"
    rm -f "$BASE_DIR/users_db.json"  # ✨ 
    echo "✅ Recover Success。"
else
    echo "♻️ Remains Success..."
    
fi

# --- 3. Start UP Ganache ---
echo "🚀 Start UP Ganache..."
gnome-terminal --title="[1] Ganache Engine" -- bash -c "ganache --host 0.0.0.0 --db '$DB_DIR' --port 9545 --networkId 5777 --mnemonic '$MNEMONIC' --defaultBalanceEther 100000; exec bash"

# Waiting For  connection
echo "⏳ Waiting For  connection..."
until curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:9545 > /dev/null; do
  sleep 1
done
echo "✅ Blockchains is ready！"

# --- 4. Start Up Node.js backend ---
echo "📂 Startup Node.js API Server (Port 5000)..."
gnome-terminal --title="[2] Node.js Bank Backend" -- bash -c "cd '$BASE_DIR'; node server.js; exec bash"

# --- 5. Startup React frontend ---
echo "🌐StartUp React Interface..."
cd "$REACT_DIR"
npm start
