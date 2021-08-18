import React from "react";
import { FaCalculator, FaPen, FaSave } from "react-icons/fa";

import { ResultInfo } from "./ResultInfo";
import { Button } from "./utils/Button";
import { Card, CardBody, CardHeader, CardTitle } from "./utils/Card";

const UploadButton = (props) => (
  <Button variant="primary" {...props} style={{ whiteSpace: "nowrap" }}>
    Save Results
  </Button>
);

const Result = ({ className, calculation, setCalculationID, saveCalculation }) => {
  const { id, scores, hypotheses, references } = calculation;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <FaCalculator /> Results
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div
          className="uk-flex uk-flex-middle"
          style={{ marginTop: "-10px", marginBottom: "20px" }}
        >
          <p className="uk-text-primary" style={{ margin: "0", marginRight: "10px" }}>
            <FaPen /> Rename and save results
          </p>
          <div className="uk-flex uk-width-1-3" style={{ flexGrow: "1" }}>
            <input
              className="uk-input"
              value={id}
              onChange={(e) => setCalculationID(e.currentTarget.value)}
              onKeyDown={(e) => e.keyCode === 13 && saveCalculation()}
            />
            <UploadButton onClick={saveCalculation} />
          </div>
        </div>
        <ResultInfo scores={scores} hypotheses={hypotheses} references={references} />
      </CardBody>
    </Card>
  );
};

export { Result };
