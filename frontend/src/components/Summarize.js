import isURL from "is-url";
import React, { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { CSSTransition } from "react-transition-group";
import { Checkboxes } from "./utils/Checkboxes"

import { feedbackRequest, summarizeRequest } from "../api";
import { SummarizersContext } from "../contexts/SummarizersContext";
import { useMarkups } from "../hooks/markup";
import { displayMessage } from "../utils/message";
import { Badge } from "./utils/Badge";
import { Button } from "./utils/Button";
import { Bars, EyeClosed, EyeOpen, ThumbsDown, ThumbsUp } from "./utils/Icons";
import { CenterLoading } from "./utils/Loading";
import { Markup, useMarkupScroll } from "./utils/Markup";

const Feedback = ({ summary }) => {
  const { name, summaryText, originalText, url } = summary;
  const sendFeedback = (feedback) =>
    feedbackRequest(name, summaryText, originalText, url, feedback);
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return <>Thanks for the Feedback!</>;
  return (
    <div className="uk-small">
      <span className="colored-header"> Good Summary?</span>
      <ThumbsUp
        className="uk-margin-left"
        onClick={() =>
          sendFeedback("good")
            .then(() => setSubmitted(true))
            .catch((e) => displayMessage(e.message))
        }
      />
      <ThumbsDown
        className="uk-margin-small-left"
        onClick={() =>
          sendFeedback("bad")
            .then(() => setSubmitted(true))
            .catch((e) => displayMessage(e.message))
        }
      />
    </div>
  );
};

const Header = ({ text, fontSize, backgroundColor = "#B02F2C", children, style }) => (
  <div
    className="uk-flex uk-flex-between uk-flex-middle"
    style={{
      paddingLeft: "20px",
      paddingRight: "10px",
      paddingTop: "10px",
      fontWeight: "500",
      paddingBottom: "12px",
      backgroundColor,
      color: "white",
      fontSize,
      ...style,
    }}
  >
    {text && <div style={{ fontSize }}>{text}</div>}
    {children}
  </div>
);

const getSetModels = (models) =>
  Object.entries(models)
    .filter((e) => e[1])
    .map((e) => e[0]);

const Loading = () => <div data-uk-spinner />;

const sampleText = `Alan Mathison Turing was an English mathematician, computer scientist, logician, cryptanalyst, philosopher, and theoretical biologist. Turing was highly influential in the development of theoretical computer science, providing a formalisation of the concepts of algorithm and computation with the Turing machine, which can be considered a model of a general-purpose computer. Turing is widely considered to be the father of theoretical computer science and artificial intelligence. Despite these accomplishments, he was never fully recognised in his home country, if only because much of his work was covered by the Official Secrets Act.
During the Second World War, Turing worked for the Government Code and Cypher School (GC&CS) at Bletchley Park, Britain's codebreaking centre that produced Ultra intelligence. For a time he led Hut 8, the section that was responsible for German naval cryptanalysis. Here, he devised a number of techniques for speeding the breaking of German ciphers, including improvements to the pre-war Polish bombe method, an electromechanical machine that could find settings for the Enigma machine.
Turing played a crucial role in cracking intercepted coded messages that enabled the Allies to defeat the Nazis in many crucial engagements, including the Battle of the Atlantic. Due to the problems of counterfactual history, it is hard to estimate the precise effect Ultra intelligence had on the war, but Professor Jack Copeland has estimated that this work shortened the war in Europe by more than two years and saved over 14 million lives.
After the war, Turing worked at the National Physical Laboratory, where he designed the Automatic Computing Engine. The Automatic Computing Engine was one of the first designs for a stored-program computer. In 1948, Turing joined Max Newman's Computing Machine Laboratory, at the Victoria University of Manchester, where he helped develop the Manchester computers and became interested in mathematical biology. He wrote a paper on the chemical basis of morphogenesis and predicted oscillating chemical reactions such as the Belousov–Zhabotinsky reaction, first observed in the 1960s.
Turing was prosecuted in 1952 for homosexual acts; the Labouchere Amendment of 1885 had mandated that "gross indecency" was a criminal offence in the UK. He accepted chemical castration treatment, with DES, as an alternative to prison. Turing died in 1954, 16 days before his 42nd birthday, from cyanide poisoning. An inquest determined his death as a suicide, but it has been noted that the known evidence is also consistent with accidental poisoning.
In 2009, following an Internet campaign, British Prime Minister Gordon Brown made an official public apology on behalf of the British government for "the appalling way he was treated". Queen Elizabeth II granted Turing a posthumous pardon in 2013. The "Alan Turing law" is now an informal term for a 2017 law in the United Kingdom that retroactively pardoned men cautioned or convicted under historical legislation that outlawed homosexual acts.`;

const InputDocument = ({ summarize, isComputing }) => {
  const [documentText, setDocumentText] = useState("");
  const { summarizers, summarizerTypes, settings, toggleSetting } = useContext(SummarizersContext);
  const [percentage, setPercentage] = useState("15");

  const anyModelSet = () => Object.values(settings).some((isSet) => isSet);

  const insertSampleText = () => {
    setDocumentText(sampleText);
    if (settings.textrank !== undefined && !settings.textrank) toggleSetting("textrank");
  };

  return (
    <div className="uk-container uk-container-expand uk-margin-medium-top@s uk-margin-large-top@l">
      <div className="uk-flex uk-flex-between" style={{ minHeight: "60vh" }}>
        {/* Start Document container */}
        <div className="uk-flex uk-flex-column" style={{ flexBasis: "60%" }}>
          <Header text="Document" fontSize="14pt">
            <Button variant="primary" onClick={insertSampleText}>
              sample text
            </Button>
          </Header>
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.currentTarget.value)}
            className="uk-textarea uk-card uk-card-default uk-card-body"
            rows="8"
            placeholder="Paste URL or long text"
            style={{ height: "100%", padding: "20px", resize: "none", overflow: "auto" }}
          />
        </div>
        {/*  End Document container */}

        <div style={{ minWidth: "20px" }} />

        {/*  Start model lists container */}
        <div className="uk-flex uk-flex-column" style={{ flexBasis: "40%" }}>
          <Header text="Models" fontSize="14pt" />
          <div
            className="uk-card uk-card-default uk-card-body uk-flex-stretch"
            style={{ height: "100%" }}
          >
            {/* Start model checkbox lists */}
            <div className="uk-flex" style={{ marginTop: "-25px" }}>
              {Object.keys(summarizerTypes).length ? (
                Object.entries(summarizerTypes).map(([key, value]) => (
                  <div key={key} style={{ flex: "1" }} className="margin-right">
                    <h4
                      className="underline-border uk-text-left colored-header"
                      style={{ textTransform: "capitalize" }}
                    >
                      {key}
                    </h4>
                    <Checkboxes
                      options={value.map((summarizer) => [
                        summarizer,
                        summarizers[summarizer].readable,
                        settings[summarizer],
                      ])}
                      toggleOption={toggleSetting}
                    />
                  </div>
                ))
              ) : (
                <div>no summarizers configured</div>
              )}
            </div>
            {/* End model checkbox lists */}

            {/*  Start summary options container */}
            <div>
              <div
                className="uk-flex uk-flex-row"
                style={{ marginTop: "10px", marginBottom: "40px" }}
              >
                <span className="colored-header">Summary Length</span>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  defaultValue={percentage}
                  style={{
                    flex: "1 0",
                    minWidth: "100px",
                    marginLeft: "15px",
                    marginRight: "15px",
                  }}
                  onChange={(e) => setPercentage(e.currentTarget.value)}
                />
                <span
                  className="uk-flex uk-label"
                  style={{
                    alignItems: "center",
                    justifyContent: "right",
                    width: "30px",
                    height: "30px",
                  }}
                >
                  {`${percentage}%`}
                </span>
              </div>
              <div className="uk-flex uk-flex-center">
                {isComputing ? (
                  <Loading />
                ) : (
                  <button
                    className="uk-button uk-button-primary"
                    disabled={!documentText || !anyModelSet()}
                    onClick={() => summarize(documentText, getSetModels(settings), percentage)}
                  >
                    Summarize
                  </button>
                )}
              </div>
            </div>
            {/*  End summary options container */}
          </div>
        </div>
        {/*  End model lists container */}
      </div>
    </div>
  );
};

