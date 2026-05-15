#!/usr/bin/env python3
"""Check available user stories and their statuses"""

import sys
sys.path.insert(0, ".")

from db.database import SessionLocal
from models.scrum import UserStory

session = SessionLocal()
try:
    us_list = session.query(UserStory).all()
    print(f"Total user stories: {len(us_list)}\n")
    print("User Stories:")
    for us in us_list[:10]:  # Show first 10
        print(f"  {us.reference} (ID={us.id}) statut={us.statut}")
    
    print(f"\nStatus distribution:")
    statuses = {}
    for us in us_list:
        statuses[us.statut] = statuses.get(us.statut, 0) + 1
    for status, count in statuses.items():
        print(f"  {status}: {count}")
    
finally:
    session.close()
