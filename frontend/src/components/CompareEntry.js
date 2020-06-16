import React, { useReducer } from "react";
import Container from "react-bootstrap/Container";

import { CalculateProvider } from "../contexts/CalculateContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { OneHypRef } from "./OneHypRef";
import { Result } from "./Result";
import { Saved } from "./Saved";
import { Settings } from "./Settings";
import { Upload } from "./Upload";

const CompareEntry = () => {
  const [resultKey, reloadResult] = useReducer((oldKey) => !oldKey, true);
  const [savedKey, reloadSaved] = useReducer((oldKey) => !oldKey, true);
  return (
    <Container className="mb-5">
      <SettingsProvider>
        <Settings className="mb-3" />
        <CalculateProvider>
          <OneHypRef className="mb-3" />
          <Upload className="mb-3" reloadResult={reloadResult} />
          <Result className="mb-3" key={resultKey} reloadSaved={reloadSaved} />
        </CalculateProvider>
        <Saved className="mb-3" key={savedKey} reloadSaved={reloadSaved} />
      </SettingsProvider>
    </Container>
  );
};

export { CompareEntry };
