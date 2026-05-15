#!/usr/bin/env python3
"""Test that all test cases passing transitions US to done"""

import sys
sys.path.insert(0, ".")

from db.database import SessionLocal
from models.scrum import UserStory
from models.cahier_test_global import CasTest, CahierTestGlobal
from schemas.cahier_test_global import UpdateCasTestRequest
from services.cahier_test_global_service import CahierTestGlobalService

session = SessionLocal()
try:
    # Get a user story with multiple test cases
    # Try "a_corriger" first, then "to_do"
    us = session.query(UserStory).filter(UserStory.statut.in_(["a_corriger", "to_do"])).first()
    if not us:
        print("No user story found")
        sys.exit(1)
    
    # Get all test cases for this user story
    all_cases = session.query(CasTest).filter(CasTest.user_story_id == us.id).all()
    if not all_cases:
        print("No test cases found for this user story")
        sys.exit(1)
    
    print(f"Found {len(all_cases)} test cases for US {us.reference}")
    
    # Reset all test cases to "Non exécuté"
    print("\n=== Resetting all test cases ===")
    for cas in all_cases:
        cas.statut_test = "Non exécuté"
        cas.bug_titre_correction = None
        cas.bug_nom_tache = None
        session.commit()
        print(f"Reset {cas.test_ref} to 'Non exécuté'")
    
    # Get cahier and projet info
    cahier = session.query(CahierTestGlobal).filter(CahierTestGlobal.id == all_cases[0].cahier_id).first()
    projet = cahier.projet
    
    print(f"\nBefore: US {us.reference} statut={us.statut}")
    
    # Create service
    svc = CahierTestGlobalService(session)
    
    # Pass all test cases except the last one
    print("\n=== Passing test cases (all but last) ===")
    for cas in all_cases[:-1]:
        data = UpdateCasTestRequest(statut_test="Réussi")
        updated_cas = svc.update_cas_test(
            cahier_id=cahier.id,
            cas_id=cas.id,
            projet_id=projet.id,
            data=data,
            changed_by_id=41,
            sync_rapport=False
        )
        print(f"  {cas.test_ref} -> Réussi, US status: {updated_cas.user_story.statut if updated_cas.user_story else 'N/A'}")
    
    # Pass the last test case
    print("\n=== Passing final test case ===")
    last_cas = all_cases[-1]
    data = UpdateCasTestRequest(statut_test="Réussi")
    updated_cas = svc.update_cas_test(
        cahier_id=cahier.id,
        cas_id=last_cas.id,
        projet_id=projet.id,
        data=data,
        changed_by_id=41,
        sync_rapport=False
    )
    print(f"  {last_cas.test_ref} -> Réussi")
    
    # Check user story status
    print(f"\nAfter all tests passed:")
    print(f"  US {updated_cas.user_story.reference} statut={updated_cas.user_story.statut}")
    
    if updated_cas.user_story.statut == "done":
        print("\n[OK] ALL TEST CASES PASSED - US TRANSITIONED TO 'done'!")
    else:
        print(f"\n[FAIL] US should be 'done' but is '{updated_cas.user_story.statut}'")
    
    # Verify persistence
    print("\n--- Verifying persistence ---")
    fresh_us = session.query(UserStory).filter(UserStory.id == us.id).first()
    print(f"  Fresh US {fresh_us.reference} statut={fresh_us.statut}")
    if fresh_us.statut == "done":
        print("[OK] US STATUS PERSISTED TO DATABASE!")
    else:
        print("[FAIL] US status not properly persisted")
    
finally:
    session.close()
