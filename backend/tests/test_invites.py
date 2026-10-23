"""Invite links (who brought whom), campaign refs and active-user counts."""
from conftest import User


def test_invite_link_counts_friends(client):
    aziz = User(client, "Aziz Karimov", "aziz.inv@icom.test")
    r = aziz.get("/api/invites/me")
    assert r.status_code == 200
    me = r.get_json()
    assert me["code"].startswith("aziz-") and me["link"].endswith(f"?ref={me['code']}") and me["joined"] == 0
    assert aziz.get("/api/invites/me").get_json()["code"] == me["code"]          # stays the same

    friend = User(client, "Linh", "linh.inv@icom.test", ref=me["code"].upper())  # case doesn't matter
    assert aziz.get("/api/invites/me").get_json()["joined"] == 1
    assert friend.get("/api/auth/me").status_code == 200


def test_campaign_ref_and_growth_stats(client, admin):
    User(client, "Kakao One", "kakao1.inv@icom.test", ref="kakao-jbnu")
    User(client, "Kakao Two", "kakao2.inv@icom.test", ref="Kakao JBNU!")         # cleaned to "kakaojbnu"
    User(client, "No Ref", "noref.inv@icom.test")
    admin.get("/api/auth/me")                                                    # admin opened ICOM today

    assert User(client, "Nosy", "nosy.inv@icom.test").get("/api/admin/growth").status_code == 403
    g = admin.get("/api/admin/growth").get_json()
    refs = {r["ref"]: r for r in g["signups_by_ref"]}
    assert refs["kakao-jbnu"]["total"] == 1 and refs["kakao-jbnu"]["last_7_days"] == 1
    assert "kakaojbnu" in refs
    assert g["wau"] >= 1 and g["dau"] >= 1 and len(g["weekly_active"]) == 8
    assert g["weekly_active"][-1]["active"] >= 1
    assert any(t["joined"] >= 1 for t in g["top_inviters"])


def test_activity_counted_once_a_day_and_removed_with_account(client, admin):
    u = User(client, "Daily", "daily.inv@icom.test")
    before = admin.get("/api/admin/growth").get_json()["dau"]
    for _ in range(3):
        u.get("/api/auth/me")
    assert admin.get("/api/admin/growth").get_json()["dau"] == before + 1
    assert u.delete("/api/auth/me", json={"confirm": "DELETE"}).status_code == 200
    assert admin.get("/api/admin/growth").get_json()["dau"] == before
