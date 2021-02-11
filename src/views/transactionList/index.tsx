import React, { useEffect, useState } from "react";
import { useWallet } from "../../contexts/wallet";
import { useConnection } from "../../contexts/connection";
import { cache, ParsedLocalTransaction } from "../../contexts/accounts";
import { LENDING_PROGRAM_ID } from "../../utils/ids";
import { LendingInstruction, TransactionListLookup } from "../../models";
import { Col, Row } from "antd";
import { LABELS } from "../../constants";
import { SingleTypeTransactionList } from "./transaction";

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
    <div className="flexColumn">
      <Row>
        <Col md={24} xl={24} span={24}>
          <SingleTypeTransactionList
            list={confirmedTxs.filter(
              (tx) =>
                tx.transactionType ===
                LendingInstruction.DepositReserveLiquidity
            )}
            title={LABELS.TABLE_TITLE_DEPOSITS}
            loading={loading}
          />
        </Col>
      </Row>
      <Row>
        <Col md={24} xl={24} span={24}>
          <SingleTypeTransactionList
            list={confirmedTxs.filter(
              (tx) =>
                tx.transactionType ===
                LendingInstruction.WithdrawReserveLiquidity
            )}
            title={LABELS.TABLE_TITLE_WITHDRAWS}
            loading={loading}
          />
        </Col>
      </Row>
      <Row>
        <Col md={24} xl={24} span={24}>
          <SingleTypeTransactionList
            list={confirmedTxs.filter(
              (tx) => tx.transactionType === LendingInstruction.BorrowLiquidity
            )}
            title={LABELS.TABLE_TITLE_BORROWS}
            loading={loading}
          />
        </Col>
      </Row>
      <Row>
        <Col md={24} xl={24} span={24}>
          <SingleTypeTransactionList
            list={confirmedTxs.filter(
              (tx) =>
                tx.transactionType ===
                LendingInstruction.RepayObligationLiquidity
            )}
            title={LABELS.TABLE_TITLE_REPAY_OBLIGATIONS}
            loading={loading}
          />
        </Col>
      </Row>
      <Row>
        <Col md={24} xl={24} span={24}>
          <SingleTypeTransactionList
            list={confirmedTxs.filter(
              (tx) =>
                tx.transactionType === LendingInstruction.LiquidateObligation
            )}
            title={LABELS.TABLE_TITLE_LIQUIDATE_OBLIGATIONS}
            loading={loading}
          />
        </Col>
      </Row>
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
