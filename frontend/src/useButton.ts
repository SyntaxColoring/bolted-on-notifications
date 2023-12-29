import * as ReactQuery from "@tanstack/react-query";

import {
  GetButtonResponse,
  PostButtonRequest,
  getButtonResponseSchema,
} from "./apiClient/httpModels";
import { HTTP_BASE_URL } from "./constants";
import useSubscribedQuery from "./apiClient/useSubscribedQuery";

const URL = HTTP_BASE_URL + "/button";
const QUERY_KEY = ["button"];
const SUBSCRIPTION_PATH = ["button"];

export function useButton(): ReactQuery.UseQueryResult<GetButtonResponse> {
  return useSubscribedQuery(QUERY_KEY, SUBSCRIPTION_PATH, getButton);
}

export function useButtonMutation(): ReactQuery.UseMutationResult<
  GetButtonResponse,
  Error,
  void
> {
  const queryClient = ReactQuery.useQueryClient();
  const mutation = ReactQuery.useMutation({
    mutationFn: postButton,
    onSuccess: (data: GetButtonResponse) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  return mutation;
}

async function getButton({
  signal,
}: {
  signal: AbortSignal;
}): Promise<GetButtonResponse> {
  const fetchResult = await fetch(URL, {
    signal,
    headers: { Accept: "application/json" },
  });
  const parsed = getButtonResponseSchema.parse(await fetchResult.json());
  return parsed;
}

async function postButton(): Promise<GetButtonResponse> {
  const body: PostButtonRequest = {};
  const fetchResult = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = getButtonResponseSchema.parse(await fetchResult.json());
  return parsed;
}
