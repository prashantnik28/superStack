import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Image, Platform, Animated,
  Easing, useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import { usePantryStore } from '../../../src/stores/usePantryStore';
import { addPantryItem } from '../../../src/api/kitchenApi';

const ACCENT  = '#6C63FF';
const OK      = '#10B981';
const WARN    = '#F59E0B';
const AMBER   = '#FFB347';
const DANGER  = '#EF4444';

const FRAME_W = 260;
const FRAME_H = 175;
const OVERLAY = 'rgba(0,0,0,0.68)';

const LOCATIONS = ['Pantry', 'Fridge', 'Freezer', 'Counter'];
const LOC_ICON  = { Pantry:'cube-outline', Fridge:'snow-outline', Freezer:'thermometer-outline', Counter:'home-outline' };
const CAT_EMOJI = { Dairy:'🥛', Produce:'🥦', Grains:'🌾', Beverages:'🧃', Snacks:'🍿', Frozen:'🧊', Condiments:'🫙', Other:'🛒' };

const NS_COLOR   = { a:'#037902', b:'#85BB2F', c:'#C8A400', d:'#E05C00', e:'#CC0000' };
const ECO_COLOR  = { a:'#037902', b:'#85BB2F', c:'#C8A400', d:'#E05C00', e:'#CC0000' };
const NOVA_COLOR = { 1:'#037902', 2:'#C8A400', 3:'#E05C00', 4:'#CC0000' };
const NOVA_LABEL = { 1:'Unprocessed', 2:'Culinary', 3:'Processed', 4:'Ultra-Processed' };
const LVL_COLOR  = { low: OK, moderate: WARN, high: DANGER };

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function emptyForm() {
  return { productName:'', brand:'', category:'', size:'', expiry:'', purchaseDate:'', location:'Pantry', qty:'1', unit:'pcs', price:'', notes:'' };
}

function parseToISO(str) {
  if (!str) return '';
  const p = str.split('/');
  if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return str;
}

function defaultExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function formatCategory(raw) {
  if (!raw) return '';
  const str = Array.isArray(raw) ? raw[0] : String(raw).split(',')[0];
  return str.replace(/^en:|^fr:/gi,'').replace(/-/g,' ')
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
}

function formatTags(tags) {
  return (tags || []).map(t => t.replace(/^en:|^fr:/gi,'').replace(/-/g,' ').trim()).filter(Boolean).slice(0, 8);
}

function guessEmoji(category) {
  if (!category) return '📦';
  const k = Object.keys(CAT_EMOJI).find(k => category.toLowerCase().includes(k.toLowerCase()));
  return CAT_EMOJI[k] || '📦';
}

function generateHealthTags(nutrition, nutrientLevels, nutriScore, ecoScore, labelsTags, analysisTags) {
  const tags   = [];
  const score  = (nutriScore || '').toLowerCase();
  const eco    = (ecoScore   || '').toLowerCase();
  const labels = (labelsTags   || []).map(t => t.toLowerCase());
  const anal   = (analysisTags || []).map(t => t.toLowerCase());

  if      (score === 'a' || score === 'b') tags.push('🟢 Healthy');
  else if (score === 'c')                  tags.push('🟡 Moderate');
  else if (score === 'd' || score === 'e') tags.push('🔴 Less Healthy');

  const sl = (nutrientLevels?.sugars       || '').toLowerCase();
  if      (sl === 'low')      tags.push('🟢 Low Sugar');
  else if (sl === 'moderate') tags.push('🟡 Moderate Sugar');
  else if (sl === 'high')     tags.push('🔴 High Sugar');

  const fl = (nutrientLevels?.fat          || '').toLowerCase();
  if      (fl === 'low')      tags.push('🟢 Low Fat');
  else if (fl === 'moderate') tags.push('🟡 Moderate Fat');
  else if (fl === 'high')     tags.push('🔴 High Fat');

  const sf = (nutrientLevels?.saturatedFat || '').toLowerCase();
  if      (sf === 'low')      tags.push('🟢 Low Saturated Fat');
  else if (sf === 'moderate') tags.push('🟡 Moderate Saturated Fat');
  else if (sf === 'high')     tags.push('🔴 High Saturated Fat');

  const sa = (nutrientLevels?.salt         || '').toLowerCase();
  if      (sa === 'low')      tags.push('🟢 Low Salt');
  else if (sa === 'moderate') tags.push('🟡 Moderate Salt');
  else if (sa === 'high')     tags.push('🔴 High Salt');

  if ((nutrition?.protein  || 0) >= 15) tags.push('💪 High Protein');
  if ((nutrition?.fiber    || 0) >= 6)  tags.push('🌾 High Fiber');
  if ((nutrition?.calories || 0) >= 400) tags.push('⚡ High Calorie');

  if      (eco === 'a' || eco === 'b') tags.push('🌱 Eco Friendly');
  else if (eco === 'c')                tags.push('🌍 Moderate Impact');
  else if (eco === 'd' || eco === 'e') tags.push('🏭 High Environmental Impact');

  if (anal.includes('en:vegan') || labels.includes('en:vegan'))
    tags.push('🌱 Vegan');
  else if (anal.includes('en:vegetarian') || labels.includes('en:vegetarian'))
    tags.push('🥬 Vegetarian');

  return tags;
}

