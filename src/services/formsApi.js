/** Forms a co-operative designs and sends to its farmers (contract "Forms", G31). */
import { serviceCall, query } from './serviceClient';

const id = (v) => encodeURIComponent(v);

export const fetchForms = () => serviceCall('/forms');
export const fetchForm = (formId) => serviceCall(`/forms/${id(formId)}`);
export const createForm = (form) => serviceCall('/forms', { method: 'POST', body: form });
export const saveForm = (formId, form) => serviceCall(`/forms/${id(formId)}`, { method: 'PUT', body: form });
export const deleteForm = (formId) => serviceCall(`/forms/${id(formId)}`, { method: 'DELETE' });

export const fetchLinks = (formId) => serviceCall(`/forms/${id(formId)}/links`);
export const createLink = (formId, link) => serviceCall(`/forms/${id(formId)}/links`, { method: 'POST', body: link });
export const updateLink = (linkId, link) => serviceCall(`/forms/links/${id(linkId)}`, { method: 'PATCH', body: link });

export const fetchSubmissions = (formId, params) => serviceCall(`/forms/${id(formId)}/submissions${query(params)}`);
export const reviewSubmission = (submissionId, action, note = '') =>
  serviceCall(`/forms/submissions/${id(submissionId)}/${action}`, { method: 'POST', body: { note } });

// Public (no account): the farmer's phone.
export const fetchPublicForm = (token) => serviceCall(`/public/forms/${id(token)}`, { auth: false });
export const submitPublicForm = (token, form) => serviceCall(`/public/forms/${id(token)}/submissions`, { method: 'POST', form, auth: false });
