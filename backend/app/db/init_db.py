import os
import logging
from backend.app.db.base import Base
from backend.app.db.session import engine, SessionLocal
from backend.app.models.entities import Payment, SettlementBatch, SettlementLineItem, BankTransaction
from backend.app.models.reconciliation import (
    ReconciliationRun,
    ReconciliationMatch,
    ExceptionRecord,
    AIInvestigation,
    AuditLog
)
from backend.app.models.recovery import (
    RecoveryCase,
    RecoveryAction
)
from backend.app.models.user import User  # noqa: F401 — ensures users table is created

logger = logging.getLogger("financetwin")

def _migrate_recovery_columns():
    with engine.connect() as conn:
        try:
            cursor = conn.exec_driver_sql("PRAGMA table_info(recovery_cases)")
            existing_cols = {row[1] for row in cursor.fetchall()}
            if existing_cols:
                cols_to_add = [
                    ("priority_level", "VARCHAR(10) DEFAULT 'P2'"),
                    ("financial_impact_score", "NUMERIC(5, 4)"),
                    ("urgency_score", "NUMERIC(5, 4)"),
                    ("severity_score", "NUMERIC(5, 4)"),
                    ("historical_multiplier", "NUMERIC(5, 4) DEFAULT 1.00"),
                    ("priority_reason", "VARCHAR(1000)"),
                    ("priority_breakdown", "JSON"),
                    ("priority_calculated_at", "DATETIME")
                ]
                for col_name, col_type in cols_to_add:
                    if col_name not in existing_cols:
                        conn.exec_driver_sql(f"ALTER TABLE recovery_cases ADD COLUMN {col_name} {col_type}")
                conn.commit()
        except Exception as e:
            logger.warning(f"Column migration check note: {e}")

def init_db():
    Base.metadata.create_all(bind=engine)
    _migrate_recovery_columns()
    
    # Check if database has data seeded; if empty, automatically populate
    db = SessionLocal()
    try:
        batch_count = db.query(SettlementBatch).count()
        if batch_count == 0:
            logger.info("Database is empty. Automatically loading synthetic datasets and executing initial reconciliation cycle...")
            from backend.app.services.data_loader import load_all_csvs
            from backend.app.services.dataset_generator import generate_synthetic_data
            from backend.app.services.batch_matcher import run_reconciliation
            from backend.app.services.audit_service import log_action
            
            # Determine backend base path
            backend_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            
            # Ensure generated CSVs exist
            csv_check_file = os.path.join(backend_path, "data", "generated", "settlement_batches.csv")
            if not os.path.exists(csv_check_file):
                logger.info("Generating deterministic synthetic datasets...")
                generate_synthetic_data(backend_path)
                
            # Load all datasets into SQLite
            load_all_csvs(db, backend_path)
            
            # Execute first reconciliation cycle so portal is immediately populated with rich analytics
            run = run_reconciliation(db, "INITIAL_PORTAL_RUN")
            
            log_action(
                db=db,
                entity_type="SystemInit",
                entity_id="INIT_001",
                action="PORTAL_DATA_INITIALIZED",
                actor="System Bootstrapper",
                decision="COMPLETED",
                reason="Automatic population of settlement batches and initial reconciliation run.",
                metadata_json={
                    "total_batches": run.total_settlements,
                    "matched": run.matched_count,
                    "exceptions": run.exception_count,
                    "abstained": run.abstained_count
                }
            )
            logger.info(f"Database bootstrap complete! Initial run {run.run_id} processed {run.total_settlements} batches.")

        # Seed Recovery Cases if empty
        recovery_count = db.query(RecoveryCase).count()
        if recovery_count == 0:
            logger.info("Initializing RevenueRescue AI recovery cases and running initial batch...")
            from backend.app.services.recovery_dataset import generate_recovery_batch
            from backend.app.services.recovery_agent import run_batch_recovery
            
            initial_cases = generate_recovery_batch(payment_failures=30, checkout_abandonments=25, overdue_receivables=25)
            summary = run_batch_recovery(db, initial_cases, actor="System Bootstrapper")
            logger.info(f"Recovery bootstrap complete! Seeded {summary['batch_size']} recovery cases with {summary['recovery_rate_pct']}% recovery rate.")
    except Exception as e:
        logger.error(f"Error during automatic database initialization: {e}")
    finally:
        db.close()
