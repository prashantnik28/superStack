import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useTheme } from "../../src/context/ThemeContext";
import { useServiceStore } from "../../src/stores/useServiceStore";
import { useFamilyStore } from "../../src/stores/useFamilyStore";
import { useAuthStore } from "../../src/stores/useAuthStore";
import { usePantryStore } from "../../src/stores/usePantryStore";
import { useCalendarStore } from "../../src/stores/useCalendarStore";
import { useNotificationsStore } from "../../src/stores/useNotificationsStore";
import api from "../../src/lib/api";
import AppBottomNav from "../../src/components/ui/AppBottomNav";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const DRAWER_W = SCREEN_W * 0.78;
const MAX_PANEL_H = Math.round(SCREEN_H * 0.82);

const SERVICE_MAP = {
  wardrobe: "wardrobe",
  kitchen: "kitchen",
  calendar: "calendar",
  profile: "profile",
};

function getService(pathname) {
  for (const key of Object.keys(SERVICE_MAP)) {
    if (pathname.includes(`/${key}`)) return key;
  }
  return "overview";
}

const NAV_BASE = [
  {
    label: "Home",
    icon: "grid",
    iconOff: "grid-outline",
    route: "/(app)/overview",
  },
  {
    label: "Calendar",
    icon: "calendar",
    iconOff: "calendar-outline",
    route: "/(app)/calendar",
  },
  { center: true },
  {
    label: "Services",
    icon: "apps",
    iconOff: "apps-outline",
    route: "/(app)/services",
  },
  {
    label: "Profile",
    icon: "person-circle",
    iconOff: "person-circle-outline",
    route: "/(app)/profile",
  },
];

const NAV = {
  overview: NAV_BASE,
  calendar: NAV_BASE,
  profile: NAV_BASE,
  wardrobe: [
    {
      label: "Closet",
      icon: "shirt",
      iconOff: "shirt-outline",
      route: "/(app)/wardrobe",
    },
    {
      label: "Add Item",
      icon: "add-circle",
      iconOff: "add-circle-outline",
      route: "/(app)/wardrobe/add-item",
    },
    {
      label: "Outfits",
      icon: "sparkles",
      iconOff: "sparkles-outline",
      route: "/(app)/wardrobe/suggestions",
    },
  ],
  kitchen: [
    {
      label: "Pantry",
      icon: "grid",
      iconOff: "grid-outline",
      route: "/(app)/kitchen",
    },
    {
      label: "Expiry",
      icon: "time",
      iconOff: "time-outline",
      route: "/(app)/kitchen",
    },
    {
      label: "Scan",
      icon: "barcode",
      iconOff: "barcode-outline",
      center: true,
      route: "/(app)/kitchen/scan",
    },
    {
      label: "Shop",
      icon: "cart",
      iconOff: "cart-outline",
      route: "/(app)/kitchen",
    },
    {
      label: "Meals",
      icon: "restaurant",
      iconOff: "restaurant-outline",
      route: "/(app)/kitchen",
    },
  ],
};

const SERVICE_COLORS = {
  wardrobe: "#6C63FF",
  kitchen: "#FFB347",
  calendar: "#4CAF82",
};

const ALL_SERVICES = [
  {
    id: "wardrobe",
    name: "Wardrobe",
    icon: "shirt",
    color: "#6C63FF",
    route: "/(app)/wardrobe",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    icon: "restaurant",
    color: "#FFB347",
    route: "/(app)/kitchen",
  },
  {
    id: "cctv",
    name: "CCTV",
    icon: "videocam",
    color: "#6C63FF",
    route: "/(app)/cctv",
  },
  {
    id: "tracking",
    name: "Tracking",
    icon: "navigate-circle",
    color: "#3B82F6",
    route: "/(app)/tracking",
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: "calendar",
    color: "#4CAF82",
    route: "/(app)/calendar",
  },
  {
    id: "wellbeing",
    name: "Well-being",
    icon: "heart",
    color: "#FF6B9D",
    route: "/(app)/wellbeing",
  },
  {
    id: "laundry",
    name: "Laundry",
    icon: "water",
    color: "#06B6D4",
    route: null,
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    icon: "medkit",
    color: "#EF4444",
    route: null,
  },
  {
    id: "sweethome",
    name: "Home Hub",
    icon: "home",
    color: "#8B5CF6",
    route: null,
  },
  {
    id: "fitness",
    name: "Fitness",
    icon: "barbell",
    color: "#F59E0B",
    route: null,
  },
  {
    id: "expenses",
    name: "Expenses",
    icon: "wallet",
    color: "#10B981",
    route: "/(app)/expenses",
  },
];

// ── Glass blur helper ──────────────────────────────────────────────────────────
function GlassLayer({ isDark, intensityMult = 1 }) {
  if (Platform.OS !== "ios") return null;
  return (
    <>
      <BlurView
        intensity={
          isDark
            ? Math.round(32 * intensityMult)
            : Math.round(22 * intensityMult)
        }
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(10,6,24,0.52)"
              : "rgba(246,247,252,0.75)",
          },
        ]}
      />
    </>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────────────────────────
function BottomNav({ pathname, isDark, colors, onPressCenter }) {
  const service     = getService(pathname);
  const tabs        = NAV[service] || NAV.overview;
  const accentColor = SERVICE_COLORS[service] || colors.primary;

  const ROOT_ROUTES = ["/overview", "/wellbeing", "/wardrobe", "/kitchen", "/calendar", "/profile", "/services"];
  const isActive = (tab) => {
    const clean = tab.route.replace("/(app)", "");
    if (pathname === clean) return true;
    if (ROOT_ROUTES.includes(clean)) return false;
    return pathname.startsWith(clean);
  };

  const handlePress = (tab) => {
    if (isActive(tab)) DeviceEventEmitter.emit("scrollToTop", tab.route);
    else router.push(tab.route);
  };

  return (
    <AppBottomNav
      tabs={tabs}
      isActive={isActive}
      onPress={handlePress}
      onAdd={onPressCenter}
      isDark={isDark}
      accentColor={accentColor}
    />
  );
}

// ── Info Panel ─────────────────────────────────────────────────────────────────
const MEMBER_STATUS = [
  { status: "At Home", color: "#4CAF82", icon: "home" },
  { status: "At Office", color: "#3B82F6", icon: "business" },
  { status: "At School", color: "#FFB347", icon: "school" },
  { status: "At School", color: "#FFB347", icon: "school" },
];

const SUGGESTIONS = [
  {
    id: "barcode",
    icon: "barcode",
    color: "#FFB347",
    label: "Scan Barcode",
    desc: "Add to grocery",
    route: "/(app)/kitchen/scan",
  },
  {
    id: "grocery",
    icon: "cart",
    color: "#4CAF82",
    label: "Add Grocery",
    desc: "Quick list update",
    route: "/(app)/kitchen/shopping",
  },
  {
    id: "reminder",
    icon: "alarm",
    color: "#6C63FF",
    label: "Reminder",
    desc: "Set family alert",
    route: "/(app)/calendar",
  },
  {
    id: "expiry",
    icon: "time",
    color: "#EF4444",
    label: "Expiry Check",
    desc: "Items expiring",
    route: "/(app)/kitchen/expiry",
  },
  {
    id: "report",
    icon: "stats-chart",
    color: "#FF6B9D",
    label: "Report",
    desc: "Weekly summary",
    route: "/(app)/wellbeing",
  },
  {
    id: "checkin",
    icon: "location",
    color: "#06B6D4",
    label: "Check In",
    desc: "Share location",
    route: "/(app)/wellbeing/tracking",
  },
];

