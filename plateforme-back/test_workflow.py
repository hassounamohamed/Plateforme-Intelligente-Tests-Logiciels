#!/usr/bin/env python3
"""Test the QA workflow automation"""

import sys
sys.path.insert(0, ".")

from db.database import SessionLocal
from models.scrum import UserStory
from models.cahier_test_global import CasTest, CahierTestGlobal
from schemas.cahier_test_global import UpdateCasTestRequest
from services.cahier_test_global_service import CahierTestGlobalService

session = SessionLocal()
try:
    # Reset cas first
    print("=== Resetting test case ===")
    reset_cas = session.query(CasTest).filter(CasTest.test_ref == "TC-005").first()
    if reset_cas:
        reset_cas.statut_test = "Non exécuté"
        reset_cas.bug_titre_correction = None
        reset_cas.bug_nom_tache = None
        session.commit()
        print(f"Reset {reset_cas.test_ref} to 'Non exécuté'")
    
    # Get US and cas
    us = session.query(UserStory).filter(UserStory.statut == "ready_for_test").first()
    if not us:
        print("No user story in ready_for_test status")
        sys.exit(1)
    
    cas = session.query(CasTest).filter(CasTest.user_story_id == us.id).first()
    if not cas:
        print("No test case found")
        sys.exit(1)
    
    cahier = session.query(CahierTestGlobal).filter(CahierTestGlobal.id == cas.cahier_id).first()
    projet = cahier.projet
    
    print(f"Before: US {us.reference} (ID={us.id}) statut={us.statut}")
    print(f"Before: Cas {cas.test_ref} statut={cas.statut_test}")
    
    # Create service
    svc = CahierTestGlobalService(session)
    
    # Create update request
    data = UpdateCasTestRequest(
        statut_test="Échoué",
        bug_titre_correction="Test Bug Fix",
        bug_nom_tache="TASK-123"
    )
    
    # Call service update
    print("\n--- Calling svc.update_cas_test ---")
    updated_cas = svc.update_cas_test(
        cahier_id=cahier.id,
        cas_id=cas.id,
        projet_id=projet.id,
        data=data,
        changed_by_id=41,
        sync_rapport=False
    )
    
    # Check results
    print(f"\nAfter service call:")
    print(f"  Cas {updated_cas.test_ref} statut={updated_cas.statut_test}")
    print(f"  updated_cas.user_story: {updated_cas.user_story}")
    if updated_cas.user_story:
        print(f"  updated_cas.user_story.statut: {updated_cas.user_story.statut}")
    
    # Refresh US from DB
    session.expire(us)
    us_fresh = session.query(UserStory).filter(UserStory.id == us.id).first()
    print(f"\nAfter DB refresh:")
    print(f"  US {us_fresh.reference} (ID={us_fresh.id}) statut={us_fresh.statut}")
    
    if us_fresh.statut == "a_corriger":
        print("\n✓ WORKFLOW WORKS ! US automatically transitioned to 'a_corriger'")
    else:
        print(f"\n✗ WORKFLOW BROKEN ! US should be 'a_corriger' but is '{us_fresh.statut}'")
    
finally:
    session.close()
