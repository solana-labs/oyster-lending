import { ExplorerLink } from "../../components/ExplorerLink";
import { Button, Popover, Tag } from "antd";
import { feeFormatter, lamportsToSol, shortenAddress } from "../../utils/utils";
import React from "react";
import { TransactionListLookup } from "../../models";

export const SingleTypeTransactionItem = (props: { transaction: any }) => {
  const tx = props.transaction;
  if (!tx) {
    return null;
  }
  return (
    <div className="dashboard-item">
      <div style={{ textAlign: "left" }}>
        {TransactionListLookup[tx.transactionType]}
      </div>
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
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          }
          trigger="click"
        >
          <Button type="primary">Show Logs</Button>
        </Popover>
      </div>
      <div>{feeFormatter.format(lamportsToSol(tx.confirmedTx.meta.fee))}</div>
      <div>
        {!!tx.confirmedTx?.meta.err ? (
          <Tag color="red">Error</Tag>
        ) : (
          <Tag color="green">Success</Tag>
        )}
      </div>
    </div>
  );
};