const AI_SUGGESTIONS = [
  {
    id: 1,
    icon: "calendar",
    color: "#6C63FF",
    category: "Task",
    text: "Pick children from school today at 3:30 PM",
    action: "Add Task",
    route: "/(app)/calendar",
  },
  {
    id: 2,
    icon: "cart",
    color: "#4CAF82",
    category: "Grocery",
    text: "Milk is running low — reorder before Thursday",
    action: "Add Item",
    route: "/(app)/kitchen/shopping",
  },
  {
    id: 3,
    icon: "alarm",
    color: "#FFB347",
    category: "Reminder",
    text: "Aarav's football practice tomorrow at 4:00 PM",
    action: "Remind",
    route: "/(app)/calendar",
  },
  {
    id: 4,
    icon: "medkit",
    color: "#EF4444",
    category: "Health",
    text: "Myra's next doctor checkup is due this week",
    action: "Schedule",
    route: "/(app)/wellbeing",
  },
  {
    id: 5,
    icon: "sparkles",
    color: "#9C27B0",
    category: "Service",
    text: "Home cleaning is scheduled tomorrow at 10 AM",
    action: "View",
    route: "/(app)/services",
  },
  {
    id: 6,
    icon: "school",
    color: "#3B82F6",
    category: "School",
    text: "Annual day event on Friday — don't forget costumes",
    action: "Add Task",
    route: "/(app)/calendar",
  },
  {
    id: 7,
    icon: "wallet",
    color: "#10B981",
    category: "Finance",
    text: "Monthly grocery budget is 80% used with 10 days left",
    action: "View",
    route: "/(app)/expenses",
  },
  {
    id: 8,
    icon: "heart",
    color: "#FF6B9D",
    category: "Wellbeing",
    text: "No mood check-in from Rajan today — send a nudge",
    action: "Nudge",
    route: "/(app)/wellbeing",
  },
  {
    id: 9,
    icon: "time",
    color: "#F59E0B",
    category: "Expiry",
    text: "3 kitchen items expiring in 2 days — review now",
    action: "Check",
    route: "/(app)/kitchen/expiry",
  },
  {
    id: 10,
    icon: "navigate-circle",
    color: "#06B6D4",
    category: "Location",
    text: "Aarav arrived at school at 8:15 AM — all good",
    action: "Track",
    route: "/(app)/wellbeing/tracking",
  },
  {
    id: 11,
    icon: "shirt",
    color: "#8B5CF6",
    category: "Wardrobe",
    text: "Myra hasn't logged an outfit in 3 days — check wardrobe",
    action: "View",
    route: "/(app)/wardrobe",
  },
  {
    id: 12,
    icon: "barbell",
    color: "#F97316",
    category: "Fitness",
    text: "Family fitness goal is 60% complete this week — keep going!",
    action: "View",
    route: "/(app)/wellbeing",
  },
  {
    id: 13,
    icon: "water",
    color: "#0EA5E9",
    category: "Delivery",
    text: "Milk delivery arrives tomorrow at 7 AM — gate unlocked?",
    action: "Confirm",
    route: "/(app)/services",
  },
  {
    id: 14,
    icon: "restaurant",
    color: "#FF6B9D",
    category: "Meal",
    text: "Plan dinner for tonight — check pantry for ingredients",
    action: "Check",
    route: "/(app)/kitchen",
  },
  {
    id: 15,
    icon: "construct",
    color: "#DC2626",
    category: "Repair",
    text: "AC service is overdue — last serviced 8 months ago",
    action: "Schedule",
    route: "/(app)/services",
  },
];

const QUICK_ACTIONS = [
  {
    icon: "add-circle",
    label: "Add Task",
    color: "#6C63FF",
    route: "/(app)/calendar",
  },
  {
    icon: "scan",
    label: "Scan",
    color: "#FFB347",
    route: "/(app)/kitchen/scan",
  },
  {
    icon: "location",
    label: "Check In",
    color: "#4CAF82",
    route: "/(app)/wellbeing/tracking",
  },
  {
    icon: "calendar",
    label: "Schedule",
    color: "#FF6B9D",
    route: "/(app)/calendar",
  },
  {
    icon: "wallet",
    label: "Expense",
    color: "#10B981",
    route: "/(app)/expenses",
  },
  {
    icon: "heart",
    label: "Wellbeing",
    color: "#EF4444",
    route: "/(app)/wellbeing",
  },
];

