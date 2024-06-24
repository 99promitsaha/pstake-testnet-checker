import React, { useState } from "react";
import axios from "axios";

const AddressTransactions = () => {
  const [address, setAddress] = useState("");
  const [interactionResult, setInteractionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const receiverAddress = "tb1qqw5qvg0u4rw7wy0eu9mtlmfze6ra7z0xnlwrl8";

  const fetchAllTransactions = async (address) => {
    let allTransactions = [];
    let lastSeenTxid = null;
    let morePages = true;

    while (morePages) {
      const url = lastSeenTxid
        ? `https://mempool.space/signet/api/address/${address}/txs/chain/${lastSeenTxid}`
        : `https://mempool.space/signet/api/address/${address}/txs`;

      try {
        const response = await axios.get(url);
        const transactions = response.data;
        if (transactions.length === 0) {
          morePages = false;
        } else {
          allTransactions = allTransactions.concat(transactions);
          lastSeenTxid = transactions[transactions.length - 1].txid;
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Error fetching transactions. Please try again.");
        morePages = false;
      }
    }

    return allTransactions;
  };

  const fetchTransactionDetails = async (txid) => {
    try {
      const response = await axios.get(
        `https://mempool.space/signet/api/tx/${txid}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching transaction details for ${txid}:`, error);
      return null;
    }
  };

  const fetchTransactions = async (event) => {
    event.preventDefault();

    if (!address) {
      setError("Please enter a wallet address.");
      return;
    }

    setLoading(true);
    setError("");
    setInteractionResult(null);

    try {
      const allTransactions = await fetchAllTransactions(address);

      let interactionFound = false;
      let interactionTxid = null;

      for (const tx of allTransactions) {
        const details = await fetchTransactionDetails(tx.txid);
        if (details) {
          const senderAddresses = details.vin.map(
            (vin) => vin.prevout.scriptpubkey_address
          );
          const receiverAddresses = details.vout.map(
            (vout) => vout.scriptpubkey_address
          );

          if (
            senderAddresses.includes(address) &&
            receiverAddresses.includes(receiverAddress)
          ) {
            interactionFound = true;
            interactionTxid = tx.txid;
            break;
          }
        }
      }

      setInteractionResult({
        interactionFound,
        interactionTxid,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Error fetching transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center font-poppins">
      <div className="max-w-lg w-full p-6 bg-white shadow-md rounded-lg">
        <div className="mb-4 space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">pSTAKE Testnet</h1>
          <p className="text-gray-500">
            Enter your wallet address to check interaction. Starts with 'tb1q'
          </p>
        </div>
        <form className="w-full" onSubmit={fetchTransactions}>
          <div className="mb-4 space-y-2">
            <label
              className="text-sm font-medium leading-none text-gray-800"
              htmlFor="address"
            >
              Wallet Address
            </label>
            <input
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring focus:border-blue-300"
              type="text"
              id="address"
              placeholder="Enter your wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <button
            className="bg-black text-white font-medium rounded-md py-2 px-4 w-full transition-colors hover:bg-black"
            type="submit"
          >
            Check Interaction
          </button>
        </form>
        {loading && <p className="text-gray-800">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {interactionResult && (
          <div className="mt-4">
            <h2 className="text-xl font-bold text-gray-800">
              Interaction Result
            </h2>
            <p className="text-gray-800">
              Interaction Found:{" "}
              {interactionResult.interactionFound ? "Yes" : "No"}
            </p>
            {interactionResult.interactionFound && (
              <p>Transaction ID: {interactionResult.interactionTxid}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressTransactions;
