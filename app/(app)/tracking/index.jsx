import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Animated, Platform, Alert, ActivityIndicator,
  Dimensions, KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/context/ThemeContext';
import { useTrackingStore } from '../../../src/stores/useTrackingStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';

const { height: SCREEN_H } = Dimensions.get('window');
const MAP_H = Math.round(SCREEN_H * 0.50);

const TRACKER_ICONS = ['bag', 'key', 'wallet', 'laptop', 'paw', 'bicycle', 'car', 'person'];
const TRACKER_COLORS = ['#6C63FF', '#FF6B9D', '#4CAF82', '#FFB347', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
const ZONE_ICONS = ['home', 'business', 'school', 'fitness', 'cafe', 'cart', 'medkit', 'star'];
const MEMBER_COLORS = ['#6C63FF', '#FF6B9D', '#4CAF82', '#FFB347', '#3B82F6', '#EF4444'];

function relTime(dateStr) {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return 'Yesterday';
}

function batteryColor(pct) {
  if (pct > 60) return '#4CAF82';
  if (pct > 30) return '#FFB347';
  return '#EF4444';
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function buildMapHtml(isDark) {
  const mapBg = isDark ? '#1a1a2e' : '#f0f0f0';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body,#map{width:100%;height:100vh;background:${mapBg};}
.leaflet-control-attribution,.leaflet-control-zoom{display:none!important;}
.leaflet-tile-pane{${isDark ? 'filter:invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);' : ''}}
.av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);font-family:sans-serif;}
.tr{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:16px;}
.me-wrap{width:50px;height:50px;display:flex;align-items:center;justify-content:center;position:relative;}
.me-pulse{width:50px;height:50px;border-radius:50%;background:rgba(59,130,246,0.25);position:absolute;top:0;left:0;animation:mepl 2s ease-in-out infinite;}
.me-dot{width:22px;height:22px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 2px 10px rgba(59,130,246,0.7);position:relative;z-index:1;}
@keyframes mepl{0%,100%{transform:scale(1);opacity:0.7}50%{transform:scale(1.9);opacity:0}}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var markers={};
var circles=[];
var initialOverviewDone=false;
var flyTimer=null;
function clearAll(){Object.values(markers).forEach(function(m){map.removeLayer(m);});markers={};circles.forEach(function(c){map.removeLayer(c);});circles=[];}
function renderMarkers(data){
  clearAll();
  var bounds=[];
  (data.members||[]).forEach(function(m){
    if(!m.lastLocation)return;
    var lat=m.lastLocation.latitude,lng=m.lastLocation.longitude;
    var el=document.createElement('div');
    var icon;
    if(m.isMe){
      el.className='me-wrap';
      el.innerHTML='<div class="me-pulse"></div><div class="me-dot"></div>';
      icon=L.divIcon({html:el.outerHTML,className:'',iconSize:[50,50],iconAnchor:[25,25]});
    }else{
      el.className='av';
      el.style.backgroundColor=m.color||'#6C63FF';
      el.textContent=(m.name||'?').split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2).toUpperCase();
      icon=L.divIcon({html:el.outerHTML,className:'',iconSize:[40,40],iconAnchor:[20,40]});
    }
    var mk=L.marker([lat,lng],{icon:icon}).addTo(map);
    (function(id,isMe){mk.on('click',function(){if(window.ReactNativeWebView&&!isMe)window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerTap',id:id,kind:'member'}));});})(m._id||m.id,!!m.isMe);
    markers[m._id||m.id]=mk;
    bounds.push([lat,lng]);
  });
  (data.trackers||[]).forEach(function(t){
    if(!t.lastLocation)return;
    var lat=t.lastLocation.latitude,lng=t.lastLocation.longitude;
    var el=document.createElement('div');
    el.className='tr';
    el.style.backgroundColor=t.color||'#6C63FF';
    el.innerHTML='&#128205;';
    var icon=L.divIcon({html:el.outerHTML,className:'',iconSize:[34,34],iconAnchor:[17,34]});
    var mk=L.marker([lat,lng],{icon:icon}).addTo(map);
    (function(id){mk.on('click',function(){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerTap',id:id,kind:'tracker'}));});})(t._id);
    markers[t._id]=mk;
    bounds.push([lat,lng]);
  });
  (data.zones||[]).forEach(function(z){
    var c=L.circle([z.latitude,z.longitude],{radius:z.radius||200,color:z.color||'#4CAF82',fillColor:z.color||'#4CAF82',fillOpacity:0.12,weight:2,dashArray:'6 4'}).addTo(map);
    circles.push(c);
  });
  if(bounds.length>0){
    try{map.fitBounds(bounds,{padding:[60,60],maxZoom:14,animate:true});}catch(e){}
    /* First load only: after showing everyone, fly to self */
    if(!initialOverviewDone&&markers['me']){
      initialOverviewDone=true;
      clearTimeout(flyTimer);
      flyTimer=setTimeout(function(){
        if(markers['me'])map.flyTo(markers['me'].getLatLng(),15,{animate:true,duration:1.8});
      },5500);
    }
  }else{
    map.setView([28.4744,77.5040],13);
  }
}
function handleMsg(e){
  try{
    var d=JSON.parse(e.data);
    if(d.type==='render')renderMarkers(d.payload);
    if(d.type==='focus'){var m=markers[d.id];if(m)map.setView(m.getLatLng(),16,{animate:true});}
    if(d.type==='cancelZone')cancelZoneMode();
  }catch(ex){}
}
window.addEventListener('message',handleMsg);
document.addEventListener('message',handleMsg);
map.setView([28.4744,77.5040],13);
/* signal React Native that Leaflet is fully ready */
if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));

var zoneMode=false,zoneCircle=null,zoneDragHandle=null,zoneCenter=null,zoneRadius=300;
var lpTimer=null,lpStartXY=null;

function edgePoint(center,radiusM){
  var lng=center.lng+(radiusM/(111320*Math.cos(center.lat*Math.PI/180)));
  return L.latLng(center.lat,lng);
}

function enterZoneMode(latlng){
  if(zoneMode)return;
  zoneMode=true;zoneCenter=latlng;zoneRadius=300;
  zoneCircle=L.circle([latlng.lat,latlng.lng],{radius:zoneRadius,color:'#3B82F6',fillColor:'#3B82F6',fillOpacity:0.15,weight:2.5}).addTo(map);
  zoneDragHandle=L.marker(edgePoint(latlng,zoneRadius),{
    icon:L.divIcon({html:'<div style="width:28px;height:28px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4);cursor:grab;"></div>',className:'',iconSize:[28,28],iconAnchor:[14,14]}),
    draggable:true,zIndexOffset:1000,
  }).addTo(map);
  zoneDragHandle.on('drag',function(e){
    var dist=map.distance(zoneCenter,e.target.getLatLng());
    zoneRadius=Math.max(50,Math.round(dist));
    zoneCircle.setRadius(zoneRadius);
    if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'radiusChange',radius:zoneRadius}));
  });
  if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'zoneCreationStart',latitude:latlng.lat,longitude:latlng.lng,radius:zoneRadius}));
}

