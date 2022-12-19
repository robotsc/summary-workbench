import pandas as pd
import spacy

from .average_lexical_connectivity import average_lexical_connectivity
from .content_words_ratio import content_words_ratio
from .length import length_score
from .position import position_score
from .rank import rank_score
from .special_tokens import special_token_score
from .tfidf import tfidf_score
from .util import tokenize
from .word_overlap import WordOverlap


def take_ratio(df, ratio):
    ranked_sents = list(df["sentences"])
    num_tokens = sum(len(s) for s in ranked_sents)
    requested_tokens = round(ratio * num_tokens)
    token_count = 0
    sent_count = 0
    for sent in ranked_sents:
        prev_token_count = token_count
        token_count += len(sent)
        if sent_count > 0 and (token_count - requested_tokens) > (
            requested_tokens - prev_token_count
        ):
            break
        sent_count += 1
    return df[:sent_count]


class Scorer:
    def __init__(self, model, rank_score_limit=3, raise_invalid_lang=True):
        self.rank_score_limit = rank_score_limit
        self.raise_invalid_lang = raise_invalid_lang
        try:
            self.nlp = spacy.load(model)
        except OSError:
            spacy.cli.download(model)
            self.nlp = spacy.load(model)

    def get_features(
        self,
        document,
        *,
        title,
        use_tfidf,
        use_special_tokens,
        use_position,
        use_average_lexical_connectivity,
        use_content_words_ratio,
        use_length,
        use_rank,
    ):
        sentences = tokenize(document, self.nlp)
        if not sentences:
            return []
        scores = pd.DataFrame(index=range(len(sentences)))
        if use_tfidf:
            scores["tfidf"] = tfidf_score(sentences, use_lemma=True)
        if use_special_tokens:
            scores["special_tokens"] = special_token_score(sentences)
        if use_position:
            scores["position"] = position_score(sentences)
        if use_average_lexical_connectivity:
            scores["average_lexical_connectivity"] = average_lexical_connectivity(
                sentences
            )
        if use_content_words_ratio:
            scores["content_words_ratio"] = content_words_ratio(sentences)
        if use_length:
            scores["length"] = length_score(sentences)
        if title is not None and title != "":
            scores["word_overlap"] = WordOverlap(title, nlp=self.nlp).score(sentences)
        if use_rank:
            scores["rank"] = rank_score(
                sentences, scores.mean(axis=1), limit=self.rank_score_limit
            )
        sentences = [sent.text.strip() for sent in sentences]
        return sentences, scores

    def score(
        self,
        document,
        **kwargs,
    ):
        sentences, scores = self.get_features(document, **kwargs)
        scores = scores.mean(axis=1).values
        return sentences, scores

    def summarize(
        self,
        document,
        ratio,
        title=None,
        use_tfidf=True,
        use_special_tokens=True,
        use_position=True,
        use_average_lexical_connectivity=True,
        use_content_words_ratio=True,
        use_length=True,
        use_rank=True,
    ):
        sentences, scores = self.score(
            document,
            title=title,
            use_tfidf=use_tfidf,
            use_special_tokens=use_special_tokens,
            use_position=use_position,
            use_average_lexical_connectivity=use_average_lexical_connectivity,
            use_content_words_ratio=use_content_words_ratio,
            use_length=use_length,
            use_rank=use_rank,
        )
        df = pd.DataFrame({"sentences": sentences, "scores": scores})
        df = df.reset_index()
        df = df.sort_values("scores", ascending=False)
        df = take_ratio(df, ratio)
        df = df.sort_values("index")
        summary = df["sentences"].tolist()
        return summary
