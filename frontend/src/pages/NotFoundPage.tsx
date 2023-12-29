import { Heading } from "@radix-ui/themes";
import { NotFoundRoute } from "@tanstack/react-router";

import { rootRoute } from "../Root";

export const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: () => <Heading my="3">Page not found</Heading>,
});
