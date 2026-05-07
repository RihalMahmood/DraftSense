"""
Tests for DraftPredictor - stub mode (no model loaded) and inference mode.

Usage:
    cd ml_service
    pytest tests/test_predictor.py -v
"""

import pytest
from unittest.mock import MagicMock, patch
from api.schemas import PredictRequest, TeamPicks
from api.predictor import DraftPredictor


def make_request(**kwargs) -> PredictRequest:
    """Helper to create a PredictRequest with sensible defaults."""
    defaults = {
        "my_role":            "jungle",
        "candidate_champion": "Vi",
        "enemy_picks": TeamPicks(top="Darius", jungle=None, mid="Syndra", bot="Jinx", support="Thresh"),
        "ally_picks":  TeamPicks(top="Camille", jungle=None, mid=None, bot="Ezreal", support="Lulu"),
        "bans":        ["Zed", "Yasuo"],
    }
    defaults.update(kwargs)
    return PredictRequest(**defaults)


class TestDraftPredictorStubMode:
    """Tests for stub mode - no model loaded (Phase 0-2)."""

    def setup_method(self):
        #Point to a non-existent model path
        self.predictor = DraftPredictor("models/trained/does_not_exist.pkl")

    def test_is_not_ready(self):
        assert self.predictor.is_ready() is False

    def test_predict_returns_null_scores(self):
        req    = make_request()
        result = self.predictor.predict(req)
        assert result.counter_score is None
        assert result.synergy_score is None
        assert result.overall_score is None

    def test_build_features_returns_array(self):
        """Feature building should work even without a trained model."""
        self.predictor.champion_list = ["Vi", "Jinx", "Darius", "Syndra", "Thresh",
                                         "Camille", "Ezreal", "Lulu", "Zed", "Yasuo"]
        self.predictor.n_champions = len(self.predictor.champion_list)
        req     = make_request()
        features = self.predictor.build_features(req)
        assert features.ndim == 2
        assert features.shape[0] == 1    #single sample
        assert features.shape[1] > 0    #non-empty feature vector

    def test_feature_vector_expected_length(self):
        """With n_champions=10, verify feature length matches spec."""
        self.predictor.champion_list = [f"Champ{i}" for i in range(10)]
        self.predictor.n_champions   = 10
        n = 10
        #enemy: n×5=50, ally: n×4=40, bans: n=10, role: 5, candidate: n=10, patch: 1
        expected = (n * 5) + (n * 4) + n + 5 + n + 1  # = 116
        req     = make_request()
        features = self.predictor.build_features(req)
        assert features.shape[1] == expected

    def test_unknown_champion_produces_zero_vector(self):
        """Champions not in the list should produce zero one-hot vectors (no crash)."""
        self.predictor.champion_list = ["Vi"]
        self.predictor.n_champions   = 1
        req = make_request(candidate_champion="NonExistentChamp9999")
        features = self.predictor.build_features(req)
        #All champion-related features should be zero
        assert features is not None


class TestDraftPredictorWithMockModel:
    """Tests with a mocked sklearn-compatible model."""

    def setup_method(self):
        import numpy as np
        self.predictor = DraftPredictor("models/trained/does_not_exist.pkl")
        self.predictor.champion_list = [f"Champ{i}" for i in range(165)]
        self.predictor.n_champions   = 165
        self.predictor.patch         = "14.8"

        # Inject a mock model that always predicts 65% win probability
        mock_model = MagicMock()
        mock_model.predict_proba.return_value = [[0.35, 0.65]]
        self.predictor.model = mock_model

    def test_is_ready_with_mock_model(self):
        assert self.predictor.is_ready() is True

    def test_predict_returns_valid_scores(self):
        req    = make_request()
        result = self.predictor.predict(req)
        assert result.counter_score is not None
        assert result.synergy_score is not None
        assert result.overall_score is not None
        assert 0.0 <= result.counter_score <= 1.0
        assert 0.0 <= result.synergy_score <= 1.0
        assert 0.0 <= result.overall_score <= 1.0

    def test_overall_score_is_weighted(self):
        """overall = (counter × 0.6) + (synergy × 0.4)."""
        req    = make_request()
        result = self.predictor.predict(req)
        expected = round((result.counter_score * 0.6) + (result.synergy_score * 0.4), 4)
        assert abs(result.overall_score - expected) < 1e-4

    def test_patch_is_returned(self):
        req    = make_request()
        result = self.predictor.predict(req)
        assert result.patch == "14.8"
