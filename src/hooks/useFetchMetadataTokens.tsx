import { useState, useEffect, useCallback } from "react";
import { useWalletContext } from "./useWalletContext";

const apiKey = import.meta.env.VITE_HELIUS_API_KEY;

// Define types for regular token accounts
interface TokenData {
  key: number;
  mint: string;
  owner: string;
  amount: string;
  delegate: string | null;
  state: number;
  isNative: boolean;
  delegatedAmount: string;
  closeAuthority: string | null;
}

interface RegularTokenAccount {
  pubkey: string;
  account: {
    data: TokenData;
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: number;
  };
}

interface PaginationData {
  hasMore: boolean;
  cursor: string | null;
}

// Hook for fetching regular SPL token accounts with pagination support
export function useRegularTokenAccounts(pageSize: number = 100) {
  const { publicKey } = useWalletContext();
  const [tokenAccounts, setTokenAccounts] = useState<RegularTokenAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    hasMore: false,
    cursor: null,
  });
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Function to fetch a page of token accounts
  const fetchTokenAccountsPage = useCallback(async (
    ownerAddress: string,
    cursor: string | null = null
  ) => {
    if (!ownerAddress) return null;
    
    try {
      console.log(`Fetching regular token accounts for ${ownerAddress}${cursor ? ` with cursor ${cursor}` : ''}`);
      
      const requestBody: any = {
        jsonrpc: "2.0",
        id: "regular-token-accounts-request",
        method: "getTokenAccountsByOwner",
        params: [
          ownerAddress,
          {
            programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" // Program 2022 token program
          },
          {
            encoding: "jsonParsed",
            limit: pageSize
          }
        ]
      };
      
      // Only add cursor if it exists and is not null
      if (cursor) {
        requestBody.params[2].cursor = cursor;
      }
      
      const response = await fetch(`https://devnet.helius-rpc.com?api-key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if response contains an error
      if (data.error) {
        throw new Error(`API error: ${data.error.message} (code: ${data.error.code})`);
      }
      
      // Validate response structure
      if (!data.result || !data.result.value) {
        throw new Error("Invalid response format: missing value array");
      }
      
      // For regular tokens, check if we need to handle pagination differently
      const items = data.result.value;
      
      // Extract pagination data if available
      const paginationData = {
        hasMore: data.result.pagination?.hasMore || false,
        cursor: data.result.pagination?.cursor || null,
      };
      
      return {
        items: items as RegularTokenAccount[],
        pagination: paginationData
      };
    } catch (err: any) {
      console.error("Failed to fetch regular token accounts:", err);
      throw err;
    }
  }, [pageSize]);

  // Initial data load
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (!publicKey) {
        setTokenAccounts([]);
        setPagination({ hasMore: false, cursor: null });
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchTokenAccountsPage(publicKey.toString());
        
        if (result && isMounted) {
          setTokenAccounts(result.items);
          setPagination(result.pagination);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(`Error fetching regular token accounts: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [publicKey, fetchTokenAccountsPage]);

  // Function to load more data
  const loadMore = useCallback(async () => {
    if (!publicKey || !pagination.hasMore || !pagination.cursor || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const result = await fetchTokenAccountsPage(publicKey.toString(), pagination.cursor);
      
      if (result) {
        setTokenAccounts(prev => [...prev, ...result.items]);
        setPagination(result.pagination);
      }
    } catch (err: any) {
      setError(`Error loading more token accounts: ${err.message}`);
    } finally {
      setIsLoadingMore(false);
    }
  }, [publicKey, pagination, isLoadingMore, fetchTokenAccountsPage]);

  // Function to refresh all data
  const refreshAccounts = useCallback(async () => {
    if (!publicKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchTokenAccountsPage(publicKey.toString());
      
      if (result) {
        setTokenAccounts(result.items);
        setPagination(result.pagination);
      }
    } catch (err: any) {
      setError(`Error refreshing token accounts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [publicKey, fetchTokenAccountsPage]);

  return {
    tokenAccounts,
    loading,
    error,
    hasMore: pagination.hasMore,
    isLoadingMore,
    loadMore,
    refreshAccounts,
  };
}