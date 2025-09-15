from transformers import pipeline, Pipeline
from app.config.settings import Settings
from app.config.constants import EMOTION_MAPPING, EMOTION_KEYWORDS
import torch
import re

settings = Settings()

class EmotionAnalyzer:
    def __init__(self):
        try:
            self.nlp: Pipeline = pipeline(
                "text-classification",
                model=settings.MODEL_NAME,
                return_all_scores=True,
                device=0 if settings.USE_GPU and torch.cuda.is_available() else -1,
                model_kwargs={"cache_dir": settings.MODEL_CACHE_DIR}
            )
            self.model_loaded = True
        except Exception as e:
            print(f"[EmotionAnalyzer] Error cargando modelo IA: {e}")
            self.model_loaded = False

    def analyze(self, text: str) -> dict:
        processed_text = self._preprocess(text)
        if self.model_loaded:
            try:
                scores = self.nlp(processed_text)[0]
                # scores: list of dicts [{'label': 'joy', 'score': 0.8}, ...]
                scores_sorted = sorted(scores, key=lambda x: x['score'], reverse=True)
                top = scores_sorted[0]
                emotion_en = top['label'].lower()
                emotion = EMOTION_MAPPING.get(emotion_en, emotion_en)
                confidence = float(top['score'])
                return {
                    "emotion": emotion,
                    "confidence": confidence,
                    "method": "ai",
                    "raw_scores": scores_sorted,
                    "processed_text": processed_text
                }
            except Exception as e:
                print(f"[EmotionAnalyzer] Error IA: {e}")
                # Fallback si la IA falla
        # Fallback por palabras clave
        return self._fallback(processed_text)

    def _preprocess(self, text: str) -> str:
        # Limpieza básica: minúsculas, quitar espacios extras, quitar signos
        text = text.lower()
        text = re.sub(r"[\n\r]+", " ", text)
        text = re.sub(r"[^\w\sáéíóúüñ]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def _fallback(self, text: str) -> dict:
        for emotion, keywords in EMOTION_KEYWORDS.items():
            for kw in keywords:
                if kw in text:
                    return {
                        "emotion": emotion,
                        "confidence": 0.7,
                        "method": "dictionary",
                        "raw_scores": None,
                        "processed_text": text
                    }
        # Si no se detecta nada
        return {
            "emotion": "desconocido",
            "confidence": 0.0,
            "method": "none",
            "raw_scores": None,
            "processed_text": text
        }
