export const TECHNICAL_REQUEST_STATUS = Object.freeze({
  Submitted: 'Submitted',
  Seen: 'Seen',
  Approved: 'Approved',
  InProgress: 'In progress',
  Rejected: 'Rejected',
  Completed: 'Completed',
});

export const TECHNICAL_REQUEST_SUBSTATUS = Object.freeze({
  MoreInfo: 'More information request',
  AlternateSuggestions: 'Alternative Suggestion',
  DelayRequest: 'Delayed Fulfillment Notice',
  Other: 'Other',
});

export const IN_PROGRESS_SUBSTATUS_OPTIONS = [
  {
    value: TECHNICAL_REQUEST_SUBSTATUS.AlternateSuggestions,
    label: 'Alternative Suggestion',
    labelGu: 'વિકલ્પ સૂચન',
    description: 'Suggest an alternate item or approach to the member.',
  },
  {
    value: TECHNICAL_REQUEST_SUBSTATUS.DelayRequest,
    label: 'Delayed Fulfillment Notice',
    labelGu: 'વિલંબ સૂચના',
    description: 'Inform the member that fulfillment will be delayed.',
  },
  {
    value: TECHNICAL_REQUEST_SUBSTATUS.Other,
    label: 'Other',
    labelGu: 'અન્ય',
    description: 'Any other in-progress reason — add a note explaining.',
    requiresNote: true,
  },
];

export function normalizeTechnicalStatus(status) {
  if (!status) return TECHNICAL_REQUEST_STATUS.Submitted;
  const s = String(status).trim().toLowerCase();

  if (s === 'in progress' || s === 'in-progress' || s === 'inprogress') return TECHNICAL_REQUEST_STATUS.InProgress;
  if (s === 'submitted') return TECHNICAL_REQUEST_STATUS.Submitted;
  if (s === 'seen') return TECHNICAL_REQUEST_STATUS.Seen;
  if (s === 'approved') return TECHNICAL_REQUEST_STATUS.Approved;
  if (s === 'rejected') return TECHNICAL_REQUEST_STATUS.Rejected;
  if (s === 'completed') return TECHNICAL_REQUEST_STATUS.Completed;

  // Fallback to original value (keeps backward compatibility)
  return status;
}