function cancelZoneMode(){
  if(zoneCircle){map.removeLayer(zoneCircle);zoneCircle=null;}
  if(zoneDragHandle){map.removeLayer(zoneDragHandle);zoneDragHandle=null;}
  zoneMode=false;zoneCenter=null;
}

/* ── Pinch-to-zoom (manual — needed because WebView scrollEnabled=false blocks native WKWebView pinch) ── */
var pinchStartDist=null,pinchStartZoom=null;
function touchDist(e){return Math.hypot(e.touches[1].clientX-e.touches[0].clientX,e.touches[1].clientY-e.touches[0].clientY);}

document.addEventListener('touchstart',function(e){
  if(e.touches.length===2){
    clearTimeout(lpTimer);lpStartXY=null;       /* cancel any pending long-press */
    pinchStartDist=touchDist(e);
    pinchStartZoom=map.getZoom();
    return;
  }
  if(zoneMode)return;
  var t=e.touches[0];
  lpStartXY={x:t.clientX,y:t.clientY};
  lpTimer=setTimeout(function(){
    if(!lpStartXY)return;
    var pt=map.containerPointToLatLng(L.point(lpStartXY.x,lpStartXY.y));
    enterZoneMode(pt);lpStartXY=null;
  },700);
},{passive:true});

document.addEventListener('touchmove',function(e){
  if(e.touches.length===2&&pinchStartDist!==null){
    var dist=touchDist(e);
    var zoom=pinchStartZoom+Math.log2(dist/pinchStartDist);
    map.setZoom(zoom,{animate:false});
    e.preventDefault();
    return;
  }
  if(lpStartXY){var t=e.touches[0],dx=t.clientX-lpStartXY.x,dy=t.clientY-lpStartXY.y;if(dx*dx+dy*dy>64){clearTimeout(lpTimer);lpStartXY=null;}}
},{passive:false});

