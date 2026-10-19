import React, { useState } from "react";
import { Linking } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { CLUB_CATEGORIES } from "@/lib/options";
import { space } from "@/lib/theme";
import type { Club, ClubEvent } from "@/lib/types";
import { Button, Card, Chip, Empty, Icon, Loading, Row, Screen, Text } from "@/components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Event times are Korea time ("2026-10-25T14:00").
function formatKst(local: string) {
  const [d, t = "00:00"] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()]} ${day} ${MONTHS[m - 1]} · ${t.slice(0, 5)}`;
}

function googleCalendarLink(e: ClubEvent, clubName: string) {
  const stamp = (local: string, addHours = 0) => {
    const [d, t = "00:00"] = local.split("T");
    const [y, m, day] = d.split("-").map(Number);
    const [h, min] = t.split(":").map(Number);
    return new Date(Date.UTC(y, m - 1, day, h - 9 + addHours, min)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };
  const end = e.ends_at ? stamp(e.ends_at) : stamp(e.starts_at, 2);
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${stamp(e.starts_at)}/${end}`, details: `${clubName} on ICOM`, location: e.location });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clubReq = useApi<{ club: Club }>(`/clubs/${id}`);
  const eventsReq = useApi<{ events: ClubEvent[] }>(`/clubs/${id}/events`);
  const club = clubReq.data?.club || null;
  const events = eventsReq.data?.events || [];
  const error = club ? "" : clubReq.error;
  const [busy, setBusy] = useState(false);
  const load = () => { clubReq.reload(); eventsReq.reload(); };

  if (error) return <Screen><Empty icon="people-outline" title="Not available" body={error} /></Screen>;
  if (!club) return <Screen><Loading /></Screen>;
  const member = club.is_creator || club.my_status === "approved";

  const joinOrLeave = async () => {
    setBusy(true);
    await api.post(`/clubs/${club.id}/${member || club.my_status === "pending" ? "leave" : "request"}`);
    setBusy(false);
    load();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: club.club_type === "community" ? "Community" : "Club" }} />
      <Text variant="title">{club.name}</Text>
      <Row style={{ flexWrap: "wrap" }} gap={6}>
        <Chip label={CLUB_CATEGORIES[club.category] || club.category} />
        <Chip label={`${club.member_count} member${club.member_count === 1 ? "" : "s"}`} icon="people-outline" />
        {club.university ? <Chip label={club.university.toUpperCase()} /> : null}
      </Row>
      {club.description ? <Text>{club.description}</Text> : null}
      {(club.meeting_time || club.location) && (
        <Card>
          {club.meeting_time ? <Row><Icon name="time-outline" /><Text variant="small" color="ink">{club.meeting_time}</Text></Row> : null}
          {club.location ? <Row><Icon name="location-outline" /><Text variant="small" color="ink">{club.location}</Text></Row> : null}
        </Card>
      )}

      {!club.is_creator && (
        <Button title={member ? "Leave" : club.my_status === "pending" ? "Cancel request" : "Join"} variant={member ? "secondary" : "primary"}
          icon={member ? "exit-outline" : "add-circle-outline"} onPress={joinOrLeave} loading={busy} />
      )}
      {member && club.kakao_link ? (
        <Button title="Open the KakaoTalk group" variant="secondary" icon="chatbubble-ellipses-outline" onPress={() => Linking.openURL(club.kakao_link!)} />
      ) : null}

      <Text variant="label" style={{ marginTop: space.md }}>Upcoming events</Text>
      {events.length === 0 ? <Text variant="small">No upcoming events.</Text> : events.map((e) => (
        <Card key={e.id}>
          <Text variant="heading">{e.title}</Text>
          <Text variant="small">{formatKst(e.starts_at)} (Korea time)</Text>
          {e.location ? <Row><Icon name="location-outline" size={14} /><Text variant="small">{e.location}</Text></Row> : null}
          {e.description ? <Text variant="small" color="ink">{e.description}</Text> : null}
          <Button title="Add to Google Calendar" variant="ghost" icon="calendar-outline" onPress={() => Linking.openURL(googleCalendarLink(e, club.name))} />
        </Card>
      ))}
    </Screen>
  );
}
