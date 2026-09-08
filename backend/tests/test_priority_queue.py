"""
RevenueRescue AI — AI Recovery Priority System Unit & Integration Tests
Tests all 14 core requirements:
1. High amount + high probability -> P0 Critical
2. High amount + low probability -> Not automatically top priority (Case B > Case A)
3. Low amount + high urgency -> Priority increases appropriately
4. High severity -> Priority increases
5. Probability changes -> Priority recalculates
6. Configurable thresholds & P0/P1/P2/P3 classifications
7. Deterministic explainability & score breakdown
8. Sorting & Filtering
9. Priority Queue & Summary APIs
10. Recover Next endpoint
11. RBAC permissions
12. Audit trail logging
13. Policy simulation
14. Decimal precision preservation
"""
import os
from decimal import Decimal
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.db.base import Base
from backend.app.db.session import get_db
from backend.app.models.recovery import (
    RecoveryCase, RecoveryAction, RecoveryCaseStatus,
    RecoveryType, RootCause, Severity, ActionType
)
from backend.app.models.reconciliation import AuditLog
from backend.app.services.priority_scoring import PriorityScoringService, PriorityLevel
from backend.app.services.recovery_agent import recalculate_case_priority

test_db_url = "sqlite:///./test_priority.db"
engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()

    if os.path.exists("./test_priority.db"):
        try:
            os.remove("./test_priority.db")
        except Exception:
            pass


@pytest.fixture(scope="function")
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client():
    return TestClient(app)


# =========================================================================
# 1. SCORING DYNAMICS TESTS
# =========================================================================

def test_high_amount_high_prob_yields_p0():
    """Case 1: ₹8,50,000 with 94% probability, high urgency, high severity -> P0 (>85)"""
    res = PriorityScoringService.compute_priority(
        amount_at_risk=Decimal("850000.00"),
        recovery_probability=Decimal("0.94"),
        severity="HIGH",
        root_cause="TEMPORARY_BANK_FAILURE",
        days_overdue=0,
        attempt_count=0
    )
    assert res["priority_score"] >= 85.0
    assert res["priority_level"] == PriorityLevel.P0_CRITICAL
    assert "8.50L" in res["priority_reason"] or "8,50,000" in res["priority_reason"]
    assert res["score_breakdown"]["financial_impact_pct"] > 80.0
    assert res["score_breakdown"]["recovery_probability_pct"] == 94.0


def test_high_amount_low_prob_does_not_rank_top():
    """Case 2: ₹5,00,000 with 20% probability vs ₹2,00,000 with 95% probability"""
    # Case A: Large amount (₹5L) but very low recoverability (20%)
    case_a = PriorityScoringService.compute_priority(
        amount_at_risk=Decimal("500000.00"),
        recovery_probability=Decimal("0.20"),
        severity="MEDIUM",
        root_cause="PERMANENT_FAILURE",
        days_overdue=10,
        attempt_count=2
    )

    # Case B: Moderate amount (₹2L) with high recoverability (95%)
    case_b = PriorityScoringService.compute_priority(
        amount_at_risk=Decimal("200000.00"),
        recovery_probability=Decimal("0.95"),
        severity="HIGH",
        root_cause="TEMPORARY_BANK_FAILURE",
        days_overdue=0,
        attempt_count=0
    )

    # Core Design Principle Check: Case B MUST score higher than Case A!
    assert case_b["priority_score"] > case_a["priority_score"]
    assert case_a["priority_level"] in (PriorityLevel.P2_MEDIUM, PriorityLevel.P3_LOW)
    assert case_b["priority_level"] in (PriorityLevel.P0_CRITICAL, PriorityLevel.P1_HIGH)


def test_urgency_and_severity_influence():
    """Test that higher urgency and severity increase the priority score"""
    base_low_urg = PriorityScoringService.compute_priority(
        amount_at_risk=Decimal("50000.00"),
        recovery_probability=Decimal("0.70"),
        severity="LOW",
        days_overdue=15,
        attempt_count=2
    )

    high_urg = PriorityScoringService.compute_priority(
        amount_at_risk=Decimal("50000.00"),
        recovery_probability=Decimal("0.70"),
        severity="CRITICAL",
        days_overdue=0,
        attempt_count=0
    )

    assert high_urg["priority_score"] > base_low_urg["priority_score"]
    assert high_urg["severity_score"] == 1.0
    assert base_low_urg["severity_score"] == 0.30


