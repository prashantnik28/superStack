import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  DeviceEventEmitter,
  Modal,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "../../../src/context/ThemeContext";
import { useFamilyStore } from "../../../src/stores/useFamilyStore";
import { useNotificationsStore } from "../../../src/stores/useNotificationsStore";
import { useCalendarStore } from "../../../src/stores/useCalendarStore";
import GlassCard from "../../../src/components/ui/GlassCard";
import StatusBadge from "../../../src/components/ui/StatusBadge";
import { LinearGradient } from "expo-linear-gradient";

const PAD = 16;

const GLANCE = [
  // ── Daily Routines ──────────────────────────────────────────────
  {
    id: "r1",
    type: "routine",
    label: "School Drop",
    icon: "bus",
    color: "#6C63FF",
    status: "done",
  },
  {
    id: "r2",
    type: "routine",
    label: "Homework",
    icon: "book",
    color: "#4CAF82",
    status: "done",
  },
  {
    id: "r3",
    type: "routine",
    label: "Healthy Meal",
    icon: "nutrition",
    color: "#FF6B9D",
    status: "done",
  },
  {
    id: "r4",
    type: "routine",
    label: "Exercise",
    icon: "barbell",
    color: "#FFB347",
    status: "in-progress",
  },
  {
    id: "r5",
    type: "routine",
    label: "Meds",
    icon: "medkit",
    color: "#26C6DA",
    status: "pending",
  },
  {
    id: "r6",
    type: "routine",
    label: "Bed Time",
    icon: "moon",
    color: "#9C27B0",
    status: "pending",
  },
  // ── Wellbeing ───────────────────────────────────────────────────
  {
    id: "w1",
    type: "wellbeing",
    label: "Family Check",
    icon: "heart",
    color: "#FF4081",
    status: "pending",
    route: "/(app)/wellbeing",
    time: "Tap to scan",
  },
  {
    id: "w2",
    type: "wellbeing",
    label: "Mood Log",
    icon: "happy",
    color: "#FF6B9D",
    status: "pending",
    route: "/(app)/wellbeing",
  },
  // ── Reminders ───────────────────────────────────────────────────
  {
    id: "m1",
    type: "reminder",
    label: "Call Mom",
    icon: "call",
    color: "#3B82F6",
    status: "pending",
    time: "2:00 PM",
  },
  {
    id: "m2",
    type: "reminder",
    label: "Pay Bills",
    icon: "card",
    color: "#FF6B6B",
    status: "pending",
    time: "5:00 PM",
  },
  {
    id: "m3",
    type: "reminder",
    label: "Grocery Run",
    icon: "cart",
    color: "#4CAF82",
    status: "pending",
    time: "6:30 PM",
  },
  // ── Expenses ────────────────────────────────────────────────────
  {
    id: "e1",
    type: "expense",
    label: "Log Expenses",
    icon: "wallet",
    color: "#4CAF82",
    status: "pending",
    route: "/(app)/expenses",
    time: "Daily",
  },
  // ── Upcoming Events ─────────────────────────────────────────────
  {
    id: "v1",
    type: "event",
    label: "Piano Class",
    icon: "musical-notes",
    color: "#9C27B0",
    status: "pending",
    route: "/(app)/calendar",
    time: "4:00 PM",
  },
  {
    id: "v2",
    type: "event",
    label: "Family Dinner",
    icon: "restaurant",
    color: "#FF6B9D",
    status: "pending",
    route: "/(app)/calendar",
    time: "7:30 PM",
  },
  {
    id: "v3",
    type: "event",
    label: "Doctor Visit",
    icon: "medical",
    color: "#FF6B6B",
    status: "pending",
    route: "/(app)/calendar",
    time: "Tomorrow",
  },
  // ── Notifications ───────────────────────────────────────────────
  {
    id: "n1",
    type: "notif",
    label: "Notifications",
    icon: "notifications",
    color: "#6C63FF",
    status: "pending",
    route: "/(app)/notifications",
  },
];

const UPDATES = [
  {
    id: "1",
    name: "Aarav",
    color: "#6C63FF",
    activity: "At School",
    place: "St. Joseph School",
    time: "8:40 AM",
    gender: "male",
  },
  {
    id: "2",
    name: "Myra",
    color: "#FF6B9D",
    activity: "At Activity",
    place: "Dance Class",
    time: "10:15 AM",
    gender: "female",
  },
];

