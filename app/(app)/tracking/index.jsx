import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  StyleSheet,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const { height: SCREEN_H } = Dimensions.get('window');
const ACCENT = '#3B82F6';

// ─── Static Data ──────────────────────────────────────────────────────────────

const TRACKERS = [
  { id: '1', name: "Aarav's Bag",  icon: 'bag',        color: '#6C63FF', battery: 92, status: 'nearby', lastSeen: 'St. Joseph School', updateTime: '9:42 AM',  coords: { latitude: 12.9352, longitude: 77.6245 } },
  { id: '2', name: 'Car Keys',     icon: 'key',        color: '#FFB347', battery: 78, status: 'nearby', lastSeen: 'Home',              updateTime: '10:10 AM', coords: { latitude: 12.9279, longitude: 77.6271 } },
  { id: '3', name: 'Wallet',       icon: 'wallet',     color: '#4CAF82', battery: 55, status: 'nearby', lastSeen: 'Home',              updateTime: '10:03 AM', coords: { latitude: 12.9281, longitude: 77.6268 } },
  { id: '4', name: "Sejal's Bag", icon: 'bag-handle', color: '#FF6B9D', battery: 34, status: 'away',   lastSeen: 'Dance Studio',      updateTime: '7:15 AM',  coords: { latitude: 12.9719, longitude: 77.5937 } },
  { id: '5', name: 'Laptop Bag',   icon: 'laptop',     color: '#3B82F6', battery: 12, status: 'away',   lastSeen: 'Office',            updateTime: '9:30 AM',  coords: { latitude: 12.9900, longitude: 77.7100 } },
  { id: '6', name: 'Pet Collar',   icon: 'paw',        color: '#F59E0B', battery: 67, status: 'nearby', lastSeen: 'Home',              updateTime: '10:15 AM', coords: { latitude: 12.9275, longitude: 77.6265 } },
];

const PRESET_LOCATIONS = [
  { id: 'home',   label: 'Home',   icon: 'home',          coords: { latitude: 12.9280, longitude: 77.6270 } },
  { id: 'school', label: 'School', icon: 'school',        coords: { latitude: 12.9352, longitude: 77.6245 } },
  { id: 'office', label: 'Office', icon: 'business',      coords: { latitude: 12.9900, longitude: 77.7100 } },
  { id: 'studio', label: 'Studio', icon: 'musical-notes', coords: { latitude: 12.9719, longitude: 77.5937 } },
];

const INITIAL_ZONES = {
  '1': { name: 'School Zone', locationId: 'school', coords: { latitude: 12.9352, longitude: 77.6245 }, radius: 300, alertType: 'leave' },
  '2': { name: 'Home',        locationId: 'home',   coords: { latitude: 12.9280, longitude: 77.6270 }, radius: 150, alertType: 'both'  },
};

const INITIAL_ALERTS = [
  { id: '1', trackerId: '5', icon: 'battery-dead',    color: '#EF4444', title: 'Battery Critical', body: 'Laptop Bag — 12% remaining',        time: '10 min ago', read: false },
  { id: '2', trackerId: '4', icon: 'navigate',         color: '#FF6B9D', title: 'Left Zone',        body: "Sejal's Bag left School Zone",       time: '3 hrs ago',  read: false },
  { id: '3', trackerId: '1', icon: 'shield-checkmark', color: '#4CAF82', title: 'Entered Zone',     body: "Aarav's Bag arrived at School Zone", time: '9:40 AM',    read: true  },
  { id: '4', trackerId: '2', icon: 'scan',             color: '#6C63FF', title: 'Unknown Tracker',  body: 'An unknown tracker detected nearby', time: '1 hr ago',   read: true  },
  { id: '5', trackerId: '6', icon: 'warning',          color: '#FFB347', title: 'Safe Zone Exit',   body: 'Pet Collar moved away from Home',    time: 'Yesterday',  read: true  },
];

const TABS = ['Trackers', 'Map', 'Zones', 'Alerts'];

// ─── Real tile-map builders ────────────────────────────────────────────────────
// Update HOME_LAT / HOME_LNG with your precise GPS coordinates
const HOME_LAT = 12.9280;
const HOME_LNG = 77.6270;

