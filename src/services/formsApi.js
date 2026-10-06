/** Forms a co-operative designs and sends to its farmers (contract "Forms", G31). */
import { serviceCall, query } from './serviceClient';

const id = (v) => encodeURIComponent(v);

export const fetchForms = () => serviceCall('/forms');
export const createForm = (form) => serviceCall('/forms', { method: 'POST', body: form });
export const saveForm = (formId, form) => serviceCall(`/forms/${id(formId)}`, { method: 'PUT', body: form });
export const fetchLinks = (formId) => serviceCall(`/forms/${id(formId)}/links`);
export const createLink = (formId, link) => serviceCall(`/forms/${id(formId)}/links`, { method: 'POST', body: link });
export const updateLink = (linkId, link) => serviceCall(`/forms/links/${id(linkId)}`, { method: 'PATCH', body: link });

// Staff entry inside the portal (e.g. Add member): same body as a public answer, saved as approved.
export const addEntry = (formId, form) => serviceCall(`/forms/${id(formId)}/entries`, { method: 'POST', form });

export const fetchSubmissions = (formId, params) => serviceCall(`/forms/${id(formId)}/submissions${query(params)}`);
export const reviewSubmission = (submissionId, action, note = '') =>
  serviceCall(`/forms/submissions/${id(submissionId)}/${action}`, { method: 'POST', body: { note } });

// Public (no account): the farmer's phone.
export const fetchPublicForm = (token) => serviceCall(`/public/forms/${id(token)}`, { auth: false });
export const submitPublicForm = (token, form) => serviceCall(`/public/forms/${id(token)}/submissions`, { method: 'POST', form, auth: false });