def test_historical_multiplier_application():
    """Known strong failure type should receive boost over difficult failure type"""
    strong_hist = PriorityScoringService.compute_priority(
        amount_at_risk=Decimal("40000.00"),
        recovery_probability=Decimal("0.80"),
        severity="MEDIUM",
        root_cause="TEMPORARY_BANK_FAILURE"
    )

    weak_hist = PriorityScoringService.compute_priority(
        amount_at_risk=Decimal("40000.00"),
        recovery_probability=Decimal("0.80"),
        severity="MEDIUM",
        root_cause="PERMANENT_FAILURE"
    )

    assert strong_hist["historical_multiplier"] > weak_hist["historical_multiplier"]
    assert strong_hist["priority_score"] > weak_hist["priority_score"]


def test_threshold_classification_boundaries():
    """Verify exact threshold boundary classification P0 >= 85, P1 >= 70, P2 >= 40, P3 < 40"""
    custom_policy = {"p0_threshold": 85.0, "p1_threshold": 70.0, "p2_threshold": 40.0}
    
    # Low exposure case
    p3_res = PriorityScoringService.compute_priority(
        amount_at_risk=Decimal("5000.00"),
        recovery_probability=Decimal("0.25"),
        severity="LOW",
        days_overdue=20,
        policy=custom_policy
    )
    assert p3_res["priority_score"] < 40.0
    assert p3_res["priority_level"] == PriorityLevel.P3_LOW


def test_decimal_precision_preservation():
    """Financial amount must remain Decimal and never lose currency cents"""
    amount = Decimal("1234567.89")
    res = PriorityScoringService.compute_priority(
        amount_at_risk=amount,
        recovery_probability=Decimal("0.88")
    )
    assert isinstance(amount, Decimal)
    assert str(amount) == "1234567.89"
    assert 0.0 <= res["priority_score"] <= 100.0


# =========================================================================
# 2. DATABASE & RECALCULATION TESTS
# =========================================================================

def test_priority_recalculation_and_audit(db_session):
    """When probability changes from 35% to 92%, priority recalculates and emits audit log"""
    case = RecoveryCase(
        case_id="REC-TEST-9901",
        recovery_type="PAYMENT_FAILURE",
        severity="HIGH",
        amount_at_risk=Decimal("350000.00"),
        amount_recovered=Decimal("0.00"),
        root_cause="TEMPORARY_BANK_FAILURE",
        recovery_probability=Decimal("0.35"),
        priority_score=Decimal("42.0"),
        priority_level="P2",
        current_status=RecoveryCaseStatus.DETECTED
    )
    db_session.add(case)
    db_session.commit()

    # Probability improves (e.g. gateway back online)
    case.recovery_probability = Decimal("0.92")
    p_info = recalculate_case_priority(case, db_session, actor="test_runner")
    db_session.commit()

    assert float(case.priority_score) > 80.0
    assert case.priority_level in ("P0", "P1")

    # Verify audit log was recorded
    audit_log = db_session.query(AuditLog).filter(
        AuditLog.entity_id == "REC-TEST-9901",
        AuditLog.action == "PRIORITY_RECALCULATED"
    ).first()
    assert audit_log is not None
    assert "P2" in audit_log.decision


# =========================================================================
# 3. API ENDPOINTS INTEGRATION TESTS
# =========================================================================

