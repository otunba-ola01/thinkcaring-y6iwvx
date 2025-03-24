import { 
  formatValue, formatDataField, formatAddress, formatName, 
  formatPhoneWithExt, formatFileSize, formatList, formatDuration,
  formatStatus, formatId, formatBoolean, formatSensitiveData 
} from '../../../utils/format';

import { formatCurrency, formatCompactCurrency } from '../../../utils/currency';
import { formatNumber, formatCompactNumber, formatPercentage } from '../../../utils/number';
import { formatDate, formatDisplayDate, formatRelativeDate } from '../../../utils/date';

describe('formatValue', () => {
  it('should format value as currency', () => {
    expect(formatValue(1234.56, 'currency')).toBe(formatCurrency(1234.56));
    expect(formatValue('1234.56', 'currency')).toBe(formatCurrency('1234.56'));
  });

  it('should format value as compact currency', () => {
    expect(formatValue(1234567, 'compactCurrency')).toBe(formatCompactCurrency(1234567));
    expect(formatValue('1234567', 'compactCurrency')).toBe(formatCompactCurrency('1234567'));
  });

  it('should format value as number', () => {
    expect(formatValue(1234.56, 'number')).toBe(formatNumber(1234.56));
    expect(formatValue('1234.56', 'number')).toBe(formatNumber('1234.56'));
  });

  it('should format value as compact number', () => {
    expect(formatValue(1234567, 'compactNumber')).toBe(formatCompactNumber(1234567));
    expect(formatValue('1234567', 'compactNumber')).toBe(formatCompactNumber('1234567'));
  });

  it('should format value as percentage', () => {
    expect(formatValue(0.1234, 'percentage')).toBe(formatPercentage(0.1234));
    expect(formatValue('0.1234', 'percentage')).toBe(formatPercentage('0.1234'));
  });

  it('should format value as date', () => {
    const date = new Date('2023-05-15');
    expect(formatValue(date, 'date')).toBe(formatDate(date));
    expect(formatValue('2023-05-15', 'date')).toBe(formatDate('2023-05-15'));
  });

  it('should format value as display date', () => {
    const date = new Date('2023-05-15');
    expect(formatValue(date, 'displayDate')).toBe(formatDisplayDate(date));
    expect(formatValue('2023-05-15', 'displayDate')).toBe(formatDisplayDate('2023-05-15'));
  });

  it('should format value as relative date', () => {
    const date = new Date('2023-05-15');
    expect(formatValue(date, 'relativeDate')).toBe(formatRelativeDate(date));
    expect(formatValue('2023-05-15', 'relativeDate')).toBe(formatRelativeDate('2023-05-15'));
  });

  it('should format value as string', () => {
    expect(formatValue(1234, 'string')).toBe('1234');
    expect(formatValue(true, 'string')).toBe('true');
    expect(formatValue({ foo: 'bar' }, 'string')).toBe('[object Object]');
  });

  it('should handle null input returns empty string', () => {
    expect(formatValue(null, 'string')).toBe('');
    expect(formatValue(null, 'number')).toBe('');
    expect(formatValue(null, 'currency')).toBe('');
  });

  it('should handle undefined input returns empty string', () => {
    expect(formatValue(undefined, 'string')).toBe('');
    expect(formatValue(undefined, 'number')).toBe('');
    expect(formatValue(undefined, 'currency')).toBe('');
  });

  it('should default format type (string) when not specified', () => {
    expect(formatValue(1234)).toBe('1234');
    expect(formatValue('hello')).toBe('hello');
  });
});

