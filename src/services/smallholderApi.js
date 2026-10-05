/** Smallholder groups, members and parcels (contract "Smallholder", G30). */
import { serviceCall, query } from './serviceClient';

export const fetchGroups = () => serviceCall('/smallholder/groups');
export const createGroup = (group) => serviceCall('/smallholder/groups', { method: 'POST', body: group });

export const fetchMembers = (params) => serviceCall(`/smallholder/members${query(params)}`);
export const fetchMember = (id) => serviceCall(`/smallholder/members/${encodeURIComponent(id)}`);
export const createMember = (member) => serviceCall('/smallholder/members', { method: 'POST', body: member });
export const updateMember = (id, member) => serviceCall(`/smallholder/members/${encodeURIComponent(id)}`, { method: 'PATCH', body: member });

export const fetchParcels = (params) => serviceCall(`/smallholder/parcels${query({ format: 'geojson', ...params })}`);
export const createParcel = (parcel) => serviceCall('/smallholder/parcels', { method: 'POST', body: parcel });

export const fetchCarbonSummary = (params) => serviceCall(`/smallholder/carbon-summary${query(params)}`);

/** Boundary files the browser cannot read (KML, KMZ, zipped shapefile) go to the backend as they are. */
export const uploadParcelFile = (memberId, file, extra = {}) => {
  const form = new FormData();
  form.append('member_id', memberId);
  form.append('file', file);
  Object.entries(extra).forEach(([k, v]) => v != null && v !== '' && form.append(k, v));
  return serviceCall('/smallholder/parcels', { method: 'POST', form });
};
