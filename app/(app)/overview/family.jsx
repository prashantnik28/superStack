import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Image, Modal, TextInput, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, useWindowDimensions, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';
import GlassCard from '../../../src/components/ui/GlassCard';

const CHILD_COLORS  = ['#4CAF82', '#FFB347', '#26C6DA', '#FF6B9D', '#9C27B0', '#3B82F6'];
const CHILD_EMOJIS  = ['👶', '🧒', '👦', '👧', '🧑', '👼'];

function sheetAnim(visible, slideAnim) {
  if (visible) Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  else Animated.timing(slideAnim, { toValue: 400, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
}

// ─── Invite Member Sheet ──────────────────────────────────────────────────────
// Searches by username / uniqueId and sends an invite (NOT a direct add)

function InviteMemberSheet({ visible, onClose, colors, isDark }) {
  const { searchUser, sendInvite, createFamily, family } = useFamilyStore();
  const [uid, setUid]         = useState('');
  const [found, setFound]     = useState(null);
  const [sent, setSent]       = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr]         = useState('');
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) { setUid(''); setFound(null); setErr(''); setSent(false); }
    sheetAnim(visible, slideAnim);
  }, [visible]);

  const handleSearch = async () => {
    if (!uid.trim()) return;
    setSearching(true); setFound(null); setErr(''); setSent(false);
    try { setFound(await searchUser(uid.trim())); }
    catch (e) { setErr(e.response?.data?.message || 'No user found with that ID or username'); }
    finally { setSearching(false); }
  };

  const handleSend = async () => {
    if (!found) return;
    setSending(true);
    try {
      await sendInvite(uid.trim());
      setSent(true);
    } catch (e) {
      const status = e.response?.status;
      const msg    = e.response?.data?.message || e.message;
      if (status === 402) {
        Alert.alert('Upgrade to Premium', `Free plan allows up to 4 members.\nUpgrade to add up to 8 family members.`, [
          { text: 'Not Now', style: 'cancel' }, { text: 'See Premium', onPress: () => { onClose(); router.push('/(app)/settings/premium'); } },
        ]);
      } else if (msg?.toLowerCase().includes('not part of any family')) {
        Alert.alert('Create Family First', 'You need a family group before adding members.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create & Invite', onPress: () =>
            Alert.prompt('Family Name', '', async (name) => {
              if (!name?.trim()) return;
              setSending(true);
              try { await createFamily(name.trim()); await sendInvite(uid.trim()); setSent(true); }
              catch (ex) { Alert.alert('Error', ex.response?.data?.message || ex.message); }
              finally { setSending(false); }
            }, 'plain-text', 'My Family'),
          },
        ]);
      } else {
        Alert.alert('Error', msg);
      }
    } finally { setSending(false); }
  };

  const bg       = isDark ? '#0E0E1F' : '#FFFFFF';
  const inputBg  = isDark ? '#1A1A2E' : '#F3F0FF';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.12)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={S.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[S.sheet, { backgroundColor: bg, transform: [{ translateY: slideAnim }] }]}>
          <View style={[S.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#D0D0E8' }]} />
          <Text style={[S.sheetTitle, { color: colors.textPrimary }]}>Invite Family Member</Text>
          <Text style={[S.sheetSub, { color: colors.textSecondary }]}>Search by Unique ID (e.g. SM4K9P2A) or @username. They'll receive an invite to accept.</Text>

          <View style={[S.searchRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
            <TextInput
              style={[S.searchInput, { color: colors.textPrimary }]}
              placeholder="Unique ID or @username"
              placeholderTextColor={colors.textSecondary}
              value={uid}
              onChangeText={t => { setUid(t); setFound(null); setErr(''); setSent(false); }}
              autoCapitalize="none" autoCorrect={false}
              returnKeyType="search" onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={[S.searchBtn, { backgroundColor: colors.primary }]} onPress={handleSearch} disabled={searching || !uid.trim()} activeOpacity={0.82}>
              {searching ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>

          {!!err && <View style={S.errRow}><Ionicons name="alert-circle" size={14} color="#FF6B6B" /><Text style={S.errTxt}>{err}</Text></View>}

          {found && !sent && (
            <View style={[S.foundCard, { backgroundColor: inputBg, borderColor: colors.primary + '30' }]}>
              <View style={[S.foundAvatar, { backgroundColor: colors.primary + '22' }]}>
                {found.avatar
                  ? <Image source={{ uri: found.avatar }} style={S.foundAvatarImg} />
                  : <Text style={[S.foundAvatarTxt, { color: colors.primary }]}>{found.name.slice(0, 2).toUpperCase()}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.foundName, { color: colors.textPrimary }]}>{found.name}</Text>
                {found.username ? <Text style={[S.foundId, { color: colors.textSecondary }]}>@{found.username}</Text> : null}
                <Text style={[S.foundId, { color: colors.textSecondary }]}>ID: {found.uniqueId}</Text>
                {found.alreadyInFamily && <Text style={{ color: '#FF6B6B', fontSize: 11, marginTop: 2 }}>Already in a family</Text>}
              </View>
              {!found.alreadyInFamily && (
                <TouchableOpacity style={[S.addConfirmBtn, { backgroundColor: colors.primary }]} onPress={handleSend} disabled={sending} activeOpacity={0.82}>
                  {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.addConfirmTxt}>Invite</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}

          {sent && (
            <View style={[S.sentCard, { backgroundColor: '#4CAF8215', borderColor: '#4CAF8240' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#4CAF82" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#4CAF82', fontWeight: '700', fontSize: 14 }}>Invite Sent!</Text>
                <Text style={{ color: '#4CAF82', fontSize: 12, marginTop: 2 }}>
                  {found?.name} will be added once they accept.
                </Text>
              </View>
            </View>
          )}

          {family && (
            <View style={S.slotRow}>
              <Ionicons name={family.needsUpgrade ? 'lock-closed' : 'people'} size={13} color={family.needsUpgrade ? '#FFB347' : colors.textSecondary} />
              <Text style={[S.slotTxt, { color: family.needsUpgrade ? '#FFB347' : colors.textSecondary }]}>
                {family.memberCount}/{family.limit} slots used{family.needsUpgrade ? ' · Upgrade for 2 more' : ''}
              </Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Child Sheet ──────────────────────────────────────────────────────────

function AddChildSheet({ visible, onClose, colors, isDark, editDependent, onEditDone }) {
  const { addDependent, updateDependent } = useFamilyStore();
  const isEdit = !!editDependent;

  const [name, setName]       = useState('');
  const [age, setAge]         = useState('');
  const [gender, setGender]   = useState(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      if (isEdit) {
        setName(editDependent.name || '');
        setAge(editDependent.age != null ? String(editDependent.age) : '');
        setGender(editDependent.gender || null);
        const ci = CHILD_COLORS.indexOf(editDependent.color);
        setColorIdx(ci >= 0 ? ci : 0);
        const ei = CHILD_EMOJIS.indexOf(editDependent.emoji);
        setEmojiIdx(ei >= 0 ? ei : 0);
      } else {
        setName(''); setAge(''); setGender(null); setColorIdx(0); setEmojiIdx(0);
      }
    }
    sheetAnim(visible, slideAnim);
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const dto = {
        name:   name.trim(),
        age:    age ? Number(age) : undefined,
        gender: gender || undefined,
        color:  CHILD_COLORS[colorIdx],
        emoji:  CHILD_EMOJIS[emojiIdx],
      };
      if (isEdit) {
        await updateDependent(editDependent.id, dto);
        onEditDone?.();
      } else {
        await addDependent(dto);
      }
      onClose();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  };

  const bg      = isDark ? '#0E0E1F' : '#FFFFFF';
  const inputBg = isDark ? '#1A1A2E' : '#F3F0FF';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.12)';
  const subTxt  = { color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 6 };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={S.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[S.sheet, { backgroundColor: bg, transform: [{ translateY: slideAnim }] }]}>
          <View style={[S.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#D0D0E8' }]} />
          <Text style={[S.sheetTitle, { color: colors.textPrimary }]}>{isEdit ? 'Edit Child' : 'Add Child'}</Text>
          <Text style={[S.sheetSub, { color: colors.textSecondary }]}>
            Children don't need their own account — they're tracked within your family.
          </Text>

          {/* Name */}
          <View style={[S.searchRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
            <TextInput
              style={[S.searchInput, { color: colors.textPrimary }]}
              placeholder="Child's name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={40}
              returnKeyType="done"
            />
          </View>

          {/* Age + Gender row */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[S.searchRow, { flex: 1, backgroundColor: inputBg, borderColor: borderCol }]}>
              <TextInput
                style={[S.searchInput, { color: colors.textPrimary }]}
                placeholder="Age (optional)"
                placeholderTextColor={colors.textSecondary}
                value={age}
                onChangeText={t => setAge(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="done"
              />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
              {['male', 'female', 'other'].map(g => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g === gender ? null : g)}
                  style={[S.genderChip, {
                    backgroundColor: gender === g ? colors.primary + '20' : inputBg,
                    borderColor: gender === g ? colors.primary : borderCol,
                  }]}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: gender === g ? colors.primary : colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                    {g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color picker */}
          <Text style={subTxt}>COLOUR</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {CHILD_COLORS.map((c, i) => (
              <TouchableOpacity
                key={c} onPress={() => setColorIdx(i)}
                style={[S.colorDot, { backgroundColor: c, borderWidth: colorIdx === i ? 2.5 : 0, borderColor: '#fff' }]}
                activeOpacity={0.8}
              >
                {colorIdx === i && <Ionicons name="checkmark" size={12} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Emoji picker */}
          <Text style={subTxt}>EMOJI</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CHILD_EMOJIS.map((e, i) => (
              <TouchableOpacity
                key={e} onPress={() => setEmojiIdx(i)}
                style={[S.emojiChip, {
                  backgroundColor: emojiIdx === i ? colors.primary + '20' : inputBg,
                  borderColor: emojiIdx === i ? colors.primary : borderCol,
                }]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[S.createBtn, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.5 }]}
            onPress={handleSave}
            disabled={loading || !name.trim()}
            activeOpacity={0.82}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.createBtnTxt}>{isEdit ? 'Save Changes' : 'Add Child'}</Text>}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Pending Invites Sheet ────────────────────────────────────────────────────

function PendingInvitesSheet({ visible, onClose, colors, isDark }) {
  const { pendingInvites, fetchPendingInvites, acceptInvite, declineInvite } = useFamilyStore();
  const [loadingId, setLoadingId] = useState(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) fetchPendingInvites();
    sheetAnim(visible, slideAnim);
  }, [visible]);

  const respond = async (inviteId, accept) => {
    setLoadingId(inviteId);
    try {
      if (accept) { await acceptInvite(inviteId); onClose(); }
      else        { await declineInvite(inviteId); }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    } finally { setLoadingId(null); }
  };

  const bg = isDark ? '#0E0E1F' : '#FFFFFF';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[S.sheet, { backgroundColor: bg, position: 'absolute', bottom: 0, left: 0, right: 0, transform: [{ translateY: slideAnim }] }]}>
        <View style={[S.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#D0D0E8' }]} />
        <Text style={[S.sheetTitle, { color: colors.textPrimary }]}>Family Invites</Text>

        {pendingInvites.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
            <Ionicons name="mail-open-outline" size={36} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No pending invites</Text>
          </View>
        ) : (
          pendingInvites.map(inv => (
            <View key={inv.id} style={[S.inviteCard, { backgroundColor: isDark ? '#1A1A2E' : '#F3F0FF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.15)' }]}>
              <View style={[S.inviteIcon, { backgroundColor: '#6C63FF20' }]}>
                <Ionicons name="people" size={18} color="#6C63FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontWeight: '700', fontSize: 14 }, { color: colors.textPrimary }]}>{inv.familyName}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  Invited by {inv.invitedByName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[S.inviteBtn, { backgroundColor: '#FF6B6B15', borderColor: '#FF6B6B40' }]}
                  onPress={() => respond(inv.id, false)}
                  disabled={!!loadingId}
                  activeOpacity={0.8}
                >
                  {loadingId === inv.id ? <ActivityIndicator size="small" color="#FF6B6B" /> : <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '700' }}>Decline</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.inviteBtn, { backgroundColor: '#4CAF8220', borderColor: '#4CAF8240' }]}
                  onPress={() => respond(inv.id, true)}
                  disabled={!!loadingId}
                  activeOpacity={0.8}
                >
                  {loadingId === inv.id ? <ActivityIndicator size="small" color="#4CAF82" /> : <Text style={{ color: '#4CAF82', fontSize: 12, fontWeight: '700' }}>Accept</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Create Family Sheet ──────────────────────────────────────────────────────

function CreateFamilySheet({ visible, onClose, onCreated, colors, isDark }) {
  const { createFamily } = useFamilyStore();
  const [name, setName]   = useState('');
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => { if (visible) setName(''); sheetAnim(visible, slideAnim); }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try { await createFamily(name.trim()); onCreated?.(); onClose(); }
    catch (e) { Alert.alert('Error', e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  const bg = isDark ? '#0E0E1F' : '#FFFFFF';
  const inputBg = isDark ? '#1A1A2E' : '#F3F0FF';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.12)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={S.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[S.sheet, { backgroundColor: bg, transform: [{ translateY: slideAnim }] }]}>
          <View style={[S.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#D0D0E8' }]} />
          <Text style={[S.sheetTitle, { color: colors.textPrimary }]}>Create Your Family</Text>
          <Text style={[S.sheetSub, { color: colors.textSecondary }]}>Give your family a name to get started</Text>
          <View style={[S.searchRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
            <TextInput style={[S.searchInput, { color: colors.textPrimary }]} placeholder="e.g. Singh Family" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} maxLength={50} returnKeyType="done" onSubmitEditing={handleCreate} />
          </View>
          <TouchableOpacity style={[S.createBtn, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.5 }]} onPress={handleCreate} disabled={loading || !name.trim()} activeOpacity={0.82}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.createBtnTxt}>Create Family</Text>}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Join Family Sheet ────────────────────────────────────────────────────────

function JoinFamilySheet({ visible, onClose, colors, isDark }) {
  const { joinFamily, fetchFamily } = useFamilyStore();
  const [code, setCode]   = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => { if (visible) { setCode(''); setErr(''); } sheetAnim(visible, slideAnim); }, [visible]);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true); setErr('');
    try { await joinFamily(code.trim()); await fetchFamily(); onClose(); }
    catch (e) { setErr(e.response?.data?.message || 'Invalid or expired invite code'); }
    finally { setLoading(false); }
  };

  const bg = isDark ? '#0E0E1F' : '#FFFFFF';
  const inputBg = isDark ? '#1A1A2E' : '#F3F0FF';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.12)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={S.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[S.sheet, { backgroundColor: bg, transform: [{ translateY: slideAnim }] }]}>
          <View style={[S.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#D0D0E8' }]} />
          <Text style={[S.sheetTitle, { color: colors.textPrimary }]}>Join a Family</Text>
          <Text style={[S.sheetSub, { color: colors.textSecondary }]}>Enter the 8-character invite code shared by the admin</Text>
          <View style={[S.searchRow, { backgroundColor: inputBg, borderColor: err ? '#EF4444' : borderCol }]}>
            <TextInput
              style={[S.searchInput, { color: colors.textPrimary, letterSpacing: 3, fontWeight: '700' }]}
              placeholder="e.g. ABC12345"
              placeholderTextColor={colors.textSecondary}
              value={code}
              onChangeText={t => { setCode(t.toUpperCase()); setErr(''); }}
              maxLength={8} autoCapitalize="characters"
              returnKeyType="done" onSubmitEditing={handleJoin}
            />
          </View>
          {!!err && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: -4 }}>{err}</Text>}
          <TouchableOpacity
            style={[S.createBtn, { backgroundColor: colors.primary, opacity: code.trim().length >= 6 ? 1 : 0.5 }]}
            onPress={handleJoin} disabled={loading || code.trim().length < 6} activeOpacity={0.82}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.createBtnTxt}>Join Family</Text>}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────

const MEMBER_GRADIENTS = [
  ['#6C63FF','#9C27B0'], ['#FF6B9D','#FF4081'], ['#4CAF82','#26C6DA'],
  ['#FFB347','#FF6B6B'], ['#3B82F6','#6C63FF'], ['#9C27B0','#FF6B9D'], ['#26C6DA','#4CAF82'],
];

function MemberCard({ member, index, onPress, onLongPress, colors, isDark }) {
  const grad    = MEMBER_GRADIENTS[index % MEMBER_GRADIENTS.length];
  const isChild = member.role === 'child';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)';
  const cardBrd = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  return (
    <TouchableOpacity
      style={[S.memberCard, { backgroundColor: cardBg, borderColor: cardBrd }]}
      onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}
    >
      <LinearGradient colors={grad} style={S.memberCardAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {member.avatar
          ? <Image source={{ uri: member.avatar }} style={S.memberCardAvatarImg} />
          : isChild
            ? <Text style={{ fontSize: 18 }}>{member.emoji || '👶'}</Text>
            : <Text style={S.memberCardInitial}>{member.name[0]}</Text>}
        {!isChild && (
          <View style={[S.memberCardDot, {
            backgroundColor: member.status === 'At Home' ? '#4CAF82' : '#FFB347',
            borderColor: isDark ? '#0E0E1F' : '#fff',
          }]} />
        )}
      </LinearGradient>
      <Text style={[S.memberCardName, { color: colors.textPrimary }]} numberOfLines={1}>{member.name.split(' ')[0]}</Text>
      <Text style={[S.memberCardRole, { color: isChild ? '#FFB347' : member.role === 'admin' ? '#6C63FF' : colors.textSecondary }]}>
        {isChild ? (member.age ? `Age ${member.age}` : 'Child') : member.role === 'admin' ? 'Admin' : 'Member'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FamilyScreen() {
  const { colors, isDark }   = useTheme();
  const {
    family, members, dependents, pendingInvites,
    isAdmin, loading,
    fetchFamily, fetchPendingInvites, removeMember, removeDependent,
  } = useFamilyStore();
  const { width: screenW } = useWindowDimensions();
  const mountAnim = useRef(new Animated.Value(0)).current;

  const [showInvite,   setShowInvite]   = useState(false);
  const [showChild,    setShowChild]    = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [showJoin,     setShowJoin]     = useState(false);
  const [showInvites,  setShowInvites]  = useState(false);
  const [editDependent, setEditDependent] = useState(null);

  useFocusEffect(useCallback(() => {
    fetchFamily();
    fetchPendingInvites();
  }, []));

  useEffect(() => {
    Animated.timing(mountAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const handleRemoveMember = (member) => {
    Alert.alert('Remove Member', `Remove ${member.name} from your family?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await removeMember(member.id); }
        catch (e) { Alert.alert('Error', e.response?.data?.message || e.message); }
      }},
    ]);
  };

  const handleRemoveDependent = (dep) => {
    Alert.alert('Remove Child', `Remove ${dep.name} from your family?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await removeDependent(dep.id); }
        catch (e) { Alert.alert('Error', e.response?.data?.message || e.message); }
      }},
    ]);
  };

  const handleMemberLongPress = (member) => {
    if (!isAdmin || member.role === 'admin') return;
    Alert.alert(member.name, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove from Family', style: 'destructive', onPress: () => handleRemoveMember(member) },
    ]);
  };

  const handleDependentLongPress = (dep) => {
    if (!isAdmin) return;
    Alert.alert(dep.name, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => setEditDependent(dep) },
      { text: 'Remove', style: 'destructive', onPress: () => handleRemoveDependent(dep) },
    ]);
  };

  if (!loading && !family) {
    return (
      <View style={[S.emptyWrap, { flex: 1 }]}>
        <LinearGradient colors={['#6C63FF22', '#FF6B9D11']} style={S.emptyIconWrap}>
          <Ionicons name="people" size={36} color={colors.primary} />
        </LinearGradient>
        <Text style={[S.emptyTitle, { color: colors.textPrimary }]}>No Family Yet</Text>
        <Text style={[S.emptySub, { color: colors.textSecondary }]}>Create your family group and start adding members</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.82}>
          <LinearGradient colors={['#6C63FF', '#9C27B0']} style={S.emptyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={S.emptyBtnTxt}>Create Family</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowJoin(true)} activeOpacity={0.75} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <Ionicons name="key-outline" size={15} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Join with Invite Code</Text>
        </TouchableOpacity>
        {pendingInvites.length > 0 && (
          <TouchableOpacity onPress={() => setShowInvites(true)} activeOpacity={0.75} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
            <View style={S.inviteDot}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{pendingInvites.length}</Text></View>
            <Text style={{ color: '#FF6B9D', fontSize: 13, fontWeight: '600' }}>View Family Invites</Text>
          </TouchableOpacity>
        )}
        <CreateFamilySheet visible={showCreate} onClose={() => setShowCreate(false)} colors={colors} isDark={isDark} />
        <JoinFamilySheet   visible={showJoin}   onClose={() => setShowJoin(false)}   colors={colors} isDark={isDark} />
        <PendingInvitesSheet visible={showInvites} onClose={() => setShowInvites(false)} colors={colors} isDark={isDark} />
      </View>
    );
  }

  const totalCount = members.length + dependents.length;
  const slotsLeft  = (family?.limit ?? 5) - (family?.memberCount ?? members.length);

  return (
    <ScrollView style={S.scroll} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
      <Animated.View style={{
        opacity: mountAnim,
        transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        gap: 14,
      }}>

        {/* ── Pending Invites Banner ── */}
        {pendingInvites.length > 0 && (
          <TouchableOpacity onPress={() => setShowInvites(true)} activeOpacity={0.85}>
            <LinearGradient colors={['#FF6B9D', '#9C27B0']} style={S.inviteBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={S.inviteDot}><Text style={{ color: '#FF6B9D', fontSize: 11, fontWeight: '800' }}>{pendingInvites.length}</Text></View>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 }}>
                You have {pendingInvites.length} pending family invite{pendingInvites.length > 1 ? 's' : ''}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Hero Card ── */}
        <LinearGradient
          colors={isDark ? ['#1A0A3B', '#0D1929', '#0A0A1A'] : ['#6C63FF', '#9C27B0', '#3B82F6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={S.heroCard}
        >
          <View style={[S.orb, { top: -30, right: -30, backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[S.orb, { bottom: -20, left: 40, width: 100, height: 100, backgroundColor: 'rgba(255,107,157,0.10)' }]} />

          <View style={S.heroTop}>
            <View>
              <Text style={S.heroLabel}>FAMILY GROUP</Text>
              <Text style={S.heroName}>{loading ? '...' : (family?.name || 'My Family')}</Text>
            </View>
            {family?.plan === 'premium'
              ? <View style={S.premiumBadge}><Ionicons name="star" size={10} color="#FFB347" /><Text style={S.premiumTxt}>Premium</Text></View>
              : <View style={S.freeBadge}><Text style={S.freeTxt}>Free</Text></View>}
          </View>

          <View style={S.heroStats}>
            <View style={S.heroStat}>
              <Text style={S.heroStatVal}>{members.length}</Text>
              <Text style={S.heroStatLabel}>Adults</Text>
            </View>
            <View style={S.heroStatSep} />
            <View style={S.heroStat}>
              <Text style={S.heroStatVal}>{dependents.length}</Text>
              <Text style={S.heroStatLabel}>Children</Text>
            </View>
            <View style={S.heroStatSep} />
            <View style={S.heroStat}>
              <Text style={S.heroStatVal}>{family?.limit ?? 5}</Text>
              <Text style={S.heroStatLabel}>Limit</Text>
            </View>
            <View style={S.heroStatSep} />
            <TouchableOpacity
              style={S.heroStat} activeOpacity={0.7}
              onPress={() => { if (family?.inviteCode) { Clipboard.setString(family.inviteCode); Alert.alert('Copied!', `Invite code ${family.inviteCode} copied.`); } }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={S.heroStatVal}>{family?.inviteCode || '--'}</Text>
                <Ionicons name="copy-outline" size={11} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={S.heroStatLabel}>Code · tap to copy</Text>
            </TouchableOpacity>
          </View>

          <View style={S.progressWrap}>
            <View style={S.progressTrack}>
              <View style={[S.progressFill, { width: `${Math.min((members.length / (family?.limit ?? 5)) * 100, 100)}%` }]} />
            </View>
            <Text style={S.progressTxt}>{slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} available` : 'Family full'}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isAdmin && !family?.atAbsoluteMax && (
              <TouchableOpacity style={[S.heroAddBtn, { flex: 1 }]} onPress={() => setShowInvite(true)} activeOpacity={0.8}>
                <Ionicons name="person-add-outline" size={14} color="#fff" />
                <Text style={S.heroAddTxt}>Invite Member</Text>
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity style={[S.heroAddBtn, { flex: 1 }]} onPress={() => setShowChild(true)} activeOpacity={0.8}>
                <Text style={{ fontSize: 14 }}>👶</Text>
                <Text style={S.heroAddTxt}>Add Child</Text>
              </TouchableOpacity>
            )}
            {!isAdmin && (
              <TouchableOpacity style={[S.heroAddBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={() => setShowJoin(true)} activeOpacity={0.8}>
                <Ionicons name="key-outline" size={14} color="#fff" />
                <Text style={S.heroAddTxt}>Join with Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* ── Upgrade Banner ── */}
        {family?.needsUpgrade && (
          <LinearGradient colors={['#FF8C00', '#FFB347']} style={S.upgradeBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="star" size={16} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={S.upgradeTxt}>Upgrade to Premium</Text>
              <Text style={S.upgradeSub}>Add up to 7 members · Unlimited history</Text>
            </View>
            <TouchableOpacity style={S.upgradeBtn} activeOpacity={0.85} onPress={() => router.push('/(app)/settings/premium')}>
              <Text style={S.upgradeBtnTxt}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* ── Adults Section ── */}
        <View style={S.sectionHeader}>
          <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Members</Text>
          <Text style={[S.sectionCount, { color: colors.textSecondary }]}>{members.length}</Text>
        </View>

        {loading && members.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 32 }}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <View style={S.memberGrid}>
            {members.map((m, i) => (
              <MemberCard
                key={m.id} member={m} index={i}
                onPress={() => router.push(`/(app)/overview/member/${m.id}`)}
                onLongPress={() => handleMemberLongPress(m)}
                colors={colors} isDark={isDark}
              />
            ))}
            {isAdmin && slotsLeft > 0 && (
              <TouchableOpacity style={[S.addSlotCard, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }]} onPress={() => setShowInvite(true)} activeOpacity={0.75}>
                <View style={[S.addSlotIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                </View>
                <Text style={[S.addSlotTxt, { color: colors.primary }]}>Invite</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Children Section ── */}
        <View style={S.sectionHeader}>
          <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Children</Text>
          <Text style={[S.sectionCount, { color: colors.textSecondary }]}>{dependents.length}</Text>
        </View>

        <View style={S.memberGrid}>
          {dependents.map((d, i) => (
            <MemberCard
              key={d.id} member={d} index={members.length + i}
              onPress={() => isAdmin && setEditDependent(d)}
              onLongPress={() => handleDependentLongPress(d)}
              colors={colors} isDark={isDark}
            />
          ))}
          {isAdmin && (
            <TouchableOpacity style={[S.addSlotCard, { borderColor: '#FFB34760', backgroundColor: '#FFB34710' }]} onPress={() => setShowChild(true)} activeOpacity={0.75}>
              <View style={[S.addSlotIcon, { backgroundColor: '#FFB34720' }]}>
                <Text style={{ fontSize: 18 }}>👶</Text>
              </View>
              <Text style={[S.addSlotTxt, { color: '#FFB347' }]}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={S.sectionHeader}>
          <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        </View>
        <View style={S.quickRow}>
          {[
            { icon: 'notifications-outline', color: '#6C63FF', label: 'Alerts',    sub: '3 unread',   grad: ['#6C63FF22','#9C27B011'] },
            { icon: 'location-outline',      color: '#FF6B9D', label: 'Location',  sub: 'All sharing', grad: ['#FF6B9D22','#FF408111'] },
            { icon: 'shield-checkmark-outline', color: '#4CAF82', label: 'Safety', sub: 'All clear',  grad: ['#4CAF8222','#26C6DA11'] },
            { icon: 'calendar-outline',      color: '#FFB347', label: 'Schedule',  sub: '2 events',   grad: ['#FFB34722','#FF6B6B11'] },
          ].map(a => (
            <TouchableOpacity key={a.label} style={{ flex: 1 }} activeOpacity={0.78}>
              <LinearGradient colors={isDark ? ['rgba(255,255,255,0.05)','rgba(255,255,255,0.02)'] : a.grad} style={[S.quickCard, { borderColor: isDark ? 'rgba(255,255,255,0.07)' : a.color + '20' }]}>
                <View style={[S.quickIcon, { backgroundColor: a.color + '20' }]}><Ionicons name={a.icon} size={16} color={a.color} /></View>
                <Text style={[S.quickLabel, { color: colors.textPrimary }]}>{a.label}</Text>
                <Text style={[S.quickSub, { color: colors.textSecondary }]}>{a.sub}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Activity ── */}
        <View style={S.sectionHeader}>
          <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
          <Text style={[S.sectionLink, { color: colors.primary }]}>See all</Text>
        </View>
        <GlassCard style={S.activityCard}>
          {[
            { icon: 'school-outline',             color: '#6C63FF', label: 'Family member checked in', time: 'Just now' },
            { icon: 'shield-checkmark-outline',    color: '#4CAF82', label: 'Home security active',    time: '2m ago' },
            { icon: 'location-outline',            color: '#FF6B9D', label: 'Location shared',          time: '10m ago' },
          ].map((act, i, arr) => (
            <View key={i}>
              <View style={S.actRow}>
                <LinearGradient colors={[act.color + '44', act.color + '11']} style={S.actIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={act.icon} size={13} color={act.color} />
                </LinearGradient>
                <Text style={[S.actLabel, { color: colors.textPrimary }]} numberOfLines={1}>{act.label}</Text>
                <Text style={[S.actTime, { color: colors.textSecondary }]}>{act.time}</Text>
              </View>
              {i < arr.length - 1 && <View style={[S.actDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', marginLeft: 50 }]} />}
            </View>
          ))}
        </GlassCard>

        <View style={{ height: 12 }} />
      </Animated.View>

      <InviteMemberSheet  visible={showInvite}   onClose={() => setShowInvite(false)}   colors={colors} isDark={isDark} />
      <AddChildSheet      visible={showChild || !!editDependent} onClose={() => { setShowChild(false); setEditDependent(null); }} colors={colors} isDark={isDark} editDependent={editDependent} onEditDone={() => setEditDependent(null)} />
      <PendingInvitesSheet visible={showInvites} onClose={() => setShowInvites(false)}  colors={colors} isDark={isDark} />
      <CreateFamilySheet  visible={showCreate}   onClose={() => setShowCreate(false)}   colors={colors} isDark={isDark} />
      <JoinFamilySheet    visible={showJoin}     onClose={() => setShowJoin(false)}      colors={colors} isDark={isDark} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 32 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 26, paddingVertical: 14, borderRadius: 999 },
  emptyBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  inviteBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14 },
  inviteDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  heroCard: { borderRadius: 20, padding: 18, gap: 14, overflow: 'hidden', shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  orb: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2 },
  heroName: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 2, letterSpacing: -0.3 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,179,71,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,179,71,0.35)' },
  premiumTxt: { fontSize: 11, fontWeight: '700', color: '#FFB347' },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  freeTxt: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  heroStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, paddingVertical: 10 },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatVal: { fontSize: 15, fontWeight: '800', color: '#fff' },
  heroStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '600', letterSpacing: 0.3 },
  heroStatSep: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)' },

  progressWrap: { gap: 6 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 99 },
  progressTxt: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },

  heroAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroAddTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  upgradeBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16 },
  upgradeTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  upgradeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 },
  upgradeBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  upgradeBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  sectionCount: { fontSize: 13, fontWeight: '600' },
  sectionLink: { fontSize: 13, fontWeight: '600' },

  memberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberCard: { width: '22%', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 5, borderWidth: 1 },
  memberCardAvatar: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  memberCardAvatarImg: { width: 38, height: 38, borderRadius: 12 },
  memberCardInitial: { color: '#fff', fontSize: 15, fontWeight: '800' },
  memberCardDot: { position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  memberCardName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  memberCardRole: { fontSize: 9, fontWeight: '600' },

  addSlotCard: { width: '22%', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 5, borderWidth: 1.5, borderStyle: 'dashed' },
  addSlotIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addSlotTxt: { fontSize: 11, fontWeight: '700' },

  quickRow: { flexDirection: 'row', gap: 8 },
  quickCard: { borderRadius: 14, padding: 10, gap: 4, borderWidth: 1 },
  quickIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  quickLabel: { fontSize: 11, fontWeight: '700' },
  quickSub: { fontSize: 10 },

  activityCard: { padding: 0, overflow: 'hidden' },
  actRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  actIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
  actTime: { fontSize: 11 },
  actDivider: { height: 0.5, marginRight: 14 },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 42, gap: 14 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetSub: { fontSize: 13, lineHeight: 18, marginTop: -8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  searchInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontWeight: '600' },
  searchBtn: { paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6 },
  errTxt: { color: '#FF6B6B', fontSize: 13 },
  foundCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  foundAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  foundAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  foundAvatarTxt: { fontSize: 14, fontWeight: '800' },
  foundName: { fontSize: 14, fontWeight: '700' },
  foundId: { fontSize: 11, marginTop: 2 },
  addConfirmBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  addConfirmTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6 },
  slotTxt: { fontSize: 12, fontWeight: '500' },
  createBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  createBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  genderChip: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, paddingVertical: 12 },
  colorDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiChip: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  inviteIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inviteBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
});