describe('formatDataField', () => {
  it('should format field with different format types', () => {
    expect(formatDataField(1234.56, { format: 'currency' })).toBe(formatCurrency(1234.56));
    expect(formatDataField(0.1234, { format: 'percentage' })).toBe(formatPercentage(0.1234));
    expect(formatDataField(new Date('2023-05-15'), { format: 'date' })).toBe(formatDate(new Date('2023-05-15')));
  });

  it('should format field with prefix', () => {
    expect(formatDataField(1234, { format: 'string', prefix: '$' })).toBe('$1234');
    expect(formatDataField('hello', { prefix: '-> ' })).toBe('-> hello');
  });

  it('should format field with suffix', () => {
    expect(formatDataField(1234, { format: 'string', suffix: ' USD' })).toBe('1234 USD');
    expect(formatDataField('hello', { suffix: '!' })).toBe('hello!');
  });

  it('should format field with truncation', () => {
    expect(formatDataField('hello world', { truncate: 5 })).toBe('hello...');
    expect(formatDataField('short', { truncate: 10 })).toBe('short');
  });

  it('should handling null input returns emptyValue from config', () => {
    expect(formatDataField(null, { emptyValue: 'None' })).toBe('None');
    expect(formatDataField(null, { format: 'currency', emptyValue: '-' })).toBe('-');
  });

  it('should handling undefined input returns emptyValue from config', () => {
    expect(formatDataField(undefined, { emptyValue: 'N/A' })).toBe('N/A');
    expect(formatDataField(undefined, { format: 'number', emptyValue: '0' })).toBe('0');
  });

  it('should handling null input returns empty string when emptyValue not provided', () => {
    expect(formatDataField(null, {})).toBe('');
    expect(formatDataField(undefined, { format: 'currency' })).toBe('');
  });
});

describe('formatAddress', () => {
  it('should format complete address as single line', () => {
    const address = {
      street: '123 Main St',
      street2: 'Apt 4B',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      country: 'USA'
    };
    expect(formatAddress(address, true)).toBe('123 Main St, Apt 4B, Anytown, CA, 12345, USA');
  });

  it('should format complete address as multi-line', () => {
    const address = {
      street: '123 Main St',
      street2: 'Apt 4B',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      country: 'USA'
    };
    expect(formatAddress(address)).toBe('123 Main St\nApt 4B\nAnytown, CA, 12345\nUSA');
  });

  it('should format address with missing components', () => {
    const address = {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345'
    };
    expect(formatAddress(address, true)).toBe('123 Main St, Anytown, CA, 12345');
    expect(formatAddress(address)).toBe('123 Main St\nAnytown, CA, 12345');
  });

  it('should handle null input returns empty string', () => {
    expect(formatAddress(null)).toBe('');
    expect(formatAddress(null, true)).toBe('');
  });

  it('should handle undefined input returns empty string', () => {
    expect(formatAddress(undefined)).toBe('');
    expect(formatAddress(undefined, true)).toBe('');
  });

  it('should handle empty object returns empty string', () => {
    expect(formatAddress({})).toBe('');
    expect(formatAddress({}, true)).toBe('');
  });
});

describe('formatName', () => {
  it('should format name with first and last name', () => {
    expect(formatName('John', 'Doe')).toBe('John Doe');
  });

  it('should format name with first, middle, and last name', () => {
    expect(formatName('John', 'Doe', 'A')).toBe('John A Doe');
  });

  it('should format name with suffix', () => {
    expect(formatName('John', 'Doe', undefined, 'Jr.')).toBe('John Doe Jr.');
  });

  it('should format name with all components', () => {
    expect(formatName('John', 'Doe', 'A', 'Jr.')).toBe('John A Doe Jr.');
  });

  it('should format name from name object', () => {
    const nameObj = {
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'A',
      suffix: 'Jr.'
    };
    expect(formatName(nameObj)).toBe('John A Doe Jr.');
  });

  it('should handle null input returns empty string', () => {
    expect(formatName(null as any)).toBe('');
  });

  it('should handle undefined input returns empty string', () => {
    expect(formatName(undefined as any)).toBe('');
  });

  it('should handle empty strings returns empty string', () => {
    expect(formatName('', '')).toBe('');
    expect(formatName('John', '', '', '')).toBe('John');
    expect(formatName('', 'Doe')).toBe('Doe');
  });
});

