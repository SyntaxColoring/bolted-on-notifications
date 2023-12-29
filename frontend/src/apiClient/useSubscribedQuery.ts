import {
  QueryClient,
  QueryFunction,
  QueryKey,
  UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Socket, io } from "socket.io-client";

import { SOCKETIO_URL } from "../constants";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SubscribeData,
  subscribeAckData,
} from "./socketioModels";

export function useSubscribedQuery<T>(
  queryKey: QueryKey,
  subscriptionPath: string[],
  queryFn: QueryFunction<T>,
  queryClient?: QueryClient,
): UseSubscribedQueryResult<T> {
  const queryClientOrDefault = useQueryClient(queryClient);

  const onNotification = useCallback(() => {
    queryClientOrDefault.invalidateQueries({ queryKey });
  }, [queryClientOrDefault, queryKey]);

  const request = useMemo(() => {
    return {
      path: subscriptionPath,
    };
  }, [subscriptionPath]);

  const subscriptionStatus = useSubscription(request, onNotification);

  const useQueryResult = useQuery(
    {
      queryKey,
      queryFn: queryFn,
      enabled: subscriptionStatus === "healthy",
      // We'll invalidate the query ourselves when we're notified that the resource has
      // changed. No need for staleTime.
      staleTime: Infinity,
    },
    queryClient,
  );

  return {
    ...useQueryResult,
    subscriptionStatus,
  };
}

/**
 * `tryingToSubscribe`: The Socket.IO connection either hasn't yet established for the
 * first time, or it's disconnected or timed out and it hasn't reestablished yet.
 * It will continue trying to reestablish itself in the background.
 *
 * `healthy`: Ping/pongs have recently gone through on the Socket.IO connection, so,
 * as far as we know, we will be informed promptly when the resource we're watching
 * updates.
 *
 * `fatalError`: The connection has encountered an error that it will not recover from.
 * This only happens if there's a bug in the client or server, like a mismatch in the
 * data models.
 */
export type SubscriptionStatus = "tryingToSubscribe" | "healthy" | "fatalError";

export type UseSubscribedQueryResult<T> = UseQueryResult<T> & {
  subscriptionStatus: SubscriptionStatus;
};

function useSubscription(
  request: SubscribeData,
  onNotification: () => void,
): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>("tryingToSubscribe");

  useEffect(() => {
    // Socket.IO should automatically deduplicate this with other connections to the
    // same URL.
    console.debug("Connecting socket.");
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      SOCKETIO_URL,
      {
        // For debugging--avoid a long-polling connection that we immediately upgrade
        // from, for a cleaner network log.
        transports: ["websocket"],
      },
    );

    socket.on("connect", () => {
      if (socket.recovered) {
        console.debug("Socket recovered after disconnection.");
        setStatus("healthy");
      } else {
        console.debug("New socket connection. Subscribing to channel.");
        socket.emit("subscribe", request, (ackData) => {
          const parsedAckData = subscribeAckData.safeParse(ackData);
          if (parsedAckData.success) {
            console.debug("Subscribed successfully.");
            setStatus("healthy");
            // We may have just resubscribed after a period where we were disconnected and
            // missing events. Treat this as a notification, since we should re-query now.
            onNotification();
          } else {
            console.error("Error subscribing.", parsedAckData.error);
            setStatus("fatalError");
          }
        });
      }
    });

    socket.on("disconnect", () => {
      console.debug("Socket disconnected.");
      setStatus("tryingToSubscribe");
    });

    socket.on("notification", () => {
      console.debug("Received notification.");
      onNotification();
    });

    return () => {
      console.debug("Closing socket.");
      socket.close();
    };
  }, [request, onNotification]);

  return status;
}
