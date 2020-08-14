import React from "react";

import { Markup } from "../Markup";

const MarkupDisplayer = ({ className, paragraphedText, name, showMarkup }) =>
  paragraphedText !== null && (
    <div
      className="uk-card uk-card-default uk-card-body uk-margin left-border"
      
    >
      <h1 className="uk-card-title uk-text-capitalize">{name}</h1>
      {paragraphedText.map((markupedText, i) => (
        <p key={i}>
          <Markup markupedText={markupedText} showMarkup={showMarkup} />
        </p>
      ))}
    </div>
  );

export { MarkupDisplayer };