describe('formatPhoneWithExt', () => {
  it('should format phone number without extension', () => {
    expect(formatPhoneWithExt('1234567890')).toBe('(123) 456-7890');
  });

  it('should format phone number with extension', () => {
    expect(formatPhoneWithExt('1234567890', '123')).toBe('(123) 456-7890 ext. 123');
  });

  it('should handle null phone returns empty string', () => {
    expect(formatPhoneWithExt(null)).toBe('');
  });

  it('should handle undefined phone returns empty string', () => {
    expect(formatPhoneWithExt(undefined)).toBe('');
  });

  it('should handle empty phone returns empty string', () => {
    expect(formatPhoneWithExt('')).toBe('');
  });

  it('should handle null extension is ignored', () => {
    expect(formatPhoneWithExt('1234567890', null)).toBe('(123) 456-7890');
  });

  it('should handle undefined extension is ignored', () => {
    expect(formatPhoneWithExt('1234567890', undefined)).toBe('(123) 456-7890');
  });

  it('should handle empty extension is ignored', () => {
    expect(formatPhoneWithExt('1234567890', '')).toBe('(123) 456-7890');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(100)).toBe('100 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(2097152)).toBe('2 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
    expect(formatFileSize(2147483648)).toBe('2 GB');
  });

  it('should format with custom decimal places', () => {
    expect(formatFileSize(1536, 1)).toBe('1.5 KB');
    expect(formatFileSize(1536, 3)).toBe('1.500 KB');
  });

  it('should handling zero returns \'0 Bytes\'', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should handling null returns \'0 Bytes\'', () => {
    expect(formatFileSize(null)).toBe('0 Bytes');
  });

  it('should handling undefined returns \'0 Bytes\'', () => {
    expect(formatFileSize(undefined)).toBe('0 Bytes');
  });
});

describe('formatList', () => {
  it('should format list with default separator', () => {
    expect(formatList(['apple', 'banana', 'orange'])).toBe('apple, banana, orange');
  });

  it('should format list with custom separator', () => {
    expect(formatList(['apple', 'banana', 'orange'], ' - ')).toBe('apple - banana - orange');
  });

  it('should format list with conjunction', () => {
    expect(formatList(['apple', 'banana', 'orange'], ', ', 'and')).toBe('apple, banana, and orange');
  });

  it('should format list with custom separator and conjunction', () => {
    expect(formatList(['apple', 'banana', 'orange'], ' - ', 'or')).toBe('apple - banana - or orange');
  });

  it('should format list with single item', () => {
    expect(formatList(['apple'])).toBe('apple');
    expect(formatList(['apple'], ', ', 'and')).toBe('apple');
  });

  it('should format list with two items and conjunction', () => {
    expect(formatList(['apple', 'banana'], ', ', 'and')).toBe('apple, and banana');
  });

  it('should handle empty array returns empty string', () => {
    expect(formatList([])).toBe('');
  });

  it('should handle null returns empty string', () => {
    expect(formatList(null)).toBe('');
  });

  it('should handle undefined returns empty string', () => {
    expect(formatList(undefined)).toBe('');
  });
});

describe('formatDuration', () => {
  it('should format minutes only', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(5)).toBe('5m');
  });

  it('should format hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(150)).toBe('2h 30m');
  });

  it('should format with seconds', () => {
    expect(formatDuration(90.5, true)).toBe('1h 30m 30s');
    expect(formatDuration(30.75, true)).toBe('30m 45s');
  });

  it('should handling zero returns \'0m\'', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('should handling null returns \'0m\'', () => {
    expect(formatDuration(null)).toBe('0m');
  });

  it('should handling undefined returns \'0m\'', () => {
    expect(formatDuration(undefined)).toBe('0m');
  });
});

describe('formatStatus', () => {
  it('should format status with default behavior', () => {
    expect(formatStatus('pending')).toBe('Pending');
    expect(formatStatus('APPROVED')).toBe('APPROVED');
  });

  it('should format status with status map', () => {
    const statusMap = {
      'pending': 'Awaiting Review',
      'approved': 'Accepted',
      'rejected': 'Declined'
    };
    expect(formatStatus('pending', statusMap)).toBe('Awaiting Review');
    expect(formatStatus('approved', statusMap)).toBe('Accepted');
    expect(formatStatus('unknown', statusMap)).toBe('Unknown');
  });

  it('should format status with underscores', () => {
    expect(formatStatus('payment_pending')).toBe('Payment Pending');
    expect(formatStatus('status_not_found')).toBe('Status Not Found');
  });

  it('should format status with hyphens', () => {
    expect(formatStatus('payment-pending')).toBe('Payment Pending');
    expect(formatStatus('status-not-found')).toBe('Status Not Found');
  });

  it('should handle empty string returns empty string', () => {
    expect(formatStatus('')).toBe('');
  });

  it('should handle null returns empty string', () => {
    expect(formatStatus(null)).toBe('');
  });

  it('should handle undefined returns empty string', () => {
    expect(formatStatus(undefined)).toBe('');
  });
});

