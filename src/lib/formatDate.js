export function formatDate(dateInput) {
  if (!dateInput) return '—';
  
  let date;
  if (typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—';

  let date;
  if (typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return '—';

  const datePart = formatDate(date);
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const formattedTime = `${hours}:${minutes} ${ampm}`;

  return `${datePart} ${formattedTime}`;
}
