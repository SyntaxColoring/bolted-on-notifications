/* eslint-disable react-refresh/only-export-components */

import { Route } from "@tanstack/react-router";
import { Heading } from "@radix-ui/themes";

import { rootRoute } from "../Root";
import { useText, useTextMutation } from "../useText";
import { Button, Flex, Text, TextArea } from "@radix-ui/themes";
import { useRef, useState } from "react";
import { ThreeDot } from "react-loading-indicators";

export const route = new Route({
  path: "communal-textarea",
  getParentRoute: () => rootRoute,
  component: TextPage,
});

export function TextPage(): JSX.Element {
  return (
    <>
      <Heading my="3">Communal Textarea</Heading>
      <SyncedTextArea />
    </>
  );
}

// TODO: Various error cases.
// Loading
// No data available
// Background refetch failed
function SyncedTextArea(): JSX.Element {
  const [editing, setEditing] = useState(false);
  const textQuery = useText();
  const textMutation = useTextMutation();

  const value = textQuery.data?.text ?? "<contents unavailable>";

  const showSpinner =
    textMutation.isPending ||
    textQuery.isFetching ||
    textQuery.subscriptionStatus === "tryingToSubscribe";

  const showError =
    textMutation.isError ||
    textQuery.isError ||
    textQuery.subscriptionStatus === "fatalError";

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  let lastModifiedAt = null;
  if (textQuery.data != null) {
    lastModifiedAt = new Date(textQuery.data.lastModifiedAt).toLocaleString();
  }

  let textArea;
  if (editing) {
    textArea = (
      <TextArea
        ref={textAreaRef}
        size="3"
        rows={10}
        disabled={textMutation.isPending}
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
        <Button type="submit" disabled={textMutation.isPending}>
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            textMutation.reset();
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
        textMutation.mutate(
          { newText: value },
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
          {showError && <Text color="red">Error</Text>}
          {buttons}
        </Flex>
      </Flex>
    </form>
  );
}
