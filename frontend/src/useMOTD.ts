import * as ReactQuery from "@tanstack/react-query";

import {
  GetMOTDResponse,
  PutMOTDRequest,
  getMOTDResponseSchema,
} from "./apiClient/httpModels";
import { HTTP_BASE_URL } from "./constants";
import useSubscribedQuery from "./apiClient/useSubscribedQuery";

const URL = HTTP_BASE_URL + "/motd";
const QUERY_KEY = ["motd"];
const SUBSCRIPTION_PATH = ["motd"];

export function useMOTD(): ReactQuery.UseQueryResult<GetMOTDResponse> {
  return useSubscribedQuery(QUERY_KEY, SUBSCRIPTION_PATH, getMOTD);
}

export function useMOTDMutation(): ReactQuery.UseMutationResult<
  GetMOTDResponse,
  Error,
  { newMOTD: string }
> {
  const queryClient = ReactQuery.useQueryClient();
  const mutation = ReactQuery.useMutation({
    mutationFn: putMOTD,
    onSuccess: (data: GetMOTDResponse) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  return mutation;
}

async function getMOTD({
  signal,
}: {
  signal: AbortSignal;
}): Promise<GetMOTDResponse> {
  const fetchResult = await fetch(URL, {
    signal,
    headers: { Accept: "application/json" },
  });
  const parsed = getMOTDResponseSchema.parse(await fetchResult.json());
  return parsed;
}

async function putMOTD({
  newMOTD,
}: {
  newMOTD: string;
}): Promise<GetMOTDResponse> {
  const body: PutMOTDRequest = { motd: newMOTD };
  const fetchResult = await fetch(URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = getMOTDResponseSchema.parse(await fetchResult.json());
  return parsed;
}
