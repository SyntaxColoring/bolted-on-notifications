import * as React from "react";
import * as ReactQuery from "@tanstack/react-query";
import * as SocketIO from "socket.io-client";

import {
  GetMOTDResponse,
  PutMOTDRequest,
  getMOTDResponseSchema,
} from "./httpModels";

const SOCKET_URL = "ws://localhost:8000";
const FETCH_URL = "http://localhost:8000/motd";
const QUERY_KEY = ["motd"];

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
    const socket = SocketIO.io(SOCKET_URL, {
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
          null, // Avoids obscure server-side internal errors when there is no data in the event.
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
  const fetchResult = await fetch(FETCH_URL, {
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
  const fetchResult = await fetch(FETCH_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = getMOTDResponseSchema.parse(await fetchResult.json());
  return parsed;
}
