import { useCallback, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<
    PaginatedResponse<Transaction[]> | null
  >(null)

  /* Fetch next page (or the first page if none loaded yet) */
  const fetchAll = useCallback(async () => {
    const response = await fetchWithCache<
      PaginatedResponse<Transaction[]>,
      PaginatedRequestParams
    >("paginatedTransactions", {
      page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
    })

    /* ────────────────
       Merge logic fix
    ──────────────── */
    setPaginatedTransactions((previousResponse) => {
      if (response === null) {
        // Failed to fetch – keep whatever we already had
        return previousResponse
      }

      if (previousResponse === null) {
        // First page
        return response
      }

      // Append new page’s data to the existing list
      return {
        data: [...previousResponse.data, ...response.data],
        nextPage: response.nextPage,
      }
    })
  }, [fetchWithCache, paginatedTransactions])

  /* Clear cached data (e.g., when switching filters) */
  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData }
}
