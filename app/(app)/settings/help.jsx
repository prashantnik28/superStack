import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const ACCENT = '#6C63FF';

const FAQS = [
  {
    q: 'How do I add a family member?',
    a: 'From the Home screen, tap any empty member slot or go to Profile → Family Members. Enter their details and send an invitation via SMS or email. They will receive a link to join your household.',
  },
  {
    q: 'How does real-time GPS tracking work?',
    a: 'Family members share their location through the smartStack app when it is open or running in the background (with permission). You can see everyone\'s location on the Tracking screen.',
  },
  {
    q: 'Is my family\'s data secure?',
    a: 'Yes. smartStack uses AES-256 encryption for data at rest and TLS 1.3 in transit. We are GDPR and PDPB compliant. Your data is never sold or shared with advertisers.',
  },
  {
    q: 'How do I set up CCTV cameras?',
    a: 'Go to Services → CCTV. Tap "Add Camera" and scan the camera\'s QR code, or manually enter its RTSP stream URL. smartStack supports most IP camera brands including Hikvision, Dahua, and TP-Link.',
  },
  {
    q: 'Can I use smartStack offline?',
    a: 'Basic features like wardrobe and shopping lists work offline. Real-time tracking, AI features, and notifications require an active internet connection.',
  },
  {
    q: 'How do I cancel my Family Pro subscription?',
    a: 'Open iOS Settings → Apple ID → Subscriptions → smartStack → Cancel Subscription. Your access continues until the end of the current billing period.',
  },
  {
    q: 'Why are some services marked "Soon"?',
    a: 'smartStack is actively building new services. Features marked "Soon" are in development and will be released in upcoming app updates. Enable notifications to be alerted when they launch.',
  },
];

const RESOURCES = [
  { icon: 'document-text', color: '#6C63FF', label: 'Privacy Policy', url: 'https://smartstack.app/privacy' },
  { icon: 'reader', color: '#4CAF82', label: 'Terms of Service', url: 'https://smartstack.app/terms' },
  { icon: 'book-outline', color: '#FFB347', label: 'User Guide', url: 'https://smartstack.app/guide' },
  { icon: 'code-slash', color: '#9CA3AF', label: 'Open Source Licenses', url: null },
];