function InfoPanel({ visible, onClose, insets }) {
  const { isDark, toggleTheme } = useTheme();
  const { members } = useFamilyStore();
  const { activeService, switchService } = useServiceStore();
  const slideY = useRef(new Animated.Value(-MAX_PANEL_H)).current;
  const panOffset = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const handlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (gs.dy < 0) panOffset.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < -70 || gs.vy < -0.5) onClose();
        else
          Animated.spring(panOffset, {
            toValue: 0,
            tension: 200,
            friction: 20,
            useNativeDriver: true,
          }).start();
      },
    }),
  ).current;

  React.useEffect(() => {
    if (visible) {
      panOffset.setValue(0);
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: -MAX_PANEL_H,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panelTranslate = Animated.add(slideY, panOffset);
  const txt = isDark ? "#F0EEFF" : "#16163A";
  const sub = isDark ? "#9CA3AF" : "#6B7280";
  const bdr = isDark ? "rgba(255,255,255,0.07)" : "rgba(108,99,255,0.09)";
  const navAndClose = (route) => {
    onClose();
    setTimeout(() => router.push(route), 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdropOpacity },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.infoPanel,
            {
              height: MAX_PANEL_H,
              backgroundColor: isDark ? "transparent" : "#FFFFFF",
              paddingTop: insets.top + 4,
              transform: [{ translateY: panelTranslate }],
            },
          ]}
        >
          {isDark && (
            <>
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(10,6,24,0.55)" },
                ]}
              />
            </>
          )}

          {/* drag handle */}
          <View style={styles.dragHandleArea} {...handlePan.panHandlers}>
            <View
              style={[
                styles.panelHandle,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(108,99,255,0.18)",
                },
              ]}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.panelContent}
            bounces={false}
          >
            {/* ── Header ── */}
            <View style={styles.panelHeaderRow}>
              <View
                style={[styles.panelLogoWrap, { backgroundColor: "#6C63FF" }]}
              >
                <Ionicons name="home" size={14} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
                >
                  <Text style={[styles.panelTitle, { color: txt }]}>
                    Family Hub
                  </Text>
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveTxt}>LIVE</Text>
                  </View>
                </View>
                <Text style={[styles.panelSubtitle, { color: sub }]}>
                  Sat, 16 May 2026 · 4 members active
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(108,99,255,0.10)",
                  },
                ]}
              >
                <Ionicons name="close" size={14} color={sub} />
              </TouchableOpacity>
            </View>

            {/* ── Stats single row ── */}
            <View
              style={[
                styles.statsBar,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.10)"
                    : "#F7F5FF",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(108,99,255,0.08)",
                },
              ]}
            >
              {[
                {
                  label: "Tasks",
                  value: "5/8",
                  icon: "checkmark-circle",
                  color: "#4CAF82",
                },
                {
                  label: "Expiring",
                  value: "3",
                  icon: "warning",
                  color: "#FFB347",
                },
                {
                  label: "Members",
                  value: `${members.length}`,
                  icon: "people",
                  color: "#6C63FF",
                },
                {
                  label: "Alerts",
                  value: "3",
                  icon: "notifications",
                  color: "#FF6B9D",
                },
              ].map((q, i, arr) => (
                <React.Fragment key={q.label}>
                  <View style={styles.statItem}>
                    <View
                      style={[styles.statIcon, { backgroundColor: q.color }]}
                    >
                      <Ionicons name={q.icon} size={13} color="#fff" />
                    </View>
                    <Text style={[styles.statVal, { color: q.color }]}>
                      {q.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: sub }]}>
                      {q.label}
                    </Text>
                  </View>
                  {i < arr.length - 1 && (
                    <View
                      style={[
                        styles.statDivider,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* ── Family Status ── */}
            <View style={styles.secRow}>
              <View style={[styles.secDot, { backgroundColor: "#4CAF82" }]} />
              <Text style={[styles.panelSec, { color: sub }]}>
                FAMILY STATUS
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
            >
              {members.map((m, idx) => {
                const ms = MEMBER_STATUS[idx % MEMBER_STATUS.length];
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(255,255,255,0.58)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.memberColorBar,
                        { backgroundColor: ms.color },
                      ]}
                    />
                    <View style={styles.memberCardInner}>
                      <View style={{ position: "relative" }}>
                        <View
                          style={[
                            styles.panelAvatar,
                            { backgroundColor: m.color },
                          ]}
                        >
                          <Text style={styles.panelAvatarTxt}>
                            {m.name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.onlineDot,
                            {
                              backgroundColor: ms.color,
                              borderColor: isDark ? "#0F0B1E" : "#fff",
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.panelMemberName, { color: txt }]}
                        numberOfLines={1}
                      >
                        {m.name.split(" ")[0]}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: ms.color + "1A" },
                        ]}
                      >
                        <Ionicons name={ms.icon} size={8} color={ms.color} />
                        <Text
                          style={[styles.statusPillTxt, { color: ms.color }]}
                        >
                          {ms.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* ── Suggested ── */}
            <View style={styles.secRow}>
              <View style={[styles.secDot, { backgroundColor: "#6C63FF" }]} />
              <Text style={[styles.panelSec, { color: sub }]}>
                SUGGESTED FOR YOU
              </Text>
              <View style={[styles.aiBadge, { backgroundColor: "#6C63FF" }]}>
                <Ionicons name="sparkles" size={9} color="#fff" />
                <Text style={styles.aiBadgeTxt}>AI</Text>
              </View>
            </View>

            {/* Run Family Scan — gradient card */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navAndClose("/(app)/wellbeing")}
              style={styles.scanCardWrap}
            >
              <LinearGradient
                colors={["#7C3AED", "#4F46E5", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scanCard}
              >
                <View
                  style={[
                    styles.scanIcon,
                    { backgroundColor: "rgba(255,255,255,0.18)" },
                  ]}
                >
                  <Ionicons name="scan-circle" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={styles.scanTitle}>Run Family Scan</Text>
                    <View style={styles.scanBadge}>
                      <Ionicons name="sparkles" size={8} color="#fff" />
                      <Text style={styles.scanBadgeTxt}>AI</Text>
                    </View>
                  </View>
                  <Text style={styles.scanDesc}>
                    Attendance · Location · Wellbeing · Grocery
                  </Text>
                  <View style={{ flexDirection: "row", gap: 5, marginTop: 7 }}>
                    {[
                      { icon: "school", label: "2 at school" },
                      { icon: "navigate", label: "All tracked" },
                      { icon: "heart", label: "Reports ok" },
                    ].map((chip) => (
                      <View key={chip.label} style={styles.scanChip}>
                        <Ionicons
                          name={chip.icon}
                          size={9}
                          color="rgba(255,255,255,0.9)"
                        />
                        <Text style={styles.scanChipTxt}>{chip.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.scanRunBtn}>
                  <Ionicons name="play" size={11} color="#4F46E5" />
                  <Text style={styles.scanRunTxt}>Scan</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Suggestion cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.suggestCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(255,255,255,0.58)",
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => navAndClose(s.route)}
                >
                  <View
                    style={[
                      styles.suggestTopLine,
                      { backgroundColor: s.color },
                    ]}
                  />
                  <View style={styles.suggestCardInner}>
                    <View
                      style={[styles.suggestIcon, { backgroundColor: s.color }]}
                    >
                      <Ionicons name={s.icon} size={17} color="#fff" />
                    </View>
                    <Text style={[styles.suggestLabel, { color: txt }]}>
                      {s.label}
                    </Text>
                    <Text style={[styles.suggestDesc, { color: sub }]}>
                      {s.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Quick Actions ── */}
            <View style={styles.secRow}>
              <View style={[styles.secDot, { backgroundColor: "#FFB347" }]} />
              <Text style={[styles.panelSec, { color: sub }]}>
                QUICK ACTIONS
              </Text>
            </View>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(255,255,255,0.58)",
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => navAndClose(a.route)}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: a.color }]}
                  >
                    <Ionicons name={a.icon} size={18} color="#fff" />
                  </View>
                  <Text style={[styles.actionLabel, { color: txt }]}>
                    {a.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={11}
                    color={sub}
                    style={{ marginLeft: "auto" }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* ── AI Suggestions ── */}
            <View style={styles.secRow}>
              <View style={[styles.secDot, { backgroundColor: "#6C63FF" }]} />
              <Text style={[styles.panelSec, { color: sub }]}>
                AI SUGGESTIONS
              </Text>
              <View style={[styles.aiBadge, { backgroundColor: "#6C63FF" }]}>
                <Ionicons name="sparkles" size={9} color="#fff" />
                <Text style={styles.aiBadgeTxt}>Smart</Text>
              </View>
            </View>
            <View
              style={[
                styles.aiCard,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "#fff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(108,99,255,0.08)",
                },
              ]}
            >
              {AI_SUGGESTIONS.map((s, i) => (
                <View key={s.id}>
                  {i > 0 && (
                    <View
                      style={[
                        styles.aiDivider,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.05)",
                        },
                      ]}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.aiRow}
                    activeOpacity={0.7}
                    onPress={() => navAndClose(s.route)}
                  >
                    <View
                      style={[styles.aiIconWrap, { backgroundColor: s.color }]}
                    >
                      <Ionicons name={s.icon} size={13} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.aiCategory, { color: s.color }]}>
                        {s.category}
                      </Text>
                      <Text style={[styles.aiText, { color: txt }]}>
                        {s.text}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.aiActionChip,
                        { backgroundColor: s.color + "15" },
                      ]}
                    >
                      <Text style={[styles.aiActionTxt, { color: s.color }]}>
                        {s.action}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* ── Appearance ── */}
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.themeRow,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(255,255,255,0.58)",
                },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.themeIconWrap,
                  { backgroundColor: isDark ? "#A78BFA" : "#FFB347" },
                ]}
              >
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={16}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeLabel, { color: txt }]}>
                  {isDark ? "Dark Mode" : "Light Mode"}
                </Text>
                <Text style={[styles.themeSub, { color: sub }]}>
                  Tap to switch
                </Text>
              </View>
              <View
                style={[
                  styles.togglePill,
                  { backgroundColor: isDark ? "#6C63FF" : "#D1D5DB" },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{ translateX: isDark ? 16 : 0 }],
                      backgroundColor: isDark ? "#fff" : "#9CA3AF",
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <View style={{ height: 28 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Notification Panel ─────────────────────────────────────────────────────────
function NotifPanel({ visible, onClose, insets, notifs, onMarkAllRead }) {
  const { isDark } = useTheme();
  const { markRead } = useNotificationsStore();
  const slideX = useRef(new Animated.Value(SCREEN_W)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: SCREEN_W,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const unread = notifs.filter((n) => !n.read);
  const read = notifs.filter((n) => n.read);
  const txt = isDark ? "#F0EEFF" : "#16163A";
  const sub = isDark ? "#9CA3AF" : "#6B7280";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdropOpacity },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.notifPanel,
            {
              backgroundColor:
                Platform.OS !== "ios"
                  ? isDark
                    ? "#000000"
                    : "#FFFFFF"
                  : "transparent",
              paddingTop: insets.top + 8,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          {Platform.OS === "ios" && (
            <>
              <BlurView
                intensity={isDark ? 38 : 26}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? "rgba(10,5,22,0.65)"
                      : "rgba(248,244,255,0.75)",
                  },
                ]}
              />
            </>
          )}

          <View
            style={[
              styles.notifHeaderRow,
              {
                borderBottomColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(108,99,255,0.1)",
              },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "#F0EEFF",
                },
              ]}
            >
              <Ionicons name="arrow-back" size={18} color={txt} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifTitle, { color: txt }]}>
                Notifications
              </Text>
              <Text style={[styles.notifSubtitle, { color: sub }]}>
                {unread.length > 0
                  ? `${unread.length} unread`
                  : "All caught up"}
              </Text>
            </View>
            {unread.length > 0 && (
              <TouchableOpacity onPress={onMarkAllRead}>
                <Text style={styles.markRead}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, gap: 10 }}
          >
            {unread.length > 0 && (
              <Text style={[styles.notifGroup, { color: sub }]}>NEW</Text>
            )}
            {unread.map((n) => (
              <TouchableOpacity
                key={n.id}
                activeOpacity={0.75}
                onPress={() => {
                  markRead(n.id);
                  if (n.actionRoute) { onClose(); setTimeout(() => router.push(n.actionRoute), 300); }
                }}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(108,99,255,0.14)"
                      : "#F0EEFF",
                    borderColor: isDark
                      ? "rgba(108,99,255,0.28)"
                      : "rgba(108,99,255,0.2)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.notifIcon,
                    { backgroundColor: n.color + "22" },
                  ]}
                >
                  <Ionicons name={n.icon} size={17} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifCardTitle, { color: txt }]}>
                    {n.title}
                  </Text>
                  <Text style={[styles.notifCardBody, { color: sub }]}>
                    {n.body}
                  </Text>
                  <Text
                    style={[
                      styles.notifTime,
                      { color: isDark ? "#6B7280" : "#C4C4C4" },
                    ]}
                  >
                    {n.time}
                  </Text>
                </View>
                <View
                  style={[styles.unreadDot, { backgroundColor: "#6C63FF" }]}
                />
              </TouchableOpacity>
            ))}

            {read.length > 0 && (
              <Text style={[styles.notifGroup, { color: sub, marginTop: 6 }]}>
                EARLIER
              </Text>
            )}
            {read.map((n) => (
              <TouchableOpacity
                key={n.id}
                activeOpacity={0.7}
                onPress={() => {
                  if (n.actionRoute) { onClose(); setTimeout(() => router.push(n.actionRoute), 300); }
                }}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "#FAFAFA",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.notifIcon,
                    { backgroundColor: n.color + "15" },
                  ]}
                >
                  <Ionicons name={n.icon} size={17} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.notifCardTitle,
                      {
                        color: isDark ? "#9CA3AF" : "#374151",
                        fontWeight: "500",
                      },
                    ]}
                  >
                    {n.title}
                  </Text>
                  <Text
                    style={[
                      styles.notifCardBody,
                      { color: isDark ? "#6B7280" : "#9CA3AF" },
                    ]}
                  >
                    {n.body}
                  </Text>
                  <Text
                    style={[
                      styles.notifTime,
                      { color: isDark ? "#4B5563" : "#D1D5DB" },
                    ]}
                  >
                    {n.time}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Settings Drawer ────────────────────────────────────────────────────────────
