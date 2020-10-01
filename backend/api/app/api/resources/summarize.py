from flask import current_app, request
from flask_restx import Resource
from marshmallow import Schema, fields, validate
from newspaper import Article
from app.common import Summarizers


class SummarizeScheme(Schema):
    text = fields.String(required=True)
    kind = fields.String(validate=validate.OneOf({"raw", "url"}))
    ratio = fields.Float(missing=0.2, validate=validate.Range(min=0, max=1, min_inclusive=False, max_inclusive=False))
    summarizers = fields.List(fields.String(), validate=validate.ContainsOnly(Summarizers.SUMMARIZERS()), required=True)


class SummarizeResource(Resource):
    def post(self):
        try:
            generate_args = SummarizeScheme().load(request.json)
            text = generate_args["text"]
            summarizers = generate_args["summarizers"]
            ratio = generate_args["ratio"]
            kind = generate_args.get("kind", "raw")
            if kind == "url":
                article = Article(text)
                article.download()
                article.parse()
                text = article.text
            summaries = current_app.SUMMARIZERS.summarize(summarizers, text, ratio)
            return {"summaries": summaries, "original_text": text}, 200
        except Exception as error:
            current_app.logger.warn(error)
            return "", 400