export default function HelpScreen() {
  const { colors, isDark } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);

  const txt = colors.textPrimary;
  const sub = isDark ? '#9CA3AF' : '#6B7280';
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const toggle = (i) => setOpenFaq(openFaq === i ? null : i);

  const openLink = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Contact cards */}
      <View style={styles.contactRow}>
        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: isDark ? ACCENT + '18' : '#F0EEFF' }]}
          onPress={() => Linking.openURL('mailto:support@smartstack.app').catch(() => {})}
          activeOpacity={0.8}
        >
          <View style={[styles.contactIcon, { backgroundColor: ACCENT + '25' }]}>
            <Ionicons name="mail" size={22} color={ACCENT} />
          </View>
          <Text style={[styles.contactLabel, { color: txt }]}>Email Us</Text>
          <Text style={[styles.contactSub, { color: sub }]}>support@{'\n'}smartstack.app</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: isDark ? '#4CAF8218' : '#EEFFF8' }]}
          onPress={() => Alert.alert('Live Chat', 'Our support team is available Monday–Saturday, 9 AM – 6 PM IST.\n\nAverage response time: under 10 minutes.', [{ text: 'Got it' }])}
          activeOpacity={0.8}
        >
          <View style={[styles.contactIcon, { backgroundColor: '#4CAF8225' }]}>
            <Ionicons name="chatbubbles" size={22} color="#4CAF82" />
          </View>
          <Text style={[styles.contactLabel, { color: txt }]}>Live Chat</Text>
          <Text style={[styles.contactSub, { color: sub }]}>Mon–Sat{'\n'}9 AM – 6 PM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: isDark ? '#FFB34718' : '#FFF8EE' }]}
          onPress={() => Linking.openURL('tel:+918001234567').catch(() => {})}
          activeOpacity={0.8}
        >
          <View style={[styles.contactIcon, { backgroundColor: '#FFB34725' }]}>
            <Ionicons name="call" size={22} color="#FFB347" />
          </View>
          <Text style={[styles.contactLabel, { color: txt }]}>Call Us</Text>
          <Text style={[styles.contactSub, { color: sub }]}>+91 800{'\n'}1234-567</Text>
        </TouchableOpacity>
      </View>

      {/* FAQs */}
      <Text style={[styles.secLabel, { color: sub }]}>FREQUENTLY ASKED QUESTIONS</Text>
      <GlassCard style={styles.card}>
        {FAQS.map((faq, i) => {
          const isOpen = openFaq === i;
          return (
            <View key={i}>
              {i > 0 && <View style={[styles.div, { backgroundColor: divColor }]} />}
              <TouchableOpacity style={styles.faqRow} onPress={() => toggle(i)} activeOpacity={0.75}>
                <View style={[styles.faqNum, { backgroundColor: ACCENT + '18' }]}>
                  <Text style={[styles.faqNumTxt, { color: ACCENT }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.faqQ, { color: txt }]}>{faq.q}</Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color={sub} />
              </TouchableOpacity>
              {isOpen && (
                <View style={[styles.faqAns, { borderTopColor: divColor }]}>
                  <Text style={[styles.faqA, { color: sub }]}>{faq.a}</Text>
                </View>
              )}
            </View>
          );
        })}
      </GlassCard>

      {/* Resources */}
      <Text style={[styles.secLabel, { color: sub }]}>RESOURCES & LEGAL</Text>
      <GlassCard style={styles.card}>
        {RESOURCES.map((r, i) => (
          <View key={r.label}>
            {i > 0 && <View style={[styles.div, { backgroundColor: divColor }]} />}
            <TouchableOpacity style={styles.resRow} onPress={() => openLink(r.url)} activeOpacity={0.75}>
              <View style={[styles.resIcon, { backgroundColor: r.color + '20' }]}>
                <Ionicons name={r.icon} size={17} color={r.color} />
              </View>
              <Text style={[styles.resLabel, { color: txt }]}>{r.label}</Text>
              <Ionicons name={r.url ? 'open-outline' : 'chevron-forward'} size={15} color={sub} />
            </TouchableOpacity>
          </View>
        ))}
      </GlassCard>

      {/* App version card */}
      <GlassCard style={styles.versionCard}>
        <View style={[styles.appLogo, { backgroundColor: ACCENT + '20' }]}>
          <Ionicons name="home" size={22} color={ACCENT} />
        </View>
        <View style={{ alignItems: 'center', gap: 3 }}>
          <Text style={[styles.appName, { color: txt }]}>smartStack</Text>
          <Text style={[styles.appVer, { color: sub }]}>Version 1.0.0 · Build 100</Text>
          <Text style={[styles.appCopy, { color: sub }]}>© 2026 smartStack Inc. All rights reserved.</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkUpdate, { backgroundColor: ACCENT + '15', borderColor: ACCENT + '30' }]}
          onPress={() => Alert.alert('Up to date', 'You\'re running the latest version of smartStack.')}
        >
          <Text style={[styles.checkUpdateTxt, { color: ACCENT }]}>Check for updates</Text>
        </TouchableOpacity>
      </GlassCard>

      <View style={{ height: 36 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  contactRow: { flexDirection: 'row', gap: 10 },
  contactCard: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', gap: 8 },
  contactIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 13, fontWeight: '700' },
  contactSub: { fontSize: 10, textAlign: 'center', lineHeight: 14 },

  card: { padding: 0 },
  div: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  faqRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  faqNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  faqNumTxt: { fontSize: 11, fontWeight: '800' },
  faqQ: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  faqAns: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  faqA: { fontSize: 13, lineHeight: 19 },

  resRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  resIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resLabel: { flex: 1, fontSize: 14, fontWeight: '600' },

  versionCard: { alignItems: 'center', gap: 10, padding: 22 },
  appLogo: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  appVer: { fontSize: 12 },
  appCopy: { fontSize: 10, textAlign: 'center' },
  checkUpdate: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginTop: 4 },
  checkUpdateTxt: { fontSize: 12, fontWeight: '700' },
});
