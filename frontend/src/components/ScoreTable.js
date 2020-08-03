import React, { useEffect, useReducer, useState } from "react";

import { toCSV, toLatex } from "../utils/export";
import { Button } from "./utils/Button";

const LatexButton = ({ onClick }) => <Button onClick={onClick}>Latex</Button>;
const CSVButton = ({ onClick }) => <Button onClick={onClick}>CSV</Button>;

const TransposeButton = ({ transpose, onClick }) => (
  <Button size="small" variant={transpose ? "default" : "primary"} onClick={onClick}>
    transpose
  </Button>
);

const ExportPreview = ({ text }) =>
  text !== null && (
    <pre className="uk-padding-small" style={{ border: "solid 1px grey" }}>
      {text}
    </pre>
  );

const PrecionField = ({ onChange }) => (
  <input className="uk-input" placeholder="precision" onChange={onChange} />
);

const ScoreTable = ({ scoreInfo }) => {
  const flatScores = Object.values(scoreInfo).reduce(
    (acc, value) => acc.concat(Object.entries(value)),
    []
  );
  const [allChecked, setAllChecked] = useState(true);
  const [isChecked, toggleChecked] = useReducer(
    (state, i) => [...state.slice(0, i), !state[i], ...state.slice(i + 1)],
    flatScores.map(() => true)
  );
  const [exportText, setExportText] = useState(null);
  const [transpose, toggleTranspose] = useReducer((state) => !state, true);
  const [precision, setPrecision] = useReducer(
    (state, newValue) => newValue.replace(/\D/g, ""),
    "3"
  );
  const allOnClick = (e) => {
    const checked = e.target.checked;
    isChecked.forEach((value, i) => {
      if (value !== checked) {
        toggleChecked(i);
      }
    });
  };
  useEffect(() => {
    if (isChecked.every((a) => a)) {
      setAllChecked(true);
    } else {
      setAllChecked(false);
    }
  }, [isChecked]);
  return (
    <>
      <table className="uk-table uk-table-divider uk-table-small uk-table-middle">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Score</th>
            <td>
              <input
                checked={allChecked}
                className="uk-checkbox uk-padding-small"
                type="checkbox"
                onChange={allOnClick}
              />
            </td>
          </tr>
        </thead>
        <tbody>
          {flatScores.map(([metric, score], i) => (
            <tr key={metric}>
              <td>{metric}</td>
              <td>{score.toFixed(3)}</td>
              <td>
                <input
                  key={i}
                  checked={isChecked[i]}
                  className="uk-checkbox uk-padding-small"
                  type="checkbox"
                  onChange={() => toggleChecked(i)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className="uk-flex uk-flex-between uk-flex-middle uk-flex-wrap-reverse uk-margin"
        style={{ gridRowGap: "20px" }}
      >
        <div className="uk-flex">
          <CSVButton
            onClick={() =>
              setExportText(
                toCSV(
                  flatScores.filter((score, i) => isChecked[i]),
                  transpose,
                  precision
                )
              )
            }
          />
          <LatexButton
            onClick={() =>
              setExportText(
                toLatex(
                  flatScores.filter((score, i) => isChecked[i]),
                  transpose,
                  precision
                )
              )
            }
          />
        </div>

        <div className="uk-flex">
          <PrecionField
            precision={precision}
            onChange={(e) => {
              setPrecision(e.target.value);
            }}
          />
          <TransposeButton transpose={transpose} onClick={() => toggleTranspose()} />
        </div>
      </div>
        <ExportPreview text={exportText} />
    </>
  );
};

export { ScoreTable };
