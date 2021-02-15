import React, { useEffect, useState } from "react";
import { useWallet } from "../../contexts/wallet";
import { useConnection } from "../../contexts/connection";
import { cache, ParsedLocalTransaction } from "../../contexts/accounts";
import { LENDING_PROGRAM_ID } from "../../utils/ids";
import { TransactionListLookup } from "../../models";
import { Card } from "antd";
import { LABELS } from "../../constants";
import { LoadingOutlined } from "@ant-design/icons";
import { SingleTypeTransactionItem } from "./item";

export const TransactionListView = () => {
  const { connected, wallet } = useWallet();
  const connection = useConnection();

  const [confirmedTxs, setConfirmedTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const queryTxs = async () => {
      if (connected && wallet?.publicKey) {
        setLoading(true);
        const signatureList = await connection.getConfirmedSignaturesForAddress2(
          wallet.publicKey
        );
        const localTransactions = cache.getAllTransactions();
        const signaturesCache = [...localTransactions.keys()];
        const filteredSignatureList = signatureList.filter((signature) => {
          return !signaturesCache.includes(signature.signature);
        });

        const txs: Array<ParsedLocalTransaction | null> = [
          ...localTransactions.values(),
        ].filter((val) => val !== null);
        if (txs.length > 0) {
          setConfirmedTxs(txs);
        }
        for (const sig of filteredSignatureList) {
          if (txs.length >= 100) {
            // limited to 100 Lending transactions
            break;
          }
          const confirmedTx = await connection.getConfirmedTransaction(
            sig.signature
          );
          const instructions = confirmedTx?.transaction.instructions;
          const filteredInstructions = instructions?.filter((ins) => {
            return ins.programId.toBase58() === LENDING_PROGRAM_ID.toBase58();
          });
          let lendingInstructionFound: boolean = false;
          if (filteredInstructions && filteredInstructions.length > 0) {
            for (const ins of filteredInstructions) {
              const code = ins.data[0];
              if (code in TransactionListLookup) {
                const tx: ParsedLocalTransaction = {
                  transactionType: code,
                  signature: sig,
                  confirmedTx: confirmedTx,
                };
                txs.push(tx);
                cache.addTransaction(sig.signature, tx);
                lendingInstructionFound = true;
                break;
              }
            }
          }
          if (!lendingInstructionFound) {
            cache.addTransaction(sig.signature, null);
          }
        }
        return txs;
      }
      return [];
    };
    Promise.all([queryTxs()]).then((all) => {
      setLoading(false);
      setConfirmedTxs(all.flat());
    });
  }, [connected, connection, wallet?.publicKey, setLoading]);

  return connected ? (
    <div className={"flexColumn"}>
      <Card
        style={{ marginBottom: "10px" }}
        title={
          <div>
            Transactions{" "}
            {loading && (
              <span>
                (Loading <LoadingOutlined />)
              </span>
            )}
          </div>
        }
      >
        <div className="dashboard-item dashboard-header">
          <div>Type</div>
          <div>Explorer Link</div>
          <div>Log Details</div>
          <div>Fee (SOL)</div>
          <div>Status</div>
        </div>
        {confirmedTxs.map((tx) => (
          <SingleTypeTransactionItem
            key={tx.signature.signature}
            transaction={tx}
          />
        ))}
      </Card>
    </div>
  ) : (
    <div className="dashboard-info">
      <img
        src="splash.svg"
        alt="connect your wallet"
        className="dashboard-splash"
      />
      {LABELS.TRANSACTIONS_INFO}
    </div>
  );
};
