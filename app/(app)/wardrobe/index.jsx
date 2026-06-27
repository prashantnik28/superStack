import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, FlatList, Modal, TextInput, Image,
  Alert, ActivityIndicator, Dimensions, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useWardrobeStore, PERSONAL_CATEGORIES, HOME_CATEGORIES } from '../../../src/stores/useWardrobeStore';
import AppBottomNav from '../../../src/components/ui/AppBottomNav';

const { width: W } = Dimensions.get('window');

// ── Constants ──────────────────────────────────────────────────────────────────
const WARDROBE_TABS = [
  { id: 'Overview', label: 'Overview', icon: 'home-outline',     iconOn: 'home'     },
  { id: 'Closet',   label: 'Closet',   icon: 'shirt-outline',    iconOn: 'shirt'    },
  { center: true,   label: 'Add' },
  { id: 'Outfits',  label: 'Outfits',  icon: 'sparkles-outline', iconOn: 'sparkles' },
  { id: 'StyleMe',  label: 'Style Me', icon: 'body-outline',     iconOn: 'body'     },
];

const CAT_ICONS = {
  All: 'apps-outline', Tops: 'shirt-outline', Bottoms: 'layers-outline',
  Dresses: 'flower-outline', Footwear: 'walk-outline', Accessories: 'sparkles-outline',
  Outerwear: 'snow-outline', Other: 'ellipsis-horizontal-outline',
  Bedding: 'bed-outline', Upholstery: 'home-outline', Towels: 'water-outline',
  'Kitchen Linens': 'restaurant-outline', Curtains: 'browsers-outline',
};

const CAT_EMOJIS = {
  All: '👗', Tops: '👕', Bottoms: '👖', Dresses: '👗', Footwear: '👟',
  Accessories: '💍', Outerwear: '🧥', Other: '📦',
};

const CATEGORY_STRIP = [
  { id: 'All',         label: 'All',         emoji: '🏷',  color: '#6C63FF' },
  { id: 'Tops',        label: 'Tops',        emoji: '👕',  color: '#FF6B6B' },
  { id: 'Bottoms',     label: 'Bottoms',     emoji: '👖',  color: '#1A237E' },
  { id: 'Outerwear',   label: 'Jackets',     emoji: '🧥',  color: '#607D8B' },
  { id: 'Dresses',     label: 'Dresses',     emoji: '👗',  color: '#E91E63' },
  { id: 'Footwear',    label: 'Shoes',       emoji: '👟',  color: '#795548' },
  { id: 'Accessories', label: 'Accessories', emoji: '💍',  color: '#FFD700' },
];

const CLOSET_PERSONAL_STRIP = [
  { id: 'All',         label: 'All',     emoji: '🏷',  color: '#6C63FF' },
  { id: 'Tops',        label: 'Tops',    emoji: '👕',  color: '#FF6B6B' },
  { id: 'Bottoms',     label: 'Bottoms', emoji: '👖',  color: '#1A237E' },
  { id: 'Dresses',     label: 'Dresses', emoji: '👗',  color: '#E91E63' },
  { id: 'Footwear',    label: 'Shoes',   emoji: '👟',  color: '#795548' },
  { id: 'Accessories', label: 'Access.', emoji: '💍',  color: '#FFD700' },
  { id: 'Outerwear',   label: 'Jackets', emoji: '🧥',  color: '#607D8B' },
  { id: 'Other',       label: 'Other',   emoji: '📦',  color: '#9E9E9E' },
];
const CLOSET_HOME_STRIP = [
  { id: 'All',            label: 'All',     emoji: '🏠',  color: '#6C63FF' },
  { id: 'Bedding',        label: 'Bedding', emoji: '🛏',  color: '#1565C0' },
  { id: 'Upholstery',     label: 'Fabric',  emoji: '🪑',  color: '#795548' },
  { id: 'Towels',         label: 'Towels',  emoji: '🛁',  color: '#0097A7' },
  { id: 'Kitchen Linens', label: 'Kitchen', emoji: '🍽',  color: '#E65100' },
  { id: 'Curtains',       label: 'Curtains',emoji: '🪟',  color: '#6A1B9A' },
  { id: 'Other',          label: 'Other',   emoji: '📦',  color: '#9E9E9E' },
];

const OCCASIONS_GRID = [
  { id: 'Office',   label: 'Office',     emoji: '💼', grad: ['#1A237E','#3949AB'] },
  { id: 'Casual',   label: 'Casual',     emoji: '😎', grad: ['#4C9EFF','#1A73E8'] },
  { id: 'Party',    label: 'Party',      emoji: '🎉', grad: ['#E91E63','#AD1457'] },
  { id: 'Date',     label: 'Date Night', emoji: '🌹', grad: ['#9C27B0','#6A1B9A'] },
  { id: 'Gym',      label: 'Gym',        emoji: '💪', grad: ['#4CAF82','#2E7D32'] },
  { id: 'Festival', label: 'Festival',   emoji: '🪔', grad: ['#FF9800','#E65100'] },
  { id: 'Formal',   label: 'Formal',     emoji: '🎩', grad: ['#37474F','#263238'] },
  { id: 'Travel',   label: 'Travel',     emoji: '✈️', grad: ['#0288D1','#01579B'] },
];

const COLORS_PAL = ['#EEEEEE','#212121','#1A237E','#E91E63','#4CAF50','#FF9800','#9C27B0','#795548','#F44336','#00BCD4','#FFD700','#607D8B'];
const MEMBER_COLORS = ['#6C63FF','#FF6B9D','#4CAF82','#FFB347','#3B82F6','#9C27B0'];

const AI_STEPS = [
  'Removing background...',
  'Identifying category...',
  'Analysing style & details...',
  'Analysis taking a bit longer...',
  'Almost there...',
];

const STEP_DURATIONS = [1400, 1000, 1300, 800, 700];

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_ITEMS = [
  { id: 'm1',  name: 'White Linen Shirt',  category: 'Tops',       color: '#E3F2FD', brand: 'Zara',       size: 'M',  season: 'Summer', wears: 12, isClean: true,  price: 2499, wardrobeType: 'personal' },
  { id: 'm2',  name: 'Navy Polo',           category: 'Tops',       color: '#283593', brand: 'H&M',        size: 'M',  season: 'All',    wears: 5,  isClean: true,  price: 1499, wardrobeType: 'personal' },
  { id: 'm8',  name: 'Striped Tee',         category: 'Tops',       color: '#90CAF9', brand: 'Uniqlo',     size: 'M',  season: 'Summer', wears: 15, isClean: true,  price: 999,  wardrobeType: 'personal' },
  { id: 'm10', name: 'Silk Blouse',         category: 'Tops',       color: '#F48FB1', brand: 'Vero Moda',  size: 'S',  season: 'All',    wears: 6,  isClean: false, price: 1999, wardrobeType: 'personal' },
  { id: 'm11', name: 'Graphic Tee',         category: 'Tops',       color: '#E8F5E9', brand: 'Zara',       size: 'M',  season: 'Summer', wears: 8,  isClean: true,  price: 799,  wardrobeType: 'personal' },
  { id: 'm3',  name: 'Black Slim Jeans',    category: 'Bottoms',    color: '#263238', brand: "Levi's",     size: '32', season: 'All',    wears: 23, isClean: false, price: 3499, wardrobeType: 'personal' },
  { id: 'm9',  name: 'Beige Chinos',        category: 'Bottoms',    color: '#D7CCC8', brand: 'Gap',        size: '30', season: 'All',    wears: 9,  isClean: true,  price: 2999, wardrobeType: 'personal' },
  { id: 'm12', name: 'Olive Trousers',      category: 'Bottoms',    color: '#C5E1A5', brand: 'Uniqlo',     size: 'M',  season: 'All',    wears: 7,  isClean: true,  price: 2199, wardrobeType: 'personal' },
  { id: 'm13', name: 'Blue Shorts',         category: 'Bottoms',    color: '#BBDEFB', brand: 'H&M',        size: 'M',  season: 'Summer', wears: 11, isClean: true,  price: 899,  wardrobeType: 'personal' },
  { id: 'm4',  name: 'Floral Midi Dress',   category: 'Dresses',    color: '#FCE4EC', brand: 'Mango',      size: 'S',  season: 'Summer', wears: 4,  isClean: true,  price: 3999, wardrobeType: 'personal' },
  { id: 'm7',  name: 'Olive Trench Coat',   category: 'Outerwear',  color: '#558B2F', brand: 'M&S',        size: 'L',  season: 'Winter', wears: 7,  isClean: true,  price: 7499, wardrobeType: 'personal' },
  { id: 'm14', name: 'Navy Blazer',         category: 'Outerwear',  color: '#1A237E', brand: 'Next',       size: 'M',  season: 'All',    wears: 5,  isClean: true,  price: 5999, wardrobeType: 'personal' },
  { id: 'm15', name: 'Denim Jacket',        category: 'Outerwear',  color: '#5C6BC0', brand: "Levi's",     size: 'M',  season: 'All',    wears: 12, isClean: true,  price: 4499, wardrobeType: 'personal' },
  { id: 'm16', name: 'Puffer Jacket',       category: 'Outerwear',  color: '#455A64', brand: 'Zara',       size: 'M',  season: 'Winter', wears: 9,  isClean: false, price: 6999, wardrobeType: 'personal' },
  { id: 'm5',  name: 'White Sneakers',      category: 'Footwear',   color: '#F5F5F5', brand: 'Nike',       size: '8',  season: 'All',    wears: 31, isClean: false, price: 6999, wardrobeType: 'personal' },
  { id: 'm17', name: 'Brown Loafers',       category: 'Footwear',   color: '#5D4037', brand: 'Woodland',   size: '9',  season: 'All',    wears: 14, isClean: true,  price: 3499, wardrobeType: 'personal' },
  { id: 'm18', name: 'Black Oxfords',       category: 'Footwear',   color: '#37474F', brand: 'Lee Cooper', size: '9',  season: 'All',    wears: 8,  isClean: true,  price: 4999, wardrobeType: 'personal' },
  { id: 'm6',  name: 'Gold Hoops',          category: 'Accessories',color: '#FFF9C4', brand: 'Tanishq',    size: '-',  season: 'All',    wears: 18, isClean: true,  price: 8999, wardrobeType: 'personal' },
];

const MOCK_SUGGESTIONS = [
  { id: 's1', label: 'Office Look',    score: 94, grad: ['#1A237E','#3949AB'], swatches: ['#1A237E','#D7CCC8','#F5F5F5'], items: ['Navy Blazer','Beige Chinos','White Sneakers']  },
  { id: 's2', label: 'Casual Vibe',    score: 88, grad: ['#4C9EFF','#1976D2'], swatches: ['#90CAF9','#263238','#F5F5F5'], items: ['Striped Tee','Black Jeans','White Sneakers']    },
  { id: 's3', label: 'Date Night',     score: 91, grad: ['#E91E63','#9C27B0'], swatches: ['#FCE4EC','#558B2F','#FFF9C4'], items: ['Floral Dress','Olive Coat','Gold Hoops']        },
  { id: 's4', label: 'Festival Vibes', score: 87, grad: ['#FF9800','#FF5722'], swatches: ['#FCE4EC','#FFF9C4','#F5F5F5'], items: ['Floral Dress','Gold Hoops','White Sneakers']   },
];

