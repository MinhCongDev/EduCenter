/**
 * Return the webmail inbox URL for a given email address, when the provider
 * is known. Used to offer a "Open my inbox" button after registration.
 */
export const getMailboxUrl = (email: string): string | null => {
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) return null;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return 'https://mail.google.com/';
  }

  if (
    domain === 'outlook.com' ||
    domain === 'hotmail.com' ||
    domain === 'live.com' ||
    domain === 'msn.com'
  ) {
    return 'https://outlook.live.com/mail/';
  }

  if (domain === 'yahoo.com' || domain === 'ymail.com') {
    return 'https://mail.yahoo.com/';
  }

  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return 'https://www.icloud.com/mail/';
  }

  if (domain === 'proton.me' || domain === 'protonmail.com') {
    return 'https://mail.proton.me/';
  }

  return null;
};