function buildMapHTML(trackers, zones, isDark) {
  const textClr = isDark ? '#ffffff' : '#111111';
  const labelBg = isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.88)';
  const bgClr   = isDark ? '#1a1a2e' : '#e8e4d8';
  const EMOJI   = { bag:'🎒', key:'🔑', wallet:'👛', 'bag-handle':'👜', laptop:'💼', paw:'🐾' };

  const markersJSON = JSON.stringify(trackers.map(t => ({
    id: t.id, lat: t.coords.latitude, lng: t.coords.longitude,
    color: t.color, em: EMOJI[t.icon] || '📍',
    name: t.name.replace(/'/g, '').split(' ')[0],
  })));

  const zonesJSON = JSON.stringify(
    Object.entries(zones).map(([tid, z]) => {
      const tr = trackers.find(t => t.id === tid);
      return tr ? { lat: z.coords.latitude, lng: z.coords.longitude, r: z.radius, color: tr.color } : null;
    }).filter(Boolean)
  );

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:${bgClr};}
#map{position:relative;width:100vw;height:100vh;overflow:hidden;}
#tiles{position:absolute;top:0;left:0;}
#ol{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}
#mks,#zns{position:absolute;top:0;left:0;width:100%;height:100%;}
.mk{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.mp{width:38px;height:38px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 3px 12px rgba(0,0,0,0.45);}
.ml{font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;white-space:nowrap;color:${textClr};background:${labelBg};}
.zn{position:absolute;border-radius:50%;pointer-events:none;}
#ctrl{position:absolute;bottom:70px;right:12px;z-index:30;display:flex;flex-direction:column;gap:7px;}
.zb{width:38px;height:38px;border-radius:10px;border:none;background:rgba(255,255,255,0.93);font-size:22px;font-weight:800;box-shadow:0 2px 10px rgba(0,0,0,0.22);cursor:pointer;line-height:38px;text-align:center;}
#att{position:absolute;bottom:6px;left:8px;font-size:8px;color:#444;opacity:0.55;z-index:30;pointer-events:none;}
</style>
</head><body>
<div id="map">
  <div id="tiles"></div>
  <div id="ol"><div id="zns"></div><div id="mks"></div></div>
  <div id="ctrl"><button class="zb" id="zi">+</button><button class="zb" id="zo">−</button></div>
  <div id="att">© OpenStreetMap contributors</div>
</div>
<script>
(function(){
var W=window.innerWidth,H=window.innerHeight,TILE=256;
var CX=${HOME_LNG},CY=${HOME_LAT},zoom=14,panX=0,panY=0;
var TRACKERS=${markersJSON},ZONES=${zonesJSON};

function l2x(lng,z){return(lng+180)/360*Math.pow(2,z);}
function l2y(lat,z){return(1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*Math.pow(2,z);}
function llPx(lat,lng){return{x:W/2+(l2x(lng,zoom)-l2x(CX,zoom))*TILE+panX,y:H/2+(l2y(lat,zoom)-l2y(CY,zoom))*TILE+panY};}
function mpp(lat){return 40075016.686*Math.cos(lat*Math.PI/180)/(TILE*Math.pow(2,zoom));}

function render(){
  var ox=W/2-l2x(CX,zoom)*TILE-panX,oy=H/2-l2y(CY,zoom)*TILE-panY;
  var maxN=Math.pow(2,zoom)-1;
  var x0=Math.floor(-ox/TILE)-1,y0=Math.floor(-oy/TILE)-1;
  var x1=Math.ceil((W-ox)/TILE),y1=Math.ceil((H-oy)/TILE);
  var tEl=document.getElementById('tiles');
  tEl.innerHTML='';
  for(var ty=y0;ty<=y1;ty++){for(var tx=x0;tx<=x1;tx++){
    if(tx<0||ty<0||tx>maxN||ty>maxN) continue;
    var img=document.createElement('img');
    img.src='https://tile.openstreetmap.org/'+zoom+'/'+tx+'/'+ty+'.png';
    img.style.cssText='position:absolute;left:'+(ox+tx*TILE)+'px;top:'+(oy+ty*TILE)+'px;width:'+TILE+'px;height:'+TILE+'px;';
    tEl.appendChild(img);
  }}
  var mEl=document.getElementById('mks');mEl.innerHTML='';
  TRACKERS.forEach(function(tr){
    var p=llPx(tr.lat,tr.lng);
    var d=document.createElement('div');d.className='mk';
    d.style.left=p.x+'px';d.style.top=p.y+'px';
    d.innerHTML='<div class="mp" style="background:'+tr.color+'">'+tr.em+'</div><div class="ml">'+tr.name+'</div>';
    d.addEventListener('click',function(e){e.stopPropagation();tap(tr.id);});
    mEl.appendChild(d);
  });
  var zEl=document.getElementById('zns');zEl.innerHTML='';
  ZONES.forEach(function(z){
    var p=llPx(z.lat,z.lng);var rPx=z.r/mpp(z.lat);
    var el=document.createElement('div');el.className='zn';
    el.style.left=(p.x-rPx)+'px';el.style.top=(p.y-rPx)+'px';
    el.style.width=(rPx*2)+'px';el.style.height=(rPx*2)+'px';
    el.style.border='2px dashed '+z.color;el.style.background=z.color+'18';
    zEl.appendChild(el);
  });
}

// Touch: pan + pinch-zoom with correct focal point math
var drag=false,px0=0,py0=0,pinch=false,pd=0,pz=0,ppx=0,ppy=0,pcx=0,pcy=0;
var m=document.getElementById('map');
m.addEventListener('touchstart',function(e){
  e.preventDefault();
  if(e.touches.length===1){
    drag=true;pinch=false;px0=e.touches[0].clientX;py0=e.touches[0].clientY;
  }else if(e.touches.length===2){
    drag=false;pinch=true;
    pd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    pz=zoom;ppx=panX;ppy=panY;
    pcx=(e.touches[0].clientX+e.touches[1].clientX)/2;
    pcy=(e.touches[0].clientY+e.touches[1].clientY)/2;
  }
},{passive:false});
m.addEventListener('touchmove',function(e){
  e.preventDefault();
  if(drag&&e.touches.length===1){
    panX+=e.touches[0].clientX-px0;panY+=e.touches[0].clientY-py0;
    px0=e.touches[0].clientX;py0=e.touches[0].clientY;render();
  }else if(pinch&&e.touches.length===2){
    var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    var nz=Math.max(10,Math.min(18,Math.round(pz+Math.log2(d/pd))));
    // Keep focal point (pcx,pcy) fixed: newPan = (focal-center)*(1-scale) + startPan*scale
    var s=Math.pow(2,nz-pz);
    panX=(pcx-W/2)*(1-s)+ppx*s;
    panY=(pcy-H/2)*(1-s)+ppy*s;
    zoom=nz;render();
  }
},{passive:false});
m.addEventListener('touchend',function(e){
  if(e.touches.length===0){drag=false;pinch=false;}
  else if(e.touches.length===1){pinch=false;drag=true;px0=e.touches[0].clientX;py0=e.touches[0].clientY;}
},{passive:false});

document.getElementById('zi').addEventListener('click',function(){panX*=2;panY*=2;zoom=Math.min(18,zoom+1);render();});
document.getElementById('zo').addEventListener('click',function(){panX/=2;panY/=2;zoom=Math.max(10,zoom-1);render();});
function tap(id){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerPress',trackerId:id}));}
render();
})();
</script>
</body></html>`;
}

function buildMiniMapHTML(coords, radius, isDark) {
  const bgClr  = isDark ? '#1a1a2e' : '#e8e4d8';
  const circClr = ACCENT;
  const ZOOM   = 15;

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:100%;height:100%;overflow:hidden;background:${bgClr};}
#map{position:relative;width:100vw;height:100vh;overflow:hidden;}#t{position:absolute;}
#ol{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}</style>
</head><body>
<div id="map"><div id="t"></div><div id="ol"></div></div>
<script>
(function(){
var W=window.innerWidth,H=window.innerHeight,TILE=256,Z=${ZOOM};
var LAT=${coords.latitude},LNG=${coords.longitude},R=${radius};
function l2x(lng){return(lng+180)/360*Math.pow(2,Z);}
function l2y(lat){return(1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*Math.pow(2,Z);}
var ox=W/2-l2x(LNG)*TILE,oy=H/2-l2y(LAT)*TILE;
var maxN=Math.pow(2,Z)-1;
var x0=Math.floor(-ox/TILE)-1,y0=Math.floor(-oy/TILE)-1;
var x1=Math.ceil((W-ox)/TILE),y1=Math.ceil((H-oy)/TILE);
var t=document.getElementById('t');
for(var ty=y0;ty<=y1;ty++){for(var tx=x0;tx<=x1;tx++){
  if(tx<0||ty<0||tx>maxN||ty>maxN) continue;
  var img=document.createElement('img');
  img.src='https://tile.openstreetmap.org/'+Z+'/'+tx+'/'+ty+'.png';
  img.style.cssText='position:absolute;left:'+(ox+tx*TILE)+'px;top:'+(oy+ty*TILE)+'px;width:256px;height:256px;';
  t.appendChild(img);
}}
var mpp=40075016.686*Math.cos(LAT*Math.PI/180)/(TILE*Math.pow(2,Z));
var rPx=R/mpp,cx=W/2,cy=H/2;
var ol=document.getElementById('ol');
ol.innerHTML='<div style="position:absolute;border-radius:50%;left:'+(cx-rPx)+'px;top:'+(cy-rPx)+'px;width:'+(rPx*2)+'px;height:'+(rPx*2)+'px;border:2px dashed ${circClr};background:${circClr}18;"></div>'
+'<div style="position:absolute;left:'+(cx-7)+'px;top:'+(cy-7)+'px;width:14px;height:14px;border-radius:50%;background:${circClr};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>';
})();
</script>
</body></html>`;
}

// ─── BatteryBar ───────────────────────────────────────────────────────────────

function BatteryBar({ battery }) {
  const battColor = battery > 50 ? '#4CAF82' : battery > 20 ? '#FFB347' : '#EF4444';
  const battIcon  = battery > 50 ? 'battery-full' : battery > 20 ? 'battery-half' : 'battery-dead';
  return (
    <View style={bb.row}>
      <Ionicons name={battIcon} size={14} color={battColor} />
      <View style={bb.track}>
        <View style={[bb.fill, { width: `${battery}%`, backgroundColor: battColor }]} />
      </View>
      <Text style={[bb.pct, { color: battColor }]}>{battery}%</Text>
    </View>
  );
}
const bb = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  track: { flex: 1, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' },
  fill:  { height: 4, borderRadius: 2 },
  pct:   { fontSize: 10, fontWeight: '600', minWidth: 26 },
});

// ─── TrackerCard ──────────────────────────────────────────────────────────────

function TrackerCard({ tracker, ringing, onPress, onFind, colors }) {
  const ringAnim = useRef(new Animated.Value(1)).current;
  const loopRef  = useRef(null);
  const isRinging = ringing === tracker.id;

  useEffect(() => {
    if (isRinging) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1.25, duration: 300, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 1,    duration: 300, useNativeDriver: true }),
        ]),
        { iterations: 6 },
      );
      loopRef.current.start(() => onFind(null));
    } else {
      loopRef.current?.stop();
      ringAnim.setValue(1);
    }
    return () => loopRef.current?.stop();
  }, [isRinging]);

  const handleFind = () => {
    if (isRinging) { onFind(null); return; }
    onFind(tracker.id);
    Alert.alert('Finding Tracker', `Playing sound on "${tracker.name}"…`);
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
      <GlassCard style={tc.card}>
        <Animated.View style={[tc.iconWrap, { backgroundColor: tracker.color + '22', transform: [{ scale: ringAnim }] }]}>
          <Ionicons name={tracker.icon} size={22} color={tracker.color} />
        </Animated.View>
        <View style={tc.info}>
          <Text style={[tc.name, { color: colors.textPrimary }]} numberOfLines={1}>{tracker.name}</Text>
          <View style={tc.locRow}>
            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
            <Text style={[tc.loc, { color: colors.textSecondary }]} numberOfLines={1}>{tracker.lastSeen}</Text>
          </View>
          <BatteryBar battery={tracker.battery} />
        </View>
        <View style={tc.right}>
          <View style={[tc.statusBadge, { backgroundColor: tracker.status === 'nearby' ? '#4CAF8222' : '#EF444422' }]}>
            <Text style={[tc.statusTxt, { color: tracker.status === 'nearby' ? '#4CAF82' : '#EF4444' }]}>
              {tracker.status === 'nearby' ? 'Nearby' : 'Away'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleFind} style={[tc.findBtn, { backgroundColor: isRinging ? ACCENT : ACCENT + '18' }]}>
            <Ionicons name={isRinging ? 'volume-high' : 'volume-high-outline'} size={16} color={isRinging ? '#fff' : ACCENT} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}
