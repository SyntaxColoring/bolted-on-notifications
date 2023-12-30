import * as ReactQuery from "@tanstack/react-query";

import {
  GetTextResponse,
  PutTextRequest,
  getTextResponseSchema,
} from "./apiClient/httpModels";
import { HTTP_BASE_URL } from "./constants";
import {
  useSubscribedQuery,
  UseSubscribedQueryResult,
} from "./apiClient/useSubscribedQuery";

const URL = HTTP_BASE_URL + "/text";
const QUERY_KEY = ["text"];
const SUBSCRIPTION_PATH = ["text"];

export function useText(): UseSubscribedQueryResult<GetTextResponse> {
  return useSubscribedQuery(QUERY_KEY, SUBSCRIPTION_PATH, getText);
}

export function useTextMutation(): ReactQuery.UseMutationResult<
  GetTextResponse,
  Error,
  { newText: string }
> {
  const queryClient = ReactQuery.useQueryClient();
  const mutation = ReactQuery.useMutation({
    mutationFn: putText,
    onSuccess: (data: GetTextResponse) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  return mutation;
}

async function getText({
  signal,
}: {
  signal: AbortSignal;
}): Promise<GetTextResponse> {
  const fetchResult = await fetch(URL, {
    signal,
    headers: { Accept: "application/json" },
  });
  const parsed = getTextResponseSchema.parse(await fetchResult.json());
  return parsed;
}

async function putText({
  newText,
}: {
  newText: string;
}): Promise<GetTextResponse> {
  const body: PutTextRequest = { text: newText };
  const fetchResult = await fetch(URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = getTextResponseSchema.parse(await fetchResult.json());
  return parsed;
}