describe('formatId', () => {
  it('should format numeric ID', () => {
    expect(formatId(12345)).toBe('12345');
  });

  it('should format string ID', () => {
    expect(formatId('ABC123')).toBe('ABC123');
  });

  it('should format with prefix', () => {
    expect(formatId(12345, 'INV-')).toBe('INV-12345');
    expect(formatId('ABC123', 'ID-')).toBe('ID-ABC123');
  });

  it('should format with padding', () => {
    expect(formatId(123, undefined, 5)).toBe('00123');
    expect(formatId('45', undefined, 4)).toBe('0045');
  });

  it('should format with prefix and padding', () => {
    expect(formatId(123, 'INV-', 5)).toBe('INV-00123');
    expect(formatId('45', 'ID-', 4)).toBe('ID-0045');
  });

  it('should handle empty string returns empty string', () => {
    expect(formatId('')).toBe('');
  });

  it('should handle null returns empty string', () => {
    expect(formatId(null)).toBe('');
  });

  it('should handle undefined returns empty string', () => {
    expect(formatId(undefined)).toBe('');
  });
});

describe('formatBoolean', () => {
  it('should format true value with default labels', () => {
    expect(formatBoolean(true)).toBe('Yes');
  });

  it('should format false value with default labels', () => {
    expect(formatBoolean(false)).toBe('No');
  });

  it('should format true value with custom labels', () => {
    expect(formatBoolean(true, 'Active', 'Inactive')).toBe('Active');
  });

  it('should format false value with custom labels', () => {
    expect(formatBoolean(false, 'Active', 'Inactive')).toBe('Inactive');
  });

  it('should format truthy values (1, \'true\', etc.)', () => {
    expect(formatBoolean(1)).toBe('Yes');
    expect(formatBoolean('1')).toBe('Yes');
    expect(formatBoolean('true')).toBe('Yes');
  });

  it('should format falsy values (0, \'false\', etc.)', () => {
    expect(formatBoolean(0)).toBe('No');
    expect(formatBoolean('0')).toBe('No');
    expect(formatBoolean('false')).toBe('No');
    expect(formatBoolean('')).toBe('No');
  });

  it('should handle null returns default falseLabel', () => {
    expect(formatBoolean(null)).toBe('No');
    expect(formatBoolean(null, 'On', 'Off')).toBe('Off');
  });

  it('should handle undefined returns default falseLabel', () => {
    expect(formatBoolean(undefined)).toBe('No');
    expect(formatBoolean(undefined, 'On', 'Off')).toBe('Off');
  });
});

describe('formatSensitiveData', () => {
  it('should format SSN', () => {
    expect(formatSensitiveData('123456789', 'ssn')).toBe('XXXXX6789');
  });

  it('should format credit card', () => {
    expect(formatSensitiveData('1234567890123456', 'creditCard')).toBe('XXXXXXXXXXXX3456');
  });

  it('should format phone number', () => {
    expect(formatSensitiveData('1234567890', 'phone')).toBe('(123) XXX-7890');
  });

  it('should format email', () => {
    expect(formatSensitiveData('user@example.com', 'email')).toBe('uxxxr@example.com');
  });

  it('should format with showFull=true returns original value', () => {
    expect(formatSensitiveData('123456789', 'ssn', true)).toBe('123456789');
  });

  it('should format with unknown data type uses default masking', () => {
    expect(formatSensitiveData('abcdefghij', 'unknown')).toBe('XXXXXXfghij');
  });

  it('should handle empty string returns empty string', () => {
    expect(formatSensitiveData('', 'ssn')).toBe('');
  });

  it('should handle null returns empty string', () => {
    expect(formatSensitiveData(null, 'ssn')).toBe('');
  });

  it('should handle undefined returns empty string', () => {
    expect(formatSensitiveData(undefined, 'ssn')).toBe('');
  });
});