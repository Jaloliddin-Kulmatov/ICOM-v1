"""Daily import of scholarships and contests from other sites into the review queue."""
import json
from types import SimpleNamespace

import pytest

import opportunity_import as imp
import routes.ai as ai_routes
from app import db
from models import Job

SC_POSTS = [
    {"id": 1, "date": "2026-11-06T10:00:00", "link": "https://scholarshipscorner.website/kaist-visual-ai-internship/",
     "title": {"rendered": "KAIST Visual AI Internship 2027 in South Korea | Paid"},
     "content": {"rendered": '<p>Paid internship at KAIST in Daejeon, South Korea.</p>'
                             '<a href="https://kaist.example/apply">Apply Now</a>'}},
    {"id": 2, "date": "2026-11-05T10:00:00", "link": "https://scholarshipscorner.website/twente/",
     "title": {"rendered": "University of Twente Scholarship 2027"},
     "content": {"rendered": "<p>Study in the Netherlands.</p>"}},           # no Korea: never read
]
WEVITY_LIST = '<a href="?c=find&s=1&gub=1&gbn=view&gp=1&ix=777">Contest</a>'
WEVITY_PAGE = """<h6 class="tit">외국인 유학생 한국어 UCC 공모전</h6>
<ul class="cd-info-list"><li><span class="tit">응모대상</span> 외국인 유학생 </li>
<li><span class="tit">주최/주관</span> 국립국어원 </li>
<li class="dday-area"><span class="tit">접수기간</span> 2026-11-01 ~ 2099-12-20 <span>D-30</span></li>
<li><span class="tit">총 상금</span> 500만원 </li>
<li><span class="tit">홈페이지</span> <a href="https://contest.example.kr" target="_blank">x</a></li></ul>
<div class="comm-desc" id="viewContents">한국 생활을 영상으로 소개하세요.</div><div class="article">"""

AI_ANSWERS = {
    "KAIST": {"relevant": True, "kind": "internship", "title": "KAIST Visual AI Internship 2027",
              "organizer": "KAIST", "deadline": "2099-01-31", "amount": "Paid",
              "eligibility": "Undergraduate and graduate students", "summary": "A paid research internship at KAIST."},
    "UCC": {"relevant": True, "kind": "contest", "title": "Korean UCC contest for international students",
            "organizer": "National Institute of Korean Language", "deadline": "2099-12-20",
            "amount": "₩5,000,000 in prizes", "eligibility": "International students in Korea",
            "summary": "Make a short video about life in Korea."},
}


class FakeSession:
    def __init__(self):
        self.headers, self.calls = {}, []

    def get(self, url, params=None, timeout=None):
        self.calls.append((url, params))
        if "scholarshipscorner" in url:
            return SimpleNamespace(json=lambda: SC_POSTS, raise_for_status=lambda: None, text="")
        body = WEVITY_PAGE if "ix=777" in url else WEVITY_LIST
        return SimpleNamespace(text=body, raise_for_status=lambda: None)


@pytest.fixture
def fake_web(app, monkeypatch):
    session = FakeSession()
    monkeypatch.setattr(imp.requests, "Session", lambda: session)
    monkeypatch.setattr(imp.time, "sleep", lambda s: None)
    asked = []

    def create(model, messages, **kw):
        post = messages[1]["content"]
        asked.append(post)
        key = "KAIST" if "KAIST" in post else "UCC"
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(AI_ANSWERS[key])))])

    monkeypatch.setattr(ai_routes, "_get_client", lambda: SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create))))
    with app.app_context():
        yield SimpleNamespace(session=session, asked=asked)


def test_imports_into_the_review_queue_once(fake_web):
    r = imp.run()
    assert r["added"] == 2 and not r["errors"], r
    kaist = Job.query.filter_by(source_url=SC_POSTS[0]["link"]).one()
    assert (kaist.job_type, kaist.review_status, kaist.is_active) == ("internship", "pending", False)
    assert kaist.apply_link == "https://kaist.example/apply"            # the organizer's page, not the blog
    assert "Found on Scholarships Corner" in kaist.description and kaist.deadline == "2099-01-31"
    ucc = Job.query.filter(Job.source_url.like("%ix=777")).one()
    assert ucc.title == "Korean UCC contest for international students" and ucc.apply_link == "https://contest.example.kr"
    assert "응모대상" not in ucc.description and "Who can apply: International students in Korea" in ucc.description
    assert not any("Twente" in a for a in fake_web.asked)                # posts without Korea never reach the AI

    again = imp.run()
    assert again["added"] == 0 and len(fake_web.asked) == 2              # nothing is imported or checked twice


def test_not_for_international_students_is_remembered_not_listed(fake_web, monkeypatch):
    monkeypatch.setitem(AI_ANSWERS, "UCC", {**AI_ANSWERS["UCC"], "relevant": False})
    Job.query.filter(Job.source_url.isnot(None)).delete()
    db.session.commit()
    imp.run(["wevity"])
    row = Job.query.filter(Job.source_url.like("%ix=777")).one()
    assert row.review_status == "rejected" and not row.is_active and row.job_type == "skipped"


def test_admin_can_run_it_and_needs_ai(client, admin, fake_web, monkeypatch):
    assert client.post("/api/admin/opportunities/import").status_code == 401
    assert admin.post("/api/admin/opportunities/import").get_json()["status"] == "done"
    monkeypatch.setattr(ai_routes, "_get_client", lambda: None)
    assert imp.run()["status"] == "no_ai"


def test_kind_guessed_when_the_ai_is_down():
    assert imp.guess_kind("CASSConf2027 - Call for Papers") == "program"
    assert imp.guess_kind("Hackathon for students") == "contest"
    assert imp.guess_kind("Summer internship at KAIST") == "internship"
    assert imp.guess_kind("SK Global Scholarship") == "scholarship"
