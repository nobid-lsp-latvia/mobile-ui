// SPDX-License-Identifier: EUPL-1.2

export function getDocType(type) {
  switch (type) {
    case 'PID':
      return 'pid';
    case 'mDL':
      return 'mdl';
    case 'Diploma':
      return 'diploma';
    case 'eSign':
      return 'esign';
    case 'eSeal':
      return 'eseal';
    case 'IBAN':
      return 'payment';
    default:
      return 'other';
  }
}

export function getDocTypeIcon(type) {
  switch (type) {
    case 'pid':
      return { icon: 'passport', iconSet: 'brand' };
    case 'mdl':
      return { icon: 'driving-license', iconSet: 'phosphor' };
    case 'diploma':
      return { icon: 'diploma', iconSet: 'phosphor' };
    case 'esign':
      return { icon: 'sign', iconSet: 'phosphor' };
    case 'eseal':
      return { icon: 'seal', iconSet: 'phosphor' };
    case 'payment':
      return { icon: 'money', iconSet: 'phosphor' };
    case 'iban':
      return { icon: 'money', iconSet: 'phosphor' };
    default:
      return { icon: 'id', iconSet: 'cds' };
  }
}

export function getDataType(detailIdentifier) {
  // add all the other identifiers here
  switch (detailIdentifier) {
    case 'citizenship_country_code':
    case 'awarding_body_country_code':
    case 'issuing_country_code':
    case 'issuing_country':
    case 'birth_country':
    case 'nationality':
    case 'awardingBody_countryCode':
    case 'citizenshipCountryCode':
      return 'country';
    case 'issuance_date':
    case 'issue_date':
    case 'expiry_date':
    case 'valid_from':
    case 'birth_date':
    case 'issuanceDate':
    case 'validFrom':
    case 'issued':
    case 'expiresOn':
    case 'issuedOn':
    case 'iat':
    case 'exp':
    case 'nbf':
      return 'date';
    // driving_privileges is a string with array like elements split by ','
    case 'driving_privileges':
      return 'array';
    case 'age_over_18':
      return 'boolean';
    case 'portrait':
      return 'exception';
    default:
      return null;
  }
}

export function getIssuerLogo(issuer) {
  switch (issuer?.toLowerCase()) {
    case 'pmlp':
      return 'pmlp';
    case 'test qeaa issuer':
    case 'csdd':
      return 'csdd';
    case 'rīgas tehniskā universitāte':
    case 'rtu':
      return 'rtu';
    case 'lvrtc':
      return 'lvrtc';
    case 'seb':
      return 'seb';
    default:
      return null;
  }
}

export function fixBase64Image(base64) {
  // Replace URL-safe characters with standard Base64 characters
  let b64 = base64.trim().replace(/_/g, '/').replace(/-/g, '+');

  // Add padding if missing
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }

  return b64;
}
