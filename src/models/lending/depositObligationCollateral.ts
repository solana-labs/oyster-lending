import {
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { TOKEN_PROGRAM_ID, LENDING_PROGRAM_ID } from "../../utils/ids";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from "./lending";

/// Deposit additional collateral to an obligation.
///
///   0. `[writable]` Source collateral token account, minted by deposit reserve collateral mint,
///                     $authority can transfer $collateral_amount
///   1. `[writable]` Destination deposit reserve collateral supply SPL Token account
///   2. `[]` Deposit reserve account.
///   3. `[writable]` Obligation
///   4. `[writable]` Obligation token mint
///   5. `[writable]` Obligation token output
///   6. `[]` Lending market account.
///   7. `[]` Derived lending market authority.
///   8. `[]` User transfer authority ($authority).
///   9. '[]` Token program id
export const depositObligationCollateralInstruction = (
    collateralAmount: number | BN,
    from: PublicKey,
    to: PublicKey,
    depositReserve: PublicKey,
    obligation: PublicKey,
    obligationMint: PublicKey,
    obligationTokenOutput: PublicKey,
    lendingMarket: PublicKey,
    lendingMarketAuthority: PublicKey,
    transferAuthority: PublicKey,
): TransactionInstruction => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("collateralAmount"),
    ]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: LendingInstruction.DepositObligationCollateral,
            collateralAmount: new BN(collateralAmount),
        },
        data
    );

    const keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: depositReserve, isSigner: false, isWritable: false },
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: obligationMint, isSigner: false, isWritable: true },
        { pubkey: obligationTokenOutput, isSigner: false, isWritable: true },
        { pubkey: lendingMarket, isSigner: false, isWritable: false },
        { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
        { pubkey: transferAuthority, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction({
        keys,
        programId: LENDING_PROGRAM_ID,
        data,
    });
};
