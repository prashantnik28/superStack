import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, FlatList, Modal, TextInput,
  Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useWardrobeStore, PERSONAL_CATEGORIES, HOME_CATEGORIES } from '../../../src/stores/useWardrobeStore';
import AppBottomNav from '../../../src/components/ui/AppBottomNav';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 48) / 2;

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_ITEMS = [
  { id: 'm1',  name: 'White Linen Shirt',  category: 'Tops',        color: '#C5CAE9', brand: 'Zara',      size: 'M',  season: 'Summer',  wears: 12, isClean: true,  wardrobeType: 'personal' },
  { id: 'm2',  name: 'Navy Blazer',         category: 'Tops',        color: '#1A237E', brand: 'H&M',       size: 'M',  season: 'Winter',  wears: 5,  isClean: true,  wardrobeType: 'personal' },
  { id: 'm3',  name: 'Black Slim Jeans',    category: 'Bottoms',     color: '#212121', brand: "Levi's",    size: '32', season: 'All',     wears: 23, isClean: false, wardrobeType: 'personal' },
  { id: 'm4',  name: 'Floral Midi Dress',   category: 'Dresses',     color: '#E91E63', brand: 'Mango',     size: 'S',  season: 'Summer',  wears: 4,  isClean: true,  wardrobeType: 'personal' },
  { id: 'm5',  name: 'White Sneakers',      category: 'Footwear',    color: '#EEEEEE', brand: 'Nike',      size: '8',  season: 'All',     wears: 31, isClean: false, wardrobeType: 'personal' },
  { id: 'm6',  name: 'Gold Hoops',          category: 'Accessories', color: '#FFD700', brand: 'Tanishq',   size: '-',  season: 'All',     wears: 18, isClean: true,  wardrobeType: 'personal' },
  { id: 'm7',  name: 'Olive Trench Coat',   category: 'Outerwear',   color: '#558B2F', brand: 'M&S',       size: 'L',  season: 'Winter',  wears: 7,  isClean: true,  wardrobeType: 'personal' },
  { id: 'm8',  name: 'Striped Tee',         category: 'Tops',        color: '#90CAF9', brand: 'Uniqlo',    size: 'M',  season: 'Summer',  wears: 15, isClean: true,  wardrobeType: 'personal' },
  { id: 'm9',  name: 'Beige Chinos',        category: 'Bottoms',     color: '#D7CCC8', brand: 'Gap',       size: '30', season: 'All',     wears: 9,  isClean: true,  wardrobeType: 'personal' },
  { id: 'm10', name: 'Silk Blouse',         category: 'Tops',        color: '#F48FB1', brand: 'Vero Moda', size: 'S',  season: 'All',     wears: 6,  isClean: false, wardrobeType: 'personal' },
];
const MOCK_STATS = { total: 10, laundry: 3, lastAdded: 'Silk Blouse' };

const CAT_ICONS = {
  All: 'apps-outline', Tops: 'shirt-outline', Bottoms: 'layers-outline', Dresses: 'flower-outline',
  Footwear: 'walk-outline', Accessories: 'sparkles-outline', Outerwear: 'snow-outline', Other: 'ellipsis-horizontal-outline',
  Bedding: 'bed-outline', Upholstery: 'home-outline', Towels: 'water-outline', 'Kitchen Linens': 'restaurant-outline', Curtains: 'browsers-outline',
};

const WARDROBE_TABS = [
  { id: 'Closet',    label: 'Closet',    icon: 'shirt-outline',    iconOn: 'shirt' },
  { id: 'Laundry',   label: 'Laundry',   icon: 'water-outline',    iconOn: 'water' },
  { center: true,    label: 'Add' },
  { id: 'Outfits',   label: 'Outfits',   icon: 'sparkles-outline', iconOn: 'sparkles' },
  { id: 'Wardrobes', label: 'Wardrobes', icon: 'layers-outline',   iconOn: 'layers' },
];

const OCCASIONS     = ['Casual', 'Office', 'Party', 'Date', 'Gym', 'Festival'];
const COLORS_PAL    = ['#EEEEEE','#212121','#1A237E','#E91E63','#4CAF50','#FF9800','#9C27B0','#795548','#F44336','#00BCD4','#FFD700','#607D8B'];
const MEMBER_COLORS = ['#6C63FF','#FF6B9D','#4CAF82','#FFB347','#3B82F6','#9C27B0'];

function memberColor(i) { return MEMBER_COLORS[i % MEMBER_COLORS.length]; }

function isLightColor(hex = '#000') {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114)/1000 > 155;
}

