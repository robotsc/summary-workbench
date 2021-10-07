import React, { useCallback, useEffect, useRef, useState } from "react";
import UIkit from "uikit";

import { flatten } from "../utils/flatScores";
import { usePairwiseMarkups } from "../hooks/markup";
import { CompareTable } from "./CompareTable";
import { ScoreTable } from "./ScoreTable";
import { DeleteButton } from "./utils/DeleteButton";

const SavedInfo = ({ index, calculation, deleteCalculation }) => {
  const {scores, metrics, hypotheses, references} = calculation
  const flatScores = flatten(scores, metrics);
  const toggleID = `toggle-saved-calculation-${index}`;
  const loadRef = useRef();
  const [showMarkups, setShowMarkups] = useState(false)
  const comparisons = usePairwiseMarkups(showMarkups && hypotheses, references)
  const showEvent = useCallback(() => {
    if (comparisons.length) return;
    if (loadRef.current && loadRef.current.className.includes("uk-active")) {
      setShowMarkups(true)
    } else UIkit.util.once(document, "show", `#${toggleID}`, showEvent);
  }, [comparisons, toggleID]);
  useEffect(showEvent, [showEvent]);

  const tabStyle={border: "2px solid #1e87f0"};

  return (
    <div>
      <div className="uk-flex uk-flex-middle uk-margin">
        <ul className="uk-subnav uk-subnav-pill uk-margin uk-margin-right uk-width-expand uk-flex-middle" data-uk-switcher={`connect: #${toggleID};`} style={{marginBottom: "0"}}>
          <li>
            <a href="/#" style={tabStyle}>Scores</a>
          </li>
          <li>
            <a href="/#" style={tabStyle}>Visualize Overlap</a>
          </li>
        </ul>
        <DeleteButton onClick={deleteCalculation} />
      </div>
      <ul id={toggleID} className="uk-switcher">
        <li>
          <ScoreTable flatScores={flatScores} />
        </li>
        <li ref={loadRef}>{comparisons.length && <CompareTable comparisons={comparisons} />}</li>
      </ul>
    </div>
  );
};

export { SavedInfo };
