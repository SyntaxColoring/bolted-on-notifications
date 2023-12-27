import * as React from "react";
import * as ReactQuery from "@tanstack/react-query";
import * as SocketIO from "socket.io-client";

import {
  GetButtonResponse,
  PostButtonRequest,
  getButtonResponseSchema,
} from "./httpModels";
import { SOCKETIO_URL, HTTP_BASE_URL } from "./constants";

const URL = HTTP_BASE_URL + "/button";
const QUERY_KEY = ["button"];
const SUBSCRIPTION_PATH = ["button"];

export function useButton(): ReactQuery.UseQueryResult<GetButtonResponse> {
  const queryClient = ReactQuery.useQueryClient();

  const onNotification = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const { isReady: isSubscriptionReady } = useButtonSubscription({
    onNotification,
  });

  const queryResult = ReactQuery.useQuery(
    {
      queryKey: QUERY_KEY,
      queryFn: getButton,
      enabled: isSubscriptionReady,
      staleTime: Infinity, // We're invalidating the query manually with notifications.
    },
    queryClient,
  );

  return queryResult;
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

function useButtonSubscription({
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
