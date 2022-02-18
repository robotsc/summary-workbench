import React, { useContext, useMemo, useState } from "react";

import { evaluateRequest } from "../api";
import { MetricsContext } from "../contexts/MetricsContext";
import { useMarkup } from "../hooks/markup";
import { flatten } from "../utils/flatScores";
import { displayError } from "../utils/message";
import { ScoreTable } from "./ScoreTable";
import { Button } from "./utils/Button";
import { Textarea } from "./utils/Form";
import { InfoText } from "./utils/InfoText";
import { Loading } from "./utils/Loading";
import { Markup } from "./utils/Markup";

const OneHypRefResult = ({ className, calculation }) => {
  const { scores, hypText, refText } = calculation;
  const [hypothesis, reference] = useMarkup(hypText, refText);

  const { metrics } = useContext(MetricsContext);
  const flatScores = useMemo(() => flatten(scores, metrics), [scores, metrics]);
  const markupState = useState();

  return (
    <div className={className}>
      <table className="uk-table uk-margin">
        <tbody>
          <tr>
            <td>
              <Markup markups={reference} markupState={markupState} />
            </td>
            <td>
              <Markup markups={hypothesis} markupState={markupState} />
            </td>
          </tr>
        </tbody>
      </table>
      <ScoreTable flatScores={flatScores} />
    </div>
  );
};

const TextField = ({ value, setValue, placeholder }) => (
  <Textarea
    value={value}
    onChange={(e) => setValue(e.currentTarget.value)}
    rows="8"
    placeholder={placeholder}
  />
);

const getChosenMetrics = (metrics) =>
  Object.entries(metrics)
    .filter((e) => e[1])
    .map((e) => e[0]);

const OneHypRef = () => {
  const [hypText, setHypText] = useState("");
  const [refText, setRefText] = useState("");
  const [evaluateResult, setEvaluateResult] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const { settings } = useContext(MetricsContext);

  const hasInput = hypText.trim() && refText.trim();
  const metricIsChoosen = Object.values(settings).some((e) => e);

  const compute = () => {
    setIsComputing(true);
    evaluateRequest(getChosenMetrics(settings), [hypText], [refText])
      .then(({ scores }) => {
        setEvaluateResult({ scores, hypText, refText });
      })
      .catch(displayError)
      .finally(() => setIsComputing(false));
  };

  return (
    <>
      <InfoText
        messages={[
          [!hasInput, "Enter a hypothesis and a reference.", false],
          [!metricIsChoosen, "Select at least one metric.", true],
        ]}
      />
      <div className="flex gap-2">
        <TextField value={refText} setValue={setRefText} placeholder="Enter the reference text" />
        <TextField value={hypText} setValue={setHypText} placeholder="Enter the predicted text" />
      </div>
      <div className="flex justify-center">
        {isComputing ? (
          <Loading />
        ) : (
          <Button
            variant="primary"
            disabled={!hasInput || !metricIsChoosen}
            onClick={() => compute()}
          >
            Evaluate
          </Button>
        )}
      </div>
      {evaluateResult && <OneHypRefResult className="uk-margin" calculation={evaluateResult} />}
    </>
  );
};

export { OneHypRef };
