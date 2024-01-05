/* eslint-disable react-refresh/only-export-components */

import { Route } from "@tanstack/react-router";
import { Button, Flex, Heading } from "@radix-ui/themes";

import { rootRoute } from "../Root";
import { useButton, useButtonMutation } from "../useButton";
import { ButtonID } from "../apiClient/httpModels";
import { ComponentProps } from "react";

export const route = new Route({
  path: "button-funtown",
  getParentRoute: () => rootRoute,
  component: ButtonsPage,
});

export function ButtonsPage(): JSX.Element {
  return (
    <>
      <Heading my="3">Buttons!</Heading>
      <Flex direction="column" gap="3">
        <DemoButton id="red" color="red" />
        <DemoButton id="green" color="green" />
        <DemoButton id="blue" color="blue" />
        <DemoButton id="yellow" color="amber" />
      </Flex>
    </>
  );
}

// TODO: Read react-query docs to learn nuances about fetching, loading, etc.
// esp. how it interacts with mutations.
function DemoButton({
  id,
  color,
}: {
  id: ButtonID;
  color: ComponentProps<typeof Button>["color"];
}): JSX.Element {
  const buttonResult = useButton(id);
  const buttonMutationResult = useButtonMutation(id);

  if (
    buttonMutationResult.status == "error" ||
    buttonResult.status == "error"
  ) {
    return (
      <Button color={color} disabled>
        Error :(
      </Button>
    );
  } else if (buttonMutationResult.status == "pending") {
    return (
      <Button color={color} disabled>
        Clicking...
      </Button>
    );
  } else if (buttonResult.status == "pending") {
    return (
      <Button color={color} disabled>
        Loading...
      </Button>
    );
  } else {
    const { timesClicked } = buttonResult.data;
    return (
      <Button color={color} onClick={() => buttonMutationResult.mutate()}>
        This button has been clicked {timesClicked} times
      </Button>
    );
  }
}
