import os

from moverscore import MoverScore, MoverScoreV2
import numpy as np

MODELS = {"MoverScoreV1": MoverScore, "MoverScoreV2": MoverScoreV2}

MODEL = os.environ.get("model") or "MoverScoreV2"

MODEL_CLASS = MODELS[MODEL]


class MetricPlugin:
    def __init__(self):
        self.mover_score = MODEL_CLASS()

    def evaluate(self, hypotheses, references):
        return np.average(self.mover_score.score(references, hypotheses))