function isLightColor(hex = '#000') {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114)/1000 > 155;
}

// ── Item Card ──────────────────────────────────────────────────────────────────
function ItemCard({ item, onPress, cardW, colors, isDark }) {
  const { radius } = useTheme();
  const w          = cardW || (W-48)/3;
  const swatchH    = w * 1.15;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86}
      style={[S.card, { width: w, borderRadius: radius, backgroundColor: isDark ? '#14142A' : '#fff',
        shadowColor: item.color || '#6C63FF', shadowOpacity: 0.18, shadowRadius: radius,
        shadowOffset: { width: 0, height: Math.round(radius * 0.35) }, elevation: 4 }]}>
      <View style={[S.swatch, { backgroundColor: item.color || '#6C63FF', height: swatchH }]}>
        <LinearGradient colors={['rgba(0,0,0,0)','rgba(0,0,0,0.38)']} style={StyleSheet.absoluteFill} />
        <Text style={{ position:'absolute', top:'50%', left:'50%',
          marginTop: -w*0.18, marginLeft: -w*0.18,
          fontSize: w*0.36 }}>
          {CAT_EMOJIS[item.category] || '👕'}
        </Text>
        {item.season && item.season !== 'All' && (
          <View style={S.seasonTag}><Text style={S.seasonTxt}>{item.season}</Text></View>
        )}
        <View style={S.wearBadge}>
          <Ionicons name="repeat" size={8} color="rgba(255,255,255,0.9)" />
          <Text style={S.wearTxt}>{item.wears}×</Text>
        </View>
        <View style={[S.cleanDot, { backgroundColor: item.isClean ? '#4CAF82' : '#FF6B6B' }]} />
      </View>
      <View style={S.cardBody}>
        <Text style={[S.cardName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[S.cardBrand, { color: colors.textSecondary }]} numberOfLines={1}>{item.brand}</Text>
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
        <View style={[S.heroSwatch, { backgroundColor: item.color || '#6C63FF' }]}>
          <LinearGradient colors={['transparent','rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
          <Text style={{ position:'absolute', top:16, right:20, fontSize:44, opacity:0.6 }}>
            {CAT_EMOJIS[item.category] || '👕'}
          </Text>
          <View style={{ position:'absolute', bottom:18, left:18 }}>
            <Text style={{ color:'#fff', fontSize:22, fontWeight:'900', letterSpacing:-0.3 }}>{item.name}</Text>
            <Text style={{ color:'rgba(255,255,255,0.75)', fontSize:13, marginTop:3 }}>
              {item.category}{item.brand ? ` · ${item.brand}` : ''}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection:'row', paddingHorizontal:20, paddingVertical:16 }}>
          {[
            { label:'Season', value: item.season||'All',           icon:'sunny-outline',          color:'#FFB347' },
            { label:'Size',   value: item.size||'—',                icon:'resize-outline',          color:'#6C63FF' },
            { label:'Worn',   value: `${item.wears}×`,              icon:'repeat-outline',          color:'#FF6B9D' },
            { label:'Status', value: item.isClean?'Clean':'Wash',   icon: item.isClean ? 'checkmark-circle-outline':'water-outline', color: item.isClean?'#4CAF82':'#FF6B6B' },
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

// ── Edit Step (BG Remove + Erase tool) ────────────────────────────────────────
function EditStep({ imageUri, onNext, colors, isDark }) {
  const { radius } = useTheme();
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgRemoved,  setBgRemoved]  = useState(false);
  const [bgStepIdx,  setBgStepIdx]  = useState(-1);
  const [eraseOn,    setEraseOn]    = useState(false);
  const [brushIdx,   setBrushIdx]   = useState(1);
  const [dots,       setDots]       = useState([]);
  const [layout,     setLayout]     = useState({ w: 0, h: 0 });

  // Refs so PanResponder closures always read latest values
  const eraseOnRef  = useRef(false);
  const brushIdxRef = useRef(1);
  useEffect(() => { eraseOnRef.current  = eraseOn;  }, [eraseOn]);
  useEffect(() => { brushIdxRef.current = brushIdx; }, [brushIdx]);

  const BRUSHES  = [13, 24, 40];
  const BG_STEPS = ['Detecting subject...', 'Masking background...', 'Refining edges...'];

  const startBgRemove = () => {
    if (bgRemoving || bgRemoved) return;
    setBgRemoving(true); setBgStepIdx(0);
    setTimeout(() => setBgStepIdx(1), 1000);
    setTimeout(() => setBgStepIdx(2), 2000);
    setTimeout(() => { setBgRemoved(true); setBgRemoving(false); setBgStepIdx(-1); }, 2800);
  };

  const erasePR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => eraseOnRef.current,
    onMoveShouldSetPanResponder:  () => eraseOnRef.current,
    onPanResponderGrant: ({ nativeEvent: { locationX: x, locationY: y } }) =>
      setDots(d => [...d, { x, y, r: BRUSHES[brushIdxRef.current] }]),
    onPanResponderMove: ({ nativeEvent: { locationX: x, locationY: y } }) =>
      setDots(d => [...d, { x, y, r: BRUSHES[brushIdxRef.current] }]),
  })).current;

  const bg = isDark ? '#07071A' : '#F7F5FF';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Image canvas */}
      <View
        style={{ flex: 1, margin: 16, borderRadius: radius + 4, overflow: 'hidden',
          backgroundColor: bgRemoved ? '#fff' : (isDark ? '#1A1A2E' : '#E8E4FF') }}
        onLayout={e => setLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>

        {/* Image — pointerEvents="none" so it never eats touches */}
        <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain"
          pointerEvents="none" />

        {/* Simulated BG-removed vignette */}
        {bgRemoved && !bgRemoving && (
          <>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'transparent', 'transparent', 'rgba(255,255,255,0.9)']}
              locations={[0, 0.22, 0.78, 1]} style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} pointerEvents="none" />
            <LinearGradient
              colors={['rgba(255,255,255,0.75)', 'transparent', 'transparent', 'rgba(255,255,255,0.75)']}
              locations={[0, 0.18, 0.82, 1]} style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none" />
          </>
        )}

        {/* Erase brush dots */}
        {dots.length > 0 && layout.w > 0 && (
          <Svg width={layout.w} height={layout.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            {dots.map((d, i) => (
              <SvgCircle key={i} cx={d.x} cy={d.y} r={d.r} fill="white" opacity={0.9} />
            ))}
          </Svg>
        )}

        {/* Touch capture layer — on top, only active when erase mode is on */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
          {...erasePR.panHandlers}
          collapsable={false}
        />

        {/* BG-removing loading overlay */}
        {bgRemoving && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.68)',
            alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
            <ActivityIndicator color="#fff" size="large" />
            <View style={{ gap: 8, alignItems: 'flex-start' }}>
              {BG_STEPS.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                  opacity: i <= bgStepIdx ? 1 : 0.35 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: i < bgStepIdx ? '#4CAF82' : (i === bgStepIdx ? '#fff' : 'rgba(255,255,255,0.25)') }}>
                    {i < bgStepIdx && <Ionicons name="checkmark" size={12} color="#4CAF82" />}
                  </View>
                  <Text style={{ color: '#fff', fontSize: 13,
                    fontWeight: i === bgStepIdx ? '700' : '500' }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Toolbar */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}>
        {/* Row: Remove BG + Erase toggle + Undo */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={bgRemoved
              ? () => { setBgRemoved(false); setDots([]); }
              : startBgRemove}
            disabled={bgRemoving} activeOpacity={0.8}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 7, paddingVertical: 12, borderRadius: radius,
              backgroundColor: bgRemoved ? '#4CAF8222' : (isDark ? '#1A1A2E' : '#F0EEFF'),
              borderWidth: 1, borderColor: bgRemoved ? '#4CAF82' : (isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.2)') }}>
            <Ionicons name={bgRemoved ? 'checkmark-circle' : 'cut-outline'}
              size={17} color={bgRemoved ? '#4CAF82' : '#6C63FF'} />
            <Text style={{ color: bgRemoved ? '#4CAF82' : '#6C63FF', fontWeight: '800', fontSize: 12 }}>
              {bgRemoved ? 'BG Removed ✓' : 'Remove BG'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setEraseOn(v => !v)} activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius,
              backgroundColor: eraseOn ? '#FF6B9D22' : (isDark ? '#1A1A2E' : '#F0EEFF'),
              borderWidth: 1, borderColor: eraseOn ? '#FF6B9D' : (isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.2)') }}>
            <Ionicons name="pencil-outline" size={17} color={eraseOn ? '#FF6B9D' : colors.textSecondary} />
            <Text style={{ color: eraseOn ? '#FF6B9D' : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>Erase</Text>
          </TouchableOpacity>

          {dots.length > 0 && (
            <TouchableOpacity
              onPress={() => setDots(d => d.slice(0, Math.max(0, d.length - 5)))}
              activeOpacity={0.8}
              style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius,
                backgroundColor: isDark ? '#1A1A2E' : '#F0EEFF',
                borderWidth: 1, borderColor: isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.2)' }}>
              <Ionicons name="arrow-undo-outline" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Brush size selector */}
        {eraseOn && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>BRUSH</Text>
            {['S', 'M', 'L'].map((label, i) => (
              <TouchableOpacity key={label} onPress={() => setBrushIdx(i)} activeOpacity={0.8}
                style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: brushIdx === i ? '#FF6B9D' : (isDark ? '#1A1A2E' : '#F0EEFF'),
                  borderWidth: 1, borderColor: brushIdx === i ? '#FF6B9D' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)') }}>
                <Text style={{ color: brushIdx === i ? '#fff' : colors.textSecondary, fontWeight: '800', fontSize: 11 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Next button */}
        <TouchableOpacity onPress={onNext} disabled={bgRemoving} activeOpacity={0.85}>
          <LinearGradient colors={['#6C63FF', '#9C27B0']}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, paddingVertical: 15, borderRadius: radius }}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Next: AI Analysis</Text>
            <Ionicons name="chevron-forward" size={17} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Crop Step (ScrollView pinch-zoom + safe coordinate math) ──────────────────
function CropStep({ imageUri, onDone, colors, isDark }) {
  const { radius }  = useTheme();
  const [cSize,     setCSize]   = useState({ w: 0, h: 0 });
  const [imgNat,    setImgNat]  = useState({ w: 1, h: 1 });
  const [rotation,  setRotation]= useState(0);
  const [applying,  setApplying]= useState(false);

  const scrollRef   = useRef(null);
  const scrollState = useRef({ contentOffset: { x: 0, y: 0 }, zoomScale: 1 });
  const natRef      = useRef({ w: 1, h: 1 });

  useEffect(() => { natRef.current = imgNat; }, [imgNat]);
  useEffect(() => {
    Image.getSize(imageUri, (w, h) => setImgNat({ w, h }));
  }, [imageUri]);

  const MARGIN = 28; // px — the dark overlay around the crop frame

  const applyCrop = async () => {
    setApplying(true);
    try {
      const { w: cW, h: cH }                      = cSize;
      const { w: iW, h: iH }                       = natRef.current;
      const { contentOffset: { x: sx, y: sy }, zoomScale: z } = scrollState.current;

      if (cW <= 0 || cH <= 0 || iW <= 0 || iH <= 0) {
        onDone(imageUri); return;
      }

      // How the image renders with resizeMode="contain" inside cW×cH
      const imgAsp = iW / iH, conAsp = cW / cH;
      let rW, rH, offX, offY;
      if (imgAsp > conAsp) {
        rW = cW; rH = cW / imgAsp; offX = 0; offY = (cH - rH) / 2;
      } else {
        rH = cH; rW = cH * imgAsp; offX = (cW - rW) / 2; offY = 0;
      }

      // Crop frame in container space
      const fX = MARGIN, fY = MARGIN;
      const fW = Math.max(1, cW - MARGIN * 2);
      const fH = Math.max(1, cH - MARGIN * 2);

      // Map frame corners through zoom/scroll → original image pixels
      // Screen point P corresponds to content point (sx + P.x) / z
      const imgLeft   = (sx + fX) / z;
      const imgTop    = (sy + fY) / z;
      const imgRight  = (sx + fX + fW) / z;
      const imgBottom = (sy + fY + fH) / z;

      // Convert content coords → image pixel coords
      const toPixX = (cx) => (cx - offX) / rW * iW;
      const toPixY = (cy) => (cy - offY) / rH * iH;

      let originX = Math.max(0, Math.floor(toPixX(imgLeft)));
      let originY = Math.max(0, Math.floor(toPixY(imgTop)));
      let cropW   = Math.floor(toPixX(imgRight))  - originX;
      let cropH   = Math.floor(toPixY(imgBottom)) - originY;

      // Hard clamp — no value must ever exceed image bounds
      originX = Math.min(originX, iW - 1);
      originY = Math.min(originY, iH - 1);
      cropW   = Math.min(cropW, iW - originX);
      cropH   = Math.min(cropH, iH - originY);

      const ops = [];
      if (rotation !== 0) ops.push({ rotate: rotation });
      if (cropW > 10 && cropH > 10) {
        ops.push({ crop: { originX, originY, width: cropW, height: cropH } });
      }

      if (ops.length === 0) { onDone(imageUri); return; }

      const result = await ImageManipulator.manipulateAsync(
        imageUri, ops,
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      onDone(result.uri);
    } catch (err) {
      console.warn('Crop error:', err);
      onDone(imageUri); // graceful fallback — never crash
    } finally {
      setApplying(false);
    }
  };

  const bg  = isDark ? '#07071A' : '#000';
  const DIM = 'rgba(0,0,0,0.6)';
  const { w: cW, h: cH } = cSize;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Image area — wrapper gives us container size via onLayout */}
      <View style={{ flex: 1 }}
        onLayout={e => setCSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>

        {/* Pinch-to-zoom ScrollView */}
        {cW > 0 && (
          <ScrollView
            ref={scrollRef}
            style={StyleSheet.absoluteFill}
            maximumZoomScale={5}
            minimumZoomScale={0.9}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onScroll={e => { scrollState.current = e.nativeEvent; }}
            scrollEventThrottle={16}
            centerContent
          >
            <Image
              source={{ uri: imageUri }}
              style={{ width: cW, height: cH }}
              resizeMode="contain"
            />
          </ScrollView>
        )}

        {/* Non-interactive crop frame overlay */}
        {cW > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Dark corners */}
            <View style={{ position:'absolute', top:0, left:0, right:0, height:MARGIN, backgroundColor:DIM }} />
            <View style={{ position:'absolute', bottom:0, left:0, right:0, height:MARGIN, backgroundColor:DIM }} />
            <View style={{ position:'absolute', top:MARGIN, left:0, width:MARGIN, height:cH-MARGIN*2, backgroundColor:DIM }} />
            <View style={{ position:'absolute', top:MARGIN, right:0, width:MARGIN, height:cH-MARGIN*2, backgroundColor:DIM }} />
            {/* Crop border */}
            <View style={{ position:'absolute', top:MARGIN, left:MARGIN,
              width:cW-MARGIN*2, height:cH-MARGIN*2,
              borderWidth:2, borderColor:'rgba(255,255,255,0.9)' }}>
              {/* Rule-of-thirds grid */}
              <View style={{ position:'absolute', left:'33%', top:0, width:0.5, height:'100%', backgroundColor:'rgba(255,255,255,0.3)' }} />
              <View style={{ position:'absolute', left:'66%', top:0, width:0.5, height:'100%', backgroundColor:'rgba(255,255,255,0.3)' }} />
              <View style={{ position:'absolute', top:'33%', left:0, height:0.5, width:'100%', backgroundColor:'rgba(255,255,255,0.3)' }} />
              <View style={{ position:'absolute', top:'66%', left:0, height:0.5, width:'100%', backgroundColor:'rgba(255,255,255,0.3)' }} />
            </View>
            {/* Corner accent marks */}
            {[[0,0],[1,0],[0,1],[1,1]].map(([cx,cy]) => (
              <View key={`${cx}${cy}`} style={{ position:'absolute',
                left: cx === 0 ? MARGIN-1 : undefined, right: cx === 1 ? MARGIN-1 : undefined,
                top:  cy === 0 ? MARGIN-1 : undefined, bottom: cy === 1 ? MARGIN-1 : undefined,
                width:22, height:22,
                borderTopWidth: cy === 0 ? 3 : 0, borderBottomWidth: cy === 1 ? 3 : 0,
                borderLeftWidth: cx === 0 ? 3 : 0, borderRightWidth: cx === 1 ? 3 : 0,
                borderColor:'#fff' }} />
            ))}
          </View>
        )}
      </View>

      <Text style={{ color:'rgba(255,255,255,0.55)', textAlign:'center', fontSize:12, fontWeight:'600', paddingVertical:8 }}>
        Pinch to zoom · Drag to reposition
      </Text>

      {/* Controls */}
      <View style={{ paddingHorizontal:16, paddingBottom:20, gap:10 }}>
        <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
          <TouchableOpacity onPress={() => setRotation(r => (r + 90) % 360)} activeOpacity={0.8}
            style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:10,
              borderRadius: radius, backgroundColor:'rgba(255,255,255,0.12)',
              borderWidth:1, borderColor:'rgba(255,255,255,0.2)' }}>
            <Ionicons name="refresh-outline" size={16} color={rotation !== 0 ? '#6C63FF' : '#fff'} />
            <Text style={{ color: rotation !== 0 ? '#6C63FF' : '#fff', fontWeight:'700', fontSize:13 }}>
              {rotation !== 0 ? `${rotation}°` : 'Rotate'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={applyCrop} disabled={applying} activeOpacity={0.85}>
          <LinearGradient colors={applying ? ['#555','#333'] : ['#6C63FF','#9C27B0']}
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'center',
              gap:8, paddingVertical:16, borderRadius:radius }}
            start={{x:0,y:0}} end={{x:1,y:0}}>
            {applying
              ? <><ActivityIndicator color="#fff" size="small" /><Text style={{ color:'#fff', fontWeight:'900', fontSize:15 }}>Applying...</Text></>
              : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={{ color:'#fff', fontWeight:'900', fontSize:15 }}>Apply & Continue</Text></>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Add Flow Modal (multi-step) ────────────────────────────────────────────────
function AddFlowModal({ visible, onClose, colors, isDark, defaultType, defaultMemberId }) {
  const { addItem, addItemLocal } = useWardrobeStore();
  const { user }    = useAuthStore();

  const [step, setStep]           = useState(0);
  const [detectedCat, setDetected]= useState('Tops');
  const [aiDone, setAiDone]       = useState(false);
  const [stepIdx, setStepIdx]     = useState(-1);
  const [imageUri, setImageUri]   = useState(null);
  const [picking, setPicking]     = useState(false);

  // form
  const [name, setName]     = useState('');
  const [cat, setCat]       = useState('Tops');
  const [color, setColor]   = useState('#6C63FF');
  const [brand, setBrand]   = useState('');
  const [size, setSize]     = useState('');
  const [season, setSeason] = useState('All');
  const [price, setPrice]   = useState('');
  const [wType, setWType]   = useState(defaultType || 'personal');
  const [saving, setSaving] = useState(false);

  const stepAnims = useRef(AI_STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      setStep(0); setStepIdx(-1); setAiDone(false); setImageUri(null); setPicking(false);
      setName(''); setCat('Tops'); setColor('#6C63FF'); setBrand(''); setSize(''); setSeason('All'); setPrice(''); setWType(defaultType || 'personal');
      stepAnims.forEach(a => a.setValue(0));
    }
  }, [visible]);

  const startAI = (croppedUri) => {
    const catList = ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories', 'Dresses'];
    const picked  = catList[Math.floor(Math.random() * catList.length)];
    if (croppedUri) setImageUri(croppedUri);
    setDetected(picked);
    setCat(picked);
    setStep(3);
    setStepIdx(-1);
    setAiDone(false);
    stepAnims.forEach(a => a.setValue(0));
    let delay = 300;
    AI_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setStepIdx(i);
        Animated.spring(stepAnims[i], { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
      }, delay);
      delay += STEP_DURATIONS[i];
    });
    setTimeout(() => setAiDone(true), delay + 400);
  };

  const handleTakePhoto = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'Allow camera access in Settings to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
        setStep(1);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setPicking(false);
    }
  };

  const handleGallery = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Gallery Permission', 'Allow photo library access in Settings to pick images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
        setStep(1);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setPicking(false);
    }
  };

  const handleBarcode = () => {
    Alert.alert('Coming Soon', 'Barcode / tag scanning will be available in the next update.');
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Enter item name');
    setSaving(true);
    const dto = {
      name: name.trim(), category: cat, color, brand, size, season,
      price: price ? parseFloat(price) : null, wardrobeType: wType,
      memberId: wType === 'home' ? null : (defaultMemberId || user?._id),
      imageUrl: imageUri || null,
    };
    try {
      await addItem(dto);
      onClose();
    } catch {
      // Backend unavailable — save locally so the user doesn't lose their item
      addItemLocal(dto);
      onClose();
    } finally { setSaving(false); }
  };

  const inputBg = isDark ? '#1A1A2E' : '#F5F4FF';
  const brd     = isDark ? 'rgba(108,99,255,0.3)' : 'rgba(108,99,255,0.2)';
  const cats    = (wType === 'home' ? HOME_CATEGORIES : PERSONAL_CATEGORIES).filter(c => c !== 'All');

  const INPUT_OPTIONS = [
    { key: 'camera',  icon: 'camera',         label: 'Take Photo',          sub: 'Capture with your camera',   handler: handleTakePhoto, grad: ['#6C63FF','#9C27B0'] },
    { key: 'gallery', icon: 'images',          label: 'Upload from Gallery', sub: 'Pick an existing photo',     handler: handleGallery,   grad: ['#FF6B9D','#FF4757'] },
    { key: 'barcode', icon: 'barcode-outline', label: 'Scan Barcode',        sub: 'Scan tag for auto-fill',     handler: handleBarcode,   grad: ['#4CAF82','#00BCD4'] },
  ];

  const screenBg  = isDark ? '#0D0D1F' : '#fff';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const TITLES    = ['Add Item', 'Crop & Adjust', 'Edit Photo', 'AI Magic ✨', 'Details'];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: screenBg }} edges={['top', 'bottom']}>

        {/* ── Top nav bar ── */}
        <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:8,
          paddingVertical:10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderCol }}>
          <TouchableOpacity
            onPress={step > 0 ? () => setStep(s => s - 1) : onClose}
            activeOpacity={0.7}
            style={{ width:44, height:44, alignItems:'center', justifyContent:'center' }}>
            <Ionicons name={step > 0 ? 'chevron-back' : 'close'} size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ flex:1, textAlign:'center', color:colors.textPrimary, fontSize:17, fontWeight:'900' }}>
            {TITLES[step] || 'Add Item'}
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}
            style={{ width:44, height:44, alignItems:'center', justifyContent:'center' }}>
            {step > 0
              ? <Ionicons name="close" size={22} color={colors.textSecondary} />
              : <View style={{ width:44 }} />}
          </TouchableOpacity>
        </View>

        {/* ── Step progress bar ── */}
        {step > 0 && (
          <View style={{ flexDirection:'row', paddingHorizontal:20, gap:6, paddingVertical:10 }}>
            {[1,2,3,4].map(i => (
              <View key={i} style={{ height:3, flex: i === step ? 2 : 1, borderRadius:2,
                backgroundColor: i <= step ? '#6C63FF' : (isDark ? 'rgba(255,255,255,0.12)' : '#E0DCFF') }} />
            ))}
          </View>
        )}

        {/* ── Content ── */}
        <View style={{ flex: 1 }}>

          {/* STEP 0: Choose input */}
          {step === 0 && (
            <View style={{ flex:1, paddingHorizontal:20, justifyContent:'center', gap:14, paddingBottom:20 }}>
              <View style={{ marginBottom:8 }}>
                <Text style={{ color: colors.textPrimary, fontSize:22, fontWeight:'900', marginBottom:4 }}>Add an item</Text>
                <Text style={{ color: colors.textSecondary, fontSize:14 }}>How would you like to add this item?</Text>
              </View>
              {INPUT_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.key} onPress={opt.handler} activeOpacity={0.78} disabled={picking}
                  style={{ flexDirection:'row', alignItems:'center', gap:16, padding:18, borderRadius:18,
                    backgroundColor: isDark ? '#1A1A2E' : '#F5F4FF',
                    borderWidth:1, borderColor: isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.15)',
                    opacity: picking ? 0.6 : 1 }}>
                  <LinearGradient colors={opt.grad} style={{ width:54, height:54, borderRadius:17, alignItems:'center', justifyContent:'center' }} start={{x:0,y:0}} end={{x:1,y:1}}>
                    {picking && (opt.key === 'camera' || opt.key === 'gallery')
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name={opt.icon} size={26} color="#fff" />}
                  </LinearGradient>
                  <View style={{ flex:1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight:'800', fontSize:16 }}>{opt.label}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize:13, marginTop:3 }}>{opt.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* STEP 1: Crop & Adjust */}
          {step === 1 && imageUri && (
            <CropStep
              imageUri={imageUri}
              onDone={(uri) => { setImageUri(uri); setStep(2); }}
              colors={colors} isDark={isDark}
            />
          )}

          {/* STEP 2: Edit Photo (BG remove + erase) */}
          {step === 2 && imageUri && (
            <EditStep
              imageUri={imageUri}
              onNext={() => startAI(null)}
              colors={colors} isDark={isDark}
            />
          )}

          {/* STEP 3: AI Processing */}
          {step === 3 && (
            <View style={{ flex:1, paddingHorizontal:20, paddingTop:10, paddingBottom:24 }}>
              {/* Photo preview */}
              <View style={{ flex:1, borderRadius:20, overflow:'hidden', marginBottom:20, maxHeight:260 }}>
                {imageUri ? (
                  <>
                    <Image source={{ uri: imageUri }} style={{ width:'100%', height:'100%' }} resizeMode="cover" />
                    <LinearGradient colors={['transparent','rgba(108,99,255,0.6)']}
                      style={StyleSheet.absoluteFill} start={{x:0,y:0}} end={{x:0,y:1}} />
                    <View style={{ position:'absolute', bottom:14, left:16, flexDirection:'row', alignItems:'center', gap:8 }}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={{ color:'#fff', fontSize:13, fontWeight:'700' }}>Analysing your item...</Text>
                    </View>
                  </>
                ) : (
                  <LinearGradient colors={['#E3F2FD','#EDE9FF']} style={{ flex:1, alignItems:'center', justifyContent:'center' }} start={{x:0,y:0}} end={{x:1,y:1}}>
                    <Text style={{ fontSize:72 }}>{CAT_EMOJIS[detectedCat] || '👕'}</Text>
                  </LinearGradient>
                )}
              </View>

              {/* AI step list */}
              <View style={{ gap:14, marginBottom:24 }}>
                {AI_STEPS.map((msg, i) => {
                  const done   = i < stepIdx || (i === stepIdx && aiDone);
                  const active = i === stepIdx && !aiDone;
                  return (
                    <Animated.View key={i} style={{ flexDirection:'row', alignItems:'center', gap:14,
                      opacity: stepAnims[i].interpolate({ inputRange:[0,1], outputRange:[0,1] }),
                      transform:[{ translateX: stepAnims[i].interpolate({ inputRange:[0,1], outputRange:[20,0] }) }] }}>
                      <View style={{ width:30, height:30, borderRadius:15, alignItems:'center', justifyContent:'center',
                        backgroundColor: done ? '#4CAF82' : active ? '#6C63FF22' : (isDark ? 'rgba(255,255,255,0.06)' : '#F0EEFF') }}>
                        {done
                          ? <Ionicons name="checkmark" size={16} color="#fff" />
                          : active
                            ? <ActivityIndicator size="small" color="#6C63FF" />
                            : <View style={{ width:8, height:8, borderRadius:4, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#D0CAFF' }} />}
                      </View>
                      <Text style={{ color: done ? '#4CAF82' : active ? colors.textPrimary : colors.textSecondary,
                        fontWeight: active ? '700' : '500', fontSize:15 }}>{msg}</Text>
                    </Animated.View>
                  );
                })}
              </View>

              {aiDone && (
                <TouchableOpacity onPress={() => setStep(4)} activeOpacity={0.88}>
                  <LinearGradient colors={['#4CAF82','#2E7D32']}
                    style={{ flexDirection:'row', gap:10, alignItems:'center', justifyContent:'center', paddingVertical:17, borderRadius:16 }}
                    start={{x:0,y:0}} end={{x:1,y:0}}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={{ color:'#fff', fontWeight:'900', fontSize:16 }}>Analysis Complete! Fill Details →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* STEP 4: Details form */}
          {step === 4 && (
            <View style={{ flex: 1 }}>
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal:20, gap:14, paddingTop:14, paddingBottom:16 }}>

                {/* Photo thumbnail + AI badge */}
                <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                  {imageUri && (
                    <View style={{ width:60, height:74, borderRadius:14, overflow:'hidden', borderWidth:2, borderColor:'#6C63FF33' }}>
                      <Image source={{ uri: imageUri }} style={{ width:'100%', height:'100%' }} resizeMode="cover" />
                    </View>
                  )}
                  <View style={{ flex:1, gap:4 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#4CAF8218', paddingHorizontal:12, paddingVertical:6, borderRadius:999, alignSelf:'flex-start' }}>
                      <Ionicons name="sparkles" size={13} color="#4CAF82" />
                      <Text style={{ color:'#4CAF82', fontSize:12, fontWeight:'700' }}>AI detected: {detectedCat}</Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize:12 }}>Fill in the details below</Text>
                  </View>
                </View>

                {/* Type toggle */}
                <View style={{ flexDirection:'row', gap:8 }}>
                  {[['personal','Personal','person-outline'],['home','Home','home-outline']].map(([v,l,ic]) => (
                    <TouchableOpacity key={v} onPress={() => setWType(v)} activeOpacity={0.8}
                      style={{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:12,
                        borderRadius:12, borderWidth:1, backgroundColor: wType===v ? '#6C63FF15' : inputBg, borderColor: wType===v ? '#6C63FF' : brd }}>
                      <Ionicons name={ic} size={14} color={wType===v ? '#6C63FF' : colors.textSecondary} />
                      <Text style={{ color: wType===v ? '#6C63FF' : colors.textSecondary, fontWeight:'700', fontSize:13 }}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Name */}
                <View style={[S.inputRow, { backgroundColor: inputBg, borderColor: brd }]}>
                  <Ionicons name="shirt-outline" size={16} color={colors.textSecondary} style={{ marginLeft:12 }} />
                  <TextInput style={[S.textInput, { color: colors.textPrimary }]} placeholder="Item name *"
                    placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName}
                    returnKeyType="next" />
                </View>

                {/* Brand + Size */}
                <View style={{ flexDirection:'row', gap:10 }}>
                  <View style={[S.inputRow, { flex:1, backgroundColor: inputBg, borderColor: brd }]}>
                    <TextInput style={[S.textInput, { color: colors.textPrimary }]} placeholder="Brand"
                      placeholderTextColor={colors.textSecondary} value={brand} onChangeText={setBrand} />
                  </View>
                  <View style={[S.inputRow, { flex:1, backgroundColor: inputBg, borderColor: brd }]}>
                    <TextInput style={[S.textInput, { color: colors.textPrimary }]} placeholder="Size"
                      placeholderTextColor={colors.textSecondary} value={size} onChangeText={setSize} />
                  </View>
                </View>

                {/* Price */}
                <View style={[S.inputRow, { backgroundColor: inputBg, borderColor: brd }]}>
                  <Text style={{ color: colors.textSecondary, fontSize:16, paddingLeft:14, fontWeight:'700' }}>₹</Text>
                  <TextInput style={[S.textInput, { color: colors.textPrimary }]} placeholder="Price (optional)"
                    placeholderTextColor={colors.textSecondary} value={price} onChangeText={setPrice} keyboardType="numeric" />
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

                {/* Colour */}
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
                </View>
              </ScrollView>

              {/* Fixed "Add to Closet" button — always visible, never scrolls away */}
              <View style={{ paddingHorizontal:20, paddingTop:10, paddingBottom:16,
                borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                backgroundColor: screenBg }}>
                <TouchableOpacity onPress={handleSave} disabled={saving || !name.trim()} activeOpacity={0.85}>
                  <LinearGradient colors={['#6C63FF','#9C27B0']} style={[S.saveBtn, { opacity: name.trim() ? 1 : 0.42 }]} start={{x:0,y:0}} end={{x:1,y:0}}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={{ color:'#fff', fontWeight:'900', fontSize:15 }}>Add to Closet</Text>
                    </>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── User Switcher Sheet ────────────────────────────────────────────────────────
function UserSwitcherSheet({ visible, onClose, onSwitch, current, colors, isDark }) {
  const { members } = useFamilyStore();
  const { user }    = useAuthStore();
  const anim        = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: visible ? 0 : 400, useNativeDriver: true, tension: 68, friction: 12 }).start();
  }, [visible]);

  const options = [
    { id: user?._id||'me', name: user?.name||'Prashant', sub: 'My Wardrobe', icon: 'person-circle', color: '#6C63FF', type: 'personal', memberId: user?._id },
    ...members.filter(m => m.id !== user?._id).map((m, i) => ({
      id: m.id, name: m.name.split(' ')[0], sub: 'Family Member', icon: 'person', color: MEMBER_COLORS[(i+1)%MEMBER_COLORS.length], type: 'personal', memberId: m.id,
    })),
    { id: 'home', name: 'Household', sub: 'Bedding, linens & shared', icon: 'home', color: '#4CAF82', type: 'home', memberId: null },
  ];

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor:'rgba(0,0,0,0.5)' }]} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[S.bottomSheet, { backgroundColor: isDark ? '#0E0E1F' : '#fff', paddingBottom:44, transform:[{translateY: anim}] }]}>
        <View style={[S.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#DDD' }]} />
        <Text style={{ color: colors.textPrimary, fontWeight:'900', fontSize:18, paddingHorizontal:20, paddingVertical:14 }}>Switch Wardrobe</Text>
        {options.map(o => {
          const active = current?.id === o.id;
          return (
            <TouchableOpacity key={o.id} onPress={() => { onSwitch(o); onClose(); }} activeOpacity={0.78}
              style={{ flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:20, paddingVertical:14,
                backgroundColor: active ? o.color+'15' : 'transparent' }}>
              <LinearGradient colors={[o.color, o.color+'BB']} style={{ width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' }} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Ionicons name={o.icon} size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex:1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight:'800', fontSize:15 }}>{o.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize:12, marginTop:1 }}>{o.sub}</Text>
              </View>
              {active && <View style={{ width:26, height:26, borderRadius:13, backgroundColor: o.color, alignItems:'center', justifyContent:'center' }}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </Modal>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ wardrobeType, memberId, colors, isDark, onSeeAllPicks }) {
  const { radius } = useTheme();
  const { items: storeItems, stats: storeStats, fetchItems, fetchStats } = useWardrobeStore();
  const [cat, setCat]   = useState('All');
  const [cols, setCols] = useState(3);
  const [sel, setSel]   = useState(null);

  useFocusEffect(useCallback(() => {
    fetchItems(wardrobeType, memberId).catch(() => {});
    fetchStats(memberId).catch(() => {});
  }, [wardrobeType, memberId]));

  const allItems = storeItems.length > 0 ? storeItems : MOCK_ITEMS.filter(i => i.wardrobeType === 'personal');
  const stats    = storeStats.total > 0 ? storeStats : { total: MOCK_ITEMS.length, laundry: MOCK_ITEMS.filter(i=>!i.isClean).length, lastAdded: 'Silk Blouse' };
  const filtered = cat === 'All' ? allItems : allItems.filter(i => i.category === cat);

  const totalWears  = allItems.reduce((s, i) => s + (i.wears||0), 0);
  const totalValue  = allItems.reduce((s, i) => s + (i.price||0), 0);
  const freshPct    = Math.round((stats.total - stats.laundry) / Math.max(stats.total,1) * 100);
  const cardW3      = (W - 48) / 3;
  const cardW4      = (W - 56) / 4;
  const cardW       = cols === 3 ? cardW3 : cardW4;
  const colGap      = cols === 3 ? 12 : 8;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:130 }}
      stickyHeaderIndices={[2]}>
      {/* Analytics Card — same pattern as Expenses hero */}
      <View style={[S.analyticsCard, { borderRadius: radius + 4, overflow:'hidden' }]}>
        {Platform.OS === 'ios' && (
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient
          colors={['rgba(100,85,255,0.88)','rgba(38,18,100,0.95)']}
          start={{x:0,y:0}} end={{x:1,y:1}}
          style={StyleSheet.absoluteFill}
        />
        {/* top highlight line */}
        <View style={{ position:'absolute', top:0, left:0, right:0, height:1.5, backgroundColor:'rgba(255,255,255,0.32)' }} />

        {/* Hero row */}
        <View style={{ flexDirection:'row', alignItems:'flex-start', marginBottom:16 }}>
          <View style={{ flex:1 }}>
            <View style={{ alignSelf:'flex-start', backgroundColor:'rgba(255,255,255,0.18)', paddingHorizontal:10, paddingVertical:4, borderRadius:999, marginBottom:10 }}>
              <Text style={{ fontSize:10, fontWeight:'800', letterSpacing:1, color:'#fff' }}>AI WARDROBE</Text>
            </View>
            <Text style={{ fontSize:11, fontWeight:'700', letterSpacing:1, color:'rgba(255,255,255,0.65)', marginBottom:4 }}>TOTAL ITEMS</Text>
            <Text style={{ fontSize:36, fontWeight:'800', color:'#fff', letterSpacing:-1 }}>{stats.total}</Text>
            <Text style={{ fontSize:12, fontWeight:'500', color:'rgba(255,255,255,0.6)', marginTop:4 }}>
              {stats.laundry > 0 ? `${stats.laundry} in laundry` : 'All items clean ✓'}
            </Text>
          </View>
          <View style={{ alignItems:'center', justifyContent:'center', width:68, height:68,
            borderRadius:34, backgroundColor:'rgba(255,255,255,0.15)', marginLeft:12, marginTop:4 }}>
            <Text style={{ fontSize:18, fontWeight:'900', color:'#fff' }}>{freshPct}%</Text>
            <Text style={{ fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.7)' }}>fresh</Text>
          </View>
        </View>

        {/* Freshness progress bar */}
        <View style={{ height:6, borderRadius:3, backgroundColor:'rgba(255,255,255,0.2)', overflow:'hidden' }}>
          <View style={{ height:'100%', borderRadius:3, width:`${freshPct}%`,
            backgroundColor: freshPct > 80 ? '#A8EDEA' : freshPct > 50 ? '#FCD9A5' : '#FF6B6B' }} />
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:7 }}>
          <Text style={{ fontSize:11, fontWeight:'600', color:'rgba(255,255,255,0.65)' }}>
            {stats.total - stats.laundry} clean
          </Text>
          <Text style={{ fontSize:11, fontWeight:'600', color:'rgba(255,255,255,0.65)' }}>
            {freshPct}% fresh
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height:1, backgroundColor:'rgba(255,255,255,0.15)', marginVertical:16 }} />

        {/* Stats row */}
        <View style={{ flexDirection:'row', alignItems:'center' }}>
          {[
            { val: `₹${totalValue >= 1000 ? `${Math.round(totalValue/1000)}K` : totalValue}`, label:'Closet Value', color:'#FCD9A5' },
            { val: `${totalWears}×`,   label:'Times Worn',    color:'#F9A8D4' },
            { val: `${totalWears > 0 && stats.total > 0 ? Math.round(totalWears/stats.total) : 0}×`, label:'Avg / Item', color:'#A8EDEA' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={{ width:1, height:26, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:1 }} />}
              <View style={{ flex:1, alignItems:'center', gap:3 }}>
                <Text style={{ fontSize:14, fontWeight:'800', color: s.color }}>{s.val}</Text>
                <Text style={{ fontSize:10, fontWeight:'600', color:'rgba(255,255,255,0.55)' }}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Today's Picks */}
      <View style={{ marginTop:20, marginBottom:6 }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingHorizontal:16 }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize:17, fontWeight:'900' }}>Today's Picks</Text>
            <Text style={{ color: colors.textSecondary, fontSize:11, fontWeight:'500', marginTop:2 }}>AI-curated looks from your closet</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAllPicks}
            style={{ backgroundColor: isDark ? 'rgba(108,99,255,0.18)' : '#EDE9FF', paddingHorizontal:12, paddingVertical:6, borderRadius:999 }}>
            <Text style={{ color:'#6C63FF', fontSize:12, fontWeight:'700' }}>See All →</Text>
          </TouchableOpacity>
        </View>
        {(() => {
          const PICK_W = (W - 16*2 - 12) / 2;
          return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              snapToInterval={PICK_W + 12}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal:16, gap:12 }}>
              {MOCK_SUGGESTIONS.map(s => (
                <TouchableOpacity key={s.id} activeOpacity={0.88}
                  style={{ width: PICK_W, borderRadius: radius + 2, overflow:'hidden',
                    shadowColor: s.grad[1], shadowOpacity:0.35, shadowRadius:10, shadowOffset:{width:0,height:5}, elevation:6 }}>
                  <LinearGradient colors={s.grad} style={{ padding:14 }} start={{x:0,y:0}} end={{x:1,y:1}}>
                    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <Text style={{ fontSize:9, fontWeight:'800', letterSpacing:0.8, color:'rgba(255,255,255,0.65)' }}>AI PICK</Text>
                      <View style={{ backgroundColor:'rgba(255,255,255,0.25)', paddingHorizontal:7, paddingVertical:3, borderRadius:999 }}>
                        <Text style={{ color:'#fff', fontSize:10, fontWeight:'800' }}>{s.score}%</Text>
                      </View>
                    </View>
                    <Text style={{ color:'#fff', fontSize:13, fontWeight:'900', marginBottom:10 }} numberOfLines={1}>{s.label}</Text>
                    <View style={{ flexDirection:'row', gap:5, marginBottom:10 }}>
                      {s.swatches.map((c, j) => (
                        <View key={j} style={{ width:20, height:20, borderRadius:6, backgroundColor:c, borderWidth:1.5, borderColor:'rgba(255,255,255,0.45)' }} />
                      ))}
                    </View>
                    <Text style={{ color:'rgba(255,255,255,0.6)', fontSize:10, fontWeight:'600' }}>{s.items.length} pieces</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          );
        })()}
      </View>

      {/* Category Strip — sticky child index 2 */}
      <View style={{
        backgroundColor: isDark ? '#07071A' : '#F7F5FF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)',
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal:16, gap:10, paddingVertical:12, alignItems:'center' }}>
          {CATEGORY_STRIP.map(c => {
            const on = cat === c.id;
            return (
              <TouchableOpacity key={c.id} onPress={() => setCat(c.id)} activeOpacity={0.8}
                style={{ alignItems:'center', gap:5 }}>
                <View style={{ width:50, height:50, borderRadius: radius + 4,
                  backgroundColor: on ? c.color : (isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF'),
                  alignItems:'center', justifyContent:'center',
                  borderWidth: on ? 0 : 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)',
                  shadowColor: on ? c.color : 'transparent', shadowOpacity:0.35, shadowRadius:8, shadowOffset:{width:0,height:3} }}>
                  <Text style={{ fontSize:21 }}>{c.emoji}</Text>
                </View>
                <Text style={{ color: on ? c.color : colors.textSecondary, fontSize:10, fontWeight: on ? '800' : '600' }}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid header */}
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, marginBottom:10 }}>
        <Text style={{ color: colors.textSecondary, fontSize:12, fontWeight:'600' }}>{filtered.length} items</Text>
        <View style={{ flexDirection:'row', gap:4 }}>
          {[3,4].map(n => (
            <TouchableOpacity key={n} onPress={() => setCols(n)} activeOpacity={0.8}
              style={{ width:34, height:34, borderRadius: radius, alignItems:'center', justifyContent:'center',
                backgroundColor: cols===n ? '#6C63FF' : (isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF') }}>
              <Ionicons name={n===3 ? 'grid-outline' : 'apps-outline'} size={16} color={cols===n ? '#fff' : '#6C63FF'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Grid */}
      <FlatList key={`overview-cols-${cols}`} data={filtered} keyExtractor={i => i.id}
        numColumns={cols}
        columnWrapperStyle={{ gap: colGap, paddingHorizontal:16 }}
        contentContainerStyle={{ gap: colGap }}
        scrollEnabled={false}
        renderItem={({ item }) => <ItemCard item={item} onPress={() => setSel(item)} cardW={cardW} colors={colors} isDark={isDark} />}
      />

      <ItemDetailSheet item={sel} visible={!!sel} onClose={() => setSel(null)} colors={colors} isDark={isDark}
        onMarkWorn={() => setSel(null)} onMarkClean={() => setSel(null)}
        onDelete={() => Alert.alert('Delete?', `Remove "${sel?.name}"?`, [{ text:'Cancel',style:'cancel' },{ text:'Delete', style:'destructive', onPress:() => setSel(null) }])} />
    </ScrollView>
  );
}

// ── Closet Tab ─────────────────────────────────────────────────────────────────
function ClosetTab({ wardrobeType, memberId, colors, isDark, onAdd }) {
  const { radius } = useTheme();
  const { items: storeItems, stats: storeStats, loading, fetchItems, fetchStats, markWorn, markClean, deleteItem } = useWardrobeStore();
  const [cat, setCat]   = useState('All');
  const [cols, setCols] = useState(3);
  const [sel, setSel]   = useState(null);

  useFocusEffect(useCallback(() => {
    fetchItems(wardrobeType, memberId).catch(() => {});
    if (wardrobeType === 'personal') fetchStats(memberId).catch(() => {});
  }, [wardrobeType, memberId]));

  useEffect(() => { setCat('All'); fetchItems(wardrobeType, memberId).catch(() => {}); }, [wardrobeType, memberId]);

  const allItems   = storeItems.length > 0 ? storeItems : MOCK_ITEMS.filter(i => i.wardrobeType === (wardrobeType||'personal'));
  const stats      = storeItems.length > 0 ? storeStats : { total: allItems.length, laundry: allItems.filter(i=>!i.isClean).length, lastAdded: 'Silk Blouse' };
  const filtered   = cat === 'All' ? allItems : allItems.filter(i => i.category === cat);
  const colGap     = cols === 3 ? 12 : 8;
  const cardW      = (W - 32 - colGap * (cols - 1)) / cols;
  const cleanCount  = Math.max(0, stats.total - stats.laundry);
  const cleanPct    = stats.total > 0 ? Math.round(cleanCount / stats.total * 100) : 100;
  const screenBg    = isDark ? '#07071A' : '#F7F5FF';
  const neverWorn   = allItems.filter(i => (i.wears || 0) === 0).length;
  const totalWears  = allItems.reduce((s, i) => s + (i.wears || 0), 0);
  const avgWears    = stats.total > 0 ? (totalWears / stats.total).toFixed(1) : '0';
  const mostWorn    = allItems.length > 0 ? allItems.reduce((m, i) => ((i.wears||0) > (m.wears||0) ? i : m), allItems[0]) : null;
  const wornClean   = allItems.filter(i => (i.wears||0) > 0 && i.isClean).length;
  const wornLaundry = allItems.filter(i => (i.wears||0) > 0 && !i.isClean).length;
  const totalValue  = allItems.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const catStrip    = wardrobeType === 'home' ? CLOSET_HOME_STRIP : CLOSET_PERSONAL_STRIP;

  return (
    <View style={{ flex:1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        stickyHeaderIndices={[1]}
      >
        {/* ── 0: Hero card ── */}
        <View style={[S.closetHero, { borderRadius: radius + 4, overflow:'hidden' }]}>
          {Platform.OS === 'ios' && (
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={['rgba(22,42,180,0.92)','rgba(8,0,55,0.97)']}
            start={{x:0,y:0}} end={{x:1,y:1}}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ position:'absolute', top:0, left:0, right:0, height:1.5, backgroundColor:'rgba(168,237,234,0.45)' }} />

          {/* Top row: total + health score */}
          <View style={{ flexDirection:'row', alignItems:'flex-start', marginBottom:14 }}>
            <View style={{ flex:1 }}>
              <View style={{ alignSelf:'flex-start', backgroundColor:'rgba(168,237,234,0.2)', paddingHorizontal:10, paddingVertical:4, borderRadius:999, marginBottom:8 }}>
                <Text style={{ fontSize:10, fontWeight:'800', letterSpacing:1.2, color:'#A8EDEA' }}>
                  {wardrobeType === 'home' ? '🏠 HOME LINEN' : '👗 MY CLOSET'}
                </Text>
              </View>
              <Text style={{ fontSize:11, fontWeight:'700', letterSpacing:0.8, color:'rgba(168,237,234,0.7)', marginBottom:2 }}>TOTAL ITEMS</Text>
              <View style={{ flexDirection:'row', alignItems:'flex-end', gap:8 }}>
                <Text style={{ fontSize:40, fontWeight:'900', color:'#fff', letterSpacing:-1.5 }}>{stats.total}</Text>
                <Text style={{ fontSize:12, fontWeight:'500', color:'rgba(255,255,255,0.5)', paddingBottom:6 }}>
                  across {new Set(allItems.map(i=>i.category).filter(Boolean)).size} categories
                </Text>
              </View>
            </View>
            {/* Health score badge */}
            <View style={{ alignItems:'center', paddingLeft:10 }}>
              <View style={{ width:62, height:62, borderRadius:31,
                borderWidth:2, borderColor:'rgba(168,237,234,0.4)',
                backgroundColor:'rgba(168,237,234,0.08)',
                alignItems:'center', justifyContent:'center' }}>
                <Text style={{ fontSize:17, fontWeight:'900', color:'#A8EDEA' }}>{cleanPct}%</Text>
                <Text style={{ fontSize:9, fontWeight:'700', color:'rgba(168,237,234,0.65)' }}>CLEAN</Text>
              </View>
              <Text style={{ fontSize:9, fontWeight:'600', color:'rgba(255,255,255,0.4)', marginTop:5 }}>closet health</Text>
            </View>
          </View>

          {/* Segmented bar: worn-clean / laundry / never worn */}
          {stats.total > 0 && (
            <>
              <View style={{ height:7, borderRadius:4, flexDirection:'row', gap:2, overflow:'hidden', marginBottom:8 }}>
                {wornClean > 0   && <View style={{ flex: wornClean,   backgroundColor:'#4CAF82', borderRadius:4 }} />}
                {wornLaundry > 0 && <View style={{ flex: wornLaundry, backgroundColor:'#FFB347', borderRadius:4 }} />}
                {neverWorn > 0   && <View style={{ flex: neverWorn,   backgroundColor:'rgba(255,255,255,0.18)', borderRadius:4 }} />}
              </View>
              <View style={{ flexDirection:'row', gap:14 }}>
                {[
                  { dot:'#4CAF82', label:`${wornClean} worn & clean` },
                  { dot:'#FFB347', label:`${wornLaundry} in laundry` },
                  { dot:'rgba(255,255,255,0.35)', label:`${neverWorn} unworn` },
                ].map(s => (
                  <View key={s.label} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                    <View style={{ width:6, height:6, borderRadius:3, backgroundColor: s.dot }} />
                    <Text style={{ fontSize:10, fontWeight:'600', color:'rgba(255,255,255,0.55)' }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Divider */}
          <View style={{ height:1, backgroundColor:'rgba(255,255,255,0.1)', marginVertical:14 }} />

          {/* Most worn insight */}
          {mostWorn && (mostWorn.wears || 0) > 0 && (
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.07)',
              borderRadius: radius, padding:10, marginBottom:14 }}>
              <Text style={{ fontSize:18, marginRight:10 }}>🔥</Text>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.45)', letterSpacing:0.5 }}>MOST WORN</Text>
                <Text style={{ fontSize:13, fontWeight:'800', color:'#fff', marginTop:1 }} numberOfLines={1}>
                  {mostWorn.name}
                </Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={{ fontSize:16, fontWeight:'900', color:'#A8EDEA' }}>{mostWorn.wears}×</Text>
                <Text style={{ fontSize:9, fontWeight:'600', color:'rgba(255,255,255,0.4)' }}>worn</Text>
              </View>
            </View>
          )}

          {/* Bottom stats */}
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            {[
              { val: `${avgWears}×`, label:'Avg wears',    color:'#A8EDEA' },
              { val: String(neverWorn), label:'Never worn', color:'rgba(255,255,255,0.6)' },
              { val: totalValue > 0 ? `₹${(totalValue/1000).toFixed(1)}k` : '—', label:'Value', color:'#FFB347' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={{ width:1, height:26, backgroundColor:'rgba(255,255,255,0.12)', borderRadius:1 }} />}
                <View style={{ flex:1, alignItems:'center', gap:2 }}>
                  <Text style={{ fontSize:14, fontWeight:'800', color: s.color }}>{s.val}</Text>
                  <Text style={{ fontSize:10, fontWeight:'600', color:'rgba(255,255,255,0.4)' }}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── 1: Sticky category strip + toolbar ── */}
        <View style={{
          backgroundColor: screenBg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal:16, gap:10, paddingVertical:12, alignItems:'center' }}>
            {catStrip.map(c => {
              const on = cat === c.id;
              return (
                <TouchableOpacity key={c.id} onPress={() => setCat(c.id)} activeOpacity={0.8}
                  style={{ alignItems:'center', gap:5 }}>
                  <View style={{ width:50, height:50, borderRadius: radius + 4,
                    backgroundColor: on ? c.color : (isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF'),
                    alignItems:'center', justifyContent:'center',
                    borderWidth: on ? 0 : 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)',
                    shadowColor: on ? c.color : 'transparent',
                    shadowOpacity:0.35, shadowRadius:8, shadowOffset:{width:0,height:3} }}>
                    <Text style={{ fontSize:22 }}>{c.emoji}</Text>
                  </View>
                  <Text style={{ color: on ? c.color : colors.textSecondary, fontSize:10, fontWeight: on ? '800' : '600' }}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between',
            paddingHorizontal:16, paddingVertical:7,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <Text style={{ color: colors.textSecondary, fontSize:12, fontWeight:'600' }}>
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </Text>
            <View style={{ flexDirection:'row', gap:4 }}>
              {[3,4].map(n => (
                <TouchableOpacity key={n} onPress={() => setCols(n)} activeOpacity={0.8}
                  style={{ width:34, height:34, borderRadius: radius, alignItems:'center', justifyContent:'center',
                    backgroundColor: cols===n ? '#6C63FF' : (isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF') }}>
                  <Ionicons name={n===3 ? 'grid-outline' : 'apps-outline'} size={16} color={cols===n ? '#fff' : '#6C63FF'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── 2: Grid or empty state ── */}
        {loading ? (
          <View style={{ paddingVertical:60, alignItems:'center' }}>
            <ActivityIndicator color="#6C63FF" size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical:60, alignItems:'center', gap:14, paddingHorizontal:32 }}>
            <LinearGradient colors={['#6C63FF22','#6C63FF0A']} style={{ width:90, height:90, borderRadius:28, alignItems:'center', justifyContent:'center' }}>
              <Ionicons name="shirt-outline" size={42} color="#6C63FF" />
            </LinearGradient>
            <Text style={{ color: colors.textPrimary, fontSize:19, fontWeight:'900' }}>Nothing here yet</Text>
            <TouchableOpacity onPress={onAdd} activeOpacity={0.85}>
              <LinearGradient colors={['#6C63FF','#9C27B0']} style={{ flexDirection:'row', gap:8, alignItems:'center', paddingHorizontal:26, paddingVertical:14, borderRadius: radius }} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color:'#fff', fontWeight:'800', fontSize:14 }}>Add Item</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap: colGap, paddingHorizontal:16, paddingTop:12 }}>
            {filtered.map(item => (
              <ItemCard key={item.id} item={item} onPress={() => setSel(item)} cardW={cardW} colors={colors} isDark={isDark} />
            ))}
          </View>
        )}
      </ScrollView>

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

// ── Outfits Tab ────────────────────────────────────────────────────────────────
function OutfitsTab({ memberId, colors, isDark }) {
  const { radius } = useTheme();
  const { suggestions, suggestLoading, fetchSuggestions, toggleLike } = useWardrobeStore();
  const [occasion, setOccasion] = useState(null);
  const [done, setDone]         = useState(false);

  const generate = async (occ) => {
    setOccasion(occ);
    try { await fetchSuggestions(occ, memberId); setDone(true); }
    catch { setDone(true); }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom:130 }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={isDark ? ['#12023A','#1A0050'] : ['#6C63FF','#9C27B0']}
        style={{ margin:16, borderRadius: radius + 4, padding:22, flexDirection:'row', alignItems:'center', gap:14 }} start={{x:0,y:0}} end={{x:1,y:1}}>
        <Text style={{ fontSize:42 }}>✨</Text>
        <View style={{ flex:1 }}>
          <Text style={{ color:'#fff', fontWeight:'900', fontSize:19 }}>AI Outfit Builder</Text>
          <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:3 }}>
            Looks built from your actual closet
          </Text>
        </View>
      </LinearGradient>

      {/* Occasion grid */}
      {!done && (
        <>
          <Text style={[S.sectionLabel, { color: colors.textSecondary, paddingHorizontal:16, marginBottom:12 }]}>
            PICK AN OCCASION
          </Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12, paddingHorizontal:16 }}>
            {OCCASIONS_GRID.map(o => (
              <TouchableOpacity key={o.id} onPress={() => generate(o.id)} activeOpacity={0.82}
                style={{ width:(W-44)/2, borderRadius: radius + 4, overflow:'hidden',
                  shadowColor:'#000', shadowOpacity:0.15, shadowRadius:10, shadowOffset:{width:0,height:4}, elevation:4 }}>
                <LinearGradient colors={o.grad} style={{ paddingVertical:20, alignItems:'center', gap:8 }} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Text style={{ fontSize:32 }}>{o.emoji}</Text>
                  <Text style={{ color:'#fff', fontWeight:'800', fontSize:14 }}>{o.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Results */}
      {done && (
        <View style={{ paddingHorizontal:16, gap:14 }}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <Text style={{ color: colors.textPrimary, fontWeight:'900', fontSize:17 }}>
              {occasion} Looks
            </Text>
            <TouchableOpacity onPress={() => setDone(false)} activeOpacity={0.7}
              style={{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor: isDark ? 'rgba(108,99,255,0.18)' : '#EDE9FF', paddingHorizontal:12, paddingVertical:7, borderRadius:999 }}>
              <Ionicons name="arrow-back" size={13} color="#6C63FF" />
              <Text style={{ color:'#6C63FF', fontWeight:'700', fontSize:12 }}>Change</Text>
            </TouchableOpacity>
          </View>

          {suggestLoading ? (
            <View style={{ alignItems:'center', padding:40 }}>
              <ActivityIndicator color="#6C63FF" size="large" />
              <Text style={{ color: colors.textSecondary, marginTop:12, fontSize:13 }}>Building outfits...</Text>
            </View>
          ) : suggestions.length > 0 ? suggestions.map(outfit => (
            <View key={outfit.id} style={{ borderRadius: radius + 4, overflow:'hidden',
              shadowColor:'#6C63FF', shadowOpacity:0.1, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:4,
              backgroundColor: isDark ? '#14142A' : '#fff' }}>
              <View style={{ flexDirection:'row', gap:4, height:80 }}>
                {outfit.items.map((it, j) => (
                  <View key={j} style={{ flex:1, backgroundColor: it.color || '#6C63FF' }}>
                    <LinearGradient colors={['transparent','rgba(0,0,0,0.25)']} style={StyleSheet.absoluteFill} />
                    <Text style={{ position:'absolute', bottom:6, left:0, right:0, textAlign:'center', fontSize:18 }}>
                      {CAT_EMOJIS[it.category]||'👕'}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ padding:14, gap:8 }}>
                {outfit.items.map((it, j) => (
                  <View key={j} style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <View style={{ width:8, height:8, borderRadius:4, backgroundColor: it.color || '#6C63FF' }} />
                    <Text style={{ color: colors.textPrimary, fontSize:13, fontWeight:'700' }}>{it.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize:11 }}>· {it.category}</Text>
                  </View>
                ))}
                <View style={{ flexDirection:'row', gap:8, marginTop:6 }}>
                  <TouchableOpacity onPress={() => toggleLike(outfit.id)} activeOpacity={0.8}
                    style={{ flexDirection:'row', gap:6, alignItems:'center', paddingHorizontal:14, paddingVertical:8, borderRadius:999,
                      backgroundColor: outfit.liked ? '#FF6B9D22' : (isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF') }}>
                    <Ionicons name={outfit.liked ? 'heart' : 'heart-outline'} size={14} color={outfit.liked ? '#FF6B9D' : colors.textSecondary} />
                    <Text style={{ color: outfit.liked ? '#FF6B9D' : colors.textSecondary, fontWeight:'700', fontSize:12 }}>
                      {outfit.liked ? 'Liked' : 'Like'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )) : (
            // Fallback: show mock cards
            MOCK_SUGGESTIONS.slice(0,2).map(s => (
              <View key={s.id} style={{ borderRadius: radius + 4, overflow:'hidden', backgroundColor: isDark ? '#14142A' : '#fff',
                shadowColor:'#6C63FF', shadowOpacity:0.1, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:4 }}>
                <LinearGradient colors={s.grad} style={{ height:80, flexDirection:'row' }} start={{x:0,y:0}} end={{x:1,y:0}}>
                  {s.swatches.map((c, j) => (
                    <View key={j} style={{ flex:1, backgroundColor:c+'80' }} />
                  ))}
                </LinearGradient>
                <View style={{ padding:14, gap:6 }}>
                  <Text style={{ color: colors.textPrimary, fontSize:15, fontWeight:'900' }}>{s.label}</Text>
                  {s.items.map((item, j) => (
                    <View key={j} style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                      <View style={{ width:7, height:7, borderRadius:4, backgroundColor: s.swatches[j]||'#6C63FF' }} />
                      <Text style={{ color: colors.textSecondary, fontSize:12 }}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ── Style Me Tab ───────────────────────────────────────────────────────────────
function StyleMeTab({ colors, isDark }) {
  const { radius } = useTheme();
  const { items: storeItems } = useWardrobeStore();
  const allItems = storeItems.length > 0 ? storeItems : MOCK_ITEMS;

  const ITEM_W = W / 3;

  const outerItems  = allItems.filter(i => i.category === 'Outerwear');
  const topItems    = allItems.filter(i => i.category === 'Tops');
  const bottomItems = allItems.filter(i => i.category === 'Bottoms');
  const shoeItems   = allItems.filter(i => i.category === 'Footwear');

  const ALL_ROWS = [
    { key:'jacket', label:'Jacket', emoji:'🧥', items: outerItems },
    { key:'top',    label:'Top',    emoji:'👕', items: topItems   },
    { key:'bottom', label:'Bottom', emoji:'👖', items: bottomItems },
    { key:'shoes',  label:'Shoes',  emoji:'👟', items: shoeItems  },
  ];

  const [rowCount, setRowCount] = useState(3);
  const [locked, setLocked]     = useState({});
  const [selIdx, setSelIdx]     = useState({ jacket:0, top:0, bottom:0, shoes:0 });
  const spinAnim   = useRef(new Animated.Value(0)).current;
  const [rolling, setRolling]   = useState(false);
  const scrollRefs = useRef({});

  // 3 rows = top/bottom/shoes  |  4 rows = jacket/top/bottom/shoes
  const activeRows = (rowCount === 4 ? ALL_ROWS : ALL_ROWS.slice(1)).filter(r => r.items.length > 0);

  const rollDice = () => {
    if (rolling) return;
    setRolling(true);
    Animated.sequence([
      Animated.timing(spinAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(spinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start(() => {
      const newSel = { ...selIdx };
      activeRows.forEach(row => {
        if (!locked[row.key] && row.items.length > 1) {
          let n;
          do { n = Math.floor(Math.random() * row.items.length); } while (n === selIdx[row.key]);
          newSel[row.key] = n;
          scrollRefs.current[row.key]?.scrollTo({ x: n * ITEM_W, animated: true });
        }
      });
      setSelIdx(newSel);
      setRolling(false);
    });
  };

  const spinRotate = spinAnim.interpolate({ inputRange:[0,1], outputRange:['0deg','360deg'] });
  const screenBg   = isDark ? '#07071A' : '#F7F5FF';

  return (
    <View style={{ flex:1, backgroundColor: screenBg }}>
      {/* ── Toolbar ── */}
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:10, gap:10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}>
        <View style={{ flex:1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight:'900', fontSize:16 }}>Style Me</Text>
          <Text style={{ color: colors.textSecondary, fontSize:10, fontWeight:'500', marginTop:1 }}>Scroll each row · center = selected</Text>
        </View>
        {/* Row count segmented button */}
        <View style={{ flexDirection:'row', backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#EDE9FF', borderRadius: radius + 2, padding:3 }}>
          {[3, 4].map(n => (
            <TouchableOpacity key={n} onPress={() => setRowCount(n)} activeOpacity={0.8}
              style={{ paddingHorizontal:14, paddingVertical:6, borderRadius: radius,
                backgroundColor: rowCount === n ? '#6C63FF' : 'transparent' }}>
              <Text style={{ color: rowCount === n ? '#fff' : colors.textSecondary, fontWeight:'700', fontSize:12 }}>
                {n} rows
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Dice FAB */}
        <TouchableOpacity onPress={rollDice} activeOpacity={0.85}
          style={{ width:44, height:44, borderRadius: radius + 2, alignItems:'center', justifyContent:'center',
            backgroundColor:'#6C63FF',
            shadowColor:'#6C63FF', shadowOpacity:0.5, shadowRadius:10, shadowOffset:{width:0,height:4}, elevation:8 }}>
          <Animated.Text style={{ fontSize:22, transform:[{ rotate: spinRotate }] }}>🎲</Animated.Text>
        </TouchableOpacity>
      </View>

      {/* ── Rows ── */}
      {activeRows.map((row, rowI) => {
        const isLocked = !!locked[row.key];
        const sIdx     = selIdx[row.key] ?? 0;
        const selItem  = row.items[sIdx];

        return (
          <View key={row.key} style={{ flex:1,
            borderBottomWidth: rowI < activeRows.length - 1 ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}>

            {/* Row label bar */}
            <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:8, paddingBottom:2, gap:8 }}>
              <Text style={{ fontSize:12 }}>{row.emoji}</Text>
              <Text style={{ color: colors.textSecondary, fontWeight:'800', fontSize:10, letterSpacing:0.8 }}>
                {row.label.toUpperCase()}
              </Text>
              {selItem && (
                <Text style={{ flex:1, color: colors.textPrimary, fontWeight:'700', fontSize:11 }} numberOfLines={1}>
                  {selItem.name}
                </Text>
              )}
              <TouchableOpacity onPress={() => setLocked(p => ({ ...p, [row.key]: !p[row.key] }))} activeOpacity={0.8}
                style={{ width:30, height:30, borderRadius:9, alignItems:'center', justifyContent:'center',
                  backgroundColor: isLocked ? 'rgba(108,99,255,0.22)' : (isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF') }}>
                <Ionicons name={isLocked ? 'lock-closed' : 'lock-open-outline'} size={14}
                  color={isLocked ? '#6C63FF' : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Snap scroll — centre item = selected */}
            <ScrollView
              ref={r => { scrollRefs.current[row.key] = r; }}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_W}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: ITEM_W }}
              onMomentumScrollEnd={e => {
                const idx = Math.max(0, Math.min(
                  Math.round(e.nativeEvent.contentOffset.x / ITEM_W),
                  row.items.length - 1,
                ));
                setSelIdx(p => ({ ...p, [row.key]: idx }));
              }}
              onScrollEndDrag={e => {
                const idx = Math.max(0, Math.min(
                  Math.round(e.nativeEvent.contentOffset.x / ITEM_W),
                  row.items.length - 1,
                ));
                setSelIdx(p => ({ ...p, [row.key]: idx }));
              }}
              style={{ flex:1 }}
            >
              {row.items.map((item, idx) => {
                const active = sIdx === idx;
                return (
                  <View key={item.id}
                    style={{ width: ITEM_W, alignItems:'center', justifyContent:'center',
                      opacity: active ? 1 : 0.35, paddingHorizontal:8 }}>
                    <View style={{ width:'100%', aspectRatio:0.72, borderRadius: radius + 4, overflow:'hidden',
                      borderWidth: active ? 2.5 : 0,
                      borderColor:'#6C63FF',
                      shadowColor: active ? '#6C63FF' : 'transparent',
                      shadowOpacity:0.45, shadowRadius:14, shadowOffset:{width:0,height:5}, elevation: active ? 8 : 0 }}>
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: item.color || '#EDE9FF' }]} />
                      <LinearGradient colors={['rgba(0,0,0,0)','rgba(0,0,0,0.32)']} style={StyleSheet.absoluteFill} />
                      {item.imageUrl
                        ? <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        : (
                          <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
                            <Text style={{ fontSize: ITEM_W * 0.28 }}>{CAT_EMOJIS[item.category] || '👕'}</Text>
                          </View>
                        )
                      }
                      {isLocked && active && (
                        <View style={{ position:'absolute', top:8, right:8, width:22, height:22, borderRadius:11,
                          backgroundColor:'rgba(108,99,255,0.9)', alignItems:'center', justifyContent:'center' }}>
                          <Ionicons name="lock-closed" size={11} color="#fff" />
                        </View>
                      )}
                      {!item.isClean && (
                        <View style={{ position:'absolute', top:8, left:8, width:8, height:8, borderRadius:4, backgroundColor:'#FF6B6B' }} />
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function WardrobeScreen() {
  const { colors, isDark }          = useTheme();
  const { user }                    = useAuthStore();
  const [activeTab, setActiveTab]   = useState('Overview');
  const [showAdd, setShowAdd]       = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [wardrobe, setWardrobe]     = useState({
    id: user?._id||'me', name: user?.name?.split(' ')[0]||'Prashant',
    type:'personal', memberId: user?._id, color:'#6C63FF',
  });

  const bg = isDark ? '#07071A' : '#F7F5FF';

  const getInitials = (name) => {
    if (!name) return 'P';
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0]+parts[1][0] : parts[0][0];
  };

  return (
    <View style={{ flex:1, backgroundColor: bg }}>
      {/* Header — matches calendar pattern */}
      <SafeAreaView edges={['top']} style={[S.screenHeader, {
        backgroundColor: isDark ? '#0E0E1F' : '#fff',
        borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.12)',
      }]}>
        <TouchableOpacity style={S.hdrBtn} onPress={() => router.push('/(app)/overview')} activeOpacity={0.7}>
          <Ionicons name="home-outline" size={20} color="#6C63FF" />
        </TouchableOpacity>

        <Text style={[S.hdrTitle, { color: colors.textPrimary }]}>AI Wardrobe</Text>

        <TouchableOpacity style={S.hdrBtn} onPress={() => setShowSwitcher(true)} activeOpacity={0.8}>
          <LinearGradient colors={[wardrobe.color||'#6C63FF', (wardrobe.color||'#6C63FF')+'BB']}
            style={{ width:34, height:34, borderRadius:11, alignItems:'center', justifyContent:'center' }}
            start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={{ color:'#fff', fontSize:13, fontWeight:'900' }}>
              {getInitials(wardrobe.name)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Content */}
      <View style={{ flex:1 }}>
        {activeTab === 'Overview' && <OverviewTab wardrobeType={wardrobe.type} memberId={wardrobe.memberId} colors={colors} isDark={isDark} onSeeAllPicks={() => setActiveTab('Outfits')} />}
        {activeTab === 'Closet'   && <ClosetTab   wardrobeType={wardrobe.type} memberId={wardrobe.memberId} colors={colors} isDark={isDark} onAdd={() => setShowAdd(true)} />}
        {activeTab === 'Outfits'  && <OutfitsTab  memberId={wardrobe.memberId} colors={colors} isDark={isDark} />}
        {activeTab === 'StyleMe'  && <StyleMeTab  colors={colors} isDark={isDark} />}
      </View>

      <AppBottomNav
        tabs={WARDROBE_TABS}
        isActive={t => (t.id ?? t.label) === activeTab}
        onPress={t => t.id && setActiveTab(t.id)}
        onAdd={() => setShowAdd(true)}
        accentColor="#6C63FF"
        isDark={isDark}
      />

      <AddFlowModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        colors={colors}
        isDark={isDark}
        defaultType={wardrobe.type}
        defaultMemberId={wardrobe.memberId}
      />

      <UserSwitcherSheet
        visible={showSwitcher}
        onClose={() => setShowSwitcher(false)}
        onSwitch={w => setWardrobe(w)}
        current={wardrobe}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  screenHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingBottom:10, paddingTop:2, borderBottomWidth:0.5 },
  hdrBtn: { width:38, height:38, alignItems:'center', justifyContent:'center' },
  hdrTitle: { fontSize:17, fontWeight:'800', letterSpacing:-0.2 },

  analyticsCard: { marginHorizontal:16, marginTop:16, padding:20,
    shadowColor:'#6C63FF', shadowOpacity:0.25, shadowRadius:18, shadowOffset:{width:0,height:6}, elevation:8 },
  closetHero: { marginHorizontal:16, marginTop:16, marginBottom:4, padding:20,
    shadowColor:'#6C63FF', shadowOpacity:0.25, shadowRadius:18, shadowOffset:{width:0,height:6}, elevation:8 },

  statsBanner: { flexDirection:'row', margin:16, borderRadius:20, padding:16, alignItems:'center',
    shadowColor:'#6C63FF', shadowOpacity:0.12, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:3 },
  statCell: { flex:1, alignItems:'center', gap:4 },
  statIconBox: { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
  statNum: { fontSize:22, fontWeight:'900', letterSpacing:-0.5 },
  statLbl: { fontSize:10, fontWeight:'600' },
  statDivider: { width:1, height:44, borderRadius:1, marginHorizontal:4 },

  catChip: { flexDirection:'row', alignItems:'center', gap:5, height:32, paddingHorizontal:13, borderRadius:999 },

  toolbar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:8, borderBottomWidth:StyleSheet.hairlineWidth },
  viewToggle: { padding:7, borderRadius:9 },

  card: { overflow:'hidden' },
  swatch: { justifyContent:'flex-end', padding:7 },
  wearBadge: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(0,0,0,0.38)', paddingHorizontal:6, paddingVertical:3, borderRadius:999, alignSelf:'flex-start' },
  wearTxt: { color:'#fff', fontSize:9, fontWeight:'700' },
  cleanDot: { position:'absolute', top:7, left:7, width:9, height:9, borderRadius:5 },
  seasonTag: { position:'absolute', top:7, right:7, backgroundColor:'rgba(0,0,0,0.35)', paddingHorizontal:6, paddingVertical:2, borderRadius:999 },
  seasonTxt: { color:'#fff', fontSize:9, fontWeight:'700' },
  cardBody: { padding:9 },
  cardName: { fontSize:12, fontWeight:'800', lineHeight:16 },
  cardBrand: { fontSize:10, marginTop:1 },
  statusPill: { paddingHorizontal:6, paddingVertical:2, borderRadius:999 },

  bottomSheet: { position:'absolute', bottom:0, left:0, right:0, borderTopLeftRadius:30, borderTopRightRadius:30, paddingBottom:50 },
  sheetHandle: { width:36, height:4, borderRadius:2, alignSelf:'center', marginTop:12, marginBottom:8 },
  heroSwatch: { height:172, position:'relative' },

  addModalSheet: { borderTopLeftRadius:30, borderTopRightRadius:30, paddingTop:4, maxHeight:'94%' },

  inputRow: { flexDirection:'row', alignItems:'center', borderRadius:13, borderWidth:1, overflow:'hidden' },
  textInput: { flex:1, paddingHorizontal:14, paddingVertical:13, fontSize:15, fontWeight:'600' },
  filterChip: { paddingHorizontal:14, height:32, borderRadius:999, borderWidth:1, alignItems:'center', justifyContent:'center' },
  sectionLabel: { fontSize:10, fontWeight:'700', letterSpacing:0.8 },
  colorDot: { width:30, height:30, borderRadius:15, alignItems:'center', justifyContent:'center' },
  saveBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:16, borderRadius:16,
    shadowColor:'#6C63FF', shadowOffset:{width:0,height:6}, shadowOpacity:0.3, shadowRadius:14, elevation:8 },
});