// ── Item Card ──────────────────────────────────────────────────────────────────
function ItemCard({ item, onPress, colors, isDark }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86}
      style={[S.card, { backgroundColor: isDark ? '#14142A' : '#fff',
        shadowColor: item.color || '#6C63FF', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 5 }]}>
      {/* Swatch */}
      <View style={[S.swatch, { backgroundColor: item.color || '#6C63FF' }]}>
        <LinearGradient colors={['rgba(0,0,0,0)','rgba(0,0,0,0.42)']} style={StyleSheet.absoluteFill} />
        {/* Big category icon centred */}
        <Ionicons name={CAT_ICONS[item.category] || 'shirt-outline'} size={32}
          color={isLightColor(item.color) ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)'}
          style={{ position:'absolute', top:'50%', left:'50%', marginTop:-16, marginLeft:-16 }} />
        {/* Season chip top-right */}
        {item.season && item.season !== 'All' && (
          <View style={S.seasonTag}><Text style={S.seasonTxt}>{item.season}</Text></View>
        )}
        {/* Wear count bottom-left */}
        <View style={S.wearBadge}>
          <Ionicons name="repeat" size={9} color="rgba(255,255,255,0.9)" />
          <Text style={S.wearTxt}>{item.wears}×</Text>
        </View>
        {/* Clean dot top-left */}
        <View style={[S.cleanDot, { backgroundColor: item.isClean ? '#4CAF82' : '#FF6B6B',
          shadowColor: item.isClean ? '#4CAF82' : '#FF6B6B', shadowOpacity:0.8, shadowRadius:4 }]} />
      </View>
      {/* Body */}
      <View style={S.cardBody}>
        <Text style={[S.cardName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:2 }}>
          <Text style={[S.cardBrand, { color: colors.textSecondary }]}>{item.brand || item.category}</Text>
          <View style={[S.statusPill, { backgroundColor: item.isClean ? '#4CAF8222' : '#FF6B6B22' }]}>
            <Text style={{ color: item.isClean ? '#4CAF82' : '#FF6B6B', fontSize:9, fontWeight:'800' }}>
              {item.isClean ? 'Clean' : 'Wash'}
            </Text>
          </View>
        </View>
        {item.size && item.size !== '-' && (
          <Text style={[S.cardSize, { color: colors.textSecondary }]}>Size {item.size}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Item Detail Sheet ──────────────────────────────────────────────────────────
function ItemDetailSheet({ item, visible, onClose, colors, isDark, onMarkWorn, onMarkClean, onDelete }) {
  const anim = useRef(new Animated.Value(500)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: visible ? 0 : 500, useNativeDriver: true, tension: 68, friction: 12 }).start();
  }, [visible]);
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor:'rgba(0,0,0,0.52)' }]} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[S.bottomSheet, { backgroundColor: isDark ? '#0E0E1F' : '#fff', transform:[{translateY: anim}] }]}>
        <View style={[S.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#DDD' }]} />
        {/* Hero */}
        <View style={[S.heroSwatch, { backgroundColor: item.color || '#6C63FF' }]}>
          <LinearGradient colors={['transparent','rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
          <Ionicons name={CAT_ICONS[item.category] || 'shirt-outline'} size={48}
            color={isLightColor(item.color) ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'}
            style={{ position:'absolute', top:20, right:20 }} />
          <View style={{ position:'absolute', bottom:18, left:18 }}>
            <Text style={{ color:'#fff', fontSize:22, fontWeight:'900', letterSpacing:-0.3 }}>{item.name}</Text>
            <Text style={{ color:'rgba(255,255,255,0.75)', fontSize:13, marginTop:3 }}>
              {item.category}{item.brand ? ` · ${item.brand}` : ''}
            </Text>
          </View>
        </View>
        {/* Stats row */}
        <View style={{ flexDirection:'row', paddingHorizontal:20, paddingVertical:16 }}>
          {[
            { label:'Season', value: item.season||'All',            icon:'sunny-outline',        color:'#FFB347' },
            { label:'Size',   value: item.size||'—',                 icon:'resize-outline',        color:'#6C63FF' },
            { label:'Worn',   value: `${item.wears}×`,               icon:'repeat-outline',        color:'#FF6B9D' },
            { label:'Status', value: item.isClean ? 'Clean':'Wash',  icon: item.isClean ? 'checkmark-circle-outline':'water-outline', color: item.isClean ? '#4CAF82':'#FF6B6B' },
          ].map(s => (
            <View key={s.label} style={{ flex:1, alignItems:'center', gap:5 }}>
              <View style={{ width:34, height:34, borderRadius:11, backgroundColor: s.color+'22', alignItems:'center', justifyContent:'center' }}>
                <Ionicons name={s.icon} size={15} color={s.color} />
              </View>
              <Text style={{ color: colors.textPrimary, fontWeight:'800', fontSize:14 }}>{s.value}</Text>
              <Text style={{ color: colors.textSecondary, fontSize:10 }}>{s.label}</Text>
            </View>
          ))}
        </View>
        {/* Actions */}
        <View style={{ flexDirection:'row', paddingHorizontal:16, gap:8 }}>
          <TouchableOpacity onPress={onMarkWorn} activeOpacity={0.8}
            style={{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7, paddingVertical:13, backgroundColor:'#FF6B6B18', borderRadius:14 }}>
            <Ionicons name="repeat" size={16} color="#FF6B6B" />
            <Text style={{ color:'#FF6B6B', fontWeight:'700', fontSize:13 }}>Worn Today</Text>
          </TouchableOpacity>
          {!item.isClean && (
            <TouchableOpacity onPress={onMarkClean} activeOpacity={0.8}
              style={{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7, paddingVertical:13, backgroundColor:'#4CAF8218', borderRadius:14 }}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF82" />
              <Text style={{ color:'#4CAF82', fontWeight:'700', fontSize:13 }}>Mark Clean</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDelete} activeOpacity={0.8}
            style={{ width:48, alignItems:'center', justifyContent:'center', backgroundColor:'#FF6B6B15', borderRadius:14 }}>
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Add Item Sheet ─────────────────────────────────────────────────────────────
function AddItemSheet({ visible, onClose, colors, isDark, defaultType = 'personal', defaultMemberId }) {
  const { addItem } = useWardrobeStore();
  const { user }    = useAuthStore();
  const [name, setName]     = useState('');
  const [cat, setCat]       = useState('Tops');
  const [color, setColor]   = useState('#6C63FF');
  const [brand, setBrand]   = useState('');
  const [size, setSize]     = useState('');
  const [season, setSeason] = useState('All');
  const [wType, setWType]   = useState(defaultType);
  const [loading, setLoading] = useState(false);
  const anim = useRef(new Animated.Value(700)).current;

  useEffect(() => {
    if (visible) {
      setName(''); setCat('Tops'); setColor('#6C63FF'); setBrand(''); setSize(''); setSeason('All'); setWType(defaultType);
      Animated.spring(anim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 11 }).start();
    } else {
      Animated.timing(anim, { toValue: 700, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [visible]);

  const cats    = wType === 'home' ? HOME_CATEGORIES.slice(1) : PERSONAL_CATEGORIES.slice(1);
  const inputBg = isDark ? '#1A1A2E' : '#F5F4FF';
  const brd     = isDark ? 'rgba(108,99,255,0.3)' : 'rgba(108,99,255,0.2)';

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Enter item name');
    setLoading(true);
    try {
      await addItem({ name: name.trim(), category: cat, color, brand, size, season, wardrobeType: wType, memberId: wType === 'home' ? null : (defaultMemberId || user?._id) });
      onClose();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor:'rgba(0,0,0,0.55)' }]} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[S.bottomSheet, { backgroundColor: isDark ? '#0E0E1F' : '#fff', maxHeight:'92%', padding:20, transform:[{translateY: anim}] }]}>
        <View style={[S.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#DDD' }]} />
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <Text style={{ color: colors.textPrimary, fontSize:20, fontWeight:'900' }}>Add to Wardrobe</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap:16 }}>
          {/* Type */}
          <View style={{ flexDirection:'row', gap:8 }}>
            {[['personal','Personal','person-outline'],['home','Home','home-outline']].map(([v,l,ic]) => (
              <TouchableOpacity key={v} onPress={() => { setWType(v); setCat(v==='home'?'Bedding':'Tops'); }}
                style={[S.typeBtn, { flex:1, backgroundColor: wType===v ? '#6C63FF15' : inputBg, borderColor: wType===v ? '#6C63FF' : brd }]} activeOpacity={0.8}>
                <Ionicons name={ic} size={14} color={wType===v ? '#6C63FF' : colors.textSecondary} />
                <Text style={{ color: wType===v ? '#6C63FF' : colors.textSecondary, fontWeight:'700', fontSize:13 }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Name */}
          <View style={[S.inputRow, { backgroundColor: inputBg, borderColor: brd }]}>
            <Ionicons name="shirt-outline" size={16} color={colors.textSecondary} style={{ marginLeft:12 }} />
            <TextInput style={[S.textInput, { color: colors.textPrimary }]} placeholder="Item name *"
              placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
          </View>
          {/* Brand + Size */}
          <View style={{ flexDirection:'row', gap:10 }}>
            {[['Brand', brand, setBrand], ['Size', size, setSize]].map(([ph, val, setter]) => (
              <View key={ph} style={[S.inputRow, { flex:1, backgroundColor: inputBg, borderColor: brd }]}>
                <TextInput style={[S.textInput, { color: colors.textPrimary }]} placeholder={ph}
                  placeholderTextColor={colors.textSecondary} value={val} onChangeText={setter} />
              </View>
            ))}
          </View>
          {/* Category */}
          <View style={{ gap:8 }}>
            <Text style={[S.sectionLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, alignItems:'center' }}>
              {cats.map(c => (
                <TouchableOpacity key={c} onPress={() => setCat(c)} activeOpacity={0.8}
                  style={[S.filterChip, { backgroundColor: cat===c ? '#6C63FF' : inputBg, borderColor: cat===c ? '#6C63FF' : brd }]}>
                  <Text style={{ color: cat===c ? '#fff' : colors.textSecondary, fontWeight:'700', fontSize:12 }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Season */}
          {wType === 'personal' && (
            <View style={{ gap:8 }}>
              <Text style={[S.sectionLabel, { color: colors.textSecondary }]}>SEASON</Text>
              <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}>
                {['All','Summer','Winter','Monsoon'].map(s => (
                  <TouchableOpacity key={s} onPress={() => setSeason(s)} activeOpacity={0.8}
                    style={[S.filterChip, { backgroundColor: season===s ? '#FFB347' : inputBg, borderColor: season===s ? '#FFB347' : brd }]}>
                    <Text style={{ color: season===s ? '#fff' : colors.textSecondary, fontWeight:'700', fontSize:12 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {/* Color */}
          <View style={{ gap:8 }}>
            <Text style={[S.sectionLabel, { color: colors.textSecondary }]}>COLOUR</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
              {COLORS_PAL.map(c => (
                <TouchableOpacity key={c} onPress={() => setColor(c)} activeOpacity={0.85}
                  style={[S.colorDot, { backgroundColor: c, borderWidth: color===c ? 3 : 1,
                    borderColor: color===c ? '#6C63FF' : 'rgba(0,0,0,0.1)',
                    shadowColor: color===c ? '#6C63FF' : 'transparent', shadowOpacity:0.5, shadowRadius:5 }]}>
                  {color===c && <Ionicons name="checkmark" size={12} color={isLightColor(c) ? '#333' : '#fff'} />}
                </TouchableOpacity>
              ))}
            </View>
            <View style={[S.colorPreview, { backgroundColor: color }]}>
              <LinearGradient colors={['transparent','rgba(0,0,0,0.38)']} style={StyleSheet.absoluteFill} />
              <Text style={{ color:'#fff', fontSize:12, fontWeight:'700', position:'absolute', bottom:10, left:14,
                textShadowColor:'rgba(0,0,0,0.5)', textShadowRadius:4 }}>
                {name || 'Preview'}
              </Text>
            </View>
          </View>
          {/* Save */}
          <TouchableOpacity onPress={handleSave} disabled={loading || !name.trim()} activeOpacity={0.85}>
            <LinearGradient colors={['#6C63FF','#9C27B0']} style={[S.saveBtn, { opacity: name.trim() ? 1 : 0.42 }]} start={{x:0,y:0}} end={{x:1,y:0}}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color:'#fff', fontWeight:'900', fontSize:15 }}>Add to Wardrobe</Text>
              </>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Closet Tab ─────────────────────────────────────────────────────────────────
function ClosetTab({ wardrobeType, memberId, colors, isDark, onAdd }) {
  const { items: storeItems, stats: storeStats, loading, fetchItems, fetchStats, markWorn, markClean, deleteItem } = useWardrobeStore();
  const [cat, setCat]     = useState('All');
  const [view, setView]   = useState('grid');
  const [sel, setSel]     = useState(null);

  const categories = wardrobeType === 'home' ? HOME_CATEGORIES : PERSONAL_CATEGORIES;

  useFocusEffect(useCallback(() => {
    fetchItems(wardrobeType, memberId).catch(() => {});
    if (wardrobeType === 'personal') fetchStats(memberId).catch(() => {});
  }, [wardrobeType, memberId]));

  useEffect(() => { setCat('All'); fetchItems(wardrobeType, memberId).catch(() => {}); }, [wardrobeType, memberId]);

  // Fall back to mock data when API is empty (no real backend items yet)
  const items  = storeItems.length > 0 ? storeItems : MOCK_ITEMS.filter(i => i.wardrobeType === (wardrobeType || 'personal'));
  const stats  = storeItems.length > 0 ? storeStats : MOCK_STATS;
  const filtered = cat === 'All' ? items : items.filter(i => i.category === cat);

  return (
    <View style={{ flex:1 }}>
      {/* Stats banner */}
      {wardrobeType === 'personal' && (
        <LinearGradient colors={isDark ? ['#1A1A2E','#0F0F23'] : ['#EDE9FF','#F5F3FF']}
          style={S.statsBanner} start={{x:0,y:0}} end={{x:1,y:1}}>
          {[
            { v: stats.total,                            l:'Total',   icon:'shirt',             c:'#6C63FF' },
            { v: stats.laundry,                          l:'Laundry', icon:'water',              c:'#FF6B6B' },
            { v: Math.max(0, stats.total-stats.laundry), l:'Clean',   icon:'checkmark-circle',   c:'#4CAF82' },
          ].map((s, i) => (
            <React.Fragment key={s.l}>
              <View style={S.statCell}>
                <View style={[S.statIconBox, { backgroundColor: s.c + '28' }]}>
                  <Ionicons name={s.icon} size={16} color={s.c} />
                </View>
                <Text style={[S.statNum, { color: colors.textPrimary }]}>{s.v}</Text>
                <Text style={[S.statLbl, { color: colors.textSecondary }]}>{s.l}</Text>
              </View>
              {i < 2 && <View style={[S.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />}
            </React.Fragment>
          ))}
        </LinearGradient>
      )}

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:16, gap:8, paddingVertical:12, alignItems:'center' }}>
        {categories.map(c => {
          const on = cat === c;
          return (
            <TouchableOpacity key={c} onPress={() => setCat(c)} activeOpacity={0.8}
              style={[S.catChip, { backgroundColor: on ? '#6C63FF' : (isDark ? 'rgba(255,255,255,0.07)' : '#EDE9FF') }]}>
              <Ionicons name={CAT_ICONS[c] || 'apps-outline'} size={12} color={on ? '#fff' : '#6C63FF'} />
              <Text style={{ color: on ? '#fff' : '#6C63FF', fontWeight:'700', fontSize:12 }}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Toolbar */}
      <View style={[S.toolbar, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <Text style={{ color: colors.textSecondary, fontSize:12, fontWeight:'600' }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </Text>
        <View style={{ flexDirection:'row', gap:4 }}>
          {['grid','list'].map(m => (
            <TouchableOpacity key={m} onPress={() => setView(m)} activeOpacity={0.8}
              style={[S.viewToggle, { backgroundColor: view===m ? (isDark ? 'rgba(108,99,255,0.25)' : '#EDE9FF') : 'transparent' }]}>
              <Ionicons name={`${m}-outline`} size={16} color={view===m ? '#6C63FF' : colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator color="#6C63FF" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:14, padding:32 }}>
          <LinearGradient colors={['#6C63FF22','#6C63FF0A']} style={{ width:90, height:90, borderRadius:28, alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="shirt-outline" size={42} color="#6C63FF" />
          </LinearGradient>
          <Text style={{ color: colors.textPrimary, fontSize:19, fontWeight:'900' }}>Nothing here yet</Text>
          <Text style={{ color: colors.textSecondary, fontSize:13, textAlign:'center', lineHeight:20 }}>
            Add your first {cat !== 'All' ? cat.toLowerCase() : 'item'} to start your wardrobe.
          </Text>
          <TouchableOpacity onPress={onAdd} activeOpacity={0.85}>
            <LinearGradient colors={['#6C63FF','#9C27B0']} style={{ flexDirection:'row', gap:8, alignItems:'center', paddingHorizontal:26, paddingVertical:14, borderRadius:16 }} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color:'#fff', fontWeight:'800', fontSize:14 }}>Add Item</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : view === 'grid' ? (
        <FlatList key="grid" data={filtered} keyExtractor={i => i.id} numColumns={2}
          columnWrapperStyle={{ gap:12, paddingHorizontal:16 }}
          contentContainerStyle={{ gap:12, paddingTop:8, paddingBottom:130 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ItemCard item={item} onPress={() => setSel(item)} colors={colors} isDark={isDark} />} />
      ) : (
        <FlatList key="list" data={filtered} keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal:16, gap:8, paddingBottom:130 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSel(item)} activeOpacity={0.8}
              style={[S.listRow, { backgroundColor: isDark ? '#14142A' : '#fff',
                borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', borderWidth:1 }]}>
              <View style={[S.listSwatch, { backgroundColor: item.color }]}>
                <Ionicons name={CAT_ICONS[item.category] || 'shirt-outline'} size={16} color="rgba(255,255,255,0.75)" />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight:'700', fontSize:14 }} numberOfLines={1}>{item.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize:11, marginTop:2 }}>
                  {item.brand || item.category}{item.size && item.size !== '-' ? ` · Size ${item.size}` : ''}
                </Text>
              </View>
              <View style={{ alignItems:'flex-end', gap:4 }}>
                <View style={[S.statusPill, { backgroundColor: item.isClean ? '#4CAF8222' : '#FF6B6B22' }]}>
                  <Text style={{ color: item.isClean ? '#4CAF82' : '#FF6B6B', fontSize:9, fontWeight:'800' }}>{item.isClean ? 'Clean':'Wash'}</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize:10 }}>{item.wears}× worn</Text>
              </View>
            </TouchableOpacity>
          )} />
      )}

      <ItemDetailSheet item={sel} visible={!!sel} onClose={() => setSel(null)} colors={colors} isDark={isDark}
        onMarkWorn={async () => { try { await markWorn(sel.id); setSel(null); } catch {} }}
        onMarkClean={async () => { try { await markClean(sel.id); setSel(null); } catch {} }}
        onDelete={() => Alert.alert('Delete', `Remove "${sel?.name}"?`, [
          { text:'Cancel', style:'cancel' },
          { text:'Delete', style:'destructive', onPress: async () => { await deleteItem(sel.id); setSel(null); } },
        ])} />
    </View>
  );
}

// ── Laundry Tab ────────────────────────────────────────────────────────────────
function LaundryTab({ memberId, colors, isDark }) {
  const { items: storeItems, fetchItems, markClean } = useWardrobeStore();
  useFocusEffect(useCallback(() => { fetchItems('personal', memberId).catch(() => {}); }, [memberId]));

  const items = storeItems.length > 0 ? storeItems : MOCK_ITEMS;
  const dirty = items.filter(i => !i.isClean);

  return (
    <View style={{ flex:1 }}>
      <LinearGradient colors={isDark ? ['#2A0A0A','#0E0E1F'] : ['#FFF0F0','#FFF8F8']}
        style={[S.laundryHeader]}>
        <View style={{ width:44, height:44, borderRadius:14, backgroundColor:'#FF6B6B22', alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="water" size={22} color="#FF6B6B" />
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight:'900', fontSize:17 }}>
            {dirty.length} in laundry
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize:12, marginTop:1 }}>Tap item to mark clean</Text>
        </View>
        {dirty.length > 0 && (
          <TouchableOpacity onPress={() => dirty.forEach(i => markClean(i.id))} activeOpacity={0.8}
            style={{ backgroundColor:'#4CAF8222', borderRadius:999, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'#4CAF8233' }}>
            <Text style={{ color:'#4CAF82', fontWeight:'800', fontSize:12 }}>All Clean</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {dirty.length === 0 ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:12 }}>
          <Text style={{ fontSize:52 }}>✨</Text>
          <Text style={{ color: colors.textPrimary, fontSize:20, fontWeight:'900' }}>All Fresh!</Text>
          <Text style={{ color: colors.textSecondary, fontSize:13 }}>Nothing in the laundry.</Text>
        </View>
      ) : (
        <FlatList data={dirty} keyExtractor={i => i.id}
          contentContainerStyle={{ padding:16, gap:10, paddingBottom:130 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[S.listRow, { backgroundColor: isDark ? '#14142A' : '#fff', borderColor: 'rgba(255,107,107,0.2)', borderWidth:1 }]}>
              <View style={[S.listSwatch, { backgroundColor: item.color }]}>
                <Ionicons name={CAT_ICONS[item.category] || 'shirt-outline'} size={16} color="rgba(255,255,255,0.75)" />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight:'700', fontSize:14 }}>{item.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize:11, marginTop:2 }}>{item.category} · {item.wears}× worn</Text>
              </View>
              <TouchableOpacity onPress={() => markClean(item.id)} activeOpacity={0.8}
                style={{ width:40, height:40, borderRadius:12, backgroundColor:'#4CAF8222', alignItems:'center', justifyContent:'center' }}>
                <Ionicons name="checkmark" size={19} color="#4CAF82" />
              </TouchableOpacity>
            </View>
          )} />
      )}
    </View>
  );
}

// ── Outfits Tab ────────────────────────────────────────────────────────────────
function OutfitsTab({ memberId, colors, isDark }) {
  const { suggestions, suggestLoading, fetchSuggestions, toggleLike } = useWardrobeStore();
  const [occasion, setOccasion] = useState('Casual');
  const [done, setDone] = useState(false);

  const generate = async () => {
    try { await fetchSuggestions(occasion, memberId); setDone(true); }
    catch { Alert.alert('Needs items', 'Add at least 2 clean items to get outfit suggestions.'); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding:16, gap:16, paddingBottom:130 }} showsVerticalScrollIndicator={false}>
      {/* Hero card */}
      <LinearGradient colors={['#6C63FF22','#FF6B9D18']} style={S.outfitHero} start={{x:0,y:0}} end={{x:1,y:1}}>
        <Text style={{ fontSize:34 }}>✨</Text>
        <View style={{ flex:1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight:'900', fontSize:18 }}>AI Outfit Builder</Text>
          <Text style={{ color: colors.textSecondary, fontSize:12, marginTop:2 }}>Outfits built from your real closet</Text>
        </View>
      </LinearGradient>

      {/* Occasion */}
      <Text style={[S.sectionLabel, { color: colors.textSecondary }]}>PICK AN OCCASION</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, alignItems:'center' }}>
        {OCCASIONS.map(o => (
          <TouchableOpacity key={o} onPress={() => setOccasion(o)} activeOpacity={0.8}
            style={[S.occChip, { backgroundColor: occasion===o ? '#6C63FF' : (isDark ? 'rgba(255,255,255,0.07)' : '#EDE9FF') }]}>
            <Text style={{ color: occasion===o ? '#fff' : '#6C63FF', fontWeight:'700', fontSize:13 }}>{o}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Generate button */}
      <TouchableOpacity onPress={generate} disabled={suggestLoading} activeOpacity={0.88}>
        <LinearGradient colors={['#6C63FF','#9C27B0','#FF6B9D']} style={S.genBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
          {suggestLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="sparkles" size={18} color="#FFD700" />}
          <Text style={{ color:'#fff', fontWeight:'900', fontSize:15 }}>
            {suggestLoading ? 'Building...' : `Generate ${occasion} Looks`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Results */}
      {done && !suggestLoading && suggestions.map(outfit => (
        <View key={outfit.id} style={[S.outfitCard, { backgroundColor: isDark ? '#14142A' : '#fff',
          borderColor: isDark ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.1)', borderWidth:1 }]}>
          {/* Color bar */}
          <View style={{ flexDirection:'row', gap:6, height:72, marginBottom:12 }}>
            {outfit.items.map((it, j) => (
              <View key={j} style={{ flex:1, borderRadius:14, backgroundColor: it.color || '#6C63FF', overflow:'hidden' }}>
                <LinearGradient colors={['transparent','rgba(0,0,0,0.3)']} style={StyleSheet.absoluteFill} />
              </View>
            ))}
          </View>
          {outfit.items.map((it, j) => (
            <View key={j} style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:5 }}>
              <View style={{ width:8, height:8, borderRadius:4, backgroundColor: it.color || '#6C63FF' }} />
              <Text style={{ color: colors.textPrimary, fontSize:13, fontWeight:'700' }}>{it.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize:11 }}>· {it.category}</Text>
            </View>
          ))}
          <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
            <TouchableOpacity onPress={() => toggleLike(outfit.id)} activeOpacity={0.8}
              style={{ flexDirection:'row', gap:6, alignItems:'center', paddingHorizontal:14, paddingVertical:8, borderRadius:999,
                backgroundColor: outfit.liked ? '#FF6B9D22' : (isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF') }}>
              <Ionicons name={outfit.liked ? 'heart' : 'heart-outline'} size={14} color={outfit.liked ? '#FF6B9D' : colors.textSecondary} />
              <Text style={{ color: outfit.liked ? '#FF6B9D' : colors.textSecondary, fontWeight:'700', fontSize:12 }}>
                {outfit.liked ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={generate} activeOpacity={0.8}
              style={{ flexDirection:'row', gap:6, alignItems:'center', paddingHorizontal:14, paddingVertical:8, borderRadius:999,
                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }}>
              <Ionicons name="refresh" size={14} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight:'700', fontSize:12 }}>Remix</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {!done && (
        <View style={{ alignItems:'center', padding:24, gap:10 }}>
          <Text style={{ fontSize:48 }}>👗</Text>
          <Text style={{ color: colors.textPrimary, fontSize:16, fontWeight:'800', textAlign:'center' }}>No looks yet</Text>
          <Text style={{ color: colors.textSecondary, fontSize:13, textAlign:'center', lineHeight:20 }}>
            Pick an occasion and tap Generate to build outfits from your actual clothes.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Wardrobes Tab ──────────────────────────────────────────────────────────────
function WardrobesTab({ current, onSwitch, colors, isDark }) {
  const { members, dependents, isAdmin, myPermissions } = useFamilyStore();
  const { user } = useAuthStore();

  const all = [
    { id: user?._id, name:'My Wardrobe',    sub:'Your personal closet',         type:'personal', memberId: user?._id, color:'#6C63FF', icon:'person-circle', locked:false },
    ...members.filter(m => m.id !== user?._id).map((m,i) => ({
      id:m.id, name:`${m.name.split(' ')[0]}'s Wardrobe`, sub:'Family member',
      type:'personal', memberId:m.id, color:MEMBER_COLORS[(i+1)%MEMBER_COLORS.length], icon:'person',
      locked: !isAdmin && myPermissions?.wardrobe === false,
    })),
    ...dependents.map((d,i) => ({
      id:d.id, name:`${d.name}'s Wardrobe`, sub: d.age ? `Age ${d.age}` : 'Child',
      type:'personal', memberId:d.id, color:MEMBER_COLORS[(members.length+i)%MEMBER_COLORS.length], icon:'happy',
      locked: !isAdmin && myPermissions?.wardrobe === false,
    })),
    { id:'home', name:'Home Wardrobe', sub:'Bedding, linens & shared items', type:'home', memberId:null, color:'#4CAF82', icon:'home', locked:false },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding:16, gap:10, paddingBottom:130 }} showsVerticalScrollIndicator={false}>
      <Text style={[S.sectionLabel, { color: colors.textSecondary, marginBottom:4 }]}>SWITCH WARDROBE</Text>
      {all.map(w => {
        const active = current?.id === w.id;
        return (
          <TouchableOpacity key={w.id} onPress={() => !w.locked && onSwitch(w)} activeOpacity={w.locked ? 1 : 0.78}
            style={[S.wardrobeRow, {
              backgroundColor: active ? (isDark ? w.color+'28' : w.color+'12') : (isDark ? '#14142A' : '#fff'),
              borderColor: active ? w.color+'55' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
              borderWidth:1, opacity: w.locked ? 0.5 : 1,
            }]}>
            <LinearGradient colors={[w.color, w.color+'AA']} style={S.wardrobeAvatar} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name={w.icon} size={20} color="#fff" />
            </LinearGradient>
            <View style={{ flex:1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight:'800', fontSize:15 }}>{w.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize:12, marginTop:2 }}>{w.sub}</Text>
            </View>
            {active
              ? <View style={[S.checkCircle, { backgroundColor:w.color }]}><Ionicons name="checkmark" size={14} color="#fff" /></View>
              : w.locked
                ? <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                : <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function WardrobeScreen() {
  const { colors, isDark } = useTheme();
  const { user }           = useAuthStore();
  const [activeTab, setActiveTab] = useState('Closet');
  const [showAdd, setShowAdd]     = useState(false);
  const [wardrobe, setWardrobe]   = useState({
    id: user?._id, name:'My Wardrobe', type:'personal', memberId: user?._id, color:'#6C63FF',
  });

  const bg = isDark ? '#07071A' : '#F7F5FF';

  return (
    <View style={{ flex:1, backgroundColor: bg }}>
      {/* Switcher bar */}
      <View style={[S.switchBar, {
        backgroundColor: isDark ? '#0E0E1F' : '#fff',
        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.1)',
      }]}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:9 }}>
          <LinearGradient colors={[wardrobe.color||'#6C63FF', (wardrobe.color||'#6C63FF')+'BB']}
            style={{ width:30, height:30, borderRadius:10, alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="shirt" size={14} color="#fff" />
          </LinearGradient>
          <Text style={{ color: colors.textPrimary, fontWeight:'800', fontSize:15 }}>{wardrobe.name}</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('Wardrobes')} activeOpacity={0.8}
          style={{ flexDirection:'row', alignItems:'center', gap:5,
            backgroundColor: isDark ? 'rgba(108,99,255,0.18)' : '#EDE9FF',
            paddingHorizontal:13, paddingVertical:7, borderRadius:999 }}>
          <Ionicons name="layers-outline" size={13} color="#6C63FF" />
          <Text style={{ color:'#6C63FF', fontWeight:'700', fontSize:12 }}>Switch</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex:1 }}>
        {activeTab === 'Closet'    && <ClosetTab wardrobeType={wardrobe.type} memberId={wardrobe.memberId} colors={colors} isDark={isDark} onAdd={() => setShowAdd(true)} />}
        {activeTab === 'Laundry'   && <LaundryTab memberId={wardrobe.memberId} colors={colors} isDark={isDark} />}
        {activeTab === 'Outfits'   && <OutfitsTab memberId={wardrobe.memberId} colors={colors} isDark={isDark} />}
        {activeTab === 'Wardrobes' && <WardrobesTab current={wardrobe} onSwitch={w => { setWardrobe(w); setActiveTab('Closet'); }} colors={colors} isDark={isDark} />}
      </View>

      <AppBottomNav tabs={WARDROBE_TABS} isActive={t => (t.id ?? t.label) === activeTab}
        onPress={t => t.id && setActiveTab(t.id)} onAdd={() => setShowAdd(true)}
        accentColor="#6C63FF" isDark={isDark} />

      <AddItemSheet visible={showAdd} onClose={() => setShowAdd(false)} colors={colors} isDark={isDark}
        defaultType={wardrobe.type} defaultMemberId={wardrobe.memberId} />
    </View>
  );
}

const S = StyleSheet.create({
  switchBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10, borderBottomWidth:1 },

  statsBanner: { flexDirection:'row', margin:16, borderRadius:20, padding:16, alignItems:'center',
    shadowColor:'#6C63FF', shadowOpacity:0.12, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:3 },
  statCell: { flex:1, alignItems:'center', gap:4 },
  statIconBox: { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
  statNum: { fontSize:22, fontWeight:'900', letterSpacing:-0.5 },
  statLbl: { fontSize:10, fontWeight:'600' },
  statDivider: { width:1, height:44, borderRadius:1, marginHorizontal:4 },

  catChip: { flexDirection:'row', alignItems:'center', gap:5, height:32, paddingHorizontal:13, borderRadius:999 },

  toolbar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:8, borderBottomWidth:StyleSheet.hairlineWidth },
  viewToggle: { padding:6, borderRadius:8 },

  card: { width:CARD_W, borderRadius:18, overflow:'hidden' },
  swatch: { height:130, justifyContent:'flex-end', padding:8 },
  wearBadge: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(0,0,0,0.38)', paddingHorizontal:7, paddingVertical:3, borderRadius:999, alignSelf:'flex-start' },
  wearTxt: { color:'#fff', fontSize:9, fontWeight:'700' },
  cleanDot: { position:'absolute', top:8, left:8, width:9, height:9, borderRadius:5 },
  seasonTag: { position:'absolute', top:8, right:8, backgroundColor:'rgba(0,0,0,0.35)', paddingHorizontal:7, paddingVertical:3, borderRadius:999 },
  seasonTxt: { color:'#fff', fontSize:9, fontWeight:'700' },
  cardBody: { padding:10 },
  cardName: { fontSize:13, fontWeight:'800', lineHeight:18 },
  cardBrand: { fontSize:11 },
  cardSize: { fontSize:10, marginTop:3 },
  statusPill: { paddingHorizontal:6, paddingVertical:2, borderRadius:999 },

  listRow: { flexDirection:'row', alignItems:'center', gap:12, padding:13, borderRadius:16 },
  listSwatch: { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center' },

  bottomSheet: { position:'absolute', bottom:0, left:0, right:0, borderTopLeftRadius:30, borderTopRightRadius:30, paddingBottom:50 },
  sheetHandle: { width:36, height:4, borderRadius:2, alignSelf:'center', marginTop:12, marginBottom:8 },
  heroSwatch: { height:172, position:'relative' },

  typeBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:12, borderRadius:12, borderWidth:1 },
  inputRow: { flexDirection:'row', alignItems:'center', borderRadius:13, borderWidth:1, overflow:'hidden' },
  textInput: { flex:1, paddingHorizontal:14, paddingVertical:13, fontSize:15, fontWeight:'600' },
  filterChip: { paddingHorizontal:14, height:32, borderRadius:999, borderWidth:1, alignItems:'center', justifyContent:'center' },
  sectionLabel: { fontSize:10, fontWeight:'700', letterSpacing:0.8 },
  colorDot: { width:30, height:30, borderRadius:15, alignItems:'center', justifyContent:'center' },
  colorPreview: { height:62, borderRadius:14, overflow:'hidden', marginTop:2 },
  saveBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:16, borderRadius:16,
    shadowColor:'#6C63FF', shadowOffset:{width:0,height:6}, shadowOpacity:0.3, shadowRadius:14, elevation:8 },

  laundryHeader: { flexDirection:'row', alignItems:'center', gap:12, padding:16, margin:16, borderRadius:20 },

  outfitHero: { flexDirection:'row', alignItems:'center', gap:12, padding:18, borderRadius:20 },
  occChip: { paddingHorizontal:16, paddingVertical:9, borderRadius:999 },
  genBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:17, borderRadius:16,
    shadowColor:'#6C63FF', shadowOffset:{width:0,height:6}, shadowOpacity:0.3, shadowRadius:14, elevation:8 },
  outfitCard: { borderRadius:20, padding:16 },

  wardrobeRow: { flexDirection:'row', alignItems:'center', gap:14, padding:14, borderRadius:18 },
  wardrobeAvatar: { width:50, height:50, borderRadius:16, alignItems:'center', justifyContent:'center' },
  checkCircle: { width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center' },
});
