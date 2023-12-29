import { Route } from "@tanstack/react-router";
import { Heading } from "@radix-ui/themes";

import { rootRoute } from "../Root";
import { useMOTD } from "../useMOTD";

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

function MOTD(): JSX.Element {
  const motdResult = useMOTD();
  if (motdResult.data) {
    return <p>{motdResult.data.motd}</p>;
  } else if (motdResult.error) {
    return <p>{motdResult.error.message}</p>;
  } else {
    return <p>No data available</p>;
  }
}
