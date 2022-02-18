import React, { useContext, useEffect, useRef, useState } from "react";
import { FaRegFile } from "react-icons/fa";

import { MetricsContext } from "../contexts/MetricsContext";
import { useCalculations } from "../hooks/calculations";
import { OneHypRef } from "./OneHypRef";
import { Result } from "./Result";
import { Saved } from "./Saved";
import { Settings } from "./Settings";
import { Upload } from "./Upload";
import { Button } from "./utils/Button";
import { Card, CardContent, CardHead } from "./utils/Card";
import { CenterLoading } from "./utils/Loading";
import { Tab, TabContent, TabHead, TabPanel, Tabs } from "./utils/Tabs";

const FileInput = ({ setCalculation }) => (
  <Card full>
    <Tabs>
      <CardHead>
        <div className="flex">
          <FaRegFile />
          <TabHead border>
            <Tab>Upload files</Tab>
            <Tab>Single Example</Tab>
          </TabHead>
        </div>
      </CardHead>
      <CardContent>
        <TabContent>
          <TabPanel>
            <Upload className="uk-margin" setCalculation={setCalculation} />
          </TabPanel>
          <TabPanel>
            <OneHypRef className="uk-margin" />
          </TabPanel>
        </TabContent>
      </CardContent>
    </Tabs>
  </Card>
);

const Evaluate = () => {
  const [calculation, setCalculation] = useState(null);

  const { loading, metrics, reload } = useContext(MetricsContext);
  const calc = useCalculations();

  const saveCalculation = async (id) =>
    calc.add({ ...calculation, id, metrics }).then(() => setCalculation(null));
  const scrollRef = useRef();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (calculation && scrollRef.current)
        scrollRef.current.scrollIntoView({ block: "start", behavior: "smooth", alignToTop: true });
    }, 20);
    return () => clearTimeout(timeout);
  }, [calculation]);

  if (loading) return <CenterLoading />;
  if (!metrics) return <Button onClick={reload}>Retry</Button>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gridGap: "10px" }}>
        <div>
          <FileInput setCalculation={setCalculation} />
        </div>
        <div>
          <Settings className="uk-margin" />
        </div>
      </div>
      <div ref={scrollRef} style={{ scrollMarginTop: "100px" }} className="uk-margin-large-top" />
      {calculation && (
        <Result className="uk-margin" calculation={calculation} saveCalculation={saveCalculation} />
      )}
      {calc.calculations && (
        <Saved
          className="uk-margin"
          calculations={calc.calculations}
          deleteCalculation={calc.del}
        />
      )}
    </div>
  );
};

export { Evaluate };