const computeNumWords = (text) => [...text.matchAll(/[a-zA-Z]+/g)].length;

const generateStatistics = (text, summaryMarkup) => {
  const numWords = computeNumWords(text);
  let numMarkupedWords = numWords;
  summaryMarkup.forEach((subtext) => {
    if (typeof subtext === "string") numMarkupedWords -= computeNumWords(subtext);
  });
  return {
    numWords,
    percentOverlap: numWords ? numMarkupedWords / numWords : 0,
  };
};

const Summary = ({ markup, summary, markupState, scrollState, showMarkup }) => {
  const { originalText, summaryText } = summary;
  const { numWords, percentOverlap } = generateStatistics(originalText, markup[1]);

  return (
    <div>
      <div className="uk-flex uk-flex-right" style={{ transform: "translate(20px, -20px)" }}>
        <Badge>{`${numWords} words`}</Badge>
        <Badge>{`${(percentOverlap * 100).toFixed(0)}% overlap`}</Badge>
      </div>
      <Markup markups={markup[1]} markupState={markupState} scrollState={scrollState} showMarkup={showMarkup} />
      <div className="uk-flex uk-flex-right">
        <Feedback summary={summary} />
      </div>
    </div>
  );
};
// Processed document
const Document = ({ title, markup, markupState, scrollState, showMarkup, clearMarkups }) => (
  <>
    <div>
      <h4 style={{ margin: "10px", marginBottom: "0" }}>{title}</h4>
      <div
        className="uk-card uk-card-default uk-card-body"
        style={{ height: "60vh", width: "auto", overflow: "auto", padding: "20px" }}
      >
        <Markup markups={markup} markupState={markupState} scrollState={scrollState} showMarkup={showMarkup} />
      </div>
      <button
        className=" uk-button uk-button-primary uk-margin-top uk-width-1-1"
        onClick={clearMarkups}
      >
        Clear
      </button>
    </div>
  </>
);

