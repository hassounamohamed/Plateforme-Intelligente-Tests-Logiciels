#!/usr/bin/env python3
"""Test bug context attachment"""

import sys
sys.path.insert(0, ".")

from db.database import SessionLocal
from models.scrum import UserStory
from models.cahier_test_global import CasTest, CahierTestGlobal
from schemas.cahier_test_global import UpdateCasTestRequest
from services.cahier_test_global_service import CahierTestGlobalService

session = SessionLocal()
try:
    # Get US and cas first
    us = session.query(UserStory).filter(UserStory.statut == "ready_for_test").first()
    if not us:
        print("No user story in ready_for_test status")
        sys.exit(1)
    
    cas = session.query(CasTest).filter(CasTest.user_story_id == us.id).first()
    if not cas:
        print("No test case found")
        sys.exit(1)
    
    # Reset this cas first
    print("=== Resetting test case ===")
    cas.statut_test = "Non exécuté"
    cas.bug_titre_correction = None
    cas.bug_nom_tache = None
    session.commit()
    print(f"Reset {cas.test_ref} to 'Non exécuté'")
    
    cahier = session.query(CahierTestGlobal).filter(CahierTestGlobal.id == cas.cahier_id).first()
    projet = cahier.projet
    
    print(f"\nBefore: US {us.reference} (ID={us.id}) statut={us.statut}")
    print(f"Before: Cas {cas.test_ref} statut={cas.statut_test}")
    
    # Create service
    svc = CahierTestGlobalService(session)
    
    # Create update request
    data = UpdateCasTestRequest(
        statut_test="Échoué",
        bug_titre_correction="Bug: Screen display issue",
        bug_nom_tache="TICKET-42"
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
    print(f"\nAfter update_cas_test:")
    print(f"  Cas {updated_cas.test_ref} statut={updated_cas.statut_test}")
    print(f"  Cas bug_titre_correction: {updated_cas.bug_titre_correction}")
    print(f"  Cas bug_nom_tache: {updated_cas.bug_nom_tache}")
    
    # Check if bug context is attached
    if updated_cas.bug_titre_correction and updated_cas.bug_nom_tache:
        print("\n[OK] BUG CONTEXT ATTACHED TO CAS TEST!")
    else:
        print("\n[FAIL] Bug context not attached to cas test")
    
    # Check user story status after update
    print("\n--- Verifying US transition ---")
    if updated_cas.user_story:
        print(f"  US {updated_cas.user_story.reference} statut={updated_cas.user_story.statut}")
        if updated_cas.user_story.statut == "a_corriger":
            print("[OK] USER STORY TRANSITIONED TO 'a_corriger'!")
        else:
            print(f"[FAIL] US should be 'a_corriger' but is '{updated_cas.user_story.statut}'")
    else:
        print("[FAIL] No user story attached to cas test")
    
    # Verify persistence by querying fresh from DB
    print("\n--- Verifying persistence ---")
    fresh_cas = session.query(CasTest).filter(CasTest.id == updated_cas.id).first()
    if fresh_cas:
        print(f"  Fresh cas {fresh_cas.test_ref} bug_titre_correction: {fresh_cas.bug_titre_correction}")
        print(f"  Fresh cas {fresh_cas.test_ref} bug_nom_tache: {fresh_cas.bug_nom_tache}")
        if fresh_cas.bug_titre_correction == "Bug: Screen display issue" and fresh_cas.bug_nom_tache == "TICKET-42":
            print("[OK] BUG CONTEXT PERSISTED TO DATABASE!")
        else:
            print("[FAIL] Bug context not properly persisted")
    
finally:
    session.close()
