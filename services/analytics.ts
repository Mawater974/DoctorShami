
import { supabase } from './supabase';

interface IPData {
  ip: string;
  city: string;
  country_name: string;
  country_code: string;
}

const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let device = "Desktop";
    let platform = "Unknown";

    // Browser
    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
    else if (ua.indexOf("Edge") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";

    // Device
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        device = "Mobile";
    }

    // Platform
    if (ua.indexOf("Win") !== -1) platform = "Windows";
    else if (ua.indexOf("Mac") !== -1) platform = "MacOS";
    else if (ua.indexOf("Linux") !== -1) platform = "Linux";
    else if (ua.indexOf("Android") !== -1) platform = "Android";
    else if (ua.indexOf("like Mac") !== -1) platform = "iOS";

    return { browser, device, platform };
};

export const analyticsService = {
  // Cache IP data in session storage to avoid rate limits
  async getIpData(): Promise<IPData | null> {
    try {
        const cached = sessionStorage.getItem('ds_ip_data');
        if (cached) {
            return JSON.parse(cached);
        }

        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const relevantData = {
            ip: data.ip,
            city: data.city,
            country_name: data.country_name,
            country_code: data.country_code
        };

        sessionStorage.setItem('ds_ip_data', JSON.stringify(relevantData));
        return relevantData;
    } catch (e) {
        console.warn('Failed to fetch IP data', e);
        return null;
    }
  },

  async trackPageView(path: string, userId?: string) {
      // 1. Get or Create Session ID
      let sessionId = sessionStorage.getItem('ds_session_id');
      if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('ds_session_id', sessionId);
      }

      // 2. Get IP Data
      const ipData = await this.getIpData();

      // 3. Get User Agent Data
      const uaData = getBrowserInfo();

      // 4. Determine Page Type & Entity
      let pageType = 'OTHER';
      let entityId = null;

      if (path === '/') pageType = 'HOME';
      else if (path.startsWith('/clinics')) pageType = 'LISTING_CLINICS';
      else if (path.startsWith('/pharmacies')) pageType = 'LISTING_PHARMACIES';
      else if (path.startsWith('/directory/')) {
          pageType = 'DETAIL';
          const parts = path.split('/');
          if (parts.length > 2) entityId = parts[2];
      } else if (path.startsWith('/clinic/')) {
          pageType = 'DETAIL_CLINIC';
          const parts = path.split('/');
          if (parts.length > 2) entityId = parts[2];
      } else if (path.startsWith('/pharmacy/')) {
          pageType = 'DETAIL_PHARMACY';
          const parts = path.split('/');
          if (parts.length > 2) entityId = parts[2];
      } else if (path.startsWith('/auth')) pageType = 'AUTH';
      else if (path.startsWith('/admin')) pageType = 'ADMIN';
      else if (path.startsWith('/provider')) pageType = 'PROVIDER';
      else if (path.startsWith('/messages')) pageType = 'MESSAGES';
      else if (path.startsWith('/appointments')) pageType = 'APPOINTMENTS';
      else if (path.startsWith('/settings')) pageType = 'SETTINGS';
      else if (path.startsWith('/register-facility')) pageType = 'REGISTER';

      // 5. Insert
      try {
          await supabase.from('page_views').insert({
              session_id: sessionId,
              user_id: userId || null,
              page_path: path,
              page_type: pageType,
              entity_id: entityId,
              ip_address: ipData?.ip,
              city: ipData?.city,
              real_country_name: ipData?.country_name,
              country_code: ipData?.country_code,
              browser: uaData.browser,
              device_type: uaData.device,
              platform: uaData.platform,
              referrer: document.referrer || null
          });
      } catch (e) {
          // Fail silently for analytics
          console.warn('Analytics tracking error', e);
      }
  }
};
