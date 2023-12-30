import * as ReactQuery from "@tanstack/react-query";

import {
  GetButtonResponse,
  PostButtonRequest,
  ButtonID,
  getButtonResponseSchema,
} from "./apiClient/httpModels";
import { HTTP_BASE_URL } from "./constants";
import { useSubscribedQuery } from "./apiClient/useSubscribedQuery";
import { useCallback, useMemo } from "react";

const URL_BASE = HTTP_BASE_URL + "/buttons";
const QUERY_KEY_BASE = ["buttons"];
const SUBSCRIPTION_PATH_BASE = ["buttons"];

export function useButton(
  buttonID: ButtonID,
): ReactQuery.UseQueryResult<GetButtonResponse> {
  const memoizedQueryFn = useCallback(
    ({ signal }: { signal: AbortSignal }) => {
      return getButton({ buttonID, signal });
    },
    [buttonID],
  );
  const memoizedQueryKey = useMemo(() => queryKey(buttonID), [buttonID]);
  const memoizedSubscriptionPath = useMemo(
    () => subscriptionPath(buttonID),
    [buttonID],
  );
  return useSubscribedQuery(
    memoizedQueryKey,
    memoizedSubscriptionPath,
    memoizedQueryFn,
  );
}

export function useButtonMutation(
  buttonID: ButtonID,
): ReactQuery.UseMutationResult<GetButtonResponse, Error, void> {
  const memoizedMutationFn = useCallback(() => {
    return postButton({ buttonID });
  }, [buttonID]);
  const queryClient = ReactQuery.useQueryClient();
  const memoizedOnSuccess = useCallback(
    (data: GetButtonResponse) => {
      queryClient.setQueryData(queryKey(buttonID), data);
    },
    [buttonID, queryClient],
  );
  return ReactQuery.useMutation({
    mutationFn: memoizedMutationFn,
    onSuccess: memoizedOnSuccess,
  });
}

async function getButton({
  buttonID,
  signal,
}: {
  buttonID: ButtonID;
  signal: AbortSignal;
}): Promise<GetButtonResponse> {
  const fetchResult = await fetch(url(buttonID), {
    signal,
    headers: { Accept: "application/json" },
  });
  const parsed = getButtonResponseSchema.parse(await fetchResult.json());
  return parsed;
}

async function postButton({
  buttonID,
}: {
  buttonID: ButtonID;
}): Promise<GetButtonResponse> {
  const body: PostButtonRequest = {};
  const fetchResult = await fetch(url(buttonID), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = getButtonResponseSchema.parse(await fetchResult.json());
  return parsed;
}

function url(buttonID: ButtonID): string {
  return `${URL_BASE}/${buttonID}`;
}

function queryKey(buttonID: ButtonID): ReactQuery.QueryKey {
  return [...QUERY_KEY_BASE, buttonID];
}

function subscriptionPath(buttonID: ButtonID): string[] {
  // TODO: Subscribe more granularly.
  return SUBSCRIPTION_PATH_BASE;
}
