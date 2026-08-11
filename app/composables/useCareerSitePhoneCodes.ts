// Small curated dial-code list for the application form's phone field — no
// intl-tel-input dependency (the stack is deliberately small).
export interface PhoneCountry { name: string, flag: string, dial: string }

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { name: 'Egypt', flag: '🇪🇬', dial: '+20' },
  { name: 'Saudi Arabia', flag: '🇸🇦', dial: '+966' },
  { name: 'United Arab Emirates', flag: '🇦🇪', dial: '+971' },
  { name: 'Jordan', flag: '🇯🇴', dial: '+962' },
  { name: 'Kuwait', flag: '🇰🇼', dial: '+965' },
  { name: 'Qatar', flag: '🇶🇦', dial: '+974' },
  { name: 'Lebanon', flag: '🇱🇧', dial: '+961' },
  { name: 'Morocco', flag: '🇲🇦', dial: '+212' },
  { name: 'United Kingdom', flag: '🇬🇧', dial: '+44' },
  { name: 'Germany', flag: '🇩🇪', dial: '+49' },
  { name: 'United States', flag: '🇺🇸', dial: '+1' },
  { name: 'India', flag: '🇮🇳', dial: '+91' },
]
