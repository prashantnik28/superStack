import { create } from 'zustand';
import api from '../lib/api';

export const useTrackingStore = create((set) => ({
  familyLocations: [],
  trackers: [],
  geoZones: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    const [locRes, trackerRes, zoneRes] = await Promise.allSettled([
      api.get('/tracking/family-locations'),
      api.get('/tracking/trackers'),
      api.get('/tracking/geo-zones'),
    ]);
    set({
      familyLocations: locRes.status === 'fulfilled' ? (locRes.value.data.data || []) : [],
      trackers:        trackerRes.status === 'fulfilled' ? (trackerRes.value.data.data || []) : [],
      geoZones:        zoneRes.status === 'fulfilled' ? (zoneRes.value.data.data || []) : [],
      loading:         false,
    });
  },

  updateMyLocation: async (lat, lng, accuracy) => {
    try {
      await api.post('/tracking/location', { latitude: lat, longitude: lng, accuracy });
    } catch {}
  },

  createTracker: async (dto) => {
    const { data } = await api.post('/tracking/trackers', dto);
    set((s) => ({ trackers: [...s.trackers, data.data] }));
    return data.data;
  },

  updateTracker: async (id, dto) => {
    const { data } = await api.patch(`/tracking/trackers/${id}`, dto);
    set((s) => ({ trackers: s.trackers.map((t) => (t._id === id ? data.data : t)) }));
  },

  deleteTracker: async (id) => {
    set((s) => ({ trackers: s.trackers.filter((t) => t._id !== id) }));
    try { await api.delete(`/tracking/trackers/${id}`); } catch {}
  },

  createGeoZone: async (dto) => {
    const { data } = await api.post('/tracking/geo-zones', dto);
    set((s) => ({ geoZones: [...s.geoZones, data.data] }));
    return data.data;
  },

  deleteGeoZone: async (id) => {
    set((s) => ({ geoZones: s.geoZones.filter((z) => z._id !== id) }));
    try { await api.delete(`/tracking/geo-zones/${id}`); } catch {}
  },

  updateZoneAssignments: async (zoneId, assignments) => {
    const { data } = await api.patch(`/tracking/geo-zones/${zoneId}/assignments`, { assignments });
    set((s) => ({ geoZones: s.geoZones.map((z) => (z._id === zoneId ? data.data : z)) }));
    return data.data;
  },

  updateGeoZone: async (id, dto) => {
    const { data } = await api.patch(`/tracking/geo-zones/${id}`, dto);
    set((s) => ({ geoZones: s.geoZones.map((z) => (z._id === id ? data.data : z)) }));
    return data.data;
  },

  simulateMemberLocation: async (targetUserId, latitude, longitude) => {
    await api.post('/tracking/test/simulate-location', { targetUserId, latitude, longitude });
  },
}));
