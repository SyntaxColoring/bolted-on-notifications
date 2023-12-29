import { Route } from "@tanstack/react-router";
import { Button, Heading } from "@radix-ui/themes";

import { rootRoute } from "../Root";
import { useButton, useButtonMutation } from "../useButton";

export const route = new Route({
  path: "button-funtown",
  getParentRoute: () => rootRoute,
  component: ButtonsPage,
});

export function ButtonsPage(): JSX.Element {
  return (
    <>
      <Heading my="3">Buttons!</Heading>
      <DemoButton />
    </>
  );
}

// TODO: Read react-query docs to learn nuances about fetching, loading, etc.
// esp. how it interacts with mutations.
function DemoButton(): JSX.Element {
  const buttonResult = useButton();
  const buttonMutationResult = useButtonMutation();

  if (
    buttonMutationResult.status == "error" ||
    buttonResult.status == "error"
  ) {
    return <Button disabled>Error :(</Button>;
  } else if (buttonMutationResult.status == "pending") {
    return <Button disabled>Clicking...</Button>;
  } else if (buttonResult.status == "pending") {
    return <Button disabled>Loading...</Button>;
  } else {
    const { timesClicked } = buttonResult.data;
    return (
      <Button onClick={() => buttonMutationResult.mutate()}>
        This button has been clicked {timesClicked} times
      </Button>
    );
  }
}
