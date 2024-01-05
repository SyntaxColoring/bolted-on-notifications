/* eslint-disable react-refresh/only-export-components */

import { Route } from "@tanstack/react-router";
import { Heading, Text } from "@radix-ui/themes";

import { rootRoute } from "../Root";

export const route = new Route({
  path: "/",
  getParentRoute: () => rootRoute,
  component: HomePage,
});

export function HomePage(): JSX.Element {
  return (
    <>
      <Heading my="3">Home</Heading>
      <Text>🏠</Text>
    </>
  );
}
