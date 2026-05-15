#!/usr/bin/env python3
"""Check user stories with test cases"""

import sys
sys.path.insert(0, ".")

from db.database import SessionLocal
from models.scrum import UserStory
from models.cahier_test_global import CasTest

session = SessionLocal()
try:
    us_list = session.query(UserStory).all()
    
    print("User Stories with test cases:\n")
    for us in us_list:
        cases = session.query(CasTest).filter(CasTest.user_story_id == us.id).all()
        if len(cases) > 0:
            print(f"  {us.reference} (ID={us.id}) statut={us.statut}")
            print(f"    Test cases: {len(cases)}")
            for cas in cases:
                print(f"      {cas.test_ref} -> {cas.statut_test}")
            print()
    
finally:
    session.close()
