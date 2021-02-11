import { Card } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import React from "react";
import { SingleTypeTransactionItem } from "./item";

export const SingleTypeTransactionList = (props: {
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
        <SingleTypeTransactionItem transaction={tx} />
      ))}
    </Card>
  );
};
