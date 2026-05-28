import re
import unicodedata
from dataclasses import dataclass
from typing import Optional


@dataclass
class MatchResult:
    matched_name: str
    competitor_price: float
    score: float
    source: str
    category: str


class ProductMatcher:
    """
    Score de similarité entre un nom produit (notre catalogue)
    et les noms scrapés chez les concurrents.

    Algorithme en 4 couches (par ordre de priorité) :
      1. Match exact normalisé                     → 1.0
      2. Inclusion complète (A contient B ou B⊂A)  → 0.85–0.95
      3. Score Jaccard sur tokens                   → proportionnel
      4. Bonus/malus contenance (500ml ≠ 1L)        → ±0.20
    """

    STOP_WORDS = {
        "de", "du", "des", "le", "la", "les", "un", "une",
        "au", "aux", "et", "en", "par", "pour", "sur", "avec",
        "the", "a", "an", "of", "and",
    }

    # Mots qui ne discriminent pas — on les retire pour le matching
    GENERIC_WORDS = {
        "bio", "new", "nouveau", "nouvelle", "special", "premium",
        "natural", "naturel", "original", "classique", "traditionnel",
    }

    QUANTITY_PATTERN = re.compile(
        r"(\d+(?:[.,]\d+)?)\s*"
        r"(ml|cl|l|g|kg|mg|gr|litre|litres|gramme|grammes|kilo|kilos)"
        r"(?:\s*x\s*\d+)?",
        re.IGNORECASE,
    )

    # Conversion tout en ml ou g pour comparer
    UNIT_TO_BASE = {
        "ml": 1, "cl": 10, "l": 1000, "litre": 1000, "litres": 1000,
        "g": 1, "gr": 1, "gramme": 1, "grammes": 1,
        "kg": 1000, "kilo": 1000, "kilos": 1000,
        "mg": 0.001,
    }

    @classmethod
    def normalize(cls, text: str) -> list[str]:
        """Normalise un nom en liste de tokens significatifs."""
        nfkd = unicodedata.normalize("NFKD", text)
        ascii_str = nfkd.encode("ascii", "ignore").decode()
        clean = re.sub(r"[^a-z0-9\s]", " ", ascii_str.lower())
        tokens = clean.split()
        return [
            t for t in tokens
            if t
            and t not in cls.STOP_WORDS
            and t not in cls.GENERIC_WORDS
        ]

    @classmethod
    def extract_quantity_ml_g(cls, name: str) -> Optional[float]:
        """
        Extrait et normalise la contenance en unité de base.
        '500 ml' → 500.0
        '1 L' → 1000.0
        '1 kg' → 1000.0
        '250 g' → 250.0
        """
        matches = cls.QUANTITY_PATTERN.findall(name)
        if not matches:
            return None
        # Prendre la première mesure trouvée
        value_str, unit = matches[0]
        value = float(value_str.replace(",", "."))
        multiplier = cls.UNIT_TO_BASE.get(unit.lower(), 1)
        return value * multiplier

    def score(self, our_name: str, competitor_name: str) -> float:
        """
        Calcule le score de matching 0.0 → 1.0.
        0.45+ = match acceptable
        0.70+ = bon match
        1.0   = identique
        """
        our_tokens = self.normalize(our_name)
        comp_tokens = self.normalize(competitor_name)

        if not our_tokens or not comp_tokens:
            return 0.0

        our_set = set(our_tokens)
        comp_set = set(comp_tokens)

        # 1. Match exact
        if our_set == comp_set:
            return 1.0

        # 2. Inclusion complète (utile quand concurrents abrègent)
        if our_set.issubset(comp_set):
            return 0.90
        if comp_set.issubset(our_set):
            return 0.85

        # 3. Jaccard
        intersection = our_set & comp_set
        union = our_set | comp_set
        jaccard = len(intersection) / len(union) if union else 0.0

        # Bonus : tous les tokens longs (>4 chars) matchent
        long_our = {t for t in our_set if len(t) > 4}
        if long_our and long_our.issubset(comp_set):
            jaccard = min(1.0, jaccard + 0.15)

        # 4. Pénalité contenance différente
        our_qty = self.extract_quantity_ml_g(our_name)
        comp_qty = self.extract_quantity_ml_g(competitor_name)

        if our_qty is not None and comp_qty is not None:
            if abs(our_qty - comp_qty) / max(our_qty, comp_qty) > 0.05:
                # Contenances différentes de plus de 5% → pénalité forte
                jaccard *= 0.55
                print(f"    [Matcher] Contenance différente: {our_qty} vs {comp_qty}")

        return round(min(jaccard, 1.0), 3)

    def find_best_match(
        self,
        our_name: str,
        candidates: list[dict],
        min_score: float = 0.45,
    ) -> Optional[MatchResult]:
        """
        Cherche le meilleur match dans la liste de candidats.
        Retourne le produit le moins cher parmi les matches valides.
        """
        valid_matches = []

        for candidate in candidates:
            s = self.score(our_name, candidate["nom"])
            if s >= min_score:
                valid_matches.append((s, candidate))
                print(f"    [Match] score={s:.2f} — '{candidate['nom']}' "
                      f"({candidate['price']} DH, {candidate['source']})")

        if not valid_matches:
            return None

        # Parmi les matches valides, prendre le MOINS CHER
        # (logique de veille concurrentielle : on veut le prix le plus bas du marché)
        valid_matches.sort(key=lambda x: x[1]["price"])
        best_score, best = valid_matches[0]

        return MatchResult(
            matched_name=best["nom"],
            competitor_price=best["price"],
            score=best_score,
            source=best.get("source", "unknown"),
            category=best.get("categorie", ""),
        )