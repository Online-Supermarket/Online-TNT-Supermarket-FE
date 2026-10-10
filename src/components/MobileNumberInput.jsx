import React from 'react';
import './MobileNumberInput.css';
import { normalizeMobileNumber, isMobileNumber } from '../utils/mobileNumber';

// Store digits only for the API; the fixed prefix and separator are presentation.
export default function MobileNumberInput({ id, value = '07', onChange, onBlur, invalid = false, describedBy, required = true }) {
  const normalized = normalizeMobileNumber(value);
  const unsupported = normalized && !normalized.startsWith('07');
  const suffix = unsupported ? '' : normalized.slice(2);
  const formatted = suffix ? `${suffix[0]}-${suffix.slice(1)}` : '';
  const update = (input, digits, caret) => {
    onChange(`07${digits.slice(0, 8)}`);
    requestAnimationFrame(() => {
      if (document.activeElement === input) input.setSelectionRange(caret, caret);
    });
  };
  const handleChange = event => {
    const input = event.target;
    const raw = input.value;
    let digits = raw.replace(/\D/g, '');
    // Browser autofill may supply a complete local phone number.
    if (isMobileNumber(raw)) {
      update(input, normalizeMobileNumber(raw).slice(2), 9);
      return;
    }
    const beforeCaret = raw.slice(0, input.selectionStart).replace(/\D/g, '').length;
    const deleting = event.nativeEvent.inputType?.startsWith('delete');
    const caret = beforeCaret + (beforeCaret > 1 || (beforeCaret === 1 && !deleting) ? 1 : 0);
    update(input, digits, caret);
  };
  const handlePaste = event => {
    const input = event.target;
    const pasted = normalizeMobileNumber(event.clipboardData.getData('text'));
    if (isMobileNumber(pasted)) {
      event.preventDefault();
      update(input, pasted.slice(2), 9);
    }
  };
  return <><div className="tnt-mobile-number" data-invalid={invalid || undefined}>
    <span className="tnt-mobile-number-prefix" aria-hidden="true">07</span>
    <input id={id} required={required} onBlur={onBlur} aria-invalid={invalid || undefined} type="tel" inputMode="numeric" autoComplete="tel-national"
      aria-label="Contact number, fixed prefix 07, enter the remaining 8 digits"
      aria-describedby={describedBy || `${id}-format`} placeholder="X-XXXXXXX" pattern="[0-9]-[0-9]{7}"
      title="Enter the remaining 8 digits, for example 7-1234567"
      value={formatted} onChange={handleChange} onPaste={handlePaste} />
  </div><small id={`${id}-format`} className="tnt-mobile-number-hint">{unsupported ? `Current number: ${value}. Enter a mobile number starting with 07.` : 'Format: 07X-XXXXXXX. The 07 prefix is fixed.'}</small></>;
}