const QUICK_SERVICES = [
  {
    name: "Well-being",
    icon: "heart",
    color: "#FF6B9D",
    sub: "2 members tracked",
    route: "/(app)/wellbeing",
  },
  {
    name: "Wardrobe",
    icon: "shirt",
    color: "#6C63FF",
    sub: "6 items synced",
    route: "/(app)/wardrobe",
  },
  {
    name: "Kitchen",
    icon: "restaurant",
    color: "#FFB347",
    sub: "3 items expiring",
    route: "/(app)/kitchen",
  },
];

function spr(anim, toValue) {
  return Animated.spring(anim, {
    toValue,
    tension: 280,
    friction: 10,
    useNativeDriver: true,
  });
}

function MemberBubble({ member, colors, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isHome = member.status === "At Home";
  const statusColor = isHome ? "#4CAF82" : "#FFB347";
  return (
    <Animated.View style={[styles.memberWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPressIn={() => spr(scale, 0.88).start()}
        onPressOut={() => spr(scale, 1).start()}
        onPress={onPress}
        activeOpacity={1}
      >
        <View style={[styles.memberAvatarOuter, { borderColor: statusColor }]}>
          <View
            style={[styles.memberAvatar, { backgroundColor: member.color }]}
          >
            {member.role === 'child' && member.emoji
              ? <Text style={{ fontSize: 18 }}>{member.emoji}</Text>
              : <Text style={styles.memberInitial}>{member.name[0]}</Text>}
          </View>
          <View
            style={[styles.memberStatusDot, { backgroundColor: statusColor }]}
          />
        </View>
      </TouchableOpacity>
      <Text style={[styles.memberName, { color: colors.textPrimary }]}>
        {member.name}
        {member.age != null ? (
          <Text style={{ color: colors.textSecondary, fontWeight: "500" }}>
            {" "}
            {member.age}y
          </Text>
        ) : null}
      </Text>
    </Animated.View>
  );
}

// ── Marquee text (scrolls left→right when title overflows) ───────────────────
function MarqueeText({ text, style, containerWidth }) {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [fullWidth, setFullWidth] = useState(0);
  const needsScroll = fullWidth > containerWidth;

  useEffect(() => {
    if (!needsScroll) {
      scrollAnim.setValue(0);
      return;
    }
    if (!fullWidth || !containerWidth) return;
    const dist = fullWidth - containerWidth + 6;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(scrollAnim, {
          toValue: -dist,
          duration: dist * 28,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.delay(500),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [needsScroll, fullWidth, containerWidth]);

  return (
    <View style={{ width: containerWidth, overflow: "hidden" }}>
      {/* invisible measurer — alignSelf flex-start lets it render at natural text width */}
      <Text
        style={[
          style,
          { position: "absolute", opacity: 0, alignSelf: "flex-start" },
        ]}
        onLayout={(e) => setFullWidth(e.nativeEvent.layout.width)}
      >
        {text}
      </Text>
      <Animated.Text
        style={[
          style,
          needsScroll ? { transform: [{ translateX: scrollAnim }] } : {},
        ]}
        numberOfLines={1}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

// ── Relative time label for glance items ──────────────────────────────────────
function glanceTimeLabel(item) {
  // Real calendar event — compare date to today/yesterday/tomorrow
  if (
    item.month !== undefined &&
    item.year !== undefined &&
    item.date !== undefined
  ) {
    const now = new Date();
    const itemDay = new Date(item.year, item.month, item.date);
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((itemDay - todayDay) / 86400000);
    if (diffDays === -1) return "Yesterday";
    if (diffDays === 0) return item.time || "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1)
      return itemDay.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    return item.time || null;
  }
  // Mock fallback
  return item.time || null;
}

// ── Glance Action Modal ───────────────────────────────────────────────────────
const SNOOZE_OPTIONS = [
  { label: "10 min", minutes: 10 },
  { label: "20 min", minutes: 20 },
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "2 hr", minutes: 120 },
];

function GlanceActionModal({ item, onClose, colors, isDark }) {
  const { markComplete, snoozeItem } = useCalendarStore();
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  const bg = isDark ? "#0E0E1F" : "#FFFFFF";
  const handleColor = isDark ? "rgba(255,255,255,0.15)" : "#D0D0E8";
  const isPhone = !!item.phoneNumber;

  const onComplete = async () => {
    setBusy(true);
    await markComplete(item.id);
    setBusy(false);
    onClose();
  };

  const onSnooze = async (minutes) => {
    setBusy(true);
    await snoozeItem(item.id, minutes);
    setBusy(false);
    onClose();
  };

  const onCall = () => {
    Linking.openURL(`tel:${item.phoneNumber}`);
    onClose();
  };

  return (
    <Modal
      visible={!!item}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.modalSheet, { backgroundColor: bg }]}>
        <View style={[styles.modalHandle, { backgroundColor: handleColor }]} />

        {/* Item header */}
        <View style={styles.modalHeader}>
          <View
            style={[
              styles.modalIconBox,
              { backgroundColor: item.color, borderRadius: 12 },
            ]}
          >
            <Ionicons name={item.icon} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
            {item.description ? (
              <Text
                style={[styles.modalSub, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Mark complete */}
        {!item.completed && (
          <TouchableOpacity
            style={[styles.modalCompleteBtn, { backgroundColor: "#4CAF82" }]}
            onPress={onComplete}
            disabled={busy}
            activeOpacity={0.82}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.modalCompleteTxt}>Mark as Done</Text>
          </TouchableOpacity>
        )}

        {/* Phone call */}
        {isPhone && (
          <TouchableOpacity
            style={[
              styles.modalCompleteBtn,
              { backgroundColor: "#3B82F6", marginTop: item.completed ? 0 : 8 },
            ]}
            onPress={onCall}
            activeOpacity={0.82}
          >
            <Ionicons name="call-outline" size={18} color="#fff" />
            <Text style={styles.modalCompleteTxt}>
              Call {item.title.replace("Call ", "")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Snooze */}
        {!item.completed && (
          <>
            <Text
              style={[styles.modalSnoozeLabel, { color: colors.textSecondary }]}
            >
              Remind me in…
            </Text>
            <View style={styles.modalSnoozeRow}>
              {SNOOZE_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.minutes}
                  style={[
                    styles.modalSnoozeChip,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.05)",
                      borderColor: item.color + "40",
                    },
                  ]}
                  onPress={() => onSnooze(s.minutes)}
                  disabled={busy}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.modalSnoozeChipTxt, { color: item.color }]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: Platform.OS === "ios" ? 24 : 12 }} />
      </View>
    </Modal>
  );
}

export default function Overview() {
  const { colors, isDark, radius } = useTheme();
  const { members, dependents, fetchFamily } = useFamilyStore();
  const { unreadCount } = useNotificationsStore();
  const { todayGlance, fetchTodayGlance } = useCalendarStore();
  const allPeople = [...members, ...dependents];
  const atHome = allPeople.filter((m) => m.status === "At Home").length;
  const totalCount = allPeople.length;

  // Merge real API data over mock fallback — real data wins when available
  const rawGlance = todayGlance.length > 0 ? todayGlance : GLANCE;
  // incomplete first, completed pushed to end
  const glanceItems = [
    ...rawGlance.filter((g) => !(g.completed || g.status === "done")),
    ...rawGlance.filter((g) => g.completed || g.status === "done"),
  ];
  const routines = glanceItems.filter((g) => g.type === "routine");
  const tasksDone = routines.filter(
    (g) => g.completed || g.status === "done",
  ).length;

  const [activeGlanceItem, setActiveGlanceItem] = useState(null);
  const { width: screenW } = useWindowDimensions();
  const glanceItemW = Math.floor((screenW - 2 * PAD - 20) / 5.2);
  const mountAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pullReady, setPullReady] = useState(false);
  const [topInset, setTopInset] = useState(0);
  const pullReadyRef = useRef(false);
  const refreshingRef = useRef(false);
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const PTR_H = 72;
  const PTR_THRESHOLD = 68;

  const cctvPlayer = useVideoPlayer(
    require("../../../assets/cctvfootages/cctv3.mp4"),
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    },
  );

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    fetchTodayGlance();
    fetchFamily();
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("scrollToTop", () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => sub.remove();
  }, []);

  const fmtLastUpdated = (d) => {
    const now = new Date();
    const hhmm = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const day = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `Last update:${day} ${hhmm}`;
  };

  const onRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    setPullReady(false);
    pullReadyRef.current = false;
    Animated.spring(arrowAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
    // Pin header natively via contentInset (no JS-thread animation)
    setTopInset(PTR_H);
    setTimeout(() => scrollRef.current?.scrollTo({ y: -PTR_H, animated: true }), 16);
    await fetchTodayGlance();
    setLastUpdated(new Date());
    // Scroll back then remove inset
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => {
      setTopInset(0);
      setRefreshing(false);
      refreshingRef.current = false;
    }, 380);
  }, []);

  const handleScroll = useCallback((e) => {
    if (refreshingRef.current) return;
    const pull = -e.nativeEvent.contentOffset.y;
    if (pull >= PTR_THRESHOLD && !pullReadyRef.current) {
      pullReadyRef.current = true;
      setPullReady(true);
      Animated.spring(arrowAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
    } else if (pull < PTR_THRESHOLD && pullReadyRef.current) {
      pullReadyRef.current = false;
      setPullReady(false);
      Animated.spring(arrowAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }).start();
    }
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    if (refreshingRef.current) return;
    if (pullReadyRef.current) {
      onRefresh();
    } else {
      pullReadyRef.current = false;
      setPullReady(false);
      Animated.spring(arrowAnim, { toValue: 0, useNativeDriver: true, tension: 160, friction: 14 }).start();
    }
  }, [onRefresh]);

  const divColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      onScrollEndDrag={handleScrollEndDrag}
      contentInset={{ top: topInset }}
      contentOffset={{ x: 0, y: -topInset }}
    >
      {/* ── Custom pull-to-refresh header — sits at marginTop:-PTR_H, revealed by iOS bounce/contentInset ── */}
      <View style={styles.ptrHeader}>
        <Animated.View style={{ transform: [{ rotate: arrowAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
          <Ionicons name="arrow-down" size={18} color="#000" />
        </Animated.View>
        <View style={{ gap: 3 }}>
          <Text style={styles.ptrTitle}>
            {refreshing ? 'Refreshing...' : pullReady ? 'Release to refresh' : 'Pull down to refresh'}
          </Text>
          <Text style={styles.ptrSub}>{fmtLastUpdated(lastUpdated)}</Text>
        </View>
      </View>

      <Animated.View
        style={{
          opacity: mountAnim,
          transform: [
            {
              translateY: mountAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
          gap: 16,
        }}
      >
        {/* ── Family Card ── */}
        <GlassCard style={styles.familyCard}>
          <View style={styles.familyTopRow}>
            {/* Left: scrollable members with right-edge fade */}
            <View style={styles.familyScrollRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.membersScroll}
              >
                {allPeople.length === 0 ? (
                  <TouchableOpacity
                    onPress={() => router.push('/(app)/overview/family')}
                    activeOpacity={0.7}
                    style={{ justifyContent: 'center', paddingVertical: 8, paddingLeft: 4 }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Tap to set up your family →</Text>
                  </TouchableOpacity>
                ) : (
                  allPeople.map((m) => (
                    <MemberBubble
                      key={m.id}
                      member={m}
                      colors={colors}
                      onPress={() =>
                        router.push(`/(app)/overview/member/${m.id}`)
                      }
                    />
                  ))
                )}
              </ScrollView>
              <LinearGradient
                colors={
                  isDark
                    ? ["rgba(18,12,32,0)", "rgba(18,12,32,0.95)"]
                    : ["rgba(255,255,255,0)", "rgba(255,255,255,0.95)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.membersFade}
                pointerEvents="none"
              />
            </View>

            {/* Right: Family label + count + arrow */}
            <TouchableOpacity
              style={styles.familyRight}
              onPress={() => router.push("/(app)/overview/family")}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.familyTitle, { color: colors.textPrimary }]}
                >
                  Family
                </Text>
                <Text
                  style={[styles.familyCount, { color: colors.textSecondary }]}
                >
                  {totalCount} Member{totalCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={[styles.statsStrip, { borderTopColor: divColor }]}>
            {[
              {
                icon: "home-outline",
                value: String(atHome),
                label: "At Home",
                color: "#4CAF82",
              },
              {
                icon: "navigate-outline",
                value: String(totalCount - atHome),
                label: "Away",
                color: "#FFB347",
              },
              {
                icon: "checkmark-done-outline",
                value: `${tasksDone}/${GLANCE.length}`,
                label: "Tasks",
                color: "#6C63FF",
              },
              {
                icon: "notifications-outline",
                value: String(unreadCount > 0 ? unreadCount : 0),
                label: "Alerts",
                color: "#FF6B9D",
              },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && (
                  <View
                    style={[styles.stripSep, { backgroundColor: divColor }]}
                  />
                )}
                <View style={styles.stripItem}>
                  <Ionicons name={s.icon} size={14} color={s.color} />
                  <Text
                    style={[styles.stripValue, { color: colors.textPrimary }]}
                  >
                    {s.value}{" "}
                    <Text
                      style={[
                        styles.stripLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </GlassCard>

        {/* ── Today at a Glance ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              TODAY AT A GLANCE
            </Text>
          </View>
          <GlassCard style={styles.glanceCard}>
            {/* Items */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.glanceItems}
            >
              {glanceItems.map((item) => {
                const isDone = item.completed || item.status === "done";
                const isWip = item.status === "in-progress";
                const hasRoute = !!item.route;
                const timeLabel = glanceTimeLabel(item);
                const title = item.title || item.label || "";
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.glanceItem, { width: glanceItemW }]}
                    activeOpacity={0.72}
                    onPress={() => {
                      if (
                        hasRoute &&
                        ["wellbeing", "event", "expense", "notif"].includes(
                          item.type,
                        )
                      ) {
                        router.push(item.route);
                      } else {
                        setActiveGlanceItem(item);
                      }
                    }}
                  >
                    {/* Icon box — original colour always, badges overlay */}
                    <View
                      style={[
                        styles.glanceIconBox,
                        {
                          backgroundColor: item.color,
                          borderRadius: radius + 2,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon || "calendar"}
                        size={17}
                        color="#fff"
                      />
                      {isDone && (
                        <View style={styles.glanceDoneBadge}>
                          <Ionicons
                            name="checkmark-done"
                            size={8}
                            color="#fff"
                          />
                        </View>
                      )}
                      {isWip && !isDone && (
                        <View style={styles.glanceWipDot}>
                          <Ionicons
                            name="ellipsis-horizontal"
                            size={7}
                            color="#fff"
                          />
                        </View>
                      )}
                      {hasRoute && !isDone && (
                        <View
                          style={[
                            styles.glanceLinkDot,
                            { backgroundColor: item.color },
                          ]}
                        >
                          <Ionicons
                            name="arrow-forward"
                            size={6}
                            color="#fff"
                          />
                        </View>
                      )}
                    </View>

                    {/* Marquee title */}
                    <MarqueeText
                      text={title}
                      containerWidth={glanceItemW - 4}
                      style={[
                        styles.glanceLabel,
                        {
                          color: isDone
                            ? colors.textSecondary
                            : colors.textPrimary,
                        },
                      ]}
                    />

                    {timeLabel ? (
                      <Text
                        style={[
                          styles.glanceTime,
                          {
                            color:
                              item.type === "event"
                                ? item.color
                                : colors.textSecondary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {timeLabel}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {/* Progress bar — flush to bottom edge, no side padding */}
            <View
              style={[
                styles.glanceProgressTrack,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              <LinearGradient
                colors={["#6C63FF", "#FF6B9D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.glanceProgressFill,
                  { width: `${(tasksDone / routines.length) * 100}%` },
                ]}
              />
            </View>
          </GlassCard>
        </View>

        {/* ── Subscribed Services — Bento Card ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              SUBSCRIBED SERVICES
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: colors.primary }]}>
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.bentoWrap}>
            {/* ── Top block: redesigned ── */}
            <View style={{ gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 }}>

              {/* Row 1: CCTV + Kitchen/Tracking */}
              <View style={{ flexDirection: "row", gap: 8, height: 148 }}>

                {/* CCTV */}
                <TouchableOpacity style={{ flex: 1.2, borderRadius: radius, overflow: "hidden", backgroundColor: "#000" }}
                  onPress={() => router.push("/(app)/cctv")} activeOpacity={0.9}>
                  <VideoView player={cctvPlayer} style={StyleSheet.absoluteFillObject} contentFit="cover" nativeControls={false} />
                  {/* top scrim for badge legibility */}
                  <LinearGradient colors={["rgba(0,0,0,0.45)", "transparent"]}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44 }} />
                  {/* bottom scrim */}
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.72)"]}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60 }} />
                  {/* LIVE badge */}
                  <View style={{ position: "absolute", top: 9, left: 9, flexDirection: "row", alignItems: "center", gap: 4,
                    backgroundColor: "rgba(0,0,0,0.52)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#4CAF82" }} />
                    <Text style={{ color: "#4CAF82", fontSize: 8, fontWeight: "800", letterSpacing: 0.8 }}>LIVE</Text>
                  </View>
                  {/* Camera count badge top-right */}
                  <View style={{ position: "absolute", top: 9, right: 9, flexDirection: "row", alignItems: "center", gap: 3,
                    backgroundColor: "rgba(108,99,255,0.85)", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999 }}>
                    <Ionicons name="videocam" size={9} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 8, fontWeight: "800" }}>3</Text>
                  </View>
                  {/* Bottom info */}
                  <View style={{ position: "absolute", bottom: 10, left: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>CCTV</Text>
                      <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, fontWeight: "500" }}>3 cameras · Live</Text>
                    </View>
                    <View style={{ backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 }}>
                      <Text style={{ color: "#fff", fontSize: 8, fontWeight: "700" }}>View →</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Right: Kitchen + Tracking stacked */}
                <View style={{ flex: 1, gap: 8 }}>
                  {/* Kitchen */}
                  <TouchableOpacity style={{ flex: 1, borderRadius: radius, overflow: "hidden" }}
                    onPress={() => router.push("/(app)/kitchen")} activeOpacity={0.85}>
                    <LinearGradient colors={["#FF9F4A", "#FF6B35"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ flex: 1, padding: 10, justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 7.5, fontWeight: "700", letterSpacing: 0.6 }}>KITCHEN</Text>
                        <Ionicons name="restaurant" size={13} color="rgba(255,255,255,0.85)" />
                      </View>
                      <View>
                        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 28, letterSpacing: -1, lineHeight: 30 }}>3</Text>
                        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 8.5, fontWeight: "600" }}>expiring soon</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Tracking */}
                  <TouchableOpacity style={{ flex: 1, borderRadius: radius, overflow: "hidden" }}
                    onPress={() => router.push("/(app)/tracking")} activeOpacity={0.85}>
                    <LinearGradient colors={["#4B8EF8", "#6C63FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ flex: 1, padding: 10, justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 7.5, fontWeight: "700", letterSpacing: 0.6 }}>TRACKING</Text>
                        <Ionicons name="navigate-circle" size={13} color="rgba(255,255,255,0.85)" />
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 5 }}>
                        <View>
                          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 28, letterSpacing: -1, lineHeight: 30 }}>2</Text>
                          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 8.5, fontWeight: "600" }}>active devices</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 3, paddingBottom: 5 }}>
                          {[0, 1].map((i) => (
                            <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#fff", opacity: i === 0 ? 1 : 0.4 }} />
                          ))}
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Row 2: Expenses — full width */}
              <TouchableOpacity style={{ borderRadius: radius, overflow: "hidden" }}
                onPress={() => router.push("/(app)/expenses")} activeOpacity={0.85}>
                <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 11 }}>
                  <View style={{ width: 38, height: 38, borderRadius: radius + 2, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="wallet" size={17} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 8.5, fontWeight: "700", letterSpacing: 0.6 }}>EXPENSES</Text>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 20, letterSpacing: -0.5, lineHeight: 22 }}>₹45,230</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, fontWeight: "600" }}>75% of budget</Text>
                    <View style={{ width: 64, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }}>
                      <View style={{ height: "100%", width: "75%", borderRadius: 2, backgroundColor: "#fff" }} />
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ── Bottom shelf: gradient icon tiles, one full row ── */}
            <View
              style={[
                styles.bentoShelf,
                {
                  borderTopColor: isDark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(0,0,0,0.06)",
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.025)",
                },
              ]}
            >
              {[
                {
                  name: "Wellbeing",
                  icon: "heart",
                  g: ["#FF6B9D", "#FF4081"],
                  route: "/(app)/wellbeing",
                  active: true,
                },
                {
                  name: "Wardrobe",
                  icon: "shirt",
                  g: ["#8B5CF6", "#6C63FF"],
                  route: "/(app)/wardrobe",
                  active: true,
                },
                {
                  name: "Calendar",
                  icon: "calendar",
                  g: ["#F59E0B", "#FBBF24"],
                  route: "/(app)/calendar",
                  active: true,
                },
                {
                  name: "Fitness",
                  icon: "barbell",
                  g: ["#FB923C", "#F97316"],
                  route: null,
                  active: false,
                },
                {
                  name: "Grocery",
                  icon: "cart",
                  g: ["#4CAF82", "#22C55E"],
                  route: null,
                  active: false,
                },
                {
                  name: "Laundry",
                  icon: "water",
                  g: ["#06B6D4", "#0EA5E9"],
                  route: null,
                  active: false,
                },
              ].map((s) => (
                <TouchableOpacity
                  key={s.name}
                  style={styles.iconTile}
                  onPress={() => s.route && router.push(s.route)}
                  activeOpacity={s.active ? 0.75 : 1}
                >
                  <LinearGradient
                    colors={s.active ? s.g : ["#C4C4C4", "#9CA3AF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.iconTileBox, { borderRadius: radius }]}
                  >
                    <Ionicons name={s.icon} size={16} color="#fff" />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.iconTileName,
                      {
                        color: s.active
                          ? colors.textPrimary
                          : colors.textSecondary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* ── Safety Banner ── */}
        <GlassCard style={styles.safetyCard}>
          <View
            style={[
              styles.safetyIcon,
              { backgroundColor: "#4CAF82", borderRadius: radius },
            ]}
          >
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.safetyTitle, { color: colors.textPrimary }]}>
              Your Home is Safe
            </Text>
            <Text style={[styles.safetySub, { color: colors.textSecondary }]}>
              All systems working fine.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.safetyBtn, { borderRadius: radius }]}
            onPress={() => router.push("/(app)/wellbeing")}
          >
            <Text style={styles.safetyBtnTxt}>View</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* ── Children Updates ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              CHILDREN UPDATES
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(app)/overview/children")}
            >
              <Text style={[styles.viewAll, { color: colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.updatesCard}>
            {UPDATES.map((u, i) => (
              <View key={u.id}>
                <View style={styles.updateRow}>
                  <View
                    style={[styles.updateAvatar, { backgroundColor: u.color }]}
                  >
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.updateNameRow}>
                      <Text
                        style={[
                          styles.updateName,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {u.name}
                      </Text>
                      <View
                        style={[
                          styles.activityChip,
                          { backgroundColor: u.color },
                        ]}
                      >
                        <Text style={styles.activityChipTxt}>{u.activity}</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.updatePlace,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {u.place}
                    </Text>
                    <Text
                      style={[
                        styles.updateTime,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {u.time}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.locationBtn,
                      { backgroundColor: colors.primary, borderRadius: radius },
                    ]}
                  >
                    <Ionicons name="location" size={13} color="#fff" />
                  </View>
                </View>
                {i < UPDATES.length - 1 && (
                  <View
                    style={[styles.divider, { backgroundColor: divColor }]}
                  />
                )}
              </View>
            ))}
          </GlassCard>
        </View>

        {/* ── Services ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            SERVICES
          </Text>
          <View style={{ gap: 8 }}>
            {QUICK_SERVICES.map((s) => (
              <TouchableOpacity
                key={s.name}
                onPress={() => router.push(s.route)}
                activeOpacity={0.85}
              >
                <GlassCard style={styles.serviceRow}>
                  <View
                    style={[
                      styles.svcIcon,
                      { backgroundColor: s.color, borderRadius: radius },
                    ]}
                  >
                    <Ionicons name={s.icon} size={17} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.svcName, { color: colors.textPrimary }]}
                    >
                      {s.name}
                    </Text>
                    <Text
                      style={[styles.svcSub, { color: colors.textSecondary }]}
                    >
                      {s.sub}
                    </Text>
                  </View>
                  <StatusBadge label="Active" status="active" />
                  <Ionicons
                    name="chevron-forward"
                    size={13}
                    color={colors.textSecondary}
                  />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 8 }} />
      </Animated.View>

      <GlanceActionModal
        item={activeGlanceItem}
        onClose={() => setActiveGlanceItem(null)}
        colors={colors}
        isDark={isDark}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "transparent" },
  content: { padding: PAD, paddingBottom: 24 },

  ptrHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 72, marginTop: -72,
    justifyContent: 'center',
  },
  ptrTitle: { fontSize: 13, fontWeight: '500', color: '#000', textAlign: 'center' },
  ptrSub:   { fontSize: 11, color: '#000', opacity: 0.5, textAlign: 'center' },

  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: { fontSize: 12, fontWeight: "600" },

  familyCard: { overflow: "hidden" },
  familyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  familyScrollRow: { flex: 1, paddingLeft: 12 },
  membersScroll: { gap: 12, paddingVertical: 4 },
  membersFade: { position: "absolute", right: 0, top: 0, bottom: 0, width: 50 },
  familyRight: {
    flexDirection: "row",
    alignItems: "center",
    width: 90,
    paddingRight: 12,
    paddingLeft: 4,
    gap: 4,
  },
  familyTitle: { fontSize: 13, fontWeight: "700" },
  familyCount: { fontSize: 10, fontWeight: "500" },
  memberWrap: { alignItems: "center", gap: 5, width: 54 },
  memberAvatarOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  memberInitial: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  memberStatusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  memberName: { fontSize: 10.5, fontWeight: "600", textAlign: "center" },

  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 0.5,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  stripItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  stripValue: { fontSize: 11, fontWeight: "800" },
  stripLabel: { fontSize: 10, fontWeight: "500" },
  stripSep: { width: 0.5, height: 16 },

  glancePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  glancePillTxt: { fontSize: 11, fontWeight: "700" },
  glanceCard: {
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 0,
    gap: 6,
  },
  glanceProgressTrack: {
    height: 3,
    overflow: "hidden",
    marginTop: 6,
    marginHorizontal: -12,
  },
  glanceProgressFill: { height: 3 },
  glanceItems: { flexDirection: "row", gap: 2, paddingBottom: 2 },
  glanceItem: {
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
    gap: 4,
  },
  glanceIconBox: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  glanceDoneBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#4CAF82",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  glanceWipDot: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF8C00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  glanceLinkDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  glanceLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 13,
  },
  glanceTime: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
    marginTop: -2,
  },

  // Glance action modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    gap: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  modalIconBox: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  modalSub: { fontSize: 12, marginTop: 2 },
  modalCompleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalCompleteTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalSnoozeLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  modalSnoozeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalSnoozeChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  modalSnoozeChipTxt: { fontSize: 13, fontWeight: "700" },

  bentoWrap: { padding: 0, overflow: "hidden" },
  bentoTopBlock: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  bentoCCTV: { flex: 3, height: 128 },
  bentoRightCol: { flex: 2, gap: 6 },
  bentoRightRow: { flex: 1, flexDirection: "row", gap: 6 },
  bentoCell: { padding: 8, gap: 4 },
  bentoExpenses: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    padding: 8,
  },
  bentoCellTitle: { fontSize: 10, fontWeight: "700" },
  bentoCellSub: { fontSize: 9, fontWeight: "500" },
  bentoCellMetric: { fontSize: 10, fontWeight: "800" },
  bentoCellIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bentoLive: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#4CAF82",
  },
  liveTxt: {
    fontSize: 7.5,
    fontWeight: "800",
    color: "#4CAF82",
    letterSpacing: 0.8,
  },
  cctvBottomOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cctvIconBadge: {
    width: 22,
    height: 22,
    backgroundColor: "rgba(108,99,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  bentoShelf: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  iconTile: { flex: 1, alignItems: "center", gap: 4 },
  iconTileBox: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTileName: { fontSize: 8.5, fontWeight: "600", textAlign: "center" },

  safetyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  safetyIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyTitle: { fontSize: 13, fontWeight: "700" },
  safetySub: { fontSize: 12, marginTop: 1 },
  safetyBtn: {
    backgroundColor: "#4CAF82",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  safetyBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "600" },

  updatesCard: { padding: 12, gap: 10 },
  updateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  updateAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  updateNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  updateName: { fontSize: 13, fontWeight: "600" },
  activityChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  activityChipTxt: { fontSize: 11, fontWeight: "600", color: "#fff" },
  updatePlace: { fontSize: 12 },
  updateTime: { fontSize: 11, marginTop: 1, opacity: 0.7 },
  locationBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 0.5, marginVertical: 8 },

  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    gap: 10,
  },
  svcIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  svcName: { fontSize: 13, fontWeight: "600" },
  svcSub: { fontSize: 12, marginTop: 1 },
});
