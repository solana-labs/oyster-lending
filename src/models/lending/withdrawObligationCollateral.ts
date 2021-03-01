import {
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { TOKEN_PROGRAM_ID, LENDING_PROGRAM_ID } from "../../utils/ids";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from "./lending";

/// Withdraw excess collateral from an obligation. The loan must remain healthy.
///
///   0. `[writable]` Source withdraw reserve collateral supply SPL Token account
///   1. `[writable]` Destination collateral token account, minted by withdraw reserve
///                     collateral mint. $authority can transfer $collateral_amount
///   2. `[]` Withdraw reserve account.
///   3. `[]` Borrow reserve account.
///   4. `[writable]` Obligation
///   5. `[writable]` Obligation token mint
///   6. `[writable]` Obligation token input
///   7. `[]` Lending market account.
///   8. `[]` Derived lending market authority.
///   9. `[]` User transfer authority ($authority).
///   10 `[]` Dex market
///   11 `[]` Dex market order book side
///   12 `[]` Temporary memory
///   13 `[]` Clock sysvar
///   14 '[]` Token program id
export const withdrawObligationCollateralInstruction = (
    collateralAmount: number | BN,
    from: PublicKey,
    to: PublicKey,
    withdrawReserve: PublicKey,
    borrowReserve: PublicKey,
    obligation: PublicKey,
    obligationMint: PublicKey,
    obligationTokenInput: PublicKey,
    lendingMarket: PublicKey,
    lendingMarketAuthority: PublicKey,
    transferAuthority: PublicKey,
    dexMarket: PublicKey,
    dexOrderBookSide: PublicKey,
    memory: PublicKey,
): TransactionInstruction => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("collateralAmount"),
    ]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: LendingInstruction.WithdrawObligationCollateral,
            collateralAmount: new BN(collateralAmount),
        },
        data
    );

    const keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: withdrawReserve, isSigner: false, isWritable: false },
        { pubkey: borrowReserve, isSigner: false, isWritable: false },
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: obligationMint, isSigner: false, isWritable: true },
        { pubkey: obligationTokenInput, isSigner: false, isWritable: true },
        { pubkey: lendingMarket, isSigner: false, isWritable: false },
        { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
        { pubkey: transferAuthority, isSigner: true, isWritable: false },
        { pubkey: dexMarket, isSigner: false, isWritable: false },
        { pubkey: dexOrderBookSide, isSigner: false, isWritable: false },
        { pubkey: memory, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction({
        keys,
        programId: LENDING_PROGRAM_ID,
        data,
    });
};
