/**
 * Consent for farmer personal data (Nigeria Data Protection Act 2023): shown
 * before every form is sent and stored with the answers (G45).
 */
export const consentText = (org) => `I agree that ${org || 'this organisation'} keeps the information and photos in this form to register me and my farm, check my land, and give me advice. It is not sold or shared with others without my permission. I can ask ${org || 'the organisation'} to show me or delete my information at any time.`;

// Built only once the person has ticked the box; the server requires agreed: true.
export const consentRecord = (org, by = 'farmer') => ({ agreed: true, text: consentText(org), accepted_at: new Date().toISOString(), by });