function mapProduct(p, code) {
  const n = p.nutriments || {};

  const category    = formatCategory(p.categories   || p.categories_tags   || '');
  const subCategory = p.categories_tags?.[1] ? formatCategory(p.categories_tags[1]) : '';
  const country     = (p.countries || '').split(',')[0].trim() ||
                      formatCategory(p.countries_tags?.[0] || '');

  const nutrition = {
    energyKj:     Math.round(Number(n['energy-kj_100g']       ?? n['energy-kj']       ?? 0)),
    calories:     Math.round(Number(n['energy-kcal_100g']     ?? n['energy-kcal']     ?? 0)),
    protein:      +(Number(n.proteins_100g        ?? n.proteins        ?? 0).toFixed(1)),
    carbohydrates:+(Number(n.carbohydrates_100g   ?? n.carbohydrates   ?? 0).toFixed(1)),
    sugars:       +(Number(n.sugars_100g          ?? n.sugars          ?? 0).toFixed(1)),
    fat:          +(Number(n.fat_100g             ?? n.fat             ?? 0).toFixed(1)),
    saturatedFat: +(Number(n['saturated-fat_100g']?? n['saturated-fat']?? 0).toFixed(1)),
    fiber:        +(Number(n.fiber_100g           ?? n.fiber           ?? 0).toFixed(1)),
    salt:         +(Number(n.salt_100g            ?? n.salt            ?? 0).toFixed(1)),
    sodium:       +(Number(n.sodium_100g          ?? n.sodium          ?? 0).toFixed(1)),
  };

  const nutrientLevels = {
    fat:          p.nutrient_levels?.fat               || null,
    saturatedFat: p.nutrient_levels?.['saturated-fat'] || null,
    sugars:       p.nutrient_levels?.sugars            || null,
    salt:         p.nutrient_levels?.salt              || null,
  };

  const nutriScore = p.nutriscore_grade || p.nutrition_grades || null;
  const ecoScore   = p.ecoscore_grade   || null;
  const novaRaw    = p.nova_group != null ? p.nova_group
    : (p.nova_groups_tags?.[0]?.match(/^en:(\d)/)
      ? parseInt(p.nova_groups_tags[0].match(/^en:(\d)/)[1], 10) : null);
  const novaGroup  = novaRaw >= 1 && novaRaw <= 4 ? novaRaw : null;

  const healthTags = generateHealthTags(
    nutrition, nutrientLevels, nutriScore, ecoScore,
    p.labels_tags, p.ingredients_analysis_tags,
  );

  return {
    barcode: code, name: p.product_name || p.product_name_en || '',
    brand:       p.brands    || '',
    category, subCategory, country,
    productType: p.product_type || 'food',
    quantity:    p.quantity || p.net_weight || '',
    emoji:       guessEmoji(category),

    imageUrl:            p.image_front_url       || p.image_url            || p.image_small_url || null,
    thumbnailUrl:        p.image_thumb_url        || p.image_front_thumb_url|| null,
    ingredientsImageUrl: p.image_ingredients_url  || null,
    nutritionImageUrl:   p.image_nutrition_url    || null,

    ingredients:    p.ingredients_text || '',
    allergens:      p.allergens        || '',
    traces:         p.traces           || '',
    ingredientCount:p.ingredients_n    || 0,

    nutrition, nutrientLevels, nutriScore, ecoScore, novaGroup,

    labels:      formatTags(p.labels_tags),
    allergenTags:formatTags(p.allergens_tags),
    healthTags,
    ai: { recipeEligible: true, pantryItem: true, shoppingItem: true },
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const { colors, isDark }              = useTheme();
  const insets                          = useSafeAreaInsets();
  const { width: SW, height: SH }       = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const { addItem }                     = usePantryStore();
  const scanLock = useRef(false);

  const [phase,     setPhase]     = useState('camera');
  const [barcode,   setBarcode]   = useState(null);
  const [product,   setProduct]   = useState(null);
  const [torch,     setTorch]     = useState(false);
  const [form,      setForm]      = useState(emptyForm());
  const [activeImg, setActiveImg] = useState('front');

  const FRAME_Y = SH * 0.32;
  const FRAME_X = (SW - FRAME_W) / 2;

  const scanAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (phase !== 'camera') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue:1, duration:1800, useNativeDriver:true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(scanAnim, { toValue:0, duration:1800, useNativeDriver:true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  const scanLineY = scanAnim.interpolate({ inputRange:[0,1], outputRange:[0, FRAME_H - 4] });

  const slideUp = useCallback(() => {
    Animated.spring(slideAnim, { toValue:0, useNativeDriver:true, tension:55, friction:11 }).start();
  }, [slideAnim]);

  const resetToCamera = () => {
    scanLock.current = false;
    setPhase('camera');
    setProduct(null);
    setBarcode(null);
    setForm(emptyForm());
    setActiveImg('front');
    slideAnim.setValue(SH);
  };

  const fetchProduct = async (code) => {
    setPhase('loading');
    try {
      const res  = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        setProduct(mapProduct(data.product, code));
        setActiveImg('front');
        setPhase('result');
        setTimeout(slideUp, 50);
      } else {
        setProduct(null);
        setPhase('notfound');
        setTimeout(slideUp, 50);
      }
    } catch {
      setProduct(null);
      setPhase('notfound');
      setTimeout(slideUp, 50);
    }
  };

  const handleBarcodeScan = ({ data }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setBarcode(data);
    fetchProduct(data);
  };

  const goManual = () => {
    scanLock.current = true;
    setProduct(null);
    setPhase('manual');
    setTimeout(slideUp, 50);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAddToPantry = () => {
    const cat = product?.category || form.category || 'Other';
    const item = {
      id:          Date.now().toString(),
      name:        product?.name        || form.productName || 'Unknown Product',
      brand:       product?.brand       || form.brand       || '',
      category:    cat,
      subCategory: product?.subCategory || '',
      country:     product?.country     || '',
      expiry:      parseToISO(form.expiry) || defaultExpiry(),
      expiryDate:  parseToISO(form.expiry) || defaultExpiry(),
      qty:         form.qty  || '1',
      unit:        form.unit || 'pcs',
      emoji:       product?.emoji || guessEmoji(cat),
      location:    form.location  || 'Pantry',
      storageLocation: form.location || 'Pantry',
      imageUrl:            product?.imageUrl            || null,
      thumbnailUrl:        product?.thumbnailUrl         || null,
      ingredientsImageUrl: product?.ingredientsImageUrl  || null,
      nutritionImageUrl:   product?.nutritionImageUrl    || null,
      price:       form.price   ? Number(form.price) : 0,
      notes:       form.notes   || '',
      purchaseDate:parseToISO(form.purchaseDate) || '',
      barcode:     barcode || '',
      productQuantity: product?.quantity || '',
      nutrition:      product?.nutrition      || null,
      nutrientLevels: product?.nutrientLevels || null,
      nutriScore:     product?.nutriScore     || null,
      ecoScore:       product?.ecoScore       || null,
      novaGroup:      product?.novaGroup      || null,
      healthTags:     product?.healthTags     || [],
      ingredients:    product?.ingredients    || '',
      allergens:      product?.allergens      || '',
      traces:         product?.traces         || '',
      ingredientCount:product?.ingredientCount|| 0,
      labels:         product?.labels         || [],
      ai: product?.ai || { recipeEligible:false, pantryItem:true, shoppingItem:true },
    };
    // Optimistic local add (full object including frontend-only fields like id/expiry/location)
    addItem(item);

    // Backend payload — only fields the DTO accepts; strip id/expiry/location aliases
    const backendPayload = {
      name:                item.name,
      barcode:             item.barcode             || undefined,
      brand:               item.brand               || undefined,
      category:            item.category            || undefined,
      subCategory:         item.subCategory         || undefined,
      country:             item.country             || undefined,
      productQuantity:     item.productQuantity      || undefined,
      emoji:               item.emoji               || undefined,
      imageUrl:            item.imageUrl            || undefined,
      thumbnailUrl:        item.thumbnailUrl         || undefined,
      ingredientsImageUrl: item.ingredientsImageUrl  || undefined,
      nutritionImageUrl:   item.nutritionImageUrl    || undefined,
      ingredients:         item.ingredients         || undefined,
      allergens:           item.allergens           || undefined,
      traces:              item.traces              || undefined,
      ingredientCount:     item.ingredientCount      || undefined,
      nutrition:           item.nutrition           || undefined,
      nutrientLevels:      item.nutrientLevels       || undefined,
      nutriScore:          item.nutriScore          || undefined,
      ecoScore:            item.ecoScore            || undefined,
      novaGroup:           item.novaGroup           || undefined,
      healthTags:          item.healthTags?.length   ? item.healthTags  : undefined,
      labels:              item.labels?.length       ? item.labels       : undefined,
      ai:                  item.ai                  || undefined,
      qty:                 Number(item.qty)          || 1,
      unit:                item.unit                || undefined,
      expiryDate:          item.expiryDate          || undefined,
      purchaseDate:        item.purchaseDate && item.purchaseDate !== '' ? item.purchaseDate : undefined,
      storageLocation:     item.storageLocation     || undefined,
      price:               item.price               || undefined,
      notes:               item.notes               || undefined,
    };
    addPantryItem(backendPayload).catch(() => {});
    router.back();
  };

  if (!permission) {
    return <View style={[styles.center, { backgroundColor:colors.background }]}><ActivityIndicator color={ACCENT} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor:isDark?'#0A0818':'#F8F7FF', padding:32, gap:16 }]}>
        <View style={[styles.permIcon, { backgroundColor:ACCENT+'18' }]}>
          <Ionicons name="camera-outline" size={36} color={ACCENT} />
        </View>
        <Text style={[styles.permTitle, { color:colors.textPrimary }]}>Camera Access Needed</Text>
        <Text style={{ fontSize:13, lineHeight:20, color:isDark?'#6B7280':'#9CA3AF', textAlign:'center' }}>
          Allow camera access to scan product barcodes and auto-fill product details.
        </Text>
        <TouchableOpacity onPress={requestPermission} activeOpacity={0.85} style={styles.permBtn}>
          <LinearGradient colors={[ACCENT,'#5851E6']} style={styles.permBtnGrad}>
            <Text style={{ fontSize:14, fontWeight:'800', color:'#fff' }}>Allow Camera</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={goManual} activeOpacity={0.8}>
          <Text style={{ fontSize:13, color:ACCENT, fontWeight:'600' }}>Add Product Manually Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showSheet    = phase === 'result' || phase === 'notfound' || phase === 'manual';
  const activeImgUrl = product ? ({
    front:       product.imageUrl,
    ingredients: product.ingredientsImageUrl,
    nutrition:   product.nutritionImageUrl,
  })[activeImg] || product.imageUrl : null;

  const imgButtons = product ? [
    { key:'front',       icon:'image-outline',       has: !!product.imageUrl },
    { key:'ingredients', icon:'list-circle-outline',  has: !!product.ingredientsImageUrl },
    { key:'nutrition',   icon:'bar-chart-outline',    has: !!product.nutritionImageUrl },
  ].filter(b => b.has) : [];

  return (
    <View style={styles.root}>

      {phase !== 'manual' && (
        <CameraView
          style={StyleSheet.absoluteFill}
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes:['ean13','ean8','upc_a','upc_e','code128','code39','qr'] }}
          onBarcodeScanned={phase === 'camera' ? handleBarcodeScan : undefined}
        />
      )}

      {phase === 'manual' && <View style={[StyleSheet.absoluteFill, { backgroundColor:isDark?'#0A0818':'#F8F7FF' }]} />}

      {/* Overlay */}
      {(phase === 'camera' || phase === 'loading') && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={{ position:'absolute', top:0, left:0, right:0, height:FRAME_Y, backgroundColor:OVERLAY }} />
          <View style={{ position:'absolute', top:FRAME_Y+FRAME_H, left:0, right:0, bottom:0, backgroundColor:OVERLAY }} />
          <View style={{ position:'absolute', top:FRAME_Y, left:0, width:FRAME_X, height:FRAME_H, backgroundColor:OVERLAY }} />
          <View style={{ position:'absolute', top:FRAME_Y, left:FRAME_X+FRAME_W, right:0, height:FRAME_H, backgroundColor:OVERLAY }} />
          <View style={{ position:'absolute', top:FRAME_Y, left:FRAME_X, width:FRAME_W, height:FRAME_H, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', borderRadius:16 }} />
          {[
            { top:FRAME_Y-1.5,            left:FRAME_X-1.5,              borderTopWidth:3, borderLeftWidth:3 },
            { top:FRAME_Y-1.5,            left:FRAME_X+FRAME_W-22+1.5,   borderTopWidth:3, borderRightWidth:3 },
            { top:FRAME_Y+FRAME_H-22+1.5, left:FRAME_X-1.5,              borderBottomWidth:3, borderLeftWidth:3 },
            { top:FRAME_Y+FRAME_H-22+1.5, left:FRAME_X+FRAME_W-22+1.5,  borderBottomWidth:3, borderRightWidth:3 },
          ].map((corner, i) => (
            <View key={i} style={{ position:'absolute', width:22, height:22, borderColor:AMBER, borderRadius:3, ...corner }} />
          ))}
          <Animated.View style={{ position:'absolute', top:FRAME_Y, left:FRAME_X+8, width:FRAME_W-16, height:2.5, transform:[{translateY:scanLineY}], overflow:'hidden', borderRadius:2 }}>
            <LinearGradient colors={['transparent',AMBER+'BB',AMBER,AMBER+'BB','transparent']} start={{x:0,y:0.5}} end={{x:1,y:0.5}} style={{flex:1}} />
          </Animated.View>
          <Animated.View style={{ position:'absolute', top:FRAME_Y, left:FRAME_X+4, width:FRAME_W-8, height:12, transform:[{translateY:scanLineY}], opacity:0.25 }}>
            <LinearGradient colors={['transparent',AMBER+'80','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={{flex:1}} />
          </Animated.View>
        </View>
      )}

      {phase === 'camera' && (
        <>
          <TouchableOpacity onPress={() => setTorch(v => !v)} activeOpacity={0.8}
            style={[styles.torchBtn, { top:insets.top+12 }]}>
            <Ionicons name={torch?'flashlight':'flashlight-outline'} size={18} color={torch?AMBER:'#fff'} />
          </TouchableOpacity>
          <View style={[styles.hintPill, { top:FRAME_Y+FRAME_H+20 }]} pointerEvents="none">
            <Ionicons name="scan-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.hintTxt}>Point camera at barcode</Text>
          </View>
          <View style={[styles.bottomBar, { paddingBottom:insets.bottom+16 }]}>
            <TouchableOpacity onPress={goManual} activeOpacity={0.85} style={styles.manualBtn}>
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.manualBtnTxt}>Add Product Manually</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {phase === 'loading' && (
        <View style={styles.loadOverlay} pointerEvents="none">
          <GlassCard style={styles.loadCard}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[styles.loadTxt, { color:colors.textPrimary }]}>Looking up product…</Text>
            <Text style={{ fontSize:11, color:isDark?'#4B5563':'#9CA3AF', fontFamily:'monospace' }}>{barcode}</Text>
          </GlassCard>
        </View>
      )}

      {showSheet && (
        <Animated.View style={[styles.sheet, { transform:[{translateY:slideAnim}], backgroundColor:isDark?'#0F0C1D':'#FAFBFF' }]}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom:insets.bottom+110 }}>

            {/* Header row */}
            <View style={styles.sheetHdr}>
              {phase === 'result' && (
                <View style={[styles.badge, { backgroundColor:OK+'18' }]}>
                  <Ionicons name="checkmark-circle" size={13} color={OK} />
                  <Text style={{ fontSize:10, fontWeight:'800', color:OK }}>Product Found</Text>
                </View>
              )}
              {phase === 'notfound' && (
                <View style={[styles.badge, { backgroundColor:WARN+'18' }]}>
                  <Ionicons name="search-outline" size={13} color={WARN} />
                  <Text style={{ fontSize:10, fontWeight:'800', color:WARN }}>Not in Database</Text>
                </View>
              )}
              {phase === 'manual' && (
                <View style={[styles.badge, { backgroundColor:ACCENT+'18' }]}>
                  <Ionicons name="create-outline" size={13} color={ACCENT} />
                  <Text style={{ fontSize:10, fontWeight:'800', color:ACCENT }}>Manual Entry</Text>
                </View>
              )}
              <TouchableOpacity onPress={resetToCamera} style={{ padding:4 }}>
                <Ionicons name="close" size={20} color={isDark?'#4B5563':'#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {/* ── Result product card ── */}
            {phase === 'result' && product && (
              <GlassCard style={[styles.productCard, { marginHorizontal:16, marginBottom:14 }]}>

                {/* Image + name + brand */}
                <View style={{ flexDirection:'row', gap:12, alignItems:'flex-start' }}>
                  <View>
                    {activeImgUrl ? (
                      <Image source={{ uri:activeImgUrl }} style={styles.productImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.productImgPlaceholder, { backgroundColor:ACCENT+'15' }]}>
                        <Text style={{ fontSize:32 }}>{product.emoji}</Text>
                      </View>
                    )}
                    {/* Image type switcher */}
                    {imgButtons.length > 1 && (
                      <View style={{ flexDirection:'row', justifyContent:'center', gap:5, marginTop:6 }}>
                        {imgButtons.map(btn => (
                          <TouchableOpacity key={btn.key} onPress={() => setActiveImg(btn.key)} activeOpacity={0.7}
                            style={{ width:24, height:24, borderRadius:12, alignItems:'center', justifyContent:'center',
                              backgroundColor:activeImg===btn.key?ACCENT:(isDark?'rgba(255,255,255,0.1)':'#EDE9FE') }}>
                            <Ionicons name={btn.icon} size={11} color={activeImg===btn.key?'#fff':(isDark?'#6B7280':ACCENT)} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={{ flex:1 }}>
                    <Text style={[styles.productName, { color:colors.textPrimary }]} numberOfLines={2}>
                      {product.name || 'Unknown Product'}
                    </Text>
                    {!!product.brand && (
                      <Text style={[styles.productBrand, { color:isDark?'#6B7280':'#9CA3AF' }]}>{product.brand}</Text>
                    )}
                    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:6 }}>
                      {!!product.category && <Chip icon="grid-outline"     label={product.category} isDark={isDark} />}
                      {!!product.country  && <Chip icon="location-outline" label={product.country}  isDark={isDark} />}
                      {!!barcode          && <Chip icon="barcode-outline"  label={barcode}          isDark={isDark} />}
                    </View>
                    {product.ingredientCount > 0 && (
                      <Text style={{ fontSize:9, color:isDark?'#4B5563':'#9CA3AF', marginTop:4 }}>
                        {product.ingredientCount} ingredients listed
                      </Text>
                    )}
                  </View>
                </View>

                {/* Score badges */}
                {(product.nutriScore || product.ecoScore || product.novaGroup) && (
                  <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
                    {product.nutriScore && (
                      <ScoreBadge label="NutriScore"
                        grade={product.nutriScore.toUpperCase()}
                        color={NS_COLOR[product.nutriScore.toLowerCase()] || '#9CA3AF'} isDark={isDark} />
                    )}
                    {product.ecoScore && (
                      <ScoreBadge label="EcoScore"
                        grade={product.ecoScore.toUpperCase()}
                        color={ECO_COLOR[product.ecoScore.toLowerCase()] || '#9CA3AF'} isDark={isDark} />
                    )}
                    {product.novaGroup && (
                      <ScoreBadge label="NOVA"
                        grade={`${product.novaGroup}`}
                        sub={NOVA_LABEL[product.novaGroup]}
                        color={NOVA_COLOR[product.novaGroup] || '#9CA3AF'} isDark={isDark} />
                    )}
                  </View>
                )}

                {/* Health tags */}
                {product.healthTags.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={{ marginTop:10 }} contentContainerStyle={{ gap:6 }}>
                    {product.healthTags.map((tag, i) => {
                      const col = tag.startsWith('🟢')?OK : tag.startsWith('🔴')?DANGER : tag.startsWith('🟡')?WARN : ACCENT;
                      return (
                        <View key={i} style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:99,
                          backgroundColor:col+'18', borderWidth:1, borderColor:col+'35' }}>
                          <Text style={{ fontSize:9.5, fontWeight:'700', color:col }}>{tag}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Full nutrition grid — 5 columns × 2 rows */}
                {product.nutrition.energyKj > 0 && (
                  <View style={{ marginTop:12 }}>
                    <Text style={[styles.sectionMini, { color:isDark?'#6B7280':'#9CA3AF' }]}>NUTRITION PER 100g</Text>
                    <View style={[styles.nutritionGrid, { backgroundColor:isDark?'rgba(255,255,255,0.04)':'#F5F3FF' }]}>
                      {[
                        { l:'Energy',    v:`${product.nutrition.energyKj} kJ` },
                        { l:'Calories',  v:`${product.nutrition.calories} kcal` },
                        { l:'Protein',   v:`${product.nutrition.protein}g` },
                        { l:'Carbs',     v:`${product.nutrition.carbohydrates}g` },
                        { l:'Sugars',    v:`${product.nutrition.sugars}g` },
                        { l:'Fat',       v:`${product.nutrition.fat}g` },
                        { l:'Sat. Fat',  v:`${product.nutrition.saturatedFat}g` },
                        { l:'Fiber',     v:`${product.nutrition.fiber}g` },
                        { l:'Salt',      v:`${product.nutrition.salt}g` },
                        { l:'Sodium',    v:`${product.nutrition.sodium}g` },
                      ].map(item => (
                        <View key={item.l} style={styles.nutritionGridItem}>
                          <Text style={[styles.nutritionVal, { color:colors.textPrimary }]}>{item.v}</Text>
                          <Text style={[styles.nutritionLabel, { color:isDark?'#4B5563':'#9CA3AF' }]}>{item.l}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Nutrient level bars */}
                {Object.values(product.nutrientLevels).some(Boolean) && (
                  <View style={{ marginTop:12 }}>
                    <Text style={[styles.sectionMini, { color:isDark?'#6B7280':'#9CA3AF', marginBottom:7 }]}>NUTRIENT LEVELS</Text>
                    {[
                      { l:'Fat',          k:'fat' },
                      { l:'Saturated Fat', k:'saturatedFat' },
                      { l:'Sugars',        k:'sugars' },
                      { l:'Salt',          k:'salt' },
                    ].filter(item => !!product.nutrientLevels[item.k]).map(item => {
                      const lvl = product.nutrientLevels[item.k];
                      const col = LVL_COLOR[lvl] || '#9CA3AF';
                      const barW = lvl==='high'?'85%' : lvl==='moderate'?'50%' : '22%';
                      return (
                        <View key={item.k} style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 }}>
                          <Text style={{ fontSize:10, fontWeight:'600', color:isDark?'#9CA3AF':'#6B7280', width:82 }}>{item.l}</Text>
                          <View style={{ flex:1, height:5, backgroundColor:isDark?'rgba(255,255,255,0.08)':'#E8E4FF', borderRadius:3, overflow:'hidden' }}>
                            <View style={{ height:'100%', width:barW, backgroundColor:col, borderRadius:3 }} />
                          </View>
                          <View style={{ paddingHorizontal:7, paddingVertical:2, borderRadius:99, backgroundColor:col+'18' }}>
                            <Text style={{ fontSize:8.5, fontWeight:'700', color:col }}>{lvl}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Allergens */}
                {!!product.allergens && product.allergens.trim() !== '' && (
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:5, marginTop:10, alignItems:'center' }}>
                    <Text style={{ fontSize:9, fontWeight:'800', color:isDark?'#6B7280':'#9CA3AF' }}>ALLERGENS  </Text>
                    {product.allergens.split(',').map(a => a.trim()).filter(Boolean).map(a => (
                      <View key={a} style={[styles.tagChip, { backgroundColor:WARN+'18', borderColor:WARN+'35' }]}>
                        <Text style={{ fontSize:9, fontWeight:'700', color:WARN }}>{a}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Traces */}
                {!!product.traces && product.traces.trim() !== '' && (
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:5, marginTop:6, alignItems:'center' }}>
                    <Text style={{ fontSize:9, fontWeight:'800', color:isDark?'#6B7280':'#9CA3AF' }}>TRACES  </Text>
                    <Text style={{ fontSize:9, color:isDark?'#4B5563':'#9CA3AF' }}>{product.traces}</Text>
                  </View>
                )}

                {/* Labels */}
                {product.labels.length > 0 && (
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:5, marginTop:8 }}>
                    {product.labels.map(l => (
                      <View key={l} style={[styles.tagChip, { backgroundColor:OK+'15', borderColor:OK+'28' }]}>
                        <Text style={{ fontSize:9, fontWeight:'700', color:OK }}>{l}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Ingredients text */}
                {!!product.ingredients && (
                  <View style={{ marginTop:10 }}>
                    <Text style={[styles.sectionMini, { color:isDark?'#6B7280':'#9CA3AF', marginBottom:4 }]}>INGREDIENTS</Text>
                    <Text style={{ fontSize:10, color:isDark?'#6B7280':'#6B7280', lineHeight:15 }} numberOfLines={5}>
                      {product.ingredients}
                    </Text>
                  </View>
                )}
              </GlassCard>
            )}

            {/* Not found */}
            {phase === 'notfound' && (
              <View style={[styles.notFoundBox, { backgroundColor:isDark?'rgba(255,255,255,0.04)':'#F5F3FF', marginHorizontal:16, marginBottom:14 }]}>
                <Ionicons name="barcode-outline" size={34} color={isDark?'#374151':'#C4B5FD'} />
                <Text style={{ fontSize:13, fontWeight:'700', color:colors.textPrimary, marginTop:8 }}>
                  Barcode {barcode}
                </Text>
                <Text style={{ fontSize:11, color:isDark?'#4B5563':'#9CA3AF', marginTop:4, textAlign:'center' }}>
                  Not found in Open Food Facts. Fill in the details below.
                </Text>
              </View>
            )}

            {/* Manual / not-found product fields */}
            {(phase === 'manual' || phase === 'notfound') && (
              <View style={{ paddingHorizontal:16, marginBottom:4 }}>
                <Text style={[styles.sectionTitle, { color:colors.textPrimary }]}>Product Details</Text>
                <FInput label="Product Name *" value={form.productName} onChangeText={v=>set('productName',v)} placeholder="e.g. Full Cream Milk" isDark={isDark} colors={colors} />
                <FInput label="Brand" value={form.brand} onChangeText={v=>set('brand',v)} placeholder="e.g. Amul" isDark={isDark} colors={colors} />
                <FInput label="Category" value={form.category} onChangeText={v=>set('category',v)} placeholder="e.g. Dairy" isDark={isDark} colors={colors} />
                <FInput label="Size / Quantity" value={form.size} onChangeText={v=>set('size',v)} placeholder="e.g. 500ml" isDark={isDark} colors={colors} />
              </View>
            )}

            {/* Pantry details */}
            <View style={{ paddingHorizontal:16 }}>
              <Text style={[styles.sectionTitle, { color:colors.textPrimary }]}>Pantry Details</Text>
              <DateField label="Expiry Date" value={form.expiry} onChange={v=>set('expiry',v)} isDark={isDark} colors={colors} />
              <DateField label="Purchase Date (optional)" value={form.purchaseDate} onChange={v=>set('purchaseDate',v)} isDark={isDark} colors={colors} />

              <Text style={[styles.fieldLabel, { color:isDark?'#9CA3AF':'#6B7280', marginBottom:6 }]}>Storage Location</Text>
              <View style={{ flexDirection:'row', gap:7, marginBottom:14, flexWrap:'wrap' }}>
                {LOCATIONS.map(loc => (
                  <TouchableOpacity key={loc} onPress={()=>set('location',loc)} activeOpacity={0.8}
                    style={[styles.locChip, { backgroundColor:form.location===loc?ACCENT:(isDark?'rgba(255,255,255,0.06)':'#F5F3FF'), borderColor:form.location===loc?'#5851E6':(isDark?'rgba(255,255,255,0.08)':'#EDE9FE') }]}>
                    <Ionicons name={LOC_ICON[loc]} size={13} color={form.location===loc?'#fff':(isDark?'#6B7280':'#7C3AED')} />
                    <Text style={[styles.locChipTxt, { color:form.location===loc?'#fff':(isDark?'#6B7280':'#7C3AED') }]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color:isDark?'#9CA3AF':'#6B7280', marginBottom:6 }]}>Quantity Owned</Text>
              <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
                <View style={[styles.inputWrap, { flex:0.4, backgroundColor:isDark?'rgba(255,255,255,0.06)':'#fff', borderColor:isDark?'rgba(255,255,255,0.1)':'#E8E6FF' }]}>
                  <TextInput value={form.qty} onChangeText={v=>set('qty',v)} keyboardType="numeric"
                    style={[styles.input, { color:colors.textPrimary }]} placeholderTextColor={isDark?'#374151':'#C4B5FD'} placeholder="1" />
                </View>
                <View style={[styles.inputWrap, { flex:0.6, backgroundColor:isDark?'rgba(255,255,255,0.06)':'#fff', borderColor:isDark?'rgba(255,255,255,0.1)':'#E8E6FF' }]}>
                  <TextInput value={form.unit} onChangeText={v=>set('unit',v)}
                    style={[styles.input, { color:colors.textPrimary }]} placeholderTextColor={isDark?'#374151':'#C4B5FD'} placeholder="pcs / bottle / kg" />
                </View>
              </View>

              <FInput label="Price Paid (₹)" value={form.price} onChangeText={v=>set('price',v)} placeholder="e.g. 65" isDark={isDark} colors={colors} icon="pricetag-outline" keyboardType="numeric" />

              <Text style={[styles.fieldLabel, { color:isDark?'#9CA3AF':'#6B7280', marginBottom:6 }]}>Notes (optional)</Text>
              <View style={[styles.inputWrap, { backgroundColor:isDark?'rgba(255,255,255,0.06)':'#fff', borderColor:isDark?'rgba(255,255,255,0.1)':'#E8E6FF', height:72 }]}>
                <TextInput value={form.notes} onChangeText={v=>set('notes',v)} multiline
                  style={[styles.input, { color:colors.textPrimary, height:'100%', textAlignVertical:'top' }]}
                  placeholderTextColor={isDark?'#374151':'#C4B5FD'} placeholder="Optional notes…" />
              </View>
            </View>
          </ScrollView>

          {/* Sticky action bar */}
          <View style={[styles.actionBar, { paddingBottom:insets.bottom+8, backgroundColor:isDark?'#0F0C1D':'#FAFBFF', borderTopColor:isDark?'rgba(255,255,255,0.06)':'#EDE9FE' }]}>
            {(phase === 'result' || phase === 'notfound') && (
              <TouchableOpacity onPress={resetToCamera} activeOpacity={0.8}
                style={[styles.actionSecondary, { borderColor:isDark?'rgba(255,255,255,0.1)':'#DDD9FF' }]}>
                <Ionicons name="scan-outline" size={15} color={ACCENT} />
                <Text style={{ fontSize:12, fontWeight:'700', color:ACCENT }}>Scan Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleAddToPantry} activeOpacity={0.88} style={{ flex:1 }}>
              <LinearGradient colors={[ACCENT,'#5851E6']} style={styles.actionPrimary} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Ionicons name="add-circle-outline" size={17} color="#fff" />
                <Text style={{ fontSize:14, fontWeight:'900', color:'#fff' }}>Add to Pantry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function ScoreBadge({ label, grade, sub, color, isDark }) {
  return (
    <View style={{ flex:1, alignItems:'center', backgroundColor:color+'15', borderWidth:1, borderColor:color+'35', borderRadius:10, paddingHorizontal:6, paddingVertical:6, gap:1 }}>
      <Text style={{ fontSize:18, fontWeight:'900', color, lineHeight:22 }}>{grade}</Text>
      <Text style={{ fontSize:8, fontWeight:'800', color:isDark?'#9CA3AF':'#6B7280' }}>{label}</Text>
      {!!sub && <Text style={{ fontSize:7.5, color:isDark?'#4B5563':'#9CA3AF' }} numberOfLines={1}>{sub}</Text>}
    </View>
  );
}

function Chip({ icon, label, isDark }) {
  return (
    <View style={[styles.metaChip, { backgroundColor:isDark?'rgba(255,255,255,0.06)':'#F5F3FF' }]}>
      <Ionicons name={icon} size={10} color={isDark?'#6B7280':'#7C3AED'} />
      <Text style={{ fontSize:9, fontWeight:'600', color:isDark?'#6B7280':'#7C3AED' }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function DateField({ label, value, onChange, isDark, colors }) {
  const mmRef   = useRef();
  const yyyyRef = useRef();
  const [dd,   setDd]   = useState(value ? value.slice(8, 10) : '');
  const [mm,   setMm]   = useState(value ? value.slice(5, 7)  : '');
  const [yyyy, setYyyy] = useState(value ? value.slice(0, 4)  : '');

  const emit = (d, m, y) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) onChange(`${y}-${m}-${d}`);
  };
  const handleDd = (v) => {
    const c = v.replace(/\D/g, '').slice(0, 2);
    setDd(c); emit(c, mm, yyyy);
    if (c.length === 2) mmRef.current?.focus();
  };
  const handleMm = (v) => {
    const c = v.replace(/\D/g, '').slice(0, 2);
    setMm(c); emit(dd, c, yyyy);
    if (c.length === 2) yyyyRef.current?.focus();
  };
  const handleYyyy = (v) => {
    const c = v.replace(/\D/g, '').slice(0, 4);
    setYyyy(c); emit(dd, mm, c);
  };
  const box = {
    flex: 1, borderWidth: 1.5, borderRadius: 11, alignItems: 'center', paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E8E6FF',
  };
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 5 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={box}>
          <TextInput value={dd} onChangeText={handleDd} keyboardType="numeric" placeholder="DD" maxLength={2}
            placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
            style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', padding: 0 }} />
        </View>
        <Text style={{ fontWeight: '800', color: isDark ? '#4B5563' : '#9CA3AF', fontSize: 18 }}>/</Text>
        <View style={box}>
          <TextInput ref={mmRef} value={mm} onChangeText={handleMm} keyboardType="numeric" placeholder="MM" maxLength={2}
            placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
            style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', padding: 0 }} />
        </View>
        <Text style={{ fontWeight: '800', color: isDark ? '#4B5563' : '#9CA3AF', fontSize: 18 }}>/</Text>
        <View style={[box, { flex: 2 }]}>
          <TextInput ref={yyyyRef} value={yyyy} onChangeText={handleYyyy} keyboardType="numeric" placeholder="YYYY" maxLength={4}
            placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
            style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', padding: 0 }} />
        </View>
      </View>
    </View>
  );
}

function FInput({ label, value, onChangeText, placeholder, isDark, colors, icon, keyboardType }) {
  return (
    <View style={{ marginBottom:12 }}>
      <Text style={[styles.fieldLabel, { color:isDark?'#9CA3AF':'#6B7280', marginBottom:5 }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor:isDark?'rgba(255,255,255,0.06)':'#fff', borderColor:isDark?'rgba(255,255,255,0.1)':'#E8E6FF' }]}>
        {icon && <Ionicons name={icon} size={14} color={isDark?'#374151':'#C4B5FD'} style={{ marginLeft:12 }} />}
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
          keyboardType={keyboardType||'default'}
          style={[styles.input, { color:colors.textPrimary }]}
          placeholderTextColor={isDark?'#374151':'#C4B5FD'} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:'#000' },
  center: { flex:1, alignItems:'center', justifyContent:'center' },

  permIcon:    { width:80, height:80, borderRadius:24, alignItems:'center', justifyContent:'center' },
  permTitle:   { fontSize:20, fontWeight:'900', textAlign:'center' },
  permBtn:     { width:'100%', borderRadius:14, overflow:'hidden' },
  permBtnGrad: { paddingVertical:14, alignItems:'center', justifyContent:'center' },

  torchBtn:    { position:'absolute', right:16, width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  hintPill:    { position:'absolute', alignSelf:'center', left:0, right:0, alignItems:'center' },
  hintTxt:     { color:'rgba(255,255,255,0.65)', fontSize:12, fontWeight:'500', marginTop:4 },
  bottomBar:   { position:'absolute', bottom:0, left:0, right:0, alignItems:'center', paddingTop:16 },
  manualBtn:   { flexDirection:'row', alignItems:'center', gap:7, backgroundColor:'rgba(255,255,255,0.14)', paddingHorizontal:22, paddingVertical:12, borderRadius:24 },
  manualBtnTxt:{ color:'#fff', fontSize:13, fontWeight:'700' },

  loadOverlay: { ...StyleSheet.absoluteFillObject, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.55)' },
  loadCard:    { padding:24, alignItems:'center', gap:12, minWidth:200 },
  loadTxt:     { fontSize:14, fontWeight:'700', marginTop:4 },

  sheet:    { position:'absolute', left:0, right:0, bottom:0, borderTopLeftRadius:26, borderTopRightRadius:26, maxHeight:'90%' },
  handle:   { width:36, height:4, borderRadius:2, backgroundColor:'#D1D5DB', alignSelf:'center', marginTop:10, marginBottom:4 },
  sheetHdr: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10 },
  badge:    { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:11, paddingVertical:5, borderRadius:99 },

  productCard:           { padding:14 },
  productImg:            { width:92, height:92, borderRadius:14 },
  productImgPlaceholder: { width:92, height:92, borderRadius:14, alignItems:'center', justifyContent:'center' },
  productName:           { fontSize:15, fontWeight:'800', lineHeight:20 },
  productBrand:          { fontSize:11, marginTop:3 },

  sectionMini:      { fontSize:9, fontWeight:'800', letterSpacing:0.5, marginBottom:2 },
  nutritionGrid:    { flexDirection:'row', flexWrap:'wrap', borderRadius:10, padding:8, marginTop:5 },
  nutritionGridItem:{ width:'20%', alignItems:'center', paddingVertical:6, gap:2 },
  nutritionVal:     { fontSize:12, fontWeight:'900' },
  nutritionLabel:   { fontSize:8, fontWeight:'600' },

  tagChip:     { paddingHorizontal:7, paddingVertical:3, borderRadius:6, borderWidth:1 },
  metaChip:    { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:7, paddingVertical:3, borderRadius:99 },
  notFoundBox: { borderRadius:14, padding:20, alignItems:'center' },

  sectionTitle:{ fontSize:14, fontWeight:'900', marginBottom:12, marginTop:4 },
  fieldLabel:  { fontSize:11, fontWeight:'700', letterSpacing:0.2 },
  inputWrap:   { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderRadius:11, overflow:'hidden' },
  input:       { flex:1, paddingHorizontal:12, paddingVertical:Platform.OS==='ios'?12:9, fontSize:13, fontWeight:'500' },
  locChip:     { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:7, borderRadius:9, borderWidth:1 },
  locChipTxt:  { fontSize:11, fontWeight:'700' },

  actionBar:      { flexDirection:'row', gap:10, paddingHorizontal:16, paddingTop:12, borderTopWidth:StyleSheet.hairlineWidth },
  actionSecondary:{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:14, borderRadius:13, borderWidth:1.5 },
  actionPrimary:  { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:14, borderRadius:13 },
});
