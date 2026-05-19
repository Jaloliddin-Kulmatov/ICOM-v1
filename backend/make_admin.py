"""Run this once to give your account admin access.
Usage: python make_admin.py your@email.com
"""
import sys
from app import create_app, db
from models import User

if len(sys.argv) < 2:
    print("Usage: python make_admin.py your@email.com")
    sys.exit(1)

email = sys.argv[1].strip().lower()
app = create_app()

with app.app_context():
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"No user found with email: {email}")
        sys.exit(1)
    user.role = "admin"
    db.session.commit()
    print(f"✅ {user.name} ({user.email}) is now an admin.")