document.addEventListener('touchend',function(e){
  if(e.touches.length<2){pinchStartDist=null;pinchStartZoom=null;}
  clearTimeout(lpTimer);lpStartXY=null;
},{passive:true});
</script>
</body>
</html>`;
}

function AddTrackerModal({ visible, onClose, onSave, colors, isDark }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('bag');
  const [color, setColor] = useState('#6C63FF');
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color });
    setName('');
    setIcon('bag');
    setColor('#6C63FF');
    onClose();
  };

  const sheetBg = isDark ? '#16162A' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6';
  const borderC = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalSheet, { backgroundColor: sheetBg, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB' }]} />
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Device</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>DEVICE NAME</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: inputBg, borderColor: borderC, color: colors.textPrimary }]}
            placeholder="e.g. My Keys, Dog Collar"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ICON</Text>
          <View style={styles.iconGrid}>
            {TRACKER_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconOption, {
                  backgroundColor: icon === ic ? color : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                  borderColor: icon === ic ? color : borderC,
                }]}
                onPress={() => setIcon(ic)}
              >
                <Ionicons name={ic} size={20} color={icon === ic ? '#fff' : colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>COLOR</Text>
          <View style={[styles.colorRow, { marginBottom: 4 }]}>
            {TRACKER_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff' }]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.5 }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnTxt}>Add Device</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ZoneSettingsModal({ zone, visible, onClose, members, onUpdateAssignments, colors, isDark }) {
  const [step, setStep] = useState('list');
  const [pickedMember, setPickedMember] = useState(null);
  const [selDays, setSelDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('16:00');
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(700)).current;

  useEffect(() => {
    if (visible) {
      setStep('list');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 700, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  const toggleDay = (d) => {
    setSelDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleAddAssignment = async () => {
    if (!pickedMember) return;
    setSaving(true);
    const existing = (zone.assignments || []).filter(a => a.userId?.toString() !== pickedMember.id);
    const updated = [...existing, {
      userId: pickedMember.id,
      name: pickedMember.name,
      days: selDays,
      startTime,
      endTime,
    }];
    await onUpdateAssignments(zone._id, updated);
    setSaving(false);
    setStep('list');
    setPickedMember(null);
    setSelDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    setStartTime('10:00');
    setEndTime('16:00');
  };

  const handleRemove = async (userId) => {
    const updated = (zone.assignments || []).filter(a => a.userId?.toString() !== userId?.toString());
    await onUpdateAssignments(zone._id, updated);
  };

  if (!zone) return null;

  const sheetBg = isDark ? '#16162A' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6';
  const borderC = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';
  const divC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const zColor = zone.color || '#4CAF82';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.zoneSettingsSheet, { backgroundColor: sheetBg, transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB' }]} />

        <View style={styles.zoneSettingsHeader}>
          <View style={[styles.zoneSettingsIcon, { backgroundColor: zColor + '20' }]}>
            <Ionicons name={zone.icon || 'home'} size={20} color={zColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.zoneSettingsName, { color: colors.textPrimary }]}>{zone.name}</Text>
            <Text style={[styles.zoneSettingsMeta, { color: colors.textSecondary }]}>
              {zone.radius || 200}m radius · {zone.alertOnExit ? 'Exit alerts ON' : 'Exit alerts OFF'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: divC }]} />

        {step === 'list' && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Text style={[styles.settingsSection, { color: colors.textSecondary }]}>ASSIGNED PEOPLE</Text>

            {(zone.assignments || []).length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 20, gap: 6 }}>
                <Ionicons name="person-add-outline" size={28} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, opacity: 0.6 }}>No people assigned yet</Text>
              </View>
            )}

            {(zone.assignments || []).map((a, i) => {
              const mem = members.find(m => m.id === a.userId?.toString());
              const mc = mem?.color || MEMBER_COLORS[i % MEMBER_COLORS.length];
              return (
                <View key={a.userId?.toString() || i} style={[styles.assignmentRow, { borderBottomColor: divC }]}>
                  <View style={[styles.assignAv, { backgroundColor: mc }]}>
                    <Text style={styles.assignAvTxt}>{initials(a.name)}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.assignName, { color: colors.textPrimary }]}>{a.name}</Text>
                    <View style={styles.dayChipsRow}>
                      {(a.days || []).map(d => (
                        <View key={d} style={[styles.dayChipSmall, { backgroundColor: zColor + '20' }]}>
                          <Text style={[styles.dayChipSmallTxt, { color: zColor }]}>{d}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.assignTime, { color: colors.textSecondary }]}>
                      {a.startTime} – {a.endTime}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(a.userId?.toString())} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.addPersonBtn, { backgroundColor: zColor + '15', borderColor: zColor + '40' }]}
              onPress={() => setStep('pick-person')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={16} color={zColor} />
              <Text style={[styles.addPersonTxt, { color: zColor }]}>Assign Person</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === 'pick-person' && (
          <View style={{ flex: 1 }}>
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => setStep('list')} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Choose Person</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberPickRow, { backgroundColor: inputBg, borderColor: pickedMember?.id === m.id ? zColor : borderC, borderWidth: 1.5 }]}
                  onPress={() => { setPickedMember(m); setStep('pick-schedule'); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.assignAv, { backgroundColor: m.color || '#6C63FF' }]}>
                    <Text style={styles.assignAvTxt}>{initials(m.name)}</Text>
                  </View>
                  <Text style={[styles.memberPickName, { color: colors.textPrimary }]}>{m.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {step === 'pick-schedule' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
              <View style={styles.stepHeader}>
                <TouchableOpacity onPress={() => setStep('pick-person')} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Set Schedule for {pickedMember?.name}</Text>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ACTIVE DAYS</Text>
              <View style={styles.dayChipsWrap}>
                {ALL_DAYS.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, {
                      backgroundColor: selDays.includes(d) ? zColor : inputBg,
                      borderColor: selDays.includes(d) ? zColor : borderC,
                    }]}
                    onPress={() => toggleDay(d)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayChipTxt, { color: selDays.includes(d) ? '#fff' : colors.textSecondary }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.coordRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>FROM (HH:MM)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: inputBg, borderColor: borderC, color: colors.textPrimary }]}
                    placeholder="10:00"
                    placeholderTextColor={colors.textSecondary}
                    value={startTime}
                    onChangeText={setStartTime}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>TO (HH:MM)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: inputBg, borderColor: borderC, color: colors.textPrimary }]}
                    placeholder="16:00"
                    placeholderTextColor={colors.textSecondary}
                    value={endTime}
                    onChangeText={setEndTime}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[{ fontSize: 11, color: colors.textSecondary, opacity: 0.7, lineHeight: 16 }]}>
                If {pickedMember?.name} leaves {zone.name} during these hours, you will receive an instant alert.
              </Text>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: zColor, opacity: selDays.length > 0 && !saving ? 1 : 0.5 }]}
                onPress={handleAddAssignment}
                disabled={saving || selDays.length === 0}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnTxt}>{saving ? 'Saving…' : 'Add Assignment'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Animated.View>
    </Modal>
  );
}

export default function TrackingScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { members, fetchFamily } = useFamilyStore();
  const {
    familyLocations, trackers, geoZones, loading,
    fetchAll, updateMyLocation, createTracker, deleteTracker,
    createGeoZone, deleteGeoZone, updateZoneAssignments, updateGeoZone, simulateMemberLocation,
  } = useTrackingStore();
  const webRef = useRef(null);
  const locationSub = useRef(null);
  const [activeTab, setActiveTab] = useState('people');
  const [showAddTracker, setShowAddTracker] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [locationGranted, setLocationGranted] = useState(null);
  const [myMarker, setMyMarker] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [mpStep, setMpStep] = useState('profile');
  const [draftZoneId, setDraftZoneId] = useState(null);
  const [draftDays, setDraftDays] = useState([]);
  const [draftStart, setDraftStart] = useState('08:00');
  const [draftEnd, setDraftEnd] = useState('17:00');
  const [draftAlertExit, setDraftAlertExit] = useState(true);
  const [draftAlertEnter, setDraftAlertEnter] = useState(false);
  const [mpSaving, setMpSaving] = useState(false);
  const [zoneCreation, setZoneCreation] = useState(null);
  const [zcExpanded, setZcExpanded] = useState(false);
  const [zoneDraftName, setZoneDraftName] = useState('');
  const [zoneDraftIcon, setZoneDraftIcon] = useState('home');
  const [zoneDraftColor, setZoneDraftColor] = useState('#4CAF82');
  const [manualRadius, setManualRadius] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const zcAnim = useRef(new Animated.Value(400)).current;
  const mapReadyRef = useRef(false);
  const pushMapDataLatest = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    let sub = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationGranted(granted);
      if (!granted) return;

      fetchAll();
      fetchFamily();

      const buildMyMarker = (latitude, longitude) => ({
        _id: 'me',
        name: user?.name || 'Me',
        color: '#3B82F6',
        lastLocation: { latitude, longitude },
        lastLocationAt: new Date().toISOString(),
        isMe: true,
      });

      // Get immediate location — don't wait for the 30s watch interval
      try {
        const immediate = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude, accuracy } = immediate.coords;
        updateMyLocation(latitude, longitude, accuracy ?? 0);
        setMyMarker(buildMyMarker(latitude, longitude));
      } catch {}

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 20 },
        (loc) => {
          const { latitude, longitude, accuracy } = loc.coords;
          updateMyLocation(latitude, longitude, accuracy ?? 0);
          setMyMarker(buildMyMarker(latitude, longitude));
        }
      );
      locationSub.current = sub;
    })();

    return () => {
      if (locationSub.current) locationSub.current.remove();
      mapReadyRef.current = false;
    };
  }, []);

  const pushMapData = useCallback(() => {
    if (!webRef.current || !mapReadyRef.current) return;
    const myId = user?._id?.toString();

    const apiIds = new Set(familyLocations.map((fl) => fl._id?.toString()));
    const synthetic = members
      .filter((m) => m.lastLocation && !apiIds.has(m.id) && m.id !== myId)
      .map((m) => ({
        _id: m.id,
        name: m.name,
        color: m.color,
        lastLocation: m.lastLocation,
        lastLocationAt: m.lastLocationAt || new Date().toISOString(),
      }));

    // Only include API members who actually have a location set
    const realWithLoc = familyLocations.filter(
      (fl) => fl.lastLocation && fl._id?.toString() !== myId
    );
    const otherMembers = [...realWithLoc, ...synthetic];

    const allMembers = myMarker ? [myMarker, ...otherMembers] : otherMembers;
    const dataStr = JSON.stringify({ members: allMembers, trackers: trackers, zones: geoZones });
    webRef.current.injectJavaScript(
      `if(typeof renderMarkers==='function'){renderMarkers(${dataStr});}true;`
    );
  }, [familyLocations, trackers, geoZones, myMarker, user, members]);

  // Keep ref current so the mapReady handler always calls the latest version
  useEffect(() => { pushMapDataLatest.current = pushMapData; }, [pushMapData]);
  useEffect(() => { pushMapData(); }, [pushMapData]);

  useEffect(() => {
    if (selectedZone) {
      const updated = geoZones.find(z => z._id === selectedZone._id);
      if (updated) setSelectedZone(updated);
    }
  }, [geoZones]);

  const focusOnMarker = useCallback((id) => {
    if (!webRef.current || !mapReadyRef.current) return;
    const safeId = JSON.stringify(String(id));
    webRef.current.injectJavaScript(
      `(function(){var mk=markers[${safeId}];if(mk){map.flyTo(mk.getLatLng(),16,{animate:true,duration:1.2});}})();true;`
    );
  }, []);

  const handleMapMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'mapReady') {
        mapReadyRef.current = true;
        // Push whatever data we already have — fetchAll may have already completed
        pushMapDataLatest.current?.();
        return;
      }
      if (msg.type === 'markerTap') {
        if (msg.kind === 'member') setActiveTab('people');
        else if (msg.kind === 'tracker') setActiveTab('devices');
      }
      if (msg.type === 'zoneCreationStart') {
        setZoneCreation({ lat: msg.latitude, lng: msg.longitude, radius: msg.radius });
        setZcExpanded(false);
        setZoneDraftName('');
        setZoneDraftIcon('home');
        setZoneDraftColor('#4CAF82');
        setManualRadius(String(msg.radius));
        Animated.spring(zcAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      }
      if (msg.type === 'radiusChange') {
        setZoneCreation((prev) => prev ? { ...prev, radius: msg.radius } : null);
        setManualRadius(String(msg.radius));
      }
    } catch {}
  };

  const cancelZoneCreation = () => {
    webRef.current?.injectJavaScript('cancelZoneMode();true;');
    Animated.timing(zcAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start(() => {
      setZoneCreation(null);
      setZcExpanded(false);
      setManualRadius('');
      zcAnim.setValue(400);
    });
  };

  const getMemberZones = (memberId) =>
    geoZones.flatMap((z) => {
      const a = (z.assignments || []).find((a) => a.userId?.toString() === memberId);
      return a ? [{ zone: z, assignment: a }] : [];
    });

  const openMemberProfile = (m) => {
    setSelectedMember(m);
    setMpStep('profile');
  };

  const closeMemberProfile = () => {
    setSelectedMember(null);
    setMpStep('profile');
    setDraftZoneId(null);
    setDraftDays([]);
    setDraftStart('08:00');
    setDraftEnd('17:00');
    setDraftAlertExit(true);
    setDraftAlertEnter(false);
  };

  const openAddAssignment = () => {
    setDraftZoneId(null);
    setDraftDays([]);
    setDraftStart('08:00');
    setDraftEnd('17:00');
    setDraftAlertExit(true);
    setDraftAlertEnter(false);
    setMpStep('addAssignment');
  };

  const saveMemberAssignment = async () => {
    if (!draftZoneId || draftDays.length === 0 || !selectedMember) return;
    setMpSaving(true);
    try {
      const zone = geoZones.find((z) => z._id === draftZoneId);
      const existing = (zone.assignments || []).filter(
        (a) => a.userId?.toString() !== selectedMember.id,
      );
      await updateZoneAssignments(draftZoneId, [
        ...existing,
        { userId: selectedMember.id, name: selectedMember.name, days: draftDays, startTime: draftStart, endTime: draftEnd },
      ]);
      if (draftAlertExit !== zone.alertOnExit || draftAlertEnter !== zone.alertOnEnter) {
        await updateGeoZone(draftZoneId, { alertOnExit: draftAlertExit, alertOnEnter: draftAlertEnter });
      }
      await fetchAll();
      setMpStep('profile');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not save assignment.');
    }
    setMpSaving(false);
  };

  const removeMemberAssignment = async (zoneId) => {
    try {
      const zone = geoZones.find((z) => z._id === zoneId);
      const remaining = (zone.assignments || []).filter(
        (a) => a.userId?.toString() !== selectedMember.id,
      );
      await updateZoneAssignments(zoneId, remaining);
      await fetchAll();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not remove assignment.');
    }
  };

  const toggleDraftDay = (d) =>
    setDraftDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const applyManualRadius = (text) => {
    const val = parseInt(text, 10);
    if (!isNaN(val) && val >= 50 && val <= 50000) {
      setZoneCreation((prev) => prev ? { ...prev, radius: val } : null);
      webRef.current?.injectJavaScript(`
        if(zoneCircle){zoneRadius=${val};zoneCircle.setRadius(${val});
        if(zoneCenter&&zoneDragHandle){
          var R=6371000,lng=zoneCenter.lng+(${val}/(111320*Math.cos(zoneCenter.lat*Math.PI/180)));
          zoneDragHandle.setLatLng([zoneCenter.lat,lng]);
        }}true;
      `);
    }
  };

  const saveZoneFromMap = async () => {
    if (!zoneDraftName.trim() || !zoneCreation) return;
    try {
      await createGeoZone({
        name: zoneDraftName.trim(),
        icon: zoneDraftIcon,
        color: zoneDraftColor,
        latitude: zoneCreation.lat,
        longitude: zoneCreation.lng,
        radius: zoneCreation.radius,
      });
      webRef.current?.injectJavaScript('cancelZoneMode();true;');
      Animated.timing(zcAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start(() => {
        setZoneCreation(null);
        setZcExpanded(false);
        setManualRadius('');
        zcAnim.setValue(400);
      });
    } catch (e) {
      const msg = e?.response?.data?.message;
      Alert.alert(
        'Could not save zone',
        Array.isArray(msg) ? msg.join('\n') : (msg || 'Check your connection and try again.'),
      );
    }
  };

  const handleDeleteTracker = (t) => {
    Alert.alert('Remove Device', `Remove "${t.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteTracker(t._id) },
    ]);
  };

  const handleDeleteZone = (z) => {
    Alert.alert('Delete Zone', `Delete "${z.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGeoZone(z._id) },
    ]);
  };

  const sheetBg = isDark ? '#0E0E1A' : '#F4F4FB';
  const cardBg  = isDark ? '#16162A' : '#FFFFFF';

  if (locationGranted === false) {
    return (
      <View style={[styles.permScreen, { backgroundColor: colors.background }]}>
        <Ionicons name="location-outline" size={52} color={colors.primary} style={{ opacity: 0.7 }} />
        <Text style={[styles.permTitle, { color: colors.textPrimary }]}>Location Access Required</Text>
        <Text style={[styles.permSub, { color: colors.textSecondary }]}>
          Enable location permission in Settings to track family members and devices.
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationGranted(status === 'granted');
          }}
        >
          <Text style={styles.permBtnTxt}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: sheetBg }]}>
      <View style={{ height: MAP_H }}>
        <WebView
          ref={webRef}
          source={{ html: buildMapHtml(isDark) }}
          style={styles.map}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          onMessage={handleMapMessage}
          onError={(e) => console.warn('WebView error', e.nativeEvent)}
        />

        <View style={[styles.mapTopBar, { top: 12 }]}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDotWrap}>
              <Animated.View style={[styles.livePulse, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.liveTxt}>LIVE</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countTxt}>
              {familyLocations.length} {familyLocations.length === 1 ? 'person' : 'people'} · {trackers.length} device{trackers.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={async () => { await fetchAll(); pushMapDataLatest.current?.(); }} activeOpacity={0.8}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="refresh" size={17} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
        <View style={[styles.tabBar, { backgroundColor: cardBg }]}>
          {[
            { key: 'people',  label: 'People',  icon: 'people' },
            { key: 'devices', label: 'Devices', icon: 'hardware-chip' },
            { key: 'zones',   label: 'Zones',   icon: 'map' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline`}
                size={14}
                color={activeTab === tab.key ? '#fff' : colors.textSecondary}
              />
              <Text style={[styles.tabTxt, { color: activeTab === tab.key ? '#fff' : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'people' && (
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          >
            {members.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                FAMILY MEMBERS ({members.length})
              </Text>
            )}
            {members.length === 0 && !loading && (
              <View style={styles.emptyWrap}>
                <Ionicons name="people-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>No family members found</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Invite family members from the Family section</Text>
              </View>
            )}
            {members.map((m, idx) => {
              // Try real API location first, then fall back to member's own lastLocation (dev mocks)
              const apiEntry = familyLocations.find(
                fl => fl._id?.toString() === m.id || fl.name === m.name
              );
              const locEntry = (apiEntry?.lastLocation)
                ? apiEntry
                : m.lastLocation
                  ? { lastLocation: m.lastLocation, lastLocationAt: m.lastLocationAt }
                  : null;
              const isMe = user?.name === m.name || user?._id?.toString() === m.id;
              const hasLoc = isMe ? !!myMarker : !!locEntry?.lastLocation;
              const memberColor = m.color || MEMBER_COLORS[idx % MEMBER_COLORS.length];
              const assignedZones = getMemberZones(m.id);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0 : 0.07 }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!hasLoc) {
                      Alert.alert(`${m.name.split(' ')[0]}'s location`, 'This member hasn\'t shared their location yet.');
                      return;
                    }
                    const markerId = isMe ? 'me' : (locEntry?._id ? String(locEntry._id) : m.id);
                    focusOnMarker(markerId);
                  }}
                >
                  <View style={styles.avatarWrap}>
                    <LinearGradient colors={[memberColor, memberColor + 'BB']} style={styles.avatar}>
                      <Text style={styles.avatarTxt}>{initials(m.name)}</Text>
                    </LinearGradient>
                    <View style={[styles.statusDot, { backgroundColor: hasLoc ? '#4CAF82' : '#9CA3AF' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.memberName, { color: colors.textPrimary }]}>{m.name}</Text>
                      {isMe && (
                        <View style={[styles.meBadge, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.meBadgeTxt, { color: colors.primary }]}>You</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.memberLoc, { color: colors.textSecondary }]} numberOfLines={1}>
                      {hasLoc
                        ? (locEntry?.lastSeenAddress || 'Location active')
                        : (apiEntry ? 'Not yet sharing' : 'No location')}
                    </Text>
                    {assignedZones.length > 0 && (
                      <Text style={[styles.memberTime, { color: colors.primary }]}>
                        {assignedZones.length} zone alert{assignedZones.length > 1 ? 's' : ''} active
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => openMemberProfile({ ...m, memberColor, hasLoc, isMe, locEntry })}
                    style={[styles.editBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.primary + '12' }]}
                  >
                    <Ionicons name="pencil" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {activeTab === 'devices' && (
          <View style={{ flex: 1 }}>
            <ScrollView
              style={styles.tabContent}
              contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: insets.bottom + 80 }}
              showsVerticalScrollIndicator={false}
            >
              {trackers.length === 0 && !loading && (
                <View style={styles.emptyWrap}>
                  <Ionicons name="hardware-chip-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                  <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>No tracking devices added yet</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Tap + to add your first device</Text>
                </View>
              )}
              {trackers.length > 0 && (
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  DEVICES ({trackers.length})
                </Text>
              )}
              {trackers.map((t) => {
                const bColor = batteryColor(t.battery ?? 100);
                const statusColors = { nearby: '#4CAF82', away: '#FFB347', lost: '#EF4444' };
                return (
                  <TouchableOpacity
                    key={t._id}
                    style={[styles.deviceCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0 : 0.07 }]}
                    activeOpacity={0.8}
                    onLongPress={() => handleDeleteTracker(t)}
                  >
                    <LinearGradient
                      colors={[t.color || '#6C63FF', (t.color || '#6C63FF') + 'AA']}
                      style={styles.deviceIcon}
                    >
                      <Ionicons name={t.icon || 'location'} size={22} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <Text style={[styles.deviceName, { color: colors.textPrimary }]}>{t.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: (statusColors[t.status] || '#9CA3AF') + '20' }]}>
                          <Text style={[styles.statusTxt, { color: statusColors[t.status] || '#9CA3AF' }]}>
                            {t.status || 'nearby'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.deviceLoc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t.lastSeenAddress || (t.lastLocation ? 'Location available' : 'No location')}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <View style={styles.batteryWrap}>
                          <View style={[styles.batteryFill, { width: `${t.battery ?? 100}%`, backgroundColor: bColor }]} />
                        </View>
                        <Text style={[styles.batteryTxt, { color: bColor }]}>{t.battery ?? 100}%</Text>
                        <Text style={[styles.deviceTime, { color: colors.textSecondary }]}>
                          {relTime(t.lastSeenAt)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 16 }]}
              onPress={() => setShowAddTracker(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'zones' && (
          <View style={{ flex: 1 }}>
            <ScrollView
              style={styles.tabContent}
              contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: insets.bottom + 80 }}
              showsVerticalScrollIndicator={false}
            >
              {geoZones.length === 0 && !loading && (
                <View style={styles.emptyWrap}>
                  <Ionicons name="map-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                  <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>No safe zones yet</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Long press anywhere on the map to draw a zone</Text>
                </View>
              )}
              {geoZones.length > 0 && (
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  SAFE ZONES ({geoZones.length})
                </Text>
              )}
              {geoZones.map((z) => {
                const zColor = z.color || '#4CAF82';
                const assignments = z.assignments || [];
                const shownAssignees = assignments.slice(0, 3);
                const extraCount = assignments.length - 3;
                return (
                  <TouchableOpacity
                    key={z._id}
                    style={[styles.zoneCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0 : 0.07 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedZone(z)}
                    onLongPress={() => handleDeleteZone(z)}
                  >
                    <View style={[styles.zoneIconWrap, { backgroundColor: zColor + '20' }]}>
                      <Ionicons name={z.icon || 'home'} size={20} color={zColor} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.zoneName, { color: colors.textPrimary }]}>{z.name}</Text>
                      <Text style={[styles.zoneMeta, { color: colors.textSecondary }]}>
                        {z.radius || 200}m radius
                        {assignments.length > 0 ? ` · ${ALL_DAYS.filter(d => assignments.some(a => (a.days||[]).includes(d))).slice(0,3).join(', ')}` : ''}
                      </Text>
                      {assignments.length > 0 && (
                        <View style={styles.assigneesRow}>
                          {shownAssignees.map((a, ai) => {
                            const mem = members.find(m => m.id === a.userId?.toString());
                            const mc = mem?.color || MEMBER_COLORS[ai % MEMBER_COLORS.length];
                            return (
                              <View key={a.userId?.toString() || ai} style={[styles.assigneeAv, { backgroundColor: mc, marginLeft: ai === 0 ? 0 : -6 }]}>
                                <Text style={styles.assigneeAvTxt}>{initials(a.name)}</Text>
                              </View>
                            );
                          })}
                          {extraCount > 0 && (
                            <View style={[styles.assigneeAv, { backgroundColor: '#9CA3AF', marginLeft: -6 }]}>
                              <Text style={styles.assigneeAvTxt}>+{extraCount}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <View style={{ gap: 4, alignItems: 'center' }}>
                      {z.alertOnExit && (
                        <View style={[styles.alertPill, { backgroundColor: '#FFB34720' }]}>
                          <Text style={{ fontSize: 9, color: '#FFB347', fontWeight: '700' }}>ALERT</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ─── Member Profile Sheet ─── */}
      <Modal
        visible={!!selectedMember}
        transparent
        animationType="slide"
        onRequestClose={closeMemberProfile}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeMemberProfile} />
          <View style={[styles.mpSheet, { backgroundColor: sheetBg }]}>
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB', alignSelf: 'center', marginBottom: 8 }]} />

            {mpStep === 'profile' && selectedMember && (() => {
              const memberZones = getMemberZones(selectedMember.id);
              const mc = selectedMember.memberColor;
              return (
                <>
                  {/* Header */}
                  <View style={styles.mpHeader}>
                    <LinearGradient colors={[mc, mc + 'BB']} style={styles.mpAvatar}>
                      <Text style={styles.mpAvatarTxt}>{initials(selectedMember.name)}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mpName, { color: colors.textPrimary }]}>{selectedMember.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedMember.hasLoc ? '#4CAF82' : '#9CA3AF' }} />
                        <Text style={[styles.mpSub, { color: colors.textSecondary }]}>
                          {selectedMember.hasLoc
                            ? (selectedMember.locEntry?.lastSeenAddress || 'Location active')
                            : 'Location off'}
                        </Text>
                      </View>
                    </View>
                    {!selectedMember.isMe && (
                      <TouchableOpacity onPress={closeMemberProfile} style={styles.closeBtn}>
                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.55 }}>

                    {/* Zone assignments */}
                    <Text style={[styles.mpSectionLabel, { color: colors.textSecondary }]}>ZONE ALERTS</Text>

                    {memberZones.length === 0 && (
                      <View style={[styles.mpEmptyZone, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                        <Ionicons name="shield-outline" size={24} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                        <Text style={[styles.mpEmptyZoneTxt, { color: colors.textSecondary }]}>No zones assigned yet</Text>
                        <Text style={[{ fontSize: 11, opacity: 0.5, color: colors.textSecondary, textAlign: 'center' }]}>
                          Add a zone to get alerts when {selectedMember.name.split(' ')[0]} enters or leaves
                        </Text>
                      </View>
                    )}

                    {memberZones.map(({ zone, assignment }) => {
                      const zColor = zone.color || '#4CAF82';
                      return (
                        <View key={zone._id} style={[styles.mpZoneRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FA', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                          <View style={[styles.mpZoneIcon, { backgroundColor: zColor + '20' }]}>
                            <Ionicons name={zone.icon || 'location'} size={18} color={zColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }]}>{zone.name}</Text>
                            <Text style={[{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }]}>
                              {(assignment.days || []).join(', ')} · {assignment.startTime || '00:00'} – {assignment.endTime || '23:59'}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                              {zone.alertOnExit && (
                                <View style={[styles.mpAlertPill, { backgroundColor: '#FFB34718' }]}>
                                  <Text style={{ fontSize: 9, color: '#FFB347', fontWeight: '700' }}>EXIT ALERT</Text>
                                </View>
                              )}
                              {zone.alertOnEnter && (
                                <View style={[styles.mpAlertPill, { backgroundColor: '#4CAF8218' }]}>
                                  <Text style={{ fontSize: 9, color: '#4CAF82', fontWeight: '700' }}>ENTRY ALERT</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            style={[styles.mpRemoveBtn, { backgroundColor: '#EF444418' }]}
                            onPress={() => Alert.alert('Remove zone alert?', `Remove ${selectedMember.name} from ${zone.name}?`, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Remove', style: 'destructive', onPress: () => removeMemberAssignment(zone._id) },
                            ])}
                          >
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    {/* Add zone button */}
                    {!selectedMember.isMe && (
                      <TouchableOpacity
                        style={[styles.mpAddZoneBtn, { borderColor: colors.primary + '55', backgroundColor: colors.primary + '10' }]}
                        onPress={openAddAssignment}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add-circle" size={18} color={colors.primary} />
                        <Text style={[{ fontSize: 13, fontWeight: '700', color: colors.primary }]}>Add Zone Alert</Text>
                      </TouchableOpacity>
                    )}

                    {/* Simulate section */}
                    {!selectedMember.isMe && selectedMember.id && (
                      <View style={styles.mpSimRow}>
                        <Text style={[{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.textSecondary, marginBottom: 8 }]}>ZONE TEST</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity
                            style={[styles.mpSimBtn, { backgroundColor: '#FF6B9D12', borderColor: '#FF6B9D44' }]}
                            onPress={async () => {
                              // Place member ~5km north of Greater Noida center (28.4744, 77.5040)
                              const baseLat = myMarker?.lastLocation?.latitude ?? 28.4744;
                              const baseLng = myMarker?.lastLocation?.longitude ?? 77.5040;
                              try {
                                await simulateMemberLocation(selectedMember.id, baseLat + (5 / 111.32), baseLng);
                                await fetchAll();
                              } catch (e) { Alert.alert('Failed', e?.response?.data?.message || 'Could not simulate.'); }
                            }}
                          >
                            <Ionicons name="radio-button-off" size={14} color="#FF6B9D" />
                            <Text style={[styles.mpSimBtnTxt, { color: '#FF6B9D' }]}>Move 5km away</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.mpSimBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '44', flex: 1 }]}
                            onPress={async () => {
                              const lat = myMarker?.lastLocation?.latitude ?? 28.4744;
                              const lng = myMarker?.lastLocation?.longitude ?? 77.5040;
                              try {
                                await simulateMemberLocation(selectedMember.id, lat, lng);
                                await fetchAll();
                                Alert.alert('✅ Done', 'Check Notifications for zone alerts.');
                              } catch (e) { Alert.alert('Failed', e?.response?.data?.message || 'Could not simulate.'); }
                            }}
                          >
                            <Ionicons name="navigate" size={14} color={colors.primary} />
                            <Text style={[styles.mpSimBtnTxt, { color: colors.primary }]}>Teleport to me</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    <View style={{ height: 20 }} />
                  </ScrollView>
                </>
              );
            })()}

            {mpStep === 'addAssignment' && selectedMember && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.75 }} keyboardShouldPersistTaps="handled">
                <View style={[styles.stepHeader, { marginBottom: 16 }]}>
                  <TouchableOpacity onPress={() => setMpStep('profile')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    Add Alert Zone for {selectedMember.name.split(' ')[0]}
                  </Text>
                </View>

                <Text style={[styles.mpSectionLabel, { color: colors.textSecondary }]}>PICK A ZONE</Text>
                {geoZones.length === 0 && (
                  <Text style={{ fontSize: 13, color: colors.textSecondary, opacity: 0.7, marginBottom: 12 }}>
                    No zones yet. Long-press the map to create one first.
                  </Text>
                )}
                {geoZones.map((z) => {
                  const zColor = z.color || '#4CAF82';
                  const selected = draftZoneId === z._id;
                  return (
                    <TouchableOpacity
                      key={z._id}
                      style={[styles.mpZoneRow, {
                        borderColor: selected ? zColor : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'),
                        backgroundColor: selected ? (zColor + '15') : (isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FA'),
                        borderWidth: selected ? 2 : 1,
                        marginBottom: 8,
                      }]}
                      onPress={() => setDraftZoneId(z._id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.mpZoneIcon, { backgroundColor: zColor + '20' }]}>
                        <Ionicons name={z.icon || 'location'} size={18} color={zColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }]}>{z.name}</Text>
                        <Text style={[{ fontSize: 11, color: colors.textSecondary }]}>{z.radius || 200}m radius</Text>
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={20} color={zColor} />}
                    </TouchableOpacity>
                  );
                })}

                <Text style={[styles.mpSectionLabel, { color: colors.textSecondary, marginTop: 12 }]}>ACTIVE DAYS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {ALL_DAYS.map((d) => {
                    const on = draftDays.includes(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dayChip, { borderColor: on ? colors.primary : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB'), backgroundColor: on ? colors.primary : 'transparent' }]}
                        onPress={() => toggleDraftDay(d)}
                      >
                        <Text style={[styles.dayChipTxt, { color: on ? '#fff' : colors.textSecondary }]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.mpSectionLabel, { color: colors.textSecondary }]}>TIME WINDOW</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4 }}>FROM</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB', color: colors.textPrimary }]}
                      value={draftStart}
                      onChangeText={setDraftStart}
                      placeholder="08:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <Text style={{ color: colors.textSecondary, marginTop: 14, fontSize: 16 }}>→</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4 }}>TO</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB', color: colors.textPrimary }]}
                      value={draftEnd}
                      onChangeText={setDraftEnd}
                      placeholder="17:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                <Text style={[styles.mpSectionLabel, { color: colors.textSecondary }]}>ALERTS</Text>
                <TouchableOpacity
                  style={[styles.mpToggleRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
                  onPress={() => setDraftAlertExit(v => !v)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Alert if they leave zone</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>Notify when {selectedMember.name.split(' ')[0]} exits during assigned hours</Text>
                  </View>
                  <View style={[styles.mpToggle, { backgroundColor: draftAlertExit ? colors.primary : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB') }]}>
                    <View style={[styles.mpToggleThumb, { marginLeft: draftAlertExit ? 16 : 2 }]} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mpToggleRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FA', marginTop: 8 }]}
                  onPress={() => setDraftAlertEnter(v => !v)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Alert when they arrive</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>Notify when {selectedMember.name.split(' ')[0]} enters this zone</Text>
                  </View>
                  <View style={[styles.mpToggle, { backgroundColor: draftAlertEnter ? colors.primary : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB') }]}>
                    <View style={[styles.mpToggleThumb, { marginLeft: draftAlertEnter ? 16 : 2 }]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, {
                    backgroundColor: (draftZoneId && draftDays.length > 0) ? colors.primary : '#9CA3AF',
                    marginTop: 20,
                    opacity: mpSaving ? 0.6 : 1,
                  }]}
                  onPress={saveMemberAssignment}
                  disabled={!draftZoneId || draftDays.length === 0 || mpSaving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnTxt}>{mpSaving ? 'Saving…' : 'Save Alert Zone'}</Text>
                </TouchableOpacity>
                <View style={{ height: 24 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <AddTrackerModal
        visible={showAddTracker}
        onClose={() => setShowAddTracker(false)}
        onSave={createTracker}
        colors={colors}
        isDark={isDark}
      />

      <ZoneSettingsModal
        zone={selectedZone}
        visible={!!selectedZone}
        onClose={() => setSelectedZone(null)}
        members={members}
        onUpdateAssignments={updateZoneAssignments}
        colors={colors}
        isDark={isDark}
      />

      {zoneCreation && (
        <Animated.View style={[
          styles.zcPanel,
          {
            backgroundColor: sheetBg,
            transform: [{ translateY: zcAnim }],
            maxHeight: zcExpanded ? SCREEN_H * 0.8 : 260,
          },
        ]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setZcExpanded(e => !e)}
            style={{ alignItems: 'center', paddingBottom: 6 }}
          >
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : '#C4C4C4', marginBottom: 0 }]} />
          </TouchableOpacity>

          <View style={styles.zcHeaderRow}>
            <Text style={[styles.zcTitle, { color: colors.textPrimary }]}>New Safe Zone</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setZcExpanded(e => !e)} style={styles.zcExpandBtn}>
                <Ionicons name={zcExpanded ? 'chevron-down' : 'chevron-up'} size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelZoneCreation} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.zcRadiusRow}>
            <Text style={[styles.zcRadiusBig, { color: colors.primary }]}>
              {(zoneCreation.radius >= 1000
                ? `${(zoneCreation.radius / 1000).toFixed(1)} km`
                : `${zoneCreation.radius} m`)}
            </Text>
            <View style={styles.zcManualWrap}>
              <TextInput
                style={[styles.zcManualInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB', color: colors.textPrimary }]}
                value={manualRadius}
                onChangeText={setManualRadius}
                onEndEditing={() => applyManualRadius(manualRadius)}
                onSubmitEditing={() => applyManualRadius(manualRadius)}
                keyboardType="numeric"
                placeholder="300"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.zcManualUnit, { color: colors.textSecondary }]}>m</Text>
            </View>
          </View>

          {zcExpanded && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={[styles.zcInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB', color: colors.textPrimary }]}
                placeholder="Zone name (e.g. School, Home)"
                placeholderTextColor={colors.textSecondary}
                value={zoneDraftName}
                onChangeText={setZoneDraftName}
                autoFocus
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>ICON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {ZONE_ICONS.map((ic) => (
                    <TouchableOpacity
                      key={ic}
                      style={[styles.iconOption, {
                        backgroundColor: zoneDraftIcon === ic ? zoneDraftColor : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                        borderColor: zoneDraftIcon === ic ? zoneDraftColor : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
                      }]}
                      onPress={() => setZoneDraftIcon(ic)}
                    >
                      <Ionicons name={ic} size={18} color={zoneDraftIcon === ic ? '#fff' : colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>COLOR</Text>
              <View style={[styles.colorRow, { marginBottom: 18 }]}>
                {TRACKER_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c, borderWidth: zoneDraftColor === c ? 3 : 0, borderColor: '#fff' }]}
                    onPress={() => setZoneDraftColor(c)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: zoneDraftColor, opacity: zoneDraftName.trim() ? 1 : 0.45 }]}
                onPress={saveZoneFromMap}
                activeOpacity={0.85}
                disabled={!zoneDraftName.trim()}
              >
                <Text style={styles.saveBtnTxt}>Save Zone</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {!zcExpanded && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: zoneDraftColor, opacity: zoneDraftName.trim() ? 1 : 0.45, marginTop: 12 }]}
              onPress={zoneDraftName.trim() ? saveZoneFromMap : () => setZcExpanded(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnTxt}>{zoneDraftName.trim() ? 'Save Zone' : 'Name this zone ↑'}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1 },
  map:                { flex: 1 },
  mapTopBar:          { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  liveDotWrap:        { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  livePulse:          { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF82', opacity: 0.35 },
  liveDot:            { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF82' },
  liveTxt:            { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  countBadge:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  countTxt:           { color: '#fff', fontSize: 12, fontWeight: '600' },
  refreshBtn:         { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  sheet:              { flex: 1 },
  tabBar:             { flexDirection: 'row', gap: 6, padding: 10, margin: 12, marginBottom: 0, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  tabBtn:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 12 },
  tabTxt:             { fontSize: 12, fontWeight: '600' },
  tabContent:         { flex: 1 },
  sectionLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, marginBottom: 4, marginLeft: 2 },
  memberCard:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, shadowColor: '#000', shadowRadius: 8, elevation: 2 },
  avatarWrap:         { position: 'relative' },
  avatar:             { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:          { color: '#fff', fontSize: 17, fontWeight: '700' },
  statusDot:          { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  memberName:         { fontSize: 14, fontWeight: '700' },
  memberLoc:          { fontSize: 12, marginTop: 1 },
  memberTime:         { fontSize: 11, marginTop: 2, opacity: 0.6 },
  focusBtn:           { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  meBadge:            { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  meBadgeTxt:         { fontSize: 10, fontWeight: '700' },
  simBtn:             { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  simBtnTxt:          { fontSize: 10, fontWeight: '700' },
  editBtn:            { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deviceCard:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, shadowColor: '#000', shadowRadius: 8, elevation: 2 },
  deviceIcon:         { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  deviceName:         { fontSize: 14, fontWeight: '700' },
  deviceLoc:          { fontSize: 11, marginTop: 1 },
  batteryWrap:        { width: 70, height: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' },
  batteryFill:        { height: '100%', borderRadius: 3 },
  batteryTxt:         { fontSize: 11, fontWeight: '700' },
  deviceTime:         { fontSize: 10, opacity: 0.55, marginLeft: 'auto' },
  statusBadge:        { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusTxt:          { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  zoneCard:           { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, shadowColor: '#000', shadowRadius: 8, elevation: 2 },
  zoneIconWrap:       { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  zoneName:           { fontSize: 14, fontWeight: '700' },
  zoneMeta:           { fontSize: 11, marginTop: 1 },
  alertPill:          { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  assigneesRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  assigneeAv:         { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  assigneeAvTxt:      { color: '#fff', fontSize: 9, fontWeight: '700' },
  fab:                { position: 'absolute', right: 16, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  emptyWrap:          { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTxt:           { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  emptySub:           { fontSize: 12, opacity: 0.5, textAlign: 'center' },
  permScreen:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permTitle:          { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  permSub:            { fontSize: 13, textAlign: 'center', lineHeight: 20, opacity: 0.7 },
  permBtn:            { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  permBtnTxt:         { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalSheetTall:     { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '90%' },
  sheetHandle:        { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:         { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  fieldLabel:         { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  textInput:          { height: 46, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, borderWidth: 1, marginBottom: 4 },
  iconGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  iconOption:         { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  colorRow:           { flexDirection: 'row', gap: 10, marginBottom: 4, flexWrap: 'wrap' },
  colorSwatch:        { width: 32, height: 32, borderRadius: 16 },
  saveBtn:            { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveBtnTxt:         { color: '#fff', fontSize: 15, fontWeight: '700' },
  coordRow:           { flexDirection: 'row', marginBottom: 4 },
  useLocBtn:          { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 12, borderWidth: 1, marginBottom: 10, marginTop: 4 },
  useLocTxt:          { fontSize: 13, fontWeight: '600' },
  radiusRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  radiusBtn:          { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  radiusTrack:        { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  radiusFill:         { height: '100%', borderRadius: 3 },
  radiusVal:          { fontSize: 13, fontWeight: '700', minWidth: 48, textAlign: 'right' },
  zoneSettingsSheet:  { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '92%' },
  zoneSettingsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  zoneSettingsIcon:   { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  zoneSettingsName:   { fontSize: 16, fontWeight: '700' },
  zoneSettingsMeta:   { fontSize: 12, marginTop: 2 },
  closeBtn:           { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  divider:            { height: 0.5, marginBottom: 12 },
  settingsSection:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, marginBottom: 10 },
  assignmentRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 0.5 },
  assignAv:           { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  assignAvTxt:        { color: '#fff', fontSize: 13, fontWeight: '700' },
  assignName:         { fontSize: 14, fontWeight: '700' },
  dayChipsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  dayChipSmall:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  dayChipSmallTxt:    { fontSize: 9, fontWeight: '700' },
  assignTime:         { fontSize: 11, marginTop: 2 },
  removeBtn:          { padding: 6, marginLeft: 'auto' },
  addPersonBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 14, borderWidth: 1.5, marginTop: 16 },
  addPersonTxt:       { fontSize: 14, fontWeight: '700' },
  stepHeader:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  backBtn:            { padding: 4 },
  stepTitle:          { fontSize: 15, fontWeight: '700', flex: 1 },
  dayChipsWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  dayChip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  dayChipTxt:         { fontSize: 12, fontWeight: '700' },
  memberPickRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
  memberPickName:     { flex: 1, fontSize: 14, fontWeight: '600' },
  zcPanel:            { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 14, overflow: 'hidden' },
  zcHeaderRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 6 },
  zcTitle:            { fontSize: 17, fontWeight: '700' },
  zcExpandBtn:        { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  zcRadiusRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  zcRadiusBig:        { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  zcManualWrap:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zcManualInput:      { width: 72, height: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  zcManualUnit:       { fontSize: 13, fontWeight: '600', opacity: 0.6 },
  zcInput:            { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 16 },
  mpSheet:            { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  mpHeader:           { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, marginTop: 6 },
  mpAvatar:           { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  mpAvatarTxt:        { color: '#fff', fontSize: 20, fontWeight: '800' },
  mpName:             { fontSize: 18, fontWeight: '800' },
  mpSub:              { fontSize: 12 },
  mpSectionLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, marginBottom: 10 },
  mpEmptyZone:        { alignItems: 'center', gap: 8, paddingVertical: 24, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16, paddingHorizontal: 20 },
  mpEmptyZoneTxt:     { fontSize: 13, fontWeight: '600', opacity: 0.6 },
  mpZoneRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  mpZoneIcon:         { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mpAlertPill:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  mpRemoveBtn:        { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mpAddZoneBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 14, borderWidth: 1.5, marginTop: 4, marginBottom: 16 },
  mpSimRow:           { paddingTop: 16, borderTopWidth: 0.5, borderTopColor: 'rgba(128,128,128,0.2)' },
  mpSimBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 12, borderWidth: 1 },
  mpSimBtnTxt:        { fontSize: 12, fontWeight: '700' },
  mpToggleRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14 },
  mpToggle:           { width: 38, height: 22, borderRadius: 11, justifyContent: 'center' },
  mpToggleThumb:      { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
});
