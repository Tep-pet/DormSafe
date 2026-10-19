/**
 * Extract owner contact from property description when contact_name/phone/email columns are empty.
 * Matches patterns like "Contact: Rhea Palima, 09324863102", "Email: ...", or inline emails.
 */
export const KNOWN_DORM_CONTACTS = {
  'ivory residences room 2004': { email: 'rheapalima09@gmail.com', name: 'Rhea Palima' },
  'ivory 2004': { email: 'rheapalima09@gmail.com', name: 'Rhea Palima' },
  'ivory residences room 1104': { email: 'blancotwinkle@gmail.com', name: 'Twinkle Blanco' },
  'ivory 1104': { email: 'blancotwinkle@gmail.com', name: 'Twinkle Blanco' },
  'brc dormitory': { email: 'buildingblocks_davao@yahoo.com.ph', name: 'Trisha Paula Gwatwo' },
  'juan luna boarding house': { email: 'jerlyugapay@gmail.com', name: 'Jerly Ugapay' },
  'juna boarding house': { email: 'jerlyugapay@gmail.com', name: 'Jerly Ugapay' },
  'correla dormitory': { email: 'w.macguilles@yahoo.com', name: 'Williamor Corpuz' },
  'residencia de maria': { email: 'andayamay111@gmail.com', name: 'May Andaya' },
  'residencia de maria goretti': { email: 'andayamay111@gmail.com', name: 'May Andaya' },
  'residencia': { email: 'andayamay111@gmail.com', name: 'May Andaya' },
};

export function parseContactFromDescription(description) {
  if (!description) return { contactName: null, contactPhone: null, contactEmail: null };

  let email = null;
  const emailLine = description.match(/Email:\s*([^\s,]+)/i);
  if (emailLine) {
    email = emailLine[1].trim();
  } else {
    const emailMatch = description.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
    if (emailMatch) {
      email = emailMatch[1].trim();
    }
  }

  const contactLine = description.match(
    /Contact(?:\/Owner)?:\s*([^\n.]+)/i
  );
  if (contactLine) {
    const rest = contactLine[1].trim();
    const phoneMatch = rest.match(/(09\d{9}|\+\d[\d\s-]{8,})/);
    const phone = phoneMatch ? phoneMatch[1].replace(/\s/g, '') : null;
    let name = rest;
    if (phone) {
      name = rest.replace(phoneMatch[0], '').replace(/,\s*$/, '').trim();
    }
    return {
      contactName: name || null,
      contactPhone: phone,
      contactEmail: email,
    };
  }

  const phoneOnly = description.match(/\b(09\d{9})\b/);
  return {
    contactName: null,
    contactPhone: phoneOnly ? phoneOnly[1] : null,
    contactEmail: email,
  };
}

export function resolvePropertyContact(property) {
  if (!property) return { contactName: null, contactPhone: null, contactEmail: null };

  const parsed = parseContactFromDescription(property.description);
  let name =
    property.contact_name ||
    property.contactName ||
    property.owner_name ||
    property.ownerName ||
    parsed.contactName ||
    null;
  const phone =
    property.contact_phone ||
    property.contactPhone ||
    parsed.contactPhone ||
    null;
  let email =
    property.contact_email ||
    property.contactEmail ||
    property.owner_email ||
    property.ownerEmail ||
    parsed.contactEmail ||
    null;

  const rawName = (property.name || property.propertyName || property.title || '').trim().toLowerCase();
  for (const [key, val] of Object.entries(KNOWN_DORM_CONTACTS)) {
    if (rawName.includes(key)) {
      if (!email && val.email) email = val.email;
      if (!name || name === 'BRC Dormitory' || name === 'Gigi' || name === 'Property Manager' || name === 'Property Owner') {
        name = val.name;
      }
      break;
    }
  }

  return {
    contactName: name,
    contactPhone: phone,
    contactEmail: email,
  };
}
