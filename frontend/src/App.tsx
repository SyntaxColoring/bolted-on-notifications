import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useMOTD, useMOTDMutation } from "./useMOTD";
import { useButton, useButtonMutation } from "./useButton";

export default function App() {
  const [count, setCount] = useState(0);

  const motdMutation = useMOTDMutation();

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button
          onClick={() => {
            const newCount = count + 1;
            setCount(newCount);
            motdMutation.mutate({ newMOTD: newCount.toString() });
          }}
        >
          count is {count}
        </button>
        <Button />
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <MOTD />
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
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

// TODO: Read react-query docs to learn nuances about fetching, loading, etc.
// esp. how it interacts with mutations.
function Button(): JSX.Element {
  const buttonResult = useButton();
  const buttonMutationResult = useButtonMutation();

  if (
    buttonMutationResult.status == "error" ||
    buttonResult.status == "error"
  ) {
    return <button disabled>Error :(</button>;
  } else if (buttonMutationResult.status == "pending") {
    return <button disabled>Clicking...</button>;
  } else if (buttonResult.status == "pending") {
    return <button disabled>Loading...</button>;
  } else {
    const { timesClicked } = buttonResult.data;
    return (
      <button onClick={() => buttonMutationResult.mutate()}>
        This button has been clicked {timesClicked} times
      </button>
    );
  }
}