const tc = StyleSheet.create({
  card:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 10 },
  iconWrap:    { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  info:        { flex: 1, gap: 4 },
  name:        { fontSize: 14, fontWeight: '700' },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  loc:         { fontSize: 11, flex: 1 },
  right:       { alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusTxt:   { fontSize: 10, fontWeight: '600' },
  findBtn:     { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});

// ─── ZoneEditorModal ──────────────────────────────────────────────────────────

function ZoneEditorModal({ visible, existingZone, onSave, onCancel, colors, isDark }) {
  const [zoneName,   setZoneName]   = useState('');
  const [locationId, setLocationId] = useState('home');
  const [radius,     setRadius]     = useState(300);
  const [alertType,  setAlertType]  = useState('both');

  useEffect(() => {
    if (visible) {
      setZoneName(existingZone?.name       ?? '');
      setLocationId(existingZone?.locationId ?? 'home');
      setRadius(existingZone?.radius     ?? 300);
      setAlertType(existingZone?.alertType  ?? 'both');
    }
  }, [visible, existingZone]);

  const selectedLoc    = PRESET_LOCATIONS.find(l => l.id === locationId) ?? PRESET_LOCATIONS[0];
  const radiusOptions  = [100, 300, 500, 1000];
  const alertOptions   = [
    { key: 'enter', label: 'Enter Zone' },
    { key: 'leave', label: 'Leave Zone' },
    { key: 'both',  label: 'Both'       },
  ];

  const handleSave = () => {
    if (!zoneName.trim()) { Alert.alert('Zone Name', 'Please enter a zone name.'); return; }
    onSave({ name: zoneName.trim(), locationId, coords: selectedLoc.coords, radius, alertType });
  };

  const bg  = isDark ? '#1A1A2E' : '#FFFFFF';
  const sec = isDark ? 'rgba(255,255,255,0.06)' : '#F7F4FF';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={ze.overlay}>
        <ScrollView style={[ze.sheet, { backgroundColor: bg }]} contentContainerStyle={ze.scrollContent}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={ze.handle} />
          <Text style={[ze.title, { color: colors.textPrimary }]}>Set Alert Zone</Text>

          <Text style={[ze.label, { color: colors.textSecondary }]}>ZONE NAME</Text>
          <TextInput
            style={[ze.input, { backgroundColor: sec, color: colors.textPrimary, borderColor: colors.border }]}
            value={zoneName}
            onChangeText={setZoneName}
            placeholder="e.g. School Zone"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[ze.label, { color: colors.textSecondary }]}>ZONE CENTER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ze.chipScroll}>
            {PRESET_LOCATIONS.map(loc => {
              const sel = loc.id === locationId;
              return (
                <TouchableOpacity key={loc.id} onPress={() => setLocationId(loc.id)}
                  style={[ze.chip, { backgroundColor: sel ? ACCENT : sec, borderColor: sel ? ACCENT : colors.border }]}>
                  <Ionicons name={loc.icon} size={14} color={sel ? '#fff' : colors.textSecondary} />
                  <Text style={[ze.chipTxt, { color: sel ? '#fff' : colors.textPrimary }]}>{loc.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <WebView
            key={locationId + '_' + radius + '_' + (isDark ? 'd' : 'l')}
            source={{ html: buildMiniMapHTML(selectedLoc.coords, radius, isDark) }}
            style={ze.miniMap}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            originWhitelist={['*', 'http://*', 'https://*']}
            scrollEnabled={false}
            mixedContentMode="always"
          />

          <Text style={[ze.label, { color: colors.textSecondary }]}>ALERT RADIUS</Text>
          <View style={ze.optRow}>
            {radiusOptions.map(r => {
              const sel = r === radius;
              return (
                <TouchableOpacity key={r} onPress={() => setRadius(r)}
                  style={[ze.optBtn, { backgroundColor: sel ? ACCENT : sec, borderColor: sel ? ACCENT : colors.border }]}>
                  <Text style={[ze.optTxt, { color: sel ? '#fff' : colors.textPrimary }]}>
                    {r >= 1000 ? '1 km' : `${r}m`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[ze.label, { color: colors.textSecondary }]}>ALERT WHEN</Text>
          <View style={ze.optRow}>
            {alertOptions.map(o => {
              const sel = o.key === alertType;
              return (
                <TouchableOpacity key={o.key} onPress={() => setAlertType(o.key)}
                  style={[ze.optBtn, { flex: 1, backgroundColor: sel ? ACCENT : sec, borderColor: sel ? ACCENT : colors.border }]}>
                  <Text style={[ze.optTxt, { color: sel ? '#fff' : colors.textPrimary }]}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={handleSave} style={ze.saveBtn}>
            <Text style={ze.saveTxt}>Save Zone</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={ze.cancelLink}>
            <Text style={[ze.cancelTxt, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const ze = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_H * 0.92 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 16 },
  title:       { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label:       { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  input:       { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chipScroll:  { marginBottom: 4 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipTxt:     { fontSize: 13, fontWeight: '600' },
  miniMap:     { height: 180, borderRadius: 12, marginTop: 8, overflow: 'hidden' },
  optRow:      { flexDirection: 'row', gap: 8 },
  optBtn:      { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  optTxt:      { fontSize: 12, fontWeight: '600' },
  saveBtn:     { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  saveTxt:     { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelLink:  { alignItems: 'center', paddingVertical: 12 },
  cancelTxt:   { fontSize: 14 },
});

// ─── TrackerDetailModal ───────────────────────────────────────────────────────

function TrackerDetailModal({ visible, tracker, zones, onClose, onFindPress, onSetZone, onRemoveZone, colors, isDark }) {
  const [zoneEditorVisible, setZoneEditorVisible] = useState(false);

  if (!tracker) return null;

  const zone              = zones[tracker.id];
  const bg                = isDark ? '#1A1A2E' : '#FFFFFF';
  const sec               = isDark ? 'rgba(255,255,255,0.06)' : '#F7F4FF';
  const alertTypeLabel    = { enter: 'Enter', leave: 'Leave', both: 'Both' };

  const HISTORY = [
    { time: tracker.updateTime, place: tracker.lastSeen },
    { time: '8:55 AM', place: 'Route Transit' },
    { time: '8:30 AM', place: 'Home' },
  ];

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={dm.overlay}>
          <View style={[dm.sheet, { backgroundColor: bg }]}>
            <View style={dm.handle} />
            <View style={dm.header}>
              <View style={[dm.bigIcon, { backgroundColor: tracker.color + '22' }]}>
                <Ionicons name={tracker.icon} size={32} color={tracker.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[dm.trackerName, { color: colors.textPrimary }]}>{tracker.name}</Text>
                <View style={[dm.statusChip, { backgroundColor: tracker.status === 'nearby' ? '#4CAF8222' : '#EF444422' }]}>
                  <Text style={[dm.statusChipTxt, { color: tracker.status === 'nearby' ? '#4CAF82' : '#EF4444' }]}>
                    {tracker.status === 'nearby' ? 'Online' : 'Away'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={dm.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dm.scroll}>
              {/* Location */}
              <GlassCard style={[dm.infoCard, { backgroundColor: sec }]}>
                <Ionicons name="location" size={18} color={ACCENT} />
                <View style={{ flex: 1 }}>
                  <Text style={[dm.infoLabel, { color: colors.textSecondary }]}>Last Seen</Text>
                  <Text style={[dm.infoVal, { color: colors.textPrimary }]}>{tracker.lastSeen}</Text>
                </View>
                <Text style={[dm.infoTime, { color: colors.textSecondary }]}>{tracker.updateTime}</Text>
              </GlassCard>

              {/* Battery */}
              <GlassCard style={[dm.infoCard, { backgroundColor: sec }]}>
                <Ionicons name="battery-charging" size={18} color={tracker.battery > 50 ? '#4CAF82' : tracker.battery > 20 ? '#FFB347' : '#EF4444'} />
                <View style={{ flex: 1 }}>
                  <Text style={[dm.infoLabel, { color: colors.textSecondary }]}>Battery</Text>
                  <BatteryBar battery={tracker.battery} />
                </View>
              </GlassCard>

              {/* Zone Settings */}
              <Text style={[dm.sectionLabel, { color: colors.textSecondary }]}>ZONE SETTINGS</Text>
              {zone ? (
                <GlassCard style={[dm.infoCard, { backgroundColor: sec }]}>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={[dm.infoVal, { color: colors.textPrimary }]}>{zone.name}</Text>
                    <View style={dm.zoneChipRow}>
                      <View style={[dm.chip, { backgroundColor: ACCENT + '22' }]}>
                        <Text style={[dm.chipTxt, { color: ACCENT }]}>{alertTypeLabel[zone.alertType]}</Text>
                      </View>
                      <View style={[dm.chip, { backgroundColor: '#4CAF8222' }]}>
                        <Text style={[dm.chipTxt, { color: '#4CAF82' }]}>{zone.radius >= 1000 ? `${zone.radius / 1000}km` : `${zone.radius}m`}</Text>
                      </View>
                    </View>
                    <View style={dm.infoRow}>
                      <Ionicons name="information-circle-outline" size={12} color={colors.textSecondary} />
                      <Text style={[dm.explainer, { color: colors.textSecondary }]}>
                        Alert when tracker {zone.alertType === 'enter' ? 'enters' : zone.alertType === 'leave' ? 'leaves' : 'enters or leaves'} this zone.
                      </Text>
                    </View>
                  </View>
                  <View style={dm.zoneBtns}>
                    <TouchableOpacity onPress={() => setZoneEditorVisible(true)} style={[dm.zoneBtn, { backgroundColor: ACCENT + '18' }]}>
                      <Ionicons name="pencil" size={14} color={ACCENT} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { onRemoveZone(tracker.id); }} style={[dm.zoneBtn, { backgroundColor: '#EF444422' }]}>
                      <Ionicons name="trash" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ) : (
                <GlassCard style={[dm.infoCard, { backgroundColor: sec }]}>
                  <Ionicons name="shield-outline" size={18} color={colors.textSecondary} />
                  <Text style={[dm.infoLabel, { color: colors.textSecondary, flex: 1 }]}>No zone set for this tracker</Text>
                  <TouchableOpacity onPress={() => setZoneEditorVisible(true)} style={dm.setZoneBtn}>
                    <Text style={dm.setZoneTxt}>Set Zone</Text>
                  </TouchableOpacity>
                </GlassCard>
              )}

              {/* History */}
              <Text style={[dm.sectionLabel, { color: colors.textSecondary }]}>RECENT HISTORY</Text>
              {HISTORY.map((h, i) => (
                <GlassCard key={i} style={[dm.histRow, { backgroundColor: sec }]}>
                  <View style={[dm.histDot, { backgroundColor: i === 0 ? tracker.color : colors.border }]} />
                  <Text style={[dm.histTime, { color: colors.textSecondary }]}>{h.time}</Text>
                  <Text style={[dm.histPlace, { color: colors.textPrimary }]}>{h.place}</Text>
                </GlassCard>
              ))}

              {/* Actions */}
              <View style={dm.actRow}>
                <TouchableOpacity onPress={() => { onFindPress(tracker.id); Alert.alert('Finding', `Playing sound on "${tracker.name}"`); }}
                  style={[dm.actBtn, { backgroundColor: ACCENT }]}>
                  <Ionicons name="volume-high" size={18} color="#fff" />
                  <Text style={dm.actTxt}>Find</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[dm.actBtn, { backgroundColor: '#4CAF8222' }]}>
                  <Ionicons name="share-social" size={18} color="#4CAF82" />
                  <Text style={[dm.actTxt, { color: '#4CAF82' }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[dm.actBtn, { backgroundColor: '#EF444422' }]}>
                  <Ionicons name="remove-circle" size={18} color="#EF4444" />
                  <Text style={[dm.actTxt, { color: '#EF4444' }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ZoneEditorModal
        visible={zoneEditorVisible}
        existingZone={zone}
        colors={colors}
        isDark={isDark}
        onSave={(zoneData) => {
          onSetZone(tracker.id, zoneData);
          setZoneEditorVisible(false);
        }}
        onCancel={() => setZoneEditorVisible(false)}
      />
    </>
  );
}

const dm = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_H * 0.92, paddingTop: 12 },
  handle:        { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 12 },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 14 },
  bigIcon:       { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  trackerName:   { fontSize: 18, fontWeight: '700' },
  statusChip:    { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  statusChipTxt: { fontSize: 11, fontWeight: '700' },
  closeBtn:      { padding: 4 },
  scroll:        { paddingHorizontal: 20, paddingBottom: 48, gap: 10 },
  infoCard:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  infoLabel:     { fontSize: 11, marginBottom: 3 },
  infoVal:       { fontSize: 14, fontWeight: '600' },
  infoTime:      { fontSize: 11 },
  sectionLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  zoneChipRow:   { flexDirection: 'row', gap: 6 },
  chip:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipTxt:       { fontSize: 11, fontWeight: '600' },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  explainer:     { fontSize: 11, flex: 1 },
  zoneBtns:      { flexDirection: 'row', gap: 8 },
  zoneBtn:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  setZoneBtn:    { backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  setZoneTxt:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  histRow:       { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  histDot:       { width: 8, height: 8, borderRadius: 4 },
  histTime:      { fontSize: 11, minWidth: 60 },
  histPlace:     { fontSize: 13, flex: 1 },
  actRow:        { flexDirection: 'row', gap: 10, marginTop: 4 },
  actBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  actTxt:        { color: '#fff', fontWeight: '700', fontSize: 13 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrackingScreen() {
  const { colors, isDark } = useTheme();

  const [activeTab,       setActiveTab]       = useState(0);
  const [zones,           setZones]           = useState(INITIAL_ZONES);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [detailTracker,   setDetailTracker]   = useState(null);
  const [detailVisible,   setDetailVisible]   = useState(false);
  const [ringing,         setRinging]         = useState(null);
  const [alerts,          setAlerts]          = useState(INITIAL_ALERTS);
  const [alertSettings,   setAlertSettings]   = useState({
    leftBehind:      true,
    lowBattery:      true,
    zoneEntry:       true,
    zoneExit:        true,
    unknownTrackers: false,
  });


  const nearby = TRACKERS.filter(t => t.status === 'nearby');
  const away   = TRACKERS.filter(t => t.status === 'away');

  const openDetail = useCallback((tracker) => {
    setDetailTracker(tracker);
    setDetailVisible(true);
  }, []);

  const handleSetZone = useCallback((trackerId, zoneData) => {
    setZones(prev => ({ ...prev, [trackerId]: zoneData }));
  }, []);

  const handleRemoveZone = useCallback((trackerId) => {
    setZones(prev => { const n = { ...prev }; delete n[trackerId]; return n; });
  }, []);


  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));

  const toggleSetting = (key) => setAlertSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const bg = isDark ? colors.background : '#F7F4FF';

  // ── Tab Bar ─────────────────────────────────────────────────────────────────

  const renderTabBar = () => (
    <View style={[tabs.bar, { backgroundColor: isDark ? '#1A1A2E' : '#fff', borderBottomColor: colors.border }]}>
      {TABS.map((t, i) => (
        <TouchableOpacity key={t} onPress={() => setActiveTab(i)} style={tabs.tab} activeOpacity={0.75}>
          <Text style={[tabs.tabTxt, { color: i === activeTab ? ACCENT : colors.textSecondary }]}>{t}</Text>
          {i === activeTab && <View style={tabs.underline} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Tab 1: Trackers ─────────────────────────────────────────────────────────

  const renderTrackers = () => {
    const lowBatt = TRACKERS.filter(t => t.battery < 20).length;
    const stats = [
      { label: 'Total',    value: TRACKERS.length, color: ACCENT    },
      { label: 'Nearby',   value: nearby.length,   color: '#4CAF82' },
      { label: 'Away',     value: away.length,      color: '#EF4444' },
      { label: 'Low Batt', value: lowBatt,          color: '#FFB347' },
    ];
    return (
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.statsRow}>
          {stats.map(st => (
            <GlassCard key={st.label} style={s.statCard}>
              <Text style={[s.statNum, { color: st.color }]}>{st.value}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>{st.label}</Text>
            </GlassCard>
          ))}
        </View>

        <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>NEARBY</Text>
        {nearby.map(t => (
          <TrackerCard key={t.id} tracker={t} ringing={ringing} colors={colors}
            onPress={() => openDetail(t)} onFind={setRinging} />
        ))}

        <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>AWAY</Text>
        {away.map(t => (
          <TrackerCard key={t.id} tracker={t} ringing={ringing} colors={colors}
            onPress={() => openDetail(t)} onFind={setRinging} />
        ))}

        <TouchableOpacity style={[s.addBtn, { borderColor: ACCENT }]}
          onPress={() => Alert.alert('Add Tracker', 'Pair a new tracker device.')}>
          <Ionicons name="add-circle-outline" size={20} color={ACCENT} />
          <Text style={[s.addTxt, { color: ACCENT }]}>Add New Tracker</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ── Tab 2: Map ──────────────────────────────────────────────────────────────

  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPress') {
        const tracker = TRACKERS.find(t => t.id === data.trackerId);
        if (tracker) setSelectedTracker(tracker);
      }
    } catch (_) {}
  }, []);

  const mapHTML = buildMapHTML(TRACKERS, zones, isDark);

  const renderMap = () => (
    <View style={{ flex: 1 }}>
      <WebView
        key={JSON.stringify(zones) + isDark}
        source={{ html: mapHTML }}
        style={{ flex: 1 }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        originWhitelist={['*', 'http://*', 'https://*']}
        scrollEnabled={false}
        mixedContentMode="always"
      />

      {/* Bottom info card when a marker is tapped */}
      {selectedTracker && (
        <View style={[mp.infoCard, { backgroundColor: isDark ? '#1A1A2E' : '#fff' }]}>
          <View style={[mp.infoIcon, { backgroundColor: selectedTracker.color + '22' }]}>
            <Ionicons name={selectedTracker.icon} size={20} color={selectedTracker.color} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[mp.infoName, { color: colors.textPrimary }]}>{selectedTracker.name}</Text>
            <Text style={[mp.infoLoc,  { color: colors.textSecondary }]}>{selectedTracker.lastSeen}</Text>
            <BatteryBar battery={selectedTracker.battery} />
          </View>
          <TouchableOpacity onPress={() => openDetail(selectedTracker)} style={mp.detailBtn}>
            <Text style={mp.detailTxt}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedTracker(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Legend strip when nothing is selected */}
      {!selectedTracker && (
        <View style={[mp.legend, { backgroundColor: isDark ? '#1A1A2E' : '#fff' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mp.legendInner}>
            {TRACKERS.map(t => (
              <TouchableOpacity key={t.id} onPress={() => setSelectedTracker(t)} style={mp.legendItem}>
                <View style={[mp.legendDot, { backgroundColor: t.color }]} />
                <Text style={[mp.legendName, { color: colors.textPrimary }]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // ── Tab 3: Zones ────────────────────────────────────────────────────────────

  const renderZones = () => {
    const zoneEntries = Object.entries(zones);
    const alertTypeLabel = { enter: 'Enter', leave: 'Leave', both: 'Both' };
    return (
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>ACTIVE ZONES</Text>

        {zoneEntries.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="shield-outline" size={52} color={colors.textSecondary} />
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No Zones Configured</Text>
            <Text style={[s.emptySub, { color: colors.textSecondary }]}>Add a safe zone to receive entry and exit alerts.</Text>
          </View>
        )}

        {zoneEntries.map(([tid, z]) => {
          const tracker = TRACKERS.find(t => t.id === tid);
          if (!tracker) return null;
          const locLabel = PRESET_LOCATIONS.find(l => l.id === z.locationId)?.label ?? '';
          return (
            <GlassCard key={tid} style={zn.row}>
              <View style={[zn.pin, { backgroundColor: tracker.color + '22' }]}>
                <Ionicons name="location" size={20} color={tracker.color} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[zn.zoneName, { color: colors.textPrimary }]}>{z.name}</Text>
                <Text style={[zn.zoneAddr, { color: colors.textSecondary }]}>{locLabel}</Text>
                <View style={zn.pillRow}>
                  <View style={[zn.pill, { backgroundColor: '#4CAF8222' }]}>
                    <Text style={[zn.pillTxt, { color: '#4CAF82' }]}>{z.radius >= 1000 ? `${z.radius / 1000}km` : `${z.radius}m`}</Text>
                  </View>
                  <View style={[zn.dot, { backgroundColor: tracker.color }]} />
                  <Text style={[zn.trackerAssigned, { color: colors.textSecondary }]}>{tracker.name}</Text>
                </View>
              </View>
              <View style={zn.actions}>
                <View style={[zn.alertChip, { backgroundColor: ACCENT + '22' }]}>
                  <Text style={[zn.alertChipTxt, { color: ACCENT }]}>{alertTypeLabel[z.alertType]}</Text>
                </View>
                <TouchableOpacity onPress={() => openDetail(tracker)} style={[zn.iconBtn, { backgroundColor: ACCENT + '18' }]}>
                  <Ionicons name="pencil" size={14} color={ACCENT} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveZone(tid)} style={[zn.iconBtn, { backgroundColor: '#EF444422' }]}>
                  <Ionicons name="trash" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </GlassCard>
          );
        })}

        <TouchableOpacity style={[s.addBtn, { borderColor: ACCENT }]}
          onPress={() => Alert.alert('Add Zone', 'Open a tracker detail to configure a new zone.')}>
          <Ionicons name="add-circle-outline" size={20} color={ACCENT} />
          <Text style={[s.addTxt, { color: ACCENT }]}>Add Zone</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ── Tab 4: Alerts ────────────────────────────────────────────────────────────

  const renderAlerts = () => {
    const unread = alerts.filter(a => !a.read).length;
    const today  = alerts.filter(a => !a.time.includes('Yesterday')).length;
    const week   = alerts.length;

    const SETTINGS_LIST = [
      { key: 'leftBehind',      icon: 'bag-remove',   label: 'Left Behind',       desc: 'Alert when a tracker is stationary too long' },
      { key: 'lowBattery',      icon: 'battery-dead', label: 'Low Battery',       desc: 'Alert when battery drops below 20%' },
      { key: 'zoneEntry',       icon: 'enter',        label: 'Zone Entry',        desc: 'Alert when a tracker enters a safe zone' },
      { key: 'zoneExit',        icon: 'exit',         label: 'Zone Exit',         desc: 'Alert when a tracker leaves a safe zone' },
      { key: 'unknownTrackers', icon: 'help-circle',  label: 'Unknown Trackers',  desc: 'Alert when an unknown tracker is detected' },
    ];

    return (
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={al.summaryRow}>
          {[
            { label: 'Today',  value: today,  color: ACCENT    },
            { label: 'Week',   value: week,   color: '#4CAF82' },
            { label: 'Unread', value: unread, color: '#EF4444' },
          ].map(st => (
            <GlassCard key={st.label} style={al.summaryCard}>
              <Text style={[al.summaryNum, { color: st.color }]}>{st.value}</Text>
              <Text style={[al.summaryLabel, { color: colors.textSecondary }]}>{st.label}</Text>
            </GlassCard>
          ))}
        </View>

        <View style={al.listHeader}>
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>RECENT ALERTS</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={[al.markAllTxt, { color: ACCENT }]}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {alerts.map(a => (
          <GlassCard key={a.id} style={al.alertRow}>
            <View style={[al.alertIcon, { backgroundColor: a.color + '22' }]}>
              <Ionicons name={a.icon} size={18} color={a.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[al.alertTitle, { color: colors.textPrimary }]}>{a.title}</Text>
              <Text style={[al.alertBody, { color: colors.textSecondary }]}>{a.body}</Text>
              <Text style={[al.alertTime, { color: colors.textSecondary }]}>{a.time}</Text>
            </View>
            {!a.read && <View style={al.unreadDot} />}
          </GlassCard>
        ))}

        <Text style={[s.sectionLabel, { color: colors.textSecondary, marginTop: 8 }]}>ALERT SETTINGS</Text>
        {SETTINGS_LIST.map(setting => (
          <GlassCard key={setting.key} style={al.settingRow}>
            <View style={[al.settingIcon, { backgroundColor: ACCENT + '18' }]}>
              <Ionicons name={setting.icon} size={18} color={ACCENT} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[al.settingLabel, { color: colors.textPrimary }]}>{setting.label}</Text>
              <Text style={[al.settingDesc, { color: colors.textSecondary }]}>{setting.desc}</Text>
            </View>
            <Switch
              value={alertSettings[setting.key]}
              onValueChange={() => toggleSetting(setting.key)}
              trackColor={{ false: colors.border, true: ACCENT + '60' }}
              thumbColor={alertSettings[setting.key] ? ACCENT : '#ccc'}
            />
          </GlassCard>
        ))}
      </ScrollView>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {renderTabBar()}
      {activeTab === 0 && renderTrackers()}
      {activeTab === 1 && renderMap()}
      {activeTab === 2 && renderZones()}
      {activeTab === 3 && renderAlerts()}

      <TrackerDetailModal
        visible={detailVisible}
        tracker={detailTracker}
        zones={zones}
        colors={colors}
        isDark={isDark}
        onClose={() => setDetailVisible(false)}
        onFindPress={setRinging}
        onSetZone={handleSetZone}
        onRemoveZone={handleRemoveZone}
      />
    </View>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:         { flex: 1 },
  content:      { padding: 16, paddingBottom: 48, gap: 0 },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard:     { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
  statNum:      { fontSize: 22, fontWeight: '800' },
  statLabel:    { fontSize: 10, fontWeight: '600', marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginTop: 2 },
  addBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, marginTop: 10 },
  addTxt:       { fontSize: 14, fontWeight: '600' },
  emptyState:   { alignItems: 'center', paddingVertical: 52, gap: 10 },
  emptyTitle:   { fontSize: 16, fontWeight: '700' },
  emptySub:     { fontSize: 13, textAlign: 'center', maxWidth: 260 },
});

const tabs = StyleSheet.create({
  bar:       { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab:       { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabTxt:    { fontSize: 13, fontWeight: '600' },
  underline: { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, backgroundColor: ACCENT, borderRadius: 1 },
});

const mp = StyleSheet.create({
  marker:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  callout:     { padding: 10, minWidth: 140 },
  calloutName: { fontWeight: '700', fontSize: 13 },
  calloutSub:  { fontSize: 11, color: '#666', marginTop: 2 },
  calloutBatt: { fontSize: 11, color: '#666', marginTop: 2 },
  infoCard:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center',
                 gap: 12, padding: 16, paddingBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
                 shadowOpacity: 0.12, shadowRadius: 10, elevation: 8 },
  infoIcon:    { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  infoName:    { fontSize: 14, fontWeight: '700' },
  infoLoc:     { fontSize: 11 },
  detailBtn:   { backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  detailTxt:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  legend:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 10, paddingBottom: 22,
                 shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 6 },
  legendInner: { paddingHorizontal: 16 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 16 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendName:  { fontSize: 12, fontWeight: '500' },
});

const zn = StyleSheet.create({
  row:             { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 10 },
  pin:             { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  zoneName:        { fontSize: 14, fontWeight: '700' },
  zoneAddr:        { fontSize: 11 },
  pillRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill:            { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  pillTxt:         { fontSize: 10, fontWeight: '600' },
  dot:             { width: 7, height: 7, borderRadius: 3.5 },
  trackerAssigned: { fontSize: 11 },
  actions:         { alignItems: 'center', gap: 6 },
  alertChip:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  alertChipTxt:    { fontSize: 10, fontWeight: '700' },
  iconBtn:         { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

const al = StyleSheet.create({
  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 18 },
  summaryCard:  { flex: 1, alignItems: 'center', paddingVertical: 14 },
  summaryNum:   { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  listHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  markAllTxt:   { fontSize: 12, fontWeight: '600' },
  alertRow:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 10 },
  alertIcon:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  alertTitle:   { fontSize: 13, fontWeight: '700' },
  alertBody:    { fontSize: 12 },
  alertTime:    { fontSize: 10 },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  settingRow:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 10 },
  settingIcon:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingDesc:  { fontSize: 11 },
});
