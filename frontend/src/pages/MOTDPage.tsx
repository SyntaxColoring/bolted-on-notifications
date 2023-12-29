import { Route } from "@tanstack/react-router";
import { Heading } from "@radix-ui/themes";

import { rootRoute } from "../Root";
import { useMOTD, useMOTDMutation } from "../useMOTD";
import { Button, Flex, Text, TextArea } from "@radix-ui/themes";
import { useRef, useState } from "react";
import { ThreeDot } from "react-loading-indicators";

export const route = new Route({
  path: "/",
  getParentRoute: () => rootRoute,
  component: MOTDPage,
});

export function MOTDPage(): JSX.Element {
  return (
    <>
      <Heading my="3">Message of the Day</Heading>
      <MOTD />
    </>
  );
}

// TODO: Various error cases.
// Loading
// No data available
// Background refetch failed
function MOTD(): JSX.Element {
  const [editing, setEditing] = useState(false);
  const motdQuery = useMOTD();
  const motdMutation = useMOTDMutation();

  const value = motdQuery.data?.motd ?? "<contents unavailable>";

  // TODO: This does not account for initial WebSocket connection time.
  const showSpinner = motdMutation.isPending || motdQuery.isFetching;

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  let lastModifiedAt = null;
  if (motdQuery.data != null) {
    lastModifiedAt = new Date(motdQuery.data.lastModifiedAt).toLocaleString();
  }

  let textArea;
  if (editing) {
    textArea = (
      <TextArea
        ref={textAreaRef}
        size="3"
        rows={10}
        disabled={motdMutation.isPending}
        defaultValue={value}
      />
    );
  } else {
    textArea = (
      <TextArea ref={textAreaRef} size="3" rows={10} disabled value={value} />
    );
  }

  let buttons;
  if (editing) {
    buttons = (
      <>
        <Button type="submit" disabled={motdMutation.isPending}>
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            motdMutation.reset();
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      </>
    );
  } else {
    buttons = (
      <>
        <Text align="right">Last edited {lastModifiedAt}</Text>
        <Button
          type="button"
          variant="outline"
          onClick={(event) => {
            event.preventDefault(); // This is the only button, so we need to prevent form submit.
            setEditing(true);
          }}
        >
          Edit
        </Button>
      </>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = textAreaRef.current!.value;
        motdMutation.mutate(
          { newMOTD: value },
          { onSuccess: () => setEditing(false) },
        );
      }}
    >
      <Flex direction="column" gap="3">
        {textArea}
        <Flex direction="row" gap="3" justify="end" align="center">
          {showSpinner && (
            <ThreeDot
              color="var(--accent-9)" // From @radix-ui/themes.
              size="small"
              text=""
              textColor=""
            />
          )}
          {buttons}
        </Flex>
      </Flex>
    </form>
  );
}
