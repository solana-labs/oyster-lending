export enum LendingInstruction {
  InitLendingMarket = 0,
  InitReserve = 1,
  InitObligation = 2,
  DepositReserveLiquidity = 3,
  WithdrawReserveLiquidity = 4,
  BorrowLiquidity = 5,
  RepayObligationLiquidity = 6,
  LiquidateObligation = 7,
  AccrueReserveInterest = 8,
  DepositObligationCollateral = 9,
  WithdrawObligationCollateral = 10,
}

export const TransactionListLookup: { [key: number]: string } = {
  3: "Deposit",
  4: "Withdraw",
  5: "Borrow",
  6: "Repay",
  7: "Liquidate",
  9: "DepositObligationCollateral",
  10: "WithdrawObligationCollateral",
};
