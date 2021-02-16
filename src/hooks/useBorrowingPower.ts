import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useMidPriceInUSD } from "../contexts/market";
import { useLendingMarket } from "./useLendingMarket";
import { getLendingReserves, useLendingReserve } from "./useLendingReserves";
import { useUserDeposits } from "./useUserDeposits";
import { useUserObligations } from "./useUserObligations";
import { fromLamports } from "../utils/utils";
import { useMint } from "../contexts/accounts";

// TODO: add option to decrease buying power by overcollateralization factor
// TODO: add support for balance in the wallet
export function useBorrowingPower(
  reserveAddress: string | PublicKey | undefined,
  includeWallet = false,
  overcollateralize = true
) {
  const key = useMemo(
    () =>
      typeof reserveAddress === "string"
        ? reserveAddress
        : reserveAddress?.toBase58() || "",
    [reserveAddress]
  );
  const reserve = useLendingReserve(key);
  const liquidityMintInfo = useMint(reserve?.info.liquidityMint);

  const liquidityMint = reserve?.info.liquidityMint;
  const liquidityMintAddress = liquidityMint?.toBase58();
  const market = useLendingMarket(reserve?.info.lendingMarket);

  const availableLiquidity = fromLamports(
    reserve?.info.state.availableLiquidity,
    liquidityMintInfo
  );

  const quoteMintAddess = market?.info?.quoteMint?.toBase58();

  // TODO: remove once cross-collateral is supported
  const onlyQuoteAllowed = liquidityMintAddress !== quoteMintAddess;

  const exclude = useMemo(() => new Set([key]), [key]);
  const inlcude = useMemo(() => {
    const quoteReserve = getLendingReserves().find(
      (r) => r.info.liquidityMint.toBase58() === quoteMintAddess
    );
    return onlyQuoteAllowed && quoteReserve
      ? new Set([quoteReserve.pubkey.toBase58()])
      : undefined;
  }, [onlyQuoteAllowed, quoteMintAddess]);

  const { totalInQuote } = useUserDeposits(exclude, inlcude);

  const price = useMidPriceInUSD(liquidityMintAddress).price;
  const availableLiquidityInUSD = availableLiquidity * price;

  const { totalInQuote: loansValue } = useUserObligations();

  const totalDeposits = loansValue + totalInQuote;

  const utilization = totalDeposits === 0 ? 0 : loansValue / totalDeposits;

  // amounts already expressed as quite mint
  if (liquidityMintAddress === quoteMintAddess) {
    return {
      borrowingPower: Math.min(totalInQuote, availableLiquidityInUSD),
      totalInQuote,
      utilization,
    };
  }

  return {
    borrowingPower: totalInQuote / price,
    totalInQuote,
    utilization,
  };
}