const SummaryTabView = ({
  title,
  showOverlap,
  summaries,
  markups,
  clearMarkups,
  documentLength,
}) => {
  const [summaryIndex, setSummaryIndex] = useState(0);
  const { summarizers } = useContext(SummarizersContext);
  const markupState = useState(null);
  const scrollState = useMarkupScroll();

  return (
    <div className="uk-flex">
      <div style={{ flexBasis: "60%" }}>
        <Header text="Document" fontSize="16pt">
          <span style={{ fontSize: "12pt" }}>{documentLength} words</span>
        </Header>
        <Document
          clearMarkups={clearMarkups}
          title={title}
          markup={markups[summaryIndex][0]}
          markupState={markupState}
          scrollState={scrollState}
          showMarkup={showOverlap}
        />
      </div>
      <div style={{ minWidth: "20px" }} />
      <div style={{ flexBasis: "40%" }}>
        <Header>
          <ul className="uk-tab dark-tab uk-margin" data-uk-tab="connect: #summary-display;">
            {summaries.map(({ name }, index) => (
              <li key={name}>
                <a
                  className=""
                  style={{ color: "blue", fontSize: "1em" }}
                  href="/#"
                  onClick={() => setSummaryIndex(index)}
                >
                  {summarizers[name].readable}
                </a>
              </li>
            ))}
          </ul>
        </Header>
        <div
          style={{ height: "auto", overflow: "auto" }}
          className="uk-card uk-card-default uk-card-body"
        >
          <ul id="summary-display" className="uk-switcher">
            {markups.map((markup, index) => (
              <li key={index}>
                <Summary
                  markup={markup}
                  summary={summaries[index]}
                  showMarkup={showOverlap}
                  markupState={markupState}
                  scrollState={scrollState}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const buildGrids = (list) => {
  const grids = [];
  let grid = null;
  for (let i = 0; i < list.length; i++) {
    if (i % 3 === 0) {
      if (grid) grids.push(grid);
      grid = [];
    }
    grid.push(list[i]);
  }
  grids.push(grid);
  return grids;
};

const SummaryCompareView = ({ summaries, markups, showOverlap }) => {
  const grids = buildGrids(markups.map((markup, index) => [markup, summaries[index]]));

  const { summarizers } = useContext(SummarizersContext);
  return (
    <>
      {grids.map((grid, gridIndex) => (
        <div key={gridIndex} className="uk-margin uk-grid uk-child-width-expand@s">
          {grid.map(([markup, summary], markupIndex) => (
            <div key={markupIndex}>
              <Header text={summarizers[summary.name].readable} fontSize="16pt" />
              <div
                style={{ maxHeight: "500px", overflow: "auto" }}
                className="uk-card uk-card-default uk-card-body"
              >
                <Summary markup={markup} summary={summary} showMarkup={showOverlap} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

const Icon = ({ OpenIcon, CloseIcon, show, toggle, descriptionOpen, descriptionClose }) =>
  show ? (
    <OpenIcon
      style={{ minWidth: "30px" }}
      onClick={toggle}
      data-uk-tooltip={`title: ${descriptionOpen}; pos: left`}
    />
  ) : (
    <CloseIcon
      onClick={toggle}
      style={{ minWidth: "30px" }}
      data-uk-tooltip={`title: ${descriptionClose}; pos: left`}
    />
  );

const ToggleView = ({ showTab, toggleShowTab }) => (
  <CSSTransition in={showTab} timeout={300} classNames="summarizer-toggle-view">
    <Bars
      style={{ minWidth: "30px" }}
      onClick={toggleShowTab}
      data-uk-tooltip={`title: ${showTab ? "Compare View" : "Reset View"}; pos: left`}
    />
  </CSSTransition>
);

const ToggleOverlap = ({ show, toggle }) => (
  <Icon
    OpenIcon={EyeOpen}
    CloseIcon={EyeClosed}
    show={show}
    toggle={toggle}
    descriptionOpen="show overlap"
    descriptionClose="hide overlap"
  />
);

const SummaryView = ({ title, summaries, clearSummaries, documentLength }) => {
  const [showTab, toggleShowTab] = useReducer((e) => !e, true);
  const [showOverlap, toggleShowOverlap] = useReducer((e) => !e, false);
  const hypotheses = useMemo(() => summaries.map(({ summaryText }) => summaryText), [summaries]);
  const references = useMemo(() => summaries.map(({ originalText }) => originalText), [summaries]);
  const markups = useMarkups(references, hypotheses);

  return (
    <div className="uk-container uk-container-expand">
      <div className="uk-flex">
        <div>
          {showTab ? (
            <SummaryTabView
              documentLength={documentLength}
              showOverlap={showOverlap}
              summaries={summaries}
              title={title}
              markups={markups}
              clearMarkups={clearSummaries}
            />
          ) : (
            <SummaryCompareView showOverlap={showOverlap} summaries={summaries} markups={markups} />
          )}
        </div>
        <div
          className="icon-margin uk-flex uk-flex-column"
          style={{ marginLeft: "10px", minWidth: "30px" }}
        >
          <ToggleView showTab={showTab} toggleShowTab={toggleShowTab} />
          <ToggleOverlap show={!showOverlap} toggle={toggleShowOverlap} />
        </div>
      </div>
    </div>
  );
};

const paragraphSize = 3;
const computeParagraphs = (text) => {
  const paragraphs = [];
  for (let index = 0; index < text.length; index += paragraphSize) {
    const paragraph = text.slice(index, index + paragraphSize);
    paragraphs.push(paragraph.join(" "));
  }
  return paragraphs.join("\n\n");
};

const Summarize = () => {
  const [results, setResults] = useState(null);
  const [title, setTitle] = useState(null);
  const [computing, setComputing] = useState(null);
  const [documentLength, setDocumentLength] = useState(0);
  const { summarizers, loading, reload } = useContext(SummarizersContext);

  const clearSummaries = () => {
    setResults(null);
    setTitle(null);
  };

  const summarize = async (rawText, models, percentage) => {
    const requestText = rawText.trim();
    const ratio = parseInt(percentage, 10) / 100;

    if (!models.length) {
      displayMessage("No summarizer selected");
      return;
    }
    if (!requestText) {
      displayMessage("Please enter some text.");
      return;
    }
    setComputing(true);
    try {
      const { summaries, original, url } = await summarizeRequest(requestText, models, ratio);
      if (Object.values(summaries).every((summarySentences) => !summarySentences.length)) {
        throw new Error("No summaries could be generated. The input is probably too short.");
      }
      const originalText = computeParagraphs(original.text);
      const newSummaries = Object.entries(summaries).map(([name, summarySentences]) => {
        const summaryText = computeParagraphs(summarySentences);
        return {
          name,
          originalText,
          summaryText,
          url,
        };
      });
      newSummaries.sort((a, b) => a.name > b.name);
      setResults(newSummaries);
      setTitle(original.title);
      setDocumentLength(computeNumWords(originalText));
    } catch (err) {
      displayMessage(err.message);
    } finally {
      setComputing(false);
    }
  };

  if (loading) return <CenterLoading />;
  if (!summarizers)
    return (
      <Button className="uk-container" onClick={reload}>
        Retry
      </Button>
    );
  if (results)
    return (
      <SummaryView
        documentLength={documentLength}
        summaries={results}
        title={title}
        clearSummaries={clearSummaries}
      />
    );
  return <InputDocument summarize={summarize} isComputing={computing} />;
};

export { Summarize };
