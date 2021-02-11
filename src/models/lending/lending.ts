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
}

export const TransactionListLookup: { [key: number]: string } = {
  3: "DepositReserveLiquidity",
  4: "WithdrawReserveLiquidity",
  5: "BorrowLiquidity",
  6: "RepayObligationLiquidity",
  7: "LiquidateObligation",
};
