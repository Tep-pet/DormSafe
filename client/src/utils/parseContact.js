/**
 * Extract owner contact from property description when contact_name/phone columns are empty.
 * Matches patterns like "Contact: Rhea Palima, 09324863102" or "Contact/Owner: ..."
 */
export function parseContactFromDescription(description) {
  if (!description) return { contactName: null, contactPhone: null };

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
    };
  }

  const phoneOnly = description.match(/\b(09\d{9})\b/);
  return {
    contactName: null,
    contactPhone: phoneOnly ? phoneOnly[1] : null,
  };
}

export function resolvePropertyContact(property) {
  if (!property) return { contactName: null, contactPhone: null };

  const name = property.contact_name || null;
  const phone = property.contact_phone || null;
  if (name || phone) {
    return { contactName: name, contactPhone: phone };
  }

  return parseContactFromDescription(property.description);
}
