/**
 * Email Header Parser
 * Extracts names and emails from email headers (To:, Cc:, From: fields)
 */

export interface ParsedContact {
  name: string | null
  email: string
  raw: string // Original format from email header
}

/**
 * Parse email header field (To:, Cc:, From:) and extract contacts
 * Handles formats like:
 * - "John Doe <john@example.com>"
 * - "Doe, John <john@example.com>"
 * - "john@example.com"
 * - Multiple contacts separated by semicolons
 */
export function parseEmailHeader(headerValue: string): ParsedContact[] {
  if (!headerValue || headerValue.trim() === '') {
    return []
  }

  const contacts: ParsedContact[] = []
  
  // Split by semicolon (handles multiple recipients)
  const parts = headerValue.split(';').map(p => p.trim()).filter(p => p)
  
  for (const part of parts) {
    const contact = parseSingleContact(part)
    if (contact) {
      contacts.push(contact)
    }
  }
  
  return contacts
}

/**
 * Parse a single contact from email header format
 */
function parseSingleContact(contactString: string): ParsedContact | null {
  if (!contactString || contactString.trim() === '') {
    return null
  }

  // Pattern 1: "Name <email@domain.com>"
  const nameEmailPattern = /^(.+?)\s*<([^>]+)>$/
      const match1 = contactString.match(nameEmailPattern)
  
  if (match1 && match1[1] && match1[2]) {
    const name = cleanName(match1[1].trim())
    const email = match1[2].trim().toLowerCase()
    
    if (isValidEmail(email)) {
      return {
        name: name || null,
        email,
        raw: contactString
      }
    }
  }

  // Pattern 2: Just email address
  const emailOnlyPattern = /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/
  const match2 = contactString.match(emailOnlyPattern)
  
  if (match2 && match2[1]) {
    const email = match2[1].toLowerCase()
    return {
      name: null,
      email,
      raw: contactString
    }
  }

  // Pattern 3: "Last, First <email>" (comma-separated name)
  const lastNameFirstPattern = /^([^,]+),\s*(.+?)\s*<([^>]+)>$/
  const match3 = contactString.match(lastNameFirstPattern)
  
  if (match3 && match3[1] && match3[2] && match3[3]) {
    const lastName = match3[1].trim()
    const firstName = match3[2].trim()
    const email = match3[3].trim().toLowerCase()
    
    if (isValidEmail(email)) {
      return {
        name: `${firstName} ${lastName}`,
        email,
        raw: contactString
      }
    }
  }

  return null
}

/**
 * Clean and normalize name (remove quotes, extra spaces)
 */
function cleanName(name: string): string {
  return name
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

/**
 * Parse full email header text (includes From:, To:, Cc:, Subject: lines)
 * Returns all contacts from To: and Cc: fields
 */
export function parseFullEmailHeader(emailHeader: string): {
  from: ParsedContact | null
  to: ParsedContact[]
  cc: ParsedContact[]
  subject: string | null
} {
  const lines = emailHeader.split('\n').map(l => l.trim())
  
  const result: {
    from: ParsedContact | null
    to: ParsedContact[]
    cc: ParsedContact[]
    subject: string | null
  } = {
    from: null,
    to: [],
    cc: [],
    subject: null
  }
  
  let currentField: 'from' | 'to' | 'cc' | 'subject' | null = null
  let currentValue = ''
  
  for (const line of lines) {
    // Check if this is a new field
    if (line.match(/^From:/i)) {
      // Save previous field if any
      if (currentField && currentValue) {
        saveField(currentField, currentValue, result)
      }
      currentField = 'from'
      currentValue = line.replace(/^From:\s*/i, '')
    } else if (line.match(/^To:/i)) {
      if (currentField && currentValue) {
        saveField(currentField, currentValue, result)
      }
      currentField = 'to'
      currentValue = line.replace(/^To:\s*/i, '')
    } else if (line.match(/^Cc:/i)) {
      if (currentField && currentValue) {
        saveField(currentField, currentValue, result)
      }
      currentField = 'cc'
      currentValue = line.replace(/^Cc:\s*/i, '')
    } else if (line.match(/^Subject:/i)) {
      if (currentField && currentValue) {
        saveField(currentField, currentValue, result)
      }
      currentField = 'subject'
      currentValue = line.replace(/^Subject:\s*/i, '')
    } else if (currentField && line.length > 0) {
      // Continuation of previous field (folded header)
      currentValue += ' ' + line
    }
  }
  
  // Save last field
  if (currentField && currentValue) {
    saveField(currentField, currentValue, result)
  }
  
  return result
}

function saveField(
  field: 'from' | 'to' | 'cc' | 'subject',
  value: string,
  result: { from: ParsedContact | null; to: ParsedContact[]; cc: ParsedContact[]; subject: string | null }
) {
  switch (field) {
    case 'from': {
      const fromContacts = parseEmailHeader(value)
      result.from = fromContacts[0] || null
      break
    }
    case 'to':
      result.to.push(...parseEmailHeader(value))
      break
    case 'cc':
      result.cc.push(...parseEmailHeader(value))
      break
    case 'subject':
      result.subject = value.trim() || null
      break
  }
}

/**
 * Extract all unique contacts from email header (combines To: and Cc:, excludes From:)
 */
export function extractAllContacts(emailHeader: string): ParsedContact[] {
  const parsed = parseFullEmailHeader(emailHeader)
  const allContacts = [...parsed.to, ...parsed.cc]
  
  // Remove duplicates by email
  const uniqueContacts = new Map<string, ParsedContact>()
  for (const contact of allContacts) {
    if (!uniqueContacts.has(contact.email)) {
      uniqueContacts.set(contact.email, contact)
    }
  }
  
  return Array.from(uniqueContacts.values())
}