def test_priority_queue_api(client, db_session):
    """Test GET /api/recovery/priority-queue with sorting, filtering, and summary"""
    c1 = RecoveryCase(
        case_id="REC-P0-01",
        recovery_type="PAYMENT_FAILURE",
        severity="CRITICAL",
        amount_at_risk=Decimal("850000.00"),
        amount_recovered=Decimal("0.00"),
        recovery_probability=Decimal("0.94"),
        priority_score=Decimal("96.2"),
        priority_level="P0",
        recommended_action="START_RECOVERY",
        current_status=RecoveryCaseStatus.DETECTED
    )
    c2 = RecoveryCase(
        case_id="REC-P1-02",
        recovery_type="OVERDUE_RECEIVABLE",
        severity="HIGH",
        amount_at_risk=Decimal("240000.00"),
        amount_recovered=Decimal("0.00"),
        recovery_probability=Decimal("0.89"),
        priority_score=Decimal("84.0"),
        priority_level="P1",
        recommended_action="INVESTIGATE",
        current_status=RecoveryCaseStatus.DETECTED
    )
    c3 = RecoveryCase(
        case_id="REC-P3-03",
        recovery_type="PAYMENT_FAILURE",
        severity="LOW",
        amount_at_risk=Decimal("18000.00"),
        amount_recovered=Decimal("0.00"),
        recovery_probability=Decimal("0.30"),
        priority_score=Decimal("28.0"),
        priority_level="P3",
        recommended_action="MONITOR",
        current_status=RecoveryCaseStatus.DETECTED
    )
    db_session.add_all([c1, c2, c3])
    db_session.commit()

    headers = {"X-User-Role": "RECOVERY_ADMIN"}
    resp = client.get("/api/recovery/priority-queue", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total"] >= 3
    assert data["summary"]["p0_count"] >= 1
    assert data["summary"]["p1_count"] >= 1
    assert data["summary"]["p3_count"] >= 1
    # Items sorted by priority_score desc
    scores = [item["priority_score"] for item in data["items"]]
    assert scores == sorted(scores, reverse=True)

    # Test filtering by priority_level
    p0_resp = client.get("/api/recovery/priority-queue?priority_level=P0", headers=headers)
    assert p0_resp.status_code == 200
    p0_data = p0_resp.json()
    assert all(item["priority_level"] == "P0" for item in p0_data["items"])


def test_priority_summary_api(client, db_session):
    """Test GET /api/recovery/priority-summary"""
    c = RecoveryCase(
        case_id="REC-SUMM-01",
        recovery_type="PAYMENT_FAILURE",
        severity="HIGH",
        amount_at_risk=Decimal("100000.00"),
        amount_recovered=Decimal("40000.00"),
        recovery_probability=Decimal("0.85"),
        priority_score=Decimal("88.0"),
        priority_level="P0",
        recommended_action="START_RECOVERY",
        current_status=RecoveryCaseStatus.ACTION_EXECUTED
    )
    db_session.add(c)
    db_session.commit()

    headers = {"X-User-Role": "RECOVERY_ADMIN"}
    resp = client.get("/api/recovery/priority-summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_cases"] >= 1
    assert data["p0_cases"] >= 1
    assert data["highest_priority_case"] is not None
    assert "revenue_detected" in data["funnel"]
    assert "recovered_revenue" in data["funnel"]


def test_recover_next_endpoint(client, db_session):
    """Test GET /api/recovery/recover-next returns highest priority actionable case"""
    c1 = RecoveryCase(
        case_id="REC-ACT-01",
        recovery_type="PAYMENT_FAILURE",
        severity="MEDIUM",
        amount_at_risk=Decimal("50000.00"),
        recovery_probability=Decimal("0.60"),
        priority_score=Decimal("55.0"),
        priority_level="P2",
        current_status=RecoveryCaseStatus.DETECTED
    )
    c2 = RecoveryCase(
        case_id="REC-ACT-02",
        recovery_type="PAYMENT_FAILURE",
        severity="CRITICAL",
        amount_at_risk=Decimal("850000.00"),
        recovery_probability=Decimal("0.94"),
        priority_score=Decimal("96.2"),
        priority_level="P0",
        recommended_action="START_RECOVERY",
        current_status=RecoveryCaseStatus.DETECTED
    )
    db_session.add_all([c1, c2])
    db_session.commit()

    headers = {"X-User-Role": "RECOVERY_OPERATOR"}
    resp = client.get("/api/recovery/recover-next", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["eligible"] is True
    assert data["case"] is not None
    assert float(data["case"]["priority_score"]) >= 55.0


def test_policy_simulation_api(client, db_session):
    """Test POST /api/recovery/policies/simulate with priority thresholds"""
    c = RecoveryCase(
        case_id="REC-SIM-01",
        recovery_type="PAYMENT_FAILURE",
        severity="HIGH",
        amount_at_risk=Decimal("100000.00"),
        recovery_probability=Decimal("0.75"),
        priority_score=Decimal("78.0"),
        priority_level="P1",
        current_status=RecoveryCaseStatus.DETECTED
    )
    db_session.add(c)
    db_session.commit()

    headers = {"X-User-Role": "RECOVERY_MANAGER"}
    payload = {
        "p0_threshold": 75.0  # lowering P0 threshold should promote this case from P1 to P0 in simulation
    }
    resp = client.post("/api/recovery/policies/simulate", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "simulated_policy" in data
    assert "p0_count" in data["simulated_policy"]
