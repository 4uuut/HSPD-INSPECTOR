import officialBadgeImg from './images/hspd_official_seal_badge_1787696082793.jpg';

export const HSPD_LOGO_URL = officialBadgeImg;

export const HSPD_LOGO_FALLBACK = 'https://cdn.discordapp.com/avatars/1544332281559130112/c28e32e12bc623e4bad1fabd02ef98d0.png';

/**
 * Returns current active logo from storage if customized, otherwise fallback to official badge.
 */
export function getActiveLogoUrl(): string {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('hspd_custom_branding_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.logoUrl) {
          return parsed.logoUrl;
        }
      }
    }
  } catch {}
  return HSPD_LOGO_URL;
}
