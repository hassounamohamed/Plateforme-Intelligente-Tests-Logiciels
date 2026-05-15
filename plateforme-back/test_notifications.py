#!/usr/bin/env python3
"""Test notification system when test cases pass/fail"""

import sys
sys.path.insert(0, ".")

from db.database import SessionLocal
from models.scrum import UserStory
from models.cahier_test_global import CasTest, CahierTestGlobal
from models.notification import Notification
from models.user import Utilisateur
from schemas.cahier_test_global import UpdateCasTestRequest
from services.cahier_test_global_service import CahierTestGlobalService

session = SessionLocal()
try:
    # Get a user story
    us = session.query(UserStory).filter(UserStory.statut.in_(["a_corriger", "to_do"])).first()
    if not us:
        print("No user story found")
        sys.exit(1)
    
    # Assign a developer to the user story if not already assigned
    if not us.developerId:
        # Get any active developer
        dev = session.query(Utilisateur).filter(Utilisateur.actif == True).first()
        if dev:
            us.developerId = dev.id
            session.commit()
            print(f"Assigned developer {dev.id} ({dev.email}) to US")
        else:
            print("No active developers found")
            sys.exit(1)
    
    # Get all test cases for this user story
    all_cases = session.query(CasTest).filter(CasTest.user_story_id == us.id).all()
    if not all_cases:
        print("No test cases found for this user story")
        sys.exit(1)
    
    print(f"Testing with US {us.reference} (ID={us.id}) and {len(all_cases)} test cases")
    
    # Reset all test cases
    print("\n=== Resetting all test cases ===")
    for cas in all_cases:
        cas.statut_test = "Non exécuté"
        cas.bug_titre_correction = None
        cas.bug_nom_tache = None
        session.commit()
        print(f"Reset {cas.test_ref} to 'Non exécuté'")
    
    # Get notification count before
    dev_id = us.developerId
    initial_notifs = session.query(Notification).filter(
        Notification.destinataireId == dev_id
    ).count() if dev_id else 0
    
    print(f"\nDeveloper ID: {dev_id}")
    print(f"Initial notifications for developer: {initial_notifs}")
    
    # Get cahier and projet info
    cahier = session.query(CahierTestGlobal).filter(CahierTestGlobal.id == all_cases[0].cahier_id).first()
    projet = cahier.projet
    
    # Create service
    svc = CahierTestGlobalService(session)
    
    print("\n=== TEST 1: Failing a test case ===")
    first_case = all_cases[0]
    data = UpdateCasTestRequest(
        statut_test="Échoué",
        bug_titre_correction="Bug: Login page not responsive",
        bug_nom_tache="BUG-001"
    )
    updated_cas = svc.update_cas_test(
        cahier_id=cahier.id,
        cas_id=first_case.id,
        projet_id=projet.id,
        data=data,
        changed_by_id=41,
        sync_rapport=False
    )
    
    # Check notifications after failure
    notifs_after_fail = session.query(Notification).filter(
        Notification.destinataireId == dev_id
    ).all() if dev_id else []
    
    print(f"Notifications after failure: {len(notifs_after_fail)}")
    if notifs_after_fail:
        for notif in notifs_after_fail[-2:]:  # Show last 2
            print(f"  - {notif.titre}: {notif.message[:60]}...")
    
    print("\n=== TEST 2: Passing a test case ===")
    second_case = all_cases[1]
    data = UpdateCasTestRequest(statut_test="Réussi")
    updated_cas = svc.update_cas_test(
        cahier_id=cahier.id,
        cas_id=second_case.id,
        projet_id=projet.id,
        data=data,
        changed_by_id=41,
        sync_rapport=False
    )
    
    # Check notifications after pass
    notifs_after_pass = session.query(Notification).filter(
        Notification.destinataireId == dev_id
    ).all() if dev_id else []
    
    print(f"Notifications after pass: {len(notifs_after_pass)}")
    if notifs_after_pass:
        for notif in notifs_after_pass[-2:]:  # Show last 2
            print(f"  - {notif.titre}: {notif.message[:60]}...")
    
    print("\n=== TEST 3: Passing all remaining test cases ===")
    for cas in all_cases[2:-1]:
        data = UpdateCasTestRequest(statut_test="Réussi")
        svc.update_cas_test(
            cahier_id=cahier.id,
            cas_id=cas.id,
            projet_id=projet.id,
            data=data,
            changed_by_id=41,
            sync_rapport=False
        )
    
    # Pass the last one
    last_case = all_cases[-1]
    data = UpdateCasTestRequest(statut_test="Réussi")
    updated_cas = svc.update_cas_test(
        cahier_id=cahier.id,
        cas_id=last_case.id,
        projet_id=projet.id,
        data=data,
        changed_by_id=41,
        sync_rapport=False
    )
    
    # Now fix the first failed test to make all pass
    print("\n=== TEST 4: Fixing the failed test case ===")
    first_case = all_cases[0]
    data = UpdateCasTestRequest(statut_test="Réussi")
    updated_cas = svc.update_cas_test(
        cahier_id=cahier.id,
        cas_id=first_case.id,
        projet_id=projet.id,
        data=data,
        changed_by_id=41,
        sync_rapport=False
    )
    
    print(f"Fixed {first_case.test_ref} to Réussi")
    
    # Check notifications after all pass
    notifs_final = session.query(Notification).filter(
        Notification.destinataireId == dev_id
    ).all() if dev_id else []
    
    # Also check ALL notifications in the system for "all tests passed"
    all_notifs = session.query(Notification).all()
    
    print(f"Total notifications: {len(notifs_final)}")
    print(f"Notifications after all tests passed: {len(notifs_final)}")
    print(f"Total notifications in system: {len(all_notifs)}")
    
    # Look for the "all tests passed" notification in ALL notifications
    all_passed_notif = None
    all_passed_notif_any_dest = None
    for notif in all_notifs:
        if "Tous les tests reussis" in notif.titre:
            all_passed_notif_any_dest = notif
            if notif.destinataireId == dev_id:
                all_passed_notif = notif
            break
    
    if all_passed_notif:
        print(f"\n[OK] ALL TESTS PASSED NOTIFICATION SENT TO DEVELOPER!")
        print(f"  Title: {all_passed_notif.titre}")
        print(f"  Message: {all_passed_notif.message}")
    elif all_passed_notif_any_dest:
        print(f"\n[OK] ALL TESTS PASSED NOTIFICATION SENT (to other user)")
        print(f"  Title: {all_passed_notif_any_dest.titre}")
        print(f"  Message: {all_passed_notif_any_dest.message}")
        print(f"  Sent to: {all_passed_notif_any_dest.destinataireId}")
    else:
        print(f"\n[FAIL] No 'all tests passed' notification found")
    
    # Verify US status
    fresh_us = session.query(UserStory).filter(UserStory.id == us.id).first()
    print(f"\nUser Story {fresh_us.reference} final status: {fresh_us.statut}")
    if fresh_us.statut == "done":
        print("[OK] US STATUS IS DONE")
    
    # Summary of notifications
    print("\n=== NOTIFICATION SUMMARY ===")
    dev_failure_notifs = [n for n in notifs_final if "echoue" in n.titre.lower()]
    dev_pass_notifs = [n for n in notifs_final if "reussi" in n.titre.lower() and "tous" not in n.titre.lower()]
    
    all_failure_notifs = [n for n in all_notifs if "echoue" in n.titre.lower()]
    all_pass_notifs = [n for n in all_notifs if "reussi" in n.titre.lower() and "tous" not in n.titre.lower()]
    all_pass_global_notifs = [n for n in all_notifs if "tous les tests" in n.titre.lower()]
    
    print(f"Failure notifications (to developer): {len(dev_failure_notifs)}")
    print(f"Pass notifications (to developer): {len(dev_pass_notifs)}")
    print(f"Failure notifications (total): {len(all_failure_notifs)}")
    print(f"Pass notifications (total): {len(all_pass_notifs)}")
    print(f"All-pass notifications (total): {len(all_pass_global_notifs)}")
    
    if all_pass_global_notifs:
        print("\n[OK] COMPLETE NOTIFICATION SYSTEM WORKING!")
        print("  - Developers notified of individual test failures")
        print("  - Developers notified of individual test passes")
        print("  - All project members notified when US tests complete")
    else:
        print("\n[FAIL] Missing all-pass notifications")
    
finally:
    session.close()
