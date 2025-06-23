
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a US number (10 or 11 digits)
  if (cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Format as +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // For international numbers or unknown formats, return as is with + prefix if missing
  return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
};

export const normalizePhoneNumber = (phoneNumber: string): string => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if missing (assume US)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Return as is if already formatted or international
  return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Valid US phone number (10 digits) or with country code (11 digits starting with 1)
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
};
