import { Route } from "@tanstack/react-router";
import { Heading } from "@radix-ui/themes";

import { rootRoute } from "../Root";

export const route = new Route({
  path: "posts",
  getParentRoute: () => rootRoute,
  component: PostsPage,
});

export function PostsPage(): JSX.Element {
  return <Heading my="3">Posts</Heading>;
}
