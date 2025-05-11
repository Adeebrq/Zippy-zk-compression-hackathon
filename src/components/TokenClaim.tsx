import {
  Transaction,
  PublicKey,
  Connection,
  Keypair,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  CompressedTokenProgram,
  selectMinCompressedTokenAccountsForTransfer,
} from '@lightprotocol/compressed-token';
import { Rpc } from '@lightprotocol/stateless.js';
import { toast } from 'react-toastify';

export const HandleCompressedTransfer = async (
  connection: Connection,
  rpc: Rpc,
  mintPublicKey: PublicKey,
  senderKeypair: Keypair,
  recipientPublicKey: PublicKey,
  amount: number,
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  try {
    // Set compute unit price and limit
    const computeUnitPriceInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 100,
    });
    const additionalComputeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    });

    // Get sender's compressed token accounts
    const senderAccounts = await rpc.getCompressedTokenAccountsByOwner(
      senderKeypair.publicKey,
      { mint: mintPublicKey }
    );
    if (!senderAccounts.items.length) {
      throw new Error('No compressed token accounts found for sender.');
    }

    // Get recipient's compressed token accounts
    const recipientAccounts = await rpc.getCompressedTokenAccountsByOwner(
      recipientPublicKey,
      { mint: mintPublicKey }
    );

    // Enforce single-account policy: Only allow transfer if no accounts exist
    if (recipientAccounts.items.length > 0) {
      toast.error("You have already collected this token. Only one airdrop per account is allowed")
      return
    }


    // Select sender input accounts
    const [inputAccounts, _] = selectMinCompressedTokenAccountsForTransfer(
      senderAccounts.items,
      amount
    );

    // Get validity proof
    const { compressedProof, rootIndices } = await rpc.getValidityProofV0(
      inputAccounts.map((account) => ({
        hash: account.compressedAccount.hash,
        tree: account.compressedAccount.treeInfo.tree,
        queue: account.compressedAccount.treeInfo.queue,
      }))
    );

    // Create transfer instruction
    const transferIx = await CompressedTokenProgram.transfer({
      payer: senderKeypair.publicKey,
      inputCompressedTokenAccounts: inputAccounts,
      toAddress: recipientPublicKey,
      amount: amount,
      recentInputStateRootIndices: rootIndices,
      recentValidityProof: compressedProof,
    });

    // Create transaction
    const transaction = new Transaction()
      .add(computeUnitPriceInstruction)
      .add(additionalComputeBudgetInstruction)
      .add(transferIx);

    // Set recent blockhash and fee payer
    transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;
    transaction.feePayer = senderKeypair.publicKey;

    // Sign transaction
    transaction.sign(senderKeypair);

    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction({
      signature,
      blockhash: transaction.recentBlockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
    });


    // Check recipient accounts after transfer
    const postTransferRecipientAccounts = await rpc.getCompressedTokenAccountsByOwner(
      recipientPublicKey,
      { mint: mintPublicKey }
    );

    // Calculate and log total balance
    const totalBalance = postTransferRecipientAccounts.items.reduce(
      (sum, account) => sum + parseInt(account.parsed.amount, 16),
      0
    );


    // Verify single-account policy
    if (postTransferRecipientAccounts.items.length > 1) {
      console.error(
        'Error: Multiple compressed token accounts created. This should not happen. Please investigate.'
      );
    } else if (postTransferRecipientAccounts.items.length === 1) {
      console.log('Success: Single compressed token account created with balance:', totalBalance);
    }

    onSuccess();
    return signature;
  } catch (error) {
    console.error('Error in handleCompressedTransfer:', error);
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('logs' in error) {
        console.error('Transaction logs:', (error as any).logs);
      }
    }
    onError(errorMessage);
    throw error;
  }
};