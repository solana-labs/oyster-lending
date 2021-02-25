import { useUserDeposits } from "./useUserDeposits";
import { useEffect, useState } from "react";
import { cache, ParsedAccount } from "../contexts/accounts";
import { LendingReserve, LendingReserveParser } from "../models";

export const useBalanceByCollateral = (collateralReserve?: string) => {
  const userDeposits = useUserDeposits();
  const [balance, setBalance] = useState<number>(0);
  useEffect(() => {
    if (collateralReserve) {
      const id: string =
        cache
          .byParser(LendingReserveParser)
          .find((acc) => acc === collateralReserve) || "";
      const parser = cache.get(id) as ParsedAccount<LendingReserve>;

      if (parser) {
        const collateralDeposit = userDeposits.userDeposits.find(
          (u) =>
            u.reserve.info.liquidityMint.toBase58() ===
            parser.info.liquidityMint.toBase58()
        );
        if (collateralDeposit) setBalance(collateralDeposit.info.amount);
        else setBalance(0);
      }
    } else {
      setBalance(0);
    }
  }, [collateralReserve, userDeposits.userDeposits]);
  return balance;
};
