import { Button, Container, Flex, Separator, Box } from "@radix-ui/themes";
import { Link, Outlet, RootRoute, useMatchRoute } from "@tanstack/react-router";

export const rootRoute = new RootRoute({ component: RootComponent });

function RootComponent(): JSX.Element {
  return (
    <Container size="2">
      <NavBar />
      <Separator size="4" />
      <main>
        <Box my="3">
          <Outlet />
        </Box>
      </main>
    </Container>
  );
}

function NavBar(): JSX.Element {
  const links = [
    { to: "/", text: "Communal Textarea" },
    { to: "button-funtown", text: "Button Funtown" },
    { to: "posts", text: "Posts" },
  ];

  const matchRoute = useMatchRoute();

  const buttons = links.map((link) => {
    const isCurrent = !!matchRoute({ to: link.to });
    return (
      <Button
        asChild
        variant={isCurrent ? "solid" : "outline"}
        highContrast={isCurrent}
        color="gray"
      >
        <Link to={link.to}>{link.text}</Link>
      </Button>
    );
  });

  return (
    <nav>
      <Flex direction="row" justify="center" align="center" gap="3" my="3">
        <>{...buttons}</>
      </Flex>
    </nav>
  );
}