function SettingsDrawer({ visible, onClose, wordMode, setWordMode }) {
  const { colors, isDark, radius, setRadius } = useTheme();
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const slideX = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -DRAWER_W,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      // Wipe all user-specific store data before clearing auth
      usePantryStore.getState().reset();
      useCalendarStore.getState().reset();
      logout();
      router.replace("/(auth)/welcome");
    }, 300);
  };


  const nav = (route) => {
    onClose();
    setTimeout(() => router.push(route), 300);
  };
  const ITEMS = [
    {
      icon: "shield-checkmark",
      label: "Privacy & Security",
      color: "#4CAF82",
      action: () => nav("/(app)/settings/privacy"),
    },
    {
      icon: "language",
      label: "Language",
      color: "#FFB347",
      value: "English",
      action: () => nav("/(app)/settings/language"),
    },
    {
      icon: "help-circle",
      label: "Help & Support",
      color: "#9CA3AF",
      action: () => nav("/(app)/settings/help"),
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: isDark ? "#000000" : "#FFFFFF",
              paddingTop: insets.top + 16,
              width: DRAWER_W,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <View
            style={[
              styles.drawerProfile,
              { backgroundColor: isDark ? "#111111" : "#F7F4FF" },
            ]}
          >
            <View
              style={[styles.drawerAvatar, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.drawerAvatarTxt}>
                {(user?.name || "P").charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.drawerName,
                  { color: isDark ? "#F0EEFF" : "#16163A" },
                ]}
              >
                {user?.name || "Somya Singh"}
              </Text>
              <Text
                style={[
                  styles.drawerEmail,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {user?.email || "somya@example.com"}
              </Text>
              <TouchableOpacity style={styles.planChip} activeOpacity={0.8} onPress={() => { nav('/(app)/settings/premium'); }}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.planChipTxt}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* ── Daily Card Mode ── */}
            <Text
              style={[
                styles.drawerSec,
                { color: isDark ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              DAILY CARD
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                paddingHorizontal: 14,
                paddingBottom: 16,
              }}
            >
              {WORD_MODES.map((m) => {
                const active = wordMode === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => {
                      setWordMode(m.key);
                      onClose();
                    }}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: active
                        ? colors.primary
                        : isDark
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(108,99,255,0.08)",
                      borderWidth: active ? 0 : 0.5,
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(108,99,255,0.15)",
                    }}
                  >
                    <Ionicons
                      name={m.icon}
                      size={13}
                      color={active ? "#fff" : colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: active ? "700" : "500",
                        color: active
                          ? "#fff"
                          : isDark
                            ? "#E0DEFF"
                            : colors.textPrimary,
                      }}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Card Corners ── */}
            <Text
              style={[
                styles.drawerSec,
                { color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 8 },
              ]}
            >
              CARD CORNERS
            </Text>
            <View style={styles.radiusRow}>
              {[
                { r: 4, label: "Sharp" },
                { r: 8, label: "Subtle" },
                { r: 10, label: "Default" },
                { r: 16, label: "Rounded" },
                { r: 24, label: "Pill" },
              ].map(({ r, label }) => {
                const active = radius === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRadius(r)}
                    style={[
                      styles.radiusSwatch,
                      {
                        borderRadius: r,
                        borderColor: active
                          ? colors.primary
                          : isDark
                            ? "rgba(255,255,255,0.14)"
                            : "rgba(0,0,0,0.10)",
                        backgroundColor: active
                          ? colors.primary + "18"
                          : isDark
                            ? "rgba(255,255,255,0.06)"
                            : "#F3F4F6",
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.radiusSwatchNum,
                        {
                          color: active
                            ? colors.primary
                            : isDark
                              ? "#9CA3AF"
                              : "#6B7280",
                        },
                      ]}
                    >
                      {r}
                    </Text>
                    <Text
                      style={[
                        styles.radiusSwatchLbl,
                        {
                          color: active
                            ? colors.primary
                            : isDark
                              ? "#6B7280"
                              : "#9CA3AF",
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text
              style={[
                styles.drawerSec,
                { color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 8 },
              ]}
            >
              ACCOUNT & SETTINGS
            </Text>
            {ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.drawerItem}
                onPress={item.action}
              >
                <View
                  style={[
                    styles.drawerItemIcon,
                    { backgroundColor: item.color },
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color="#fff" />
                </View>
                <Text
                  style={[
                    styles.drawerItemLabel,
                    { color: isDark ? "#F0EEFF" : "#16163A" },
                  ]}
                >
                  {item.label}
                </Text>
                {item.badge ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: colors.primary,
                        position: "relative",
                        top: 0,
                        right: 0,
                      },
                    ]}
                  >
                    <Text style={styles.badgeTxt}>{item.badge}</Text>
                  </View>
                ) : item.value ? (
                  <Text
                    style={[
                      styles.drawerItemVal,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {item.value}
                  </Text>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={isDark ? "#9CA3AF" : "#C4C4C4"}
                  />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.drawerItem, { marginTop: 12 }]}
              onPress={handleLogout}
            >
              <View
                style={[styles.drawerItemIcon, { backgroundColor: "#FF6B6B" }]}
              >
                <Ionicons name="log-out-outline" size={18} color="#fff" />
              </View>
              <Text style={[styles.drawerItemLabel, { color: "#FF6B6B" }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
            <Text
              style={[styles.appVer, { color: isDark ? "#9CA3AF" : "#C4C4C4" }]}
            >
              smartStack v1.0.0
            </Text>
            <View style={{ height: 30 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── SmartStack card-stack data ────────────────────────────────────────────────

const STACK_SHORTCUTS = [
  {
    icon: "calendar",
    label: "Calendar",
    color: "#4CAF82",
    route: "/(app)/calendar",
  },
  {
    icon: "restaurant",
    label: "Kitchen",
    color: "#FFB347",
    route: "/(app)/kitchen",
  },
  {
    icon: "shirt",
    label: "Wardrobe",
    color: "#6C63FF",
    route: "/(app)/wardrobe",
  },
  {
    icon: "heart",
    label: "Wellbeing",
    color: "#FF6B9D",
    route: "/(app)/wellbeing",
  },
  {
    icon: "wallet",
    label: "Expenses",
    color: "#10B981",
    route: "/(app)/expenses",
  },
  {
    icon: "navigate-circle",
    label: "Tracking",
    color: "#3B82F6",
    route: "/(app)/tracking",
  },
];

const DAILY_QUOTES = [
  {
    quote: "Family is not an important thing. It's everything.",
    word: "Together",
    goal: "Stay connected",
  },
  {
    quote: "In family life, love is the oil that eases friction.",
    word: "Empathy",
    goal: "Listen more",
  },
  {
    quote: "The family is one of nature's masterpieces.",
    word: "Gratitude",
    goal: "Say thank you",
  },
  {
    quote: "Home is where love resides and memories are made.",
    word: "Presence",
    goal: "Be mindful",
  },
  {
    quote: "A happy family is but an earlier heaven.",
    word: "Harmony",
    goal: "Avoid conflicts",
  },
  {
    quote: "Family means no one gets left behind.",
    word: "Support",
    goal: "Check on others",
  },
  {
    quote: "The love of family is life's greatest blessing.",
    word: "Appreciate",
    goal: "Count blessings",
  },
];

const QUICK_REMINDERS = [
  {
    icon: "alarm",
    label: "Add Reminder",
    color: "#6C63FF",
    route: "/(app)/calendar/add-event",
  },
  {
    icon: "cart",
    label: "Shopping Item",
    color: "#FFB347",
    route: "/(app)/kitchen",
  },
  {
    icon: "heart",
    label: "Log Mood",
    color: "#FF6B9D",
    route: "/(app)/wellbeing",
  },
  {
    icon: "wallet",
    label: "Add Expense",
    color: "#10B981",
    route: "/(app)/expenses",
  },
  {
    icon: "shirt",
    label: "Add Outfit",
    color: "#3B82F6",
    route: "/(app)/wardrobe",
  },
];

const WORD_MODES = [
  {
    key: "word",
    label: "Word of the Day",
    icon: "text-outline",
    color: "#8B7FFF",
    desc: "Expand your vocabulary",
  },
  {
    key: "quote",
    label: "Quote of the Day",
    icon: "chatbubble-outline",
    color: "#4CAF82",
    desc: "Daily inspiration",
  },
  {
    key: "goal",
    label: "Family Goal",
    icon: "flag-outline",
    color: "#FFB347",
    desc: "Stay focused together",
  },
  {
    key: "affirmation",
    label: "Affirmation",
    icon: "sunny-outline",
    color: "#FF6B9D",
    desc: "Positive mindset",
  },
];

// ── Page config helper ────────────────────────────────────────────────────────
function getPageConfig(pathname, members) {
  if (pathname === "/overview") return { type: "home" };

  const memberMatch = pathname.match(/\/overview\/member\/(.+)/);
  if (memberMatch) {
    const memberId = memberMatch[1];
    const member = members.find((m) => m.id === memberId);
    return {
      type: "member",
      title: member?.name || "Profile",
      backRoute: "/(app)/overview/family",
      memberId,
    };
  }

  // Screens that render their own headers
  if (pathname === "/calendar" || pathname === "/calendar/add-event")
    return { type: "screenManaged" };

  const STANDALONE = {
    "/notifications": "Notifications",
    "/profile": "Profile",
    "/services": "Services",
  };
  if (STANDALONE[pathname])
    return { type: "standalone", title: STANDALONE[pathname] };

  const SERVICES = {
    "/wellbeing": "Well-being",
    "/wardrobe": "Wardrobe",
    "/kitchen": "Kitchen",
    "/jaap": "Jaap Counter",
    "/cctv": "CCTV",
    "/tracking": "Trackers",
    "/expenses": "Expenses",
  };
  if (SERVICES[pathname])
    return {
      type: "page",
      title: SERVICES[pathname],
      backRoute: "/(app)/overview",
      homeIcon: pathname === "/expenses" || pathname === "/kitchen",
    };

  const TITLES = {
    "/overview/family": "__family-hub__",
    "/overview/children": "Children",
    "/emergency": "Emergency & SOS",
    "/wellbeing/tracking": "Tracking",
    "/wellbeing/checkins": "Check-ins",
    "/wellbeing/sos": "SOS",
    "/wardrobe/suggestions": "Suggestions",
    "/kitchen/expiry": "Expiry Tracker",
    "/kitchen/shopping": "Shopping",
    "/kitchen/scan": "Barcode Scan",
    "/settings/privacy": "Privacy & Security",
    "/settings/devices": "Connected Devices",
    "/settings/language": "Language",
    "/settings/help": "Help & Support",
    "/settings/premium": "Premium",
  };
  if (pathname === "/profile/edit")
    return { type: "page", title: "Edit Profile", backRoute: "/(app)/profile" };
  if (pathname === "/profile/change-password")
    return {
      type: "page",
      title: "Change Password",
      backRoute: "/(app)/profile",
    };
  if (pathname === "/expenses/reports")
    return { type: "page", title: "Reports & Analytics", backRoute: "/(app)/expenses" };
  if (pathname === "/expenses/goals")
    return { type: "page", title: "Savings Goals", backRoute: "/(app)/expenses" };
  if (pathname.startsWith("/expenses/transaction/"))
    return { type: "page", title: "Edit Transaction", backRoute: "/(app)/expenses" };
  if (pathname === "/kitchen/expiry")
    return { type: "page", title: "Expiry Tracker", backRoute: "/(app)/kitchen" };
  if (pathname === "/kitchen/shopping")
    return { type: "page", title: "Shopping", backRoute: "/(app)/kitchen" };
  if (pathname === "/kitchen/scan")
    return { type: "page", title: "Barcode Scan", backRoute: "/(app)/kitchen" };
  if (pathname.startsWith("/kitchen/recipe/"))
    return { type: "page", title: "Recipe", backRoute: "/(app)/kitchen" };
  if (pathname === "/kitchen/meal-plan")
    return { type: "page", title: "Meal Planner", backRoute: "/(app)/kitchen" };
  if (pathname === "/kitchen/add-recipe")
    return { type: "page", title: "Add Recipe", backRoute: "/(app)/kitchen" };
  const raw = TITLES[pathname];
  if (raw === "__family-hub__")
    return { type: "family-hub", title: "Family Hub" };
  return { type: "page", title: raw || "" };
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { colors, isDark, radius } = useTheme();
  const { user } = useAuthStore();
  const { members, isAdmin, removeMember } = useFamilyStore();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [infoOpen, setInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const {
    notifications,
    unreadCount: storeUnreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAllRead,
  } = useNotificationsStore();
  const [stackPeeked, setStackPeeked] = useState(false);
  const [wordMode, setWordMode] = useState("word");
  const [wordModePicker, setWordModePicker] = useState(false);
  const stackPeekedRef = useRef(false);
  const stackAnim = useRef(new Animated.Value(0)).current;

  const handleRemoveMemberFromHeader = useCallback(
    (memberId, memberName) => {
      Alert.alert("Remove Member", `Remove ${memberName} from your family?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMember(memberId);
              router.replace("/(app)/overview/family");
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || err.message);
            }
          },
        },
      ]);
    },
    [removeMember],
  );

  const dismissStack = useCallback(() => {
    stackPeekedRef.current = false;
    setStackPeeked(false);
    Animated.spring(stackAnim, {
      toValue: 0,
      tension: 150,
      friction: 14,
      useNativeDriver: false,
    }).start();
  }, []);

  const stackGesture = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        !stackPeekedRef.current &&
        gs.dy > 20 &&
        gs.vy > 0.2 &&
        Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (!stackPeekedRef.current && gs.dy > 0) {
          stackAnim.setValue(Math.min(gs.dy / 90, 1));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 40 || gs.vy > 0.3) {
          stackPeekedRef.current = true;
          setStackPeeked(true);
          setQuoteIndex((i) => (i + 1) % DAILY_QUOTES.length);
          Animated.spring(stackAnim, {
            toValue: 1,
            tension: 62,
            friction: 12,
            useNativeDriver: false,
          }).start();
        } else {
          stackPeekedRef.current = false;
          Animated.spring(stackAnim, {
            toValue: 0,
            tension: 200,
            friction: 20,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const unreadCount = storeUnreadCount;
  const handleMarkAllRead = markAllRead;

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Register Expo push token with backend when user is available
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") return;
        const { data: expoPushToken } =
          await Notifications.getExpoPushTokenAsync();
        await api.patch("/users/push-token", { expoPushToken });
      } catch {}
    })();
  }, [user]);

  const hour = new Date().getHours();
  const greetWord =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userName = user?.name?.split(" ")[0] || "Somya";

  const pageConfig = getPageConfig(pathname, members);
  const isOverviewHome = pageConfig.type === "home";
  const showNav =
    !pathname.includes("/jaap") &&
    !pathname.includes("/cctv") &&
    !pathname.includes("/tracking") &&
    !pathname.includes("/expenses") &&
    !pathname.includes("/kitchen") &&
    !pathname.includes("/add-event");

  const navAnim = useRef(new Animated.Value(showNav ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(navAnim, {
      toValue: showNav ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showNav]);

  const gradientDark = ["#000000", "#0A0A0A", "#050505", "#000000"];
  const gradientLight = ["#F6F7FC", "#F6F7FC", "#F6F7FC", "#F6F7FC"];
  const [quoteIndex, setQuoteIndex] = useState(
    new Date().getDay() % DAILY_QUOTES.length,
  );
  const todayQuote = DAILY_QUOTES[quoteIndex];

  const SOSButton = (
    <TouchableOpacity
      style={styles.sosBtnCircle}
      onPress={() => router.push("/(app)/emergency")}
      activeOpacity={0.85}
    >
      <Text style={styles.sosBtnTxt}>SOS</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Root: Daily Card — properly centered in black zone above Card 3 ── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: SCREEN_H * 0.26,
        }}
      >
        {/* Status bar spacer — keeps centering true */}
        <View style={{ height: insets.top }} />
        {/* Content centered in remaining space */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 28,
          }}
        >
          {/* Mode label pill */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(108,99,255,0.18)",
              paddingHorizontal: 11,
              paddingVertical: 5,
              borderRadius: 99,
              borderWidth: 0.5,
              borderColor: "rgba(138,127,255,0.35)",
              marginBottom: 12,
            }}
          >
            <Ionicons
              name={WORD_MODES.find((m) => m.key === wordMode)?.icon}
              size={10}
              color="#B0A8FF"
            />
            <Text
              style={{
                color: "#B0A8FF",
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 1.6,
              }}
            >
              {WORD_MODES.find((m) => m.key === wordMode)?.label?.toUpperCase()}
            </Text>
          </View>

          {/* Main content based on mode */}
          {wordMode === "word" && (
            <>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 46,
                  fontWeight: "900",
                  letterSpacing: -2,
                  textAlign: "center",
                  lineHeight: 50,
                }}
              >
                {todayQuote.word}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 8,
                  lineHeight: 17,
                  fontStyle: "italic",
                }}
                numberOfLines={2}
              >
                "{todayQuote.quote}"
              </Text>
            </>
          )}
          {wordMode === "quote" && (
            <>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                  textAlign: "center",
                  lineHeight: 26,
                  letterSpacing: -0.3,
                  fontStyle: "italic",
                }}
                numberOfLines={3}
              >
                "{todayQuote.quote}"
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 11,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                — smartStack Daily
              </Text>
            </>
          )}
          {wordMode === "goal" && (
            <>
              <Text
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 1.2,
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                TODAY'S FAMILY FOCUS
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 30,
                  fontWeight: "900",
                  textAlign: "center",
                  letterSpacing: -1,
                }}
              >
                {todayQuote.goal}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.28)",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 8,
                  fontStyle: "italic",
                }}
                numberOfLines={2}
              >
                "{todayQuote.quote}"
              </Text>
            </>
          )}
          {wordMode === "affirmation" && (
            <>
              <Text
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 1.2,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                DAILY AFFIRMATION
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "800",
                  textAlign: "center",
                  lineHeight: 28,
                  letterSpacing: -0.5,
                }}
              >
                We are stronger together as a family.
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.28)",
                  fontSize: 11,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Repeat this 3 times today
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── Background cards removed ── */}
      {false && (
        <Animated.View
          pointerEvents={stackPeeked ? "auto" : "none"}
          style={[
            styles.stackBgCard,
            {
              left: 28,
              right: 28,
              top: 0,
              bottom: 0,
              borderRadius: 20,
              opacity: stackAnim.interpolate({
                inputRange: [0, 0.25, 1],
                outputRange: [0, 0, 1],
              }),
              transform: [
                {
                  translateY: stackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, SCREEN_H * 0.26],
                  }),
                },
              ],
            },
          ]}
        >
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={70}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(25, 14, 60, 0.85)", borderRadius: 20 },
              ]}
            />
          )}
          <LinearGradient
            colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0.04)"]}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.22)",
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={{ paddingTop: 14, paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Ionicons name="flash" size={11} color="#A89DFF" />
              <Text
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 1.3,
                }}
              >
                QUICK REMINDERS
              </Text>
            </View>
            {/* Single row of 4 actions */}
            <View style={{ flexDirection: "row" }}>
              {QUICK_REMINDERS.map((r) => (
                <TouchableOpacity
                  key={r.label}
                  style={{ flex: 1, alignItems: "center", gap: 5 }}
                  onPress={() => {
                    dismissStack();
                    setTimeout(() => router.push(r.route), 220);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: radius,
                      backgroundColor: r.color,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={r.icon} size={18} color="#fff" />
                  </View>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 9,
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {false && (
        <Animated.View
          pointerEvents={stackPeeked ? "auto" : "none"}
          style={[
            styles.stackBgCard,
            {
              left: 18,
              right: 18,
              top: 0,
              bottom: 0,
              borderRadius: 22,
              opacity: stackAnim.interpolate({
                inputRange: [0, 0.15, 1],
                outputRange: [0, 0, 1],
              }),
              transform: [
                {
                  translateY: stackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, SCREEN_H * 0.38],
                  }),
                },
              ],
            },
          ]}
        >
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(30, 18, 70, 0.85)", borderRadius: 22 },
              ]}
            />
          )}
          <LinearGradient
            colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0.06)"]}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.28)",
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Icons only — no header row */}
          <View
            style={{
              paddingTop: 20,
              paddingHorizontal: 16,
              flexDirection: "row",
            }}
          >
            {STACK_SHORTCUTS.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={{ flex: 1, alignItems: "center", gap: 6 }}
                onPress={() => {
                  dismissStack();
                  setTimeout(() => router.push(s.route), 220);
                }}
                activeOpacity={0.75}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: radius,
                    backgroundColor: s.color,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: s.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                  }}
                >
                  <Ionicons name={s.icon} size={21} color="#fff" />
                </View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 9,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* ── Main screen ── bottom:-1 pushes iOS overflow:hidden clip boundary 1px below screen, eliminating the layer artifact line */}
      <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: -1, overflow: "hidden" }}>
        <LinearGradient
          colors={isDark ? gradientDark : gradientLight}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {/* ── Header ── */}
          {pageConfig.type !== "screenManaged" && (
            <Animated.View
              style={[
                isOverviewHome ? styles.header : styles.backHeader,
                {
                  paddingTop: insets.top + 4,
                  ...(isOverviewHome
                    ? {
                        borderBottomWidth: isDark ? 0.5 : 0,
                        borderBottomColor: "rgba(255,255,255,0.08)",
                        backgroundColor:
                          Platform.OS !== "ios"
                            ? isDark
                              ? "rgba(10,6,22,0.97)"
                              : "#F6F7FC"
                            : "transparent",
                      }
                    : {
                        backgroundColor: "transparent",
                      }),
                },
              ]}
            >
              {isOverviewHome && <GlassLayer isDark={isDark} />}
              {isOverviewHome ? (
                <>
                  <TouchableOpacity
                    onPress={() => setSettingsOpen(true)}
                    style={styles.hBtn}
                  >
                    <Ionicons name="menu" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.greetWrap}
                    onPress={() => setInfoOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.greetMain, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {greetWord}, {userName} 👋
                    </Text>
                    <Text
                      style={[styles.greetSub, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {"Here's what's happening..."}
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {SOSButton}
                    <TouchableOpacity
                      style={[
                        styles.hBtn,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.05)",
                        },
                      ]}
                      onPress={() => router.push("/(app)/notifications")}
                    >
                      <Ionicons
                        name={
                          unreadCount > 0
                            ? "notifications"
                            : "notifications-outline"
                        }
                        size={20}
                        color={
                          unreadCount > 0 ? colors.primary : colors.textPrimary
                        }
                      />
                      {unreadCount > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeTxt}>
                            {unreadCount > 9 ? "9+" : String(unreadCount)}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : pageConfig.type === "standalone" ? (
                <>
                  <View style={styles.hBtn} />
                  <Text
                    style={[styles.headerTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {pageConfig.title}
                  </Text>
                  <View style={styles.hBtn} />
                </>
              ) : pageConfig.type === "family-hub" ? (
                <>
                  <TouchableOpacity
                    onPress={() => router.replace("/(app)/overview")}
                    style={styles.hBtn}
                  >
                    <Ionicons
                      name="home-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.headerTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {pageConfig.title}
                  </Text>
                  <View style={styles.hBtn} />
                </>
              ) : pageConfig.type === "member" ? (
                <>
                  <TouchableOpacity
                    onPress={() => router.push("/(app)/overview/family")}
                    style={styles.hBtn}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.headerTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {pageConfig.title}
                  </Text>
                  {isAdmin &&
                  pageConfig.memberId &&
                  String(user?._id) !== pageConfig.memberId ? (
                    <TouchableOpacity
                      style={styles.hBtn}
                      onPress={() =>
                        handleRemoveMemberFromHeader(
                          pageConfig.memberId,
                          pageConfig.title,
                        )
                      }
                    >
                      <Ionicons
                        name="person-remove-outline"
                        size={20}
                        color="#FF6B6B"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.hBtn} />
                  )}
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      router.canGoBack()
                        ? router.back()
                        : router.replace(pageConfig.backRoute ?? '/(app)/overview')
                    }
                    style={styles.hBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={pageConfig.homeIcon ? "home-outline" : "chevron-back"}
                      size={pageConfig.homeIcon ? 22 : 24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.headerTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {pageConfig.title}
                  </Text>
                  <View style={styles.hBtn} />
                </>
              )}
            </Animated.View>
          )}

          {/* ── Screens ── */}
          <View style={{ flex: 1, backgroundColor: "transparent", paddingBottom: showNav ? (Platform.OS === "ios" ? 82 : 62) : 0 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "transparent" },
              }}
            >
              <Stack.Screen
                name="calendar/add-event"
                options={{ animation: "slide_from_bottom", presentation: "modal" }}
              />
              <Stack.Screen
                name="profile/edit"
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="profile/change-password"
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="kitchen/index"
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="expenses/index"
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="expenses/reports"
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="expenses/goals"
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="expenses/transaction/[id]"
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="settings/premium"
                options={{ animation: "slide_from_bottom", headerShown: false }}
              />
            </Stack>
          </View>
        </LinearGradient>

      </Animated.View>

      {/* ── Word mode picker — rendered last so it's above all stack cards ── */}
      {false && wordModePicker && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 10,
            alignSelf: "center",
            zIndex: 9999,
            backgroundColor: "rgba(18,10,40,0.97)",
            borderRadius: 18,
            borderWidth: 0.8,
            borderColor: "rgba(255,255,255,0.15)",
            paddingVertical: 6,
            minWidth: 230,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 30,
          }}
        >
          {WORD_MODES.map((m, i) => (
            <TouchableOpacity
              key={m.key}
              onPress={() => {
                setWordMode(m.key);
                setWordModePicker(false);
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: i < WORD_MODES.length - 1 ? 0.5 : 0,
                borderBottomColor: "rgba(255,255,255,0.07)",
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: m.color + "28",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={m.icon} size={15} color={m.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color:
                      wordMode === m.key ? "#fff" : "rgba(255,255,255,0.75)",
                    fontSize: 13,
                    fontWeight: wordMode === m.key ? "700" : "500",
                  }}
                >
                  {m.label}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 10,
                    marginTop: 1,
                  }}
                >
                  {m.desc}
                </Text>
              </View>
              {wordMode === m.key && (
                <Ionicons name="checkmark-circle" size={16} color="#8B7FFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Bottom Nav — full-screen overlay so AppBottomNav can anchor to screen bottom ── */}
      <Animated.View
        pointerEvents={showNav ? "box-none" : "none"}
        style={[StyleSheet.absoluteFill, { opacity: navAnim }]}
      >
        <BottomNav
          pathname={pathname}
          isDark={isDark}
          colors={colors}
          onPressCenter={() => setInfoOpen(true)}
        />
      </Animated.View>

      <InfoPanel
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        insets={insets}
      />
      <NotifPanel
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        insets={insets}
        notifs={notifications}
        onMarkAllRead={handleMarkAllRead}
      />
      <SettingsDrawer
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        wordMode={wordMode}
        setWordMode={setWordMode}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 10,
    overflow: "hidden",
  },
  backHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  hBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  greetWrap: { flex: 1, gap: 1 },
  greetMain: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  greetSub: { fontSize: 11 },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
  },
  badgeTxt: { color: "#fff", fontSize: 9, fontWeight: "800" },

  // SOS button in header (home only)
  sosBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  sosBtnTxt: {
    color: "#FF3B30",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Bottom Nav — styles moved to AppBottomNav component
  floatingNavShadow: {},
  navFab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    marginVertical: -4,
  },

  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Info Panel
  infoPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 28,
  },
  dragHandleArea: { alignItems: "center", paddingVertical: 8 },
  panelHandle: { width: 36, height: 3, borderRadius: 2 },
  panelContent: { paddingHorizontal: 14, gap: 12, paddingBottom: 16 },
  panelHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  panelLogoWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  panelTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  panelSubtitle: { fontSize: 10, marginTop: 1 },

  // Header live badge
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4CAF8220",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4CAF82" },
  liveTxt: {
    fontSize: 8,
    fontWeight: "800",
    color: "#4CAF82",
    letterSpacing: 0.5,
  },

  // Section row label
  secRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  secDot: { width: 6, height: 6, borderRadius: 3 },
  panelSec: { fontSize: 9, fontWeight: "700", letterSpacing: 1.2, flex: 1 },

  // Stats single row
  statsBar: {
    flexDirection: "row",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  statVal: { fontSize: 13, fontWeight: "800" },
  statLabel: { fontSize: 8, fontWeight: "600" },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },

  // Member cards
  memberCard: {
    width: 80,
    borderRadius: 13,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  memberColorBar: { height: 3, width: "100%" },
  memberCardInner: {
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 5,
  },
  panelAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  panelAvatarTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  panelMemberName: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 99,
  },
  statusPillTxt: { fontSize: 8, fontWeight: "700" },

  // AI badge
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeTxt: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Scan card (gradient)
  scanCardWrap: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 14,
    paddingVertical: 14,
    paddingLeft: 12,
  },
  scanIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  scanTitle: { fontSize: 13, fontWeight: "800", color: "#fff" },
  scanDesc: { fontSize: 10, marginTop: 2, color: "rgba(255,255,255,0.75)" },
  scanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scanBadgeTxt: { fontSize: 8, fontWeight: "800", color: "#fff" },
  scanChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  scanChipTxt: {
    fontSize: 8,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  scanRunBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  scanRunTxt: { color: "#4F46E5", fontSize: 11, fontWeight: "800" },

  // Suggestion cards
  suggestCard: {
    width: 86,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  suggestTopLine: { height: 3, width: "100%" },
  suggestCardInner: { padding: 10, gap: 5 },
  suggestIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestLabel: { fontSize: 10, fontWeight: "700" },
  suggestDesc: { fontSize: 9, lineHeight: 13 },

  // Quick actions — 2-col horizontal rows
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  actionBtn: {
    width: "47.8%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 11, fontWeight: "700", flex: 1 },

  // AI Suggestions list
  aiCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  aiIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCategory: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  aiText: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  aiDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  aiActionChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99 },
  aiActionTxt: { fontSize: 10, fontWeight: "700" },
  soonTxt: { fontSize: 7, fontWeight: "700" },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  themeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  themeLabel: { fontSize: 12, fontWeight: "700" },
  themeSub: { fontSize: 10, marginTop: 1 },
  togglePill: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: { width: 16, height: 16, borderRadius: 8 },

  // Notif Panel
  notifPanel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_W,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  notifHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: { fontSize: 16, fontWeight: "800" },
  notifSubtitle: { fontSize: 11, marginTop: 1 },
  markRead: { fontSize: 12, fontWeight: "600", color: "#6C63FF" },
  notifGroup: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 2,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  notifCardTitle: { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  notifCardBody: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  notifTime: { fontSize: 10, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  // Settings Drawer
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  drawerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerAvatarTxt: { color: "#fff", fontSize: 22, fontWeight: "800" },
  drawerName: { fontSize: 15, fontWeight: "800" },
  drawerEmail: { fontSize: 11, marginTop: 1 },
  planChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#6C63FF22",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  planChipTxt: { color: "#6C63FF", fontSize: 9, fontWeight: "700" },
  drawerSec: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  drawerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  drawerItemVal: { fontSize: 12 },
  drawerSvcDetail: { fontSize: 11, marginTop: 1 },
  drawerSvcDot: { width: 8, height: 8, borderRadius: 4 },
  radiusRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  radiusSwatch: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1.5,
    gap: 3,
  },
  radiusSwatchNum: { fontSize: 13, fontWeight: "800" },
  radiusSwatchLbl: { fontSize: 8, fontWeight: "600", letterSpacing: 0.2 },

  appVer: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 20,
    paddingHorizontal: 20,
  },

  // Card stack background cards (peek from top when main screen scales down)
  stackBgCard: {
    position: "absolute",
    overflow: "hidden",
  },
  stackCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.35)",
  },
  stackCard2Header: { flex: 1 },
});
