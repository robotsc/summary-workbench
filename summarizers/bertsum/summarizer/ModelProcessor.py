from abc import abstractmethod
from typing import List

import numpy as np
from spacy.lang.en import English
from transformers import PreTrainedModel, PreTrainedTokenizer

from .BertParent import BertParent
from .ClusterFeatures import ClusterFeatures


class ModelProcessor(object):
    def __init__(
        self,
        model: str = "bert-large-uncased",
        custom_model: PreTrainedModel = None,
        custom_tokenizer: PreTrainedTokenizer = None,
        hidden: int = -2,
        reduce_option: str = "mean",
        language=English,
        random_state: int = 12345,
    ):
        """
        This is the parent Bert Summarizer model. New methods should implement this class

        :param model: This parameter is associated with the inherit string parameters from the transformers library.
        :param custom_model: If you have a pre-trained model, you can add the model class here.
        :param custom_tokenizer: If you have a custom tokenizer, you can add the tokenizer here.
        :param hidden: This signifies which layer of the BERT model you would like to use as embeddings.
        :param reduce_option: Given the output of the bert model, this param determines how you want to reduce results.
        :param language: Which language to use for training.
        :param random_state: The random state to reproduce summarizations.
        """

        np.random.seed(random_state)
        self.model = BertParent(model, custom_model, custom_tokenizer)
        self.hidden = hidden
        self.reduce_option = reduce_option
        self.nlp = language()
        self.random_state = random_state
        self.nlp.add_pipe("sentencizer")

    def process_content_sentences(
        self, body: str, min_length: int = 40, max_length: int = 600
    ) -> List[str]:
        """
        Processes the content sentences with neural coreference.
        :param body: The raw string body to process
        :param min_length: Minimum length that the sentences must be
        :param max_length: Max length that the sentences mus fall under
        :return: Returns a list of sentences with coreference applied.
        """

        doc = self.nlp(body)
        return [
            c.text.strip()
            for c in doc.sents
            if max_length > len(c.text.strip()) > min_length
        ]

    @abstractmethod
    def run_clusters(
        self,
        content: List[str],
        ratio: float = 0.2,
        algorithm: str = "kmeans",
        use_first: bool = True,
    ) -> List[str]:
        """
        Classes must implement this to run the clusters.
        """
        raise NotImplementedError("Must Implement run_clusters")

    def run(
        self,
        body: str,
        ratio: float = 0.2,
        min_length: int = 40,
        max_length: int = 600,
        use_first: bool = True,
        algorithm: str = "kmeans",
    ) -> str:
        sentences = self.process_content_sentences(body, min_length, max_length)

        if sentences:
            sentences = self.run_clusters(sentences, ratio, algorithm, use_first)

        return ". ".join([s.strip(".") for s in sentences])

    def __call__(
        self,
        body: str,
        ratio: float = 0.2,
        min_length: int = 40,
        max_length: int = 600,
        use_first: bool = True,
        algorithm: str = "kmeans",
    ) -> str:
        return self.run(
            body,
            ratio,
            min_length,
            max_length,
            algorithm=algorithm,
            use_first=use_first,
        )


class BertSummarizer(ModelProcessor):
    def __init__(
        self,
        model: str = "bert-large-uncased",
        custom_model: PreTrainedModel = None,
        custom_tokenizer: PreTrainedTokenizer = None,
        hidden: int = -2,
        reduce_option: str = "mean",
        language=English,
        random_state: int = 12345,
    ):
        """
        This is the main Bert Summarizer class.

        :param model: This parameter is associated with the inherit string parameters from the transformers library.
        :param custom_model: If you have a pre-trained model, you can add the model class here.
        :param custom_tokenizer: If you have a custom tokenizer, you can add the tokenizer here.
        :param hidden: This signifies which layer of the BERT model you would like to use as embeddings.
        :param reduce_option: Given the output of the bert model, this param determines how you want to reduce results.
        :param language: Which language to use for training.
        :param random_state: The random state to reproduce summarizations.
        """
        super(BertSummarizer, self).__init__(
            model,
            custom_model,
            custom_tokenizer,
            hidden,
            reduce_option,
            language,
            random_state,
        )

    def run_clusters(
        self, content: List[str], ratio=0.2, algorithm="kmeans", use_first: bool = True
    ) -> List[str]:
        hidden = self.model(content, self.hidden, self.reduce_option)
        hidden_args = ClusterFeatures(
            hidden, algorithm, random_state=self.random_state
        ).cluster(ratio)

        if use_first:
            if hidden_args[0] != 0:
                hidden_args.insert(0, 0)

        return [content[j] for j in hidden_args]
