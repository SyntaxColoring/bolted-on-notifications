import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useMOTD, useMOTDMutation } from "./useMOTD";

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
