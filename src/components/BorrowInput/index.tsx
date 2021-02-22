import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useSliderInput,
  useUserBalance,
  useUserDeposits,
  useUserObligationByReserve,
} from "../../hooks";
import {
  BorrowAmountType,
  LendingReserve,
  LendingReserveParser,
} from "../../models";
import { Card } from "antd";
import { cache, ParsedAccount, useMint } from "../../contexts/accounts";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { borrow, deposit } from "../../actions";
import "./style.less";
import { LABELS } from "../../constants";
import { ActionConfirmation } from "./../ActionConfirmation";
import { BackButton } from "./../BackButton";
import { ConnectButton } from "../ConnectButton";
import CollateralInput from "../CollateralInput";
import { useMidPriceInUSD } from "../../contexts/market";
import { RiskSlider } from "../RiskSlider";
import { notify } from "../../utils/notifications";
import { fromLamports, toLamports } from "../../utils/utils";

export const BorrowInput = (props: {
  className?: string;
  onCollateralReserve?: (id: string) => void;
  reserve: ParsedAccount<LendingReserve>;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [value, setValue] = useState("");
  const [lastTyped, setLastTyped] = useState("collateral");
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const borrowReserve = props.reserve;

  const [collateralReserveKey, setCollateralReserveKey] = useState<string>();

  const collateralReserve = useMemo(() => {
    const id: string =
      cache
        .byParser(LendingReserveParser)
        .find((acc) => acc === collateralReserveKey) || "";

    return cache.get(id) as ParsedAccount<LendingReserve>;
  }, [collateralReserveKey]);

  const borrowPrice = useMidPriceInUSD(
    borrowReserve.info.liquidityMint.toBase58()
  ).price;
  const collateralPrice = useMidPriceInUSD(
    collateralReserve?.info.liquidityMint.toBase58()
  )?.price;

  const include = useMemo(
    () => new Set([collateralReserve?.pubkey.toBase58()]),
    [collateralReserve]
  );

  const exclude = useMemo(() => new Set([]), []);

  const { userDeposits: accountBalance } = useUserDeposits(exclude, include);
  const tokenBalance = accountBalance[0]?.info.amount || 0;
  const {
    accounts: fromAccountsDeposit,
    balanceLamports: balanceDepositLamports,
  } = useUserBalance(collateralReserve?.info.liquidityMint);
  const mintInfo = useMint(collateralReserve?.info.liquidityMint);
  const balance = fromLamports(balanceDepositLamports, mintInfo);

  const convert = useCallback(
    (val: string | number) => {
      const maxAmount = balance + tokenBalance;
      setLastTyped("collateral");
      if (typeof val === "string") {
        return (parseFloat(val) / maxAmount) * 100;
      } else {
        return (val * maxAmount) / 100;
      }
    },
    [tokenBalance, balance]
  );

  const {
    value: collateralValue,
    setValue: setCollateralValue,
    pct,
    setPct,
  } = useSliderInput(convert);

  useEffect(() => {
    if (collateralReserve && lastTyped === "collateral") {
      const ltv = borrowReserve.info.config.loanToValueRatio / 100;

      if (collateralValue) {
        const nCollateralValue = parseFloat(collateralValue);
        const borrowInUSD = nCollateralValue * collateralPrice * ltv;
        const borrowAmount = borrowInUSD / borrowPrice;
        setValue(borrowAmount.toString());
      } else {
        setValue("");
      }
    }
  }, [
    lastTyped,
    collateralReserve,
    collateralPrice,
    borrowPrice,
    borrowReserve,
    collateralValue,
    setValue,
  ]);

  useEffect(() => {
    if (collateralReserve && lastTyped === "borrow") {
      const ltv = borrowReserve.info.config.loanToValueRatio / 100;

      if (value) {
        const nValue = parseFloat(value);
        const borrowInUSD = nValue * borrowPrice;
        const collateralAmount = borrowInUSD / ltv / collateralPrice;
        setCollateralValue(collateralAmount.toString());
      } else {
        setCollateralValue("");
      }
    }
  }, [
    lastTyped,
    collateralReserve,
    collateralPrice,
    borrowPrice,
    borrowReserve,
    value,
  ]);

  const { userObligationsByReserve } = useUserObligationByReserve(
    borrowReserve?.pubkey,
    collateralReserve?.pubkey
  );
  const { accounts: fromAccounts } = useUserBalance(
    collateralReserve?.info.collateralMint
  );
  const onBorrow = useCallback(() => {
    if (!collateralReserve || !wallet?.publicKey) {
      return;
    }

    setPendingTx(true);

    (async () => {
      try {
        const collateralDifference = toLamports(
          parseFloat(collateralValue) - tokenBalance,
          mintInfo
        );
        if (collateralDifference > 0) {
          await deposit(
            fromAccountsDeposit[0],
            collateralDifference,
            collateralReserve.info,
            collateralReserve.pubkey,
            connection,
            wallet
          );
        }

        await borrow(
          connection,
          wallet,

          fromAccounts[0],
          parseFloat(value),
          // TODO: switch to collateral when user is using slider
          BorrowAmountType.LiquidityBorrowAmount,
          borrowReserve,
          collateralReserve,

          // TODO: select exsisting obligations by collateral reserve
          userObligationsByReserve.length > 0
            ? userObligationsByReserve[0].obligation.account
            : undefined,

          userObligationsByReserve.length > 0
            ? userObligationsByReserve[0].userAccounts[0].pubkey
            : undefined
        );

        setValue("");
        setCollateralValue("");
        setShowConfirmation(true);
      } catch (error) {
        // TODO:
        notify({
          message: "Unable to borrow.",
          type: "error",
          description: error.message,
        });
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    connection,
    wallet,
    value,
    setValue,
    setCollateralValue,
    collateralValue,
    collateralReserve,
    mintInfo,
    borrowReserve,
    fromAccounts,
    fromAccountsDeposit,
    userObligationsByReserve,
    setPendingTx,
    setShowConfirmation,
  ]);

  const bodyStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  };

  return (
    <Card className={props.className} bodyStyle={bodyStyle}>
      {showConfirmation ? (
        <ActionConfirmation onClose={() => setShowConfirmation(false)} />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
          }}
        >
          <div className="borrow-input-title">{LABELS.BORROW_QUESTION}</div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "center",
            }}
          >
            <CollateralInput
              title="Collateral (estimated)"
              reserve={borrowReserve.info}
              amount={parseFloat(collateralValue) || 0}
              onInputChange={(val: number | null) => {
                setCollateralValue(val?.toString() || "");
                setLastTyped("collateral");
              }}
              onCollateralReserve={(key) => {
                if (props.onCollateralReserve) props.onCollateralReserve(key);
                setCollateralReserveKey(key);
              }}
              useFirstReserve={true}
            />
          </div>
          <RiskSlider value={pct} onChange={(val) => setPct(val)} />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <CollateralInput
              title="Borrow Amount"
              reserve={borrowReserve.info}
              amount={parseFloat(value) || 0}
              onInputChange={(val: number | null) => {
                setValue(val?.toString() || "");
                setLastTyped("borrow");
              }}
              disabled={true}
              hideBalance={true}
            />
          </div>
          <ConnectButton
            size="large"
            type="primary"
            onClick={onBorrow}
            loading={pendingTx}
            disabled={fromAccounts.length === 0}
          >
            {fromAccounts.length === 0
              ? LABELS.NO_COLLATERAL
              : LABELS.BORROW_ACTION}
          </ConnectButton>
          <BackButton />
        </div>
      )}
    </Card>
  );
};
