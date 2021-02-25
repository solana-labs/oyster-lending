import React, { useMemo, useState } from "react";
import {
  useBorrowingPower,
  useLendingReserve,
  useUserObligations,
} from "../../hooks";
import { useParams } from "react-router-dom";
import "./style.less";

import { BorrowInput } from "../../components/BorrowInput";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";
import { Card, Col, Row, Statistic } from "antd";
import { BarChartStatistic } from "../../components/BarChartStatistic";
import { GUTTER, LABELS } from "../../constants";
import {
  cache,
  ParsedAccount,
  useAccountByMint,
  useMint,
} from "../../contexts/accounts";
import { LendingReserve, LendingReserveParser } from "../../models";
import { getTokenName } from "../../utils/utils";
import { useConnectionConfig } from "../../contexts/connection";

export const BorrowReserveView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const { userObligations, totalInQuote: loansValue } = useUserObligations();
  const { tokenMap } = useConnectionConfig();

  const { totalInQuote: borrowingPower, utilization } = useBorrowingPower(id);
  const [collateralReserveKey, setCollateralReserveKey] = useState<string>("");
  const collateralReserve = useMemo(() => {
    const id: string =
      cache
        .byParser(LendingReserveParser)
        .find((acc) => acc === collateralReserveKey) || "";

    return cache.get(id) as ParsedAccount<LendingReserve>;
  }, [collateralReserveKey]);

  const mintAddress = collateralReserve?.info.liquidityMint.toBase58();

  const tokenMint = useMint(mintAddress);
  const tokenAccount = useAccountByMint(mintAddress);
  const name = getTokenName(tokenMap, mintAddress);
  if (!lendingReserve) {
    return null;
  }
  let balance: number = 0;
  if (tokenAccount && tokenMint) {
    balance =
      tokenAccount.info.amount.toNumber() / Math.pow(10, tokenMint.decimals);
  }

  return (
    <div className="borrow-reserve">
      <Row gutter={GUTTER}>
        <Col xs={24} xl={4}>
          <Card>
            <Statistic
              title={LABELS.BORROWED_VALUE}
              value={loansValue}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} xl={4}>
          <Card>
            <Statistic
              title={LABELS.BORROWING_POWER_USED}
              value={utilization * 100}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} xl={4}>
          <Card>
            <Statistic
              title={LABELS.BORROWING_POWER_VALUE}
              value={borrowingPower}
              valueStyle={{ color: "#3fBB00" }}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} xl={4}>
          <Card>
            <Statistic
              title={LABELS.WALLET_BALANCE}
              value={balance}
              valueStyle={{ color: "#3fBB00" }}
              precision={2}
              suffix={name}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card>
            <BarChartStatistic
              title="Your Loans"
              items={userObligations}
              getPct={(item) =>
                item.obligation.info.borrowedInQuote / loansValue
              }
              name={(item) => item.obligation.info.repayName}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={GUTTER} style={{ flex: 1 }}>
        <Col xs={24} xl={16}>
          <BorrowInput
            onCollateralReserve={setCollateralReserveKey}
            className="card-fill"
            reserve={lendingReserve}
          />
        </Col>
        <Col xs={24} xl={8}>
          <SideReserveOverview
            className="card-fill"
            reserve={lendingReserve}
            mode={SideReserveOverviewMode.Borrow}
          />
        </Col>
      </Row>
    </div>
  );
};
