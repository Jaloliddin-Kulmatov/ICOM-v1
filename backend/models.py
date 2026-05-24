from app import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    university = db.Column(db.String(100))
    visa_type = db.Column(db.String(20))
    country = db.Column(db.String(100))
    role = db.Column(db.String(20), default="student")
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "university": self.university,
            "visa_type": self.visa_type,
            "country": self.country,
            "role": self.role,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() + "Z",
        }


class AISession(db.Model):
    __tablename__ = "ai_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    messages = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref="ai_sessions")


class Club(db.Model):
    __tablename__ = "clubs"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    university = db.Column(db.String(100), default="JBNU")
    # private — only shown to approved members
    kakao_link = db.Column(db.String(300))
    contact = db.Column(db.String(200))
    meeting_time = db.Column(db.String(150))
    location = db.Column(db.String(150))
    club_type = db.Column(db.String(20), default="club")  # "club" | "community"
    country = db.Column(db.String(100))
    website = db.Column(db.String(500))   # official university / community website
    cover_image = db.Column(db.String(500))  # optional cover photo URL (user-set or blank = picsum default)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship("User", foreign_keys=[created_by], backref="owned_clubs")

    def to_dict(self, user_id=None):
        approved_count = ClubMembership.query.filter_by(club_id=self.id, status="approved").count()
        # Avoid double-counting if the creator joined their own club via ClubMembership
        creator_in_memberships = ClubMembership.query.filter_by(
            club_id=self.id, user_id=self.created_by, status="approved"
        ).first() is not None
        pending_count = 0
        my_status = None  # None | "pending" | "approved"

        if user_id:
            m = ClubMembership.query.filter_by(club_id=self.id, user_id=user_id).first()
            if m:
                my_status = m.status
            if self.created_by == user_id:
                pending_count = ClubMembership.query.filter_by(club_id=self.id, status="pending").count()

        is_approved_member = my_status == "approved" or self.created_by == user_id
        is_creator = self.created_by == user_id

        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "university": self.university,
            "meeting_time": self.meeting_time,
            "location": self.location,
            "is_active": self.is_active,
            # +1 for creator, unless creator also has a membership row (don't double-count)
            "member_count": approved_count + (0 if creator_in_memberships else 1),
            "pending_count": pending_count,
            "my_status": my_status,           # None / "pending" / "approved"
            "is_creator": is_creator,
            # Private info — only for approved members & creator
            "kakao_link": self.kakao_link if is_approved_member else None,
            "contact": self.contact if is_approved_member else None,
            "created_at": self.created_at.isoformat() + "Z",
            "creator_name": self.creator.name if self.creator else None,
            "club_type": self.club_type or "club",
            "country": self.country,
            "website": self.website or "",
            "cover_image": self.cover_image or "",
        }


class ClubMembership(db.Model):
    __tablename__ = "club_memberships"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending | approved | rejected
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "club_id"),)

    user = db.relationship("User", backref="club_memberships")
    club = db.relationship("Club", backref="memberships")


class AmbassadorApplication(db.Model):
    __tablename__ = "ambassador_applications"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    university = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(150))
    year = db.Column(db.String(10))
    country = db.Column(db.String(100))
    visa_type = db.Column(db.String(20))
    motivation = db.Column(db.Text)
    social = db.Column(db.String(300))   # KakaoTalk ID / Instagram / etc.
    status = db.Column(db.String(20), default="pending")  # pending | approved | rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "university": self.university,
            "department": self.department,
            "year": self.year,
            "country": self.country,
            "visa_type": self.visa_type,
            "motivation": self.motivation,
            "social": self.social,
            "status": self.status,
            "created_at": self.created_at.isoformat() + "Z",
        }


class Post(db.Model):
    """Community feed posts — can be posted as self, university, or club."""
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    # What the post appears "from" — "user" | "university" | "club"
    posted_as_type = db.Column(db.String(20), default="user")
    posted_as_label = db.Column(db.String(150))   # e.g. "JBNU" or "Hiking Club"
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", foreign_keys=[user_id], backref="posts")
    club = db.relationship("Club", foreign_keys=[club_id], backref="posts")

    def to_dict(self):
        comment_count = PostComment.query.filter_by(post_id=self.id).count()
        return {
            "id": self.id,
            "user_id": self.user_id,
            "author_name": self.author.name if self.author else "Unknown",
            "content": self.content,
            "posted_as_type": self.posted_as_type,
            "posted_as_label": self.posted_as_label,
            "club_id": self.club_id,
            "created_at": self.created_at.isoformat() + "Z",
            "comment_count": comment_count,
        }


class PostComment(db.Model):
    """Comments on community feed posts. Supports one-level threaded replies via parent_id."""
    __tablename__ = "post_comments"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("post_comments.id"), nullable=True, index=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "user_id": self.user_id,
            "parent_id": self.parent_id,
            "author_name": self.author.name if self.author else "Unknown",
            "content": self.content,
            "created_at": self.created_at.isoformat() + "Z",
        }


class ClubMessage(db.Model):
    """Chat messages inside a club or community."""
    __tablename__ = "club_messages"

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    # Reply threading (nullable — not all messages are replies)
    reply_to_id      = db.Column(db.Integer, db.ForeignKey("club_messages.id"), nullable=True)
    reply_to_name    = db.Column(db.String(150), nullable=True)   # denormalized author name
    reply_to_content = db.Column(db.String(200), nullable=True)   # preview of original msg
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", foreign_keys=[user_id])
    club = db.relationship("Club", foreign_keys=[club_id])

    def to_dict(self):
        return {
            "id": self.id,
            "club_id": self.club_id,
            "user_id": self.user_id,
            "author_name": self.author.name if self.author else "Unknown",
            "content": self.content,
            "reply_to_id": self.reply_to_id,
            "reply_to_name": self.reply_to_name,
            "reply_to_content": self.reply_to_content,
            "created_at": self.created_at.isoformat() + "Z",
        }


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150))
    job_type = db.Column(db.String(50))
    salary = db.Column(db.String(100))
    description = db.Column(db.Text)
    requirements = db.Column(db.Text)
    visa_compatible = db.Column(db.String(200))
    deadline = db.Column(db.String(50))
    tags = db.Column(db.String(300))
    apply_link = db.Column(db.String(500))   # real application URL
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "type": self.job_type,
            "salary": self.salary,
            "description": self.description,
            "requirements": [r.strip() for r in (self.requirements or "").split("\n") if r.strip()],
            "visa_compatible": [v.strip() for v in (self.visa_compatible or "").split(",") if v.strip()],
            "deadline": self.deadline,
            "tags": [t.strip() for t in (self.tags or "").split(",") if t.strip()],
            "apply_link": self.apply_link or "",
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() + "Z",
            "isNew": (datetime.utcnow() - self.created_at).days < 3,
        }


class Feedback(db.Model):
    __tablename__ = "feedback"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # null = anonymous
    name       = db.Column(db.String(120))   # filled for anon submissions
    email      = db.Column(db.String(200))   # filled for anon submissions
    rating     = db.Column(db.Integer)       # 1-5 stars (nullable)
    message    = db.Column(db.Text, nullable=False)
    page_url   = db.Column(db.String(500))   # captured client-side for context
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        # Prefer the authenticated user's profile info when available
        author_name = self.user.name if self.user else (self.name or "Anonymous")
        author_email = self.user.email if self.user else (self.email or "")
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": author_name,
            "email": author_email,
            "rating": self.rating,
            "message": self.message,
            "page_url": self.page_url or "",
            "created_at": self.created_at.isoformat() + "Z",
        }
