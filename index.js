const express = require('express');
require('dotenv').config();
const { Web3 } = require('web3');

const app = express();
app.use(express.json());

const web3 = new Web3(process.env.RPC_URL);
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const FROM_ADDRESS = process.env.FROM_ADDRESS;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ABI = require('./abi.json');

const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

app.post('/send-token', async (req, res) => {
  console.log("📦 Incoming request body from Wix:", req.body);

  const data = req.body?.data;
  const toAddress = data?.['field:wallet_address'];

  console.log("💡 Extracted toAddress:", toAddress);

  if (!web3.utils.isAddress(toAddress)) {
    console.log("❌ Invalid wallet address received:", toAddress);
    return res.status(400).send({ error: 'Invalid wallet address', value: toAddress });
  }

  try {
    const amount = web3.utils.toWei('0.0001', 'ether').toString();
    const gasPrice = (await web3.eth.getGasPrice()).toString();

    const tx = {
      from: FROM_ADDRESS,
      to: CONTRACT_ADDRESS,
      gas: 100000,
      gasPrice,
      data: contract.methods.transfer(toAddress, amount).encodeABI(),
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    const safeReceipt = JSON.parse(JSON.stringify(receipt, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ));

    console.log("✅ Transaction success:", safeReceipt);
    res.send({ success: true, receipt: safeReceipt });
  } catch (err) {
    console.error("🚨 Transaction error:", err);
    res.status(500).send({ error: 'Transaction failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ RA Atum backend running on port ${PORT}`));
