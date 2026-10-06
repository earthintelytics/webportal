/** Smallholder groups, members and parcels (contract "Smallholder", G30). */
import { serviceCall, query } from './serviceClient';

export const fetchGroups = () => serviceCall('/smallholder/groups');
export const fetchMembers = (params) => serviceCall(`/smallholder/members${query(params)}`);
export const updateMember = (id, member) => serviceCall(`/smallholder/members/${encodeURIComponent(id)}`, { method: 'PATCH', body: member });

export const fetchParcels = (params) => serviceCall(`/smallholder/parcels${query({ format: 'geojson', ...params })}`);

export const fetchCarbonSummary = (params) => serviceCall(`/smallholder/carbon-summary${query(params)}`);

