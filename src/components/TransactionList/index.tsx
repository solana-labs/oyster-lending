import React from "react";
import { useWallet } from "../../contexts/wallet";
import { useConnection } from "../../contexts/connection";
import { useEffect, useState } from "react";
import { LENDING_PROGRAM_ID } from "../../utils/ids";
import { LendingInstruction, TransactionListLookup } from "../../models";
import { Button, Card, Col, Popover, Row, Tag } from "antd";
import { feeFormatter, lamportsToSol, shortenAddress } from "../../utils/utils";
import { ExplorerLink } from "../ExplorerLink";
import { cache, ParsedLocalTransaction } from "../../contexts/accounts";
import { LoadingOutlined } from "@ant-design/icons";
import { LABELS } from "../../constants";

const SingleTypeTransactionList = (props: {
  list: any[];
  title: string;
  loading: boolean;
}) => {
  return (
    <Card
      style={{ marginBottom: "10px" }}
      title={
        <div>
          {props.title}{" "}
          {props.loading && (
            <span>
              (Loading <LoadingOutlined />)
            </span>
          )}
        </div>
      }
    >
      <div className="dashboard-item dashboard-header">
        <div>Explorer Link</div>
        <div>Log Details</div>
        <div>Fee (SOL)</div>
        <div>Status</div>
      </div>
      {props.list.map((tx) => (
        <div className="dashboard-item">
          <div>
            <ExplorerLink address={tx.signature.signature} type="transaction" />
          </div>
          <div>
            <Popover
              placement="topLeft"
              title={`Logs ${shortenAddress(tx.signature.signature)}`}
              content={
                <ul>
                  {tx.confirmedTx.meta.logMessages.map((msg: string) => (
                    <li>{msg}</li>
                  ))}
                </ul>
              }
              trigger="click"
            >
              <Button type="primary">Show Logs</Button>
            </Popover>
          </div>
          <div>
            {feeFormatter.format(lamportsToSol(tx.confirmedTx.meta.fee))}
          </div>
          <div>
            {!!tx.confirmedTx?.meta.err ? (
              <Tag color="red">Error</Tag>
            ) : (
              <Tag color="green">Success</Tag>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
};

export const TransactionList = () => {
  const { connected, wallet } = useWallet();
  const connection = useConnection();

  const [confirmedTxs, setConfirmedTxs] = useState<any[]>([]);
  const [loading, setloading] = useState<boolean>(true);
  useEffect(() => {
    const queryTxs = async () => {
      if (connected) {
        setloading(true);
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
      setloading(false);
      setConfirmedTxs(all.flat());
    });
  }, [connected, connection, wallet.publicKey]);

  return connected ? (
    <>
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
    </>
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
