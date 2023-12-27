import * as React from "react";
import * as ReactQuery from "@tanstack/react-query";
import * as SocketIO from "socket.io-client";

import {
  GetMOTDResponse,
  PutMOTDRequest,
  getMOTDResponseSchema,
} from "./httpModels";
import { SOCKETIO_URL, HTTP_BASE_URL } from "./constants";

const URL = HTTP_BASE_URL + "/motd";
const QUERY_KEY = ["motd"];
const SUBSCRIPTION_PATH = ["motd"];

export function useMOTD(): ReactQuery.UseQueryResult<GetMOTDResponse> {
  const queryClient = ReactQuery.useQueryClient();

  const onNotification = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const { isReady: isSubscriptionReady } = usePostsSubscription({
    onNotification,
  });

  const queryResult = ReactQuery.useQuery(
    {
      queryKey: QUERY_KEY,
      queryFn: getMOTD,
      enabled: isSubscriptionReady,
      staleTime: Infinity, // We're invalidating the query manually with notifications.
    },
    queryClient,
  );

  return queryResult;
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

function usePostsSubscription({
  onNotification,
}: {
  onNotification: () => void;
}): { isReady: boolean } {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Socket.IO should automatically deduplicate this with other connections to the
    // same SOCKET_URL.
    console.log("Connecting socket.");
    const socket = SocketIO.io(SOCKETIO_URL, {
      // For debugging--avoid a long-polling connection that we immediately upgrade
      // from, for a cleaner network log.
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      if (socket.recovered) {
        console.log("Socket recovered after disconnection.");
        setIsReady(true);
      } else {
        console.log("New socket connection. Subscribing to channel.");
        socket.emit(
          "subscribe",
          { path: SUBSCRIPTION_PATH },
          (responseData: unknown) => {
            console.log("Subscribed successfully.", responseData);
            setIsReady(true);
            // We may have just resubscribed after a period where we were disconnected and
            // missing events. Treat this as a notification, since we should re-query now.
            onNotification();
          },
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected.");
      setIsReady(false);
    });

    socket.on("notification", () => {
      console.log("Received notification.");
      onNotification();
    });

    return () => {
      console.log("Closing socket.");
      socket.close();
    };
  }, [onNotification]);

  return { isReady };
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
