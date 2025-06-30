//import { IP_HEADER_CANDIDATES } from "./constants";
const IP_HEADER_CANDIDATES = [
  'cf-connecting-ip',
  'x-client-ip',
  'x-forwarded-for',
  'do-connecting-ip',
  'fastly-client-ip',
  'true-client-ip',
  'x-real-ip',
  'x-cluster-client-ip',
  'x-forwarded',
  'forwarded',
  'x-appengine-user-ip',
];

// EXtract User IP Address
export function extractClientIp(reqHeaders, fallBackIp) {

  for (const headerName of IP_HEADER_CANDIDATES) {
    const rawValue = reqHeaders.get(headerName);

    if (!rawValue) continue;

    switch (headerName) {
      case 'x-forwarded-for': {
        const [firstIp] = rawValue.split(',');
        if (firstIp?.trim()) return firstIp.trim();
        break;
      }

      case 'forwarded': {
        const ipMatch = rawValue.match(/for=(\[?[0-9a-fA-F:.]+\]?)/);
        if (ipMatch) return ipMatch[1];
        break;
      }

      default:
        return rawValue.trim();
    }
  }

  return fallBackIp ;
}

export async function extractClientGeoLocation(ip) {
  const defaultResponse = {
    success: false,
    ip: ip || 'unknown',
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    countryCode: null,
    latitude: null,
    longitude: null,
    timezone: null,
    isp: null,
    error: null,
  };

  // Basic IP validation (rejects local/private IPs)
  if (!isValidPublicIP(ip)) {
    return { ...defaultResponse, error: 'Invalid or private IP address' };
  }

  const apis = [
    {
      name: 'ip-api.com',
      url: `http://ip-api.com/json/${ip}`,
      parse: (d) => ({
        success: d.status === 'success',
        ip: d.query,
        country: d.country,
        region: d.regionName || d.region,
        city: d.city,
        countryCode: d.countryCode,
        latitude: d.lat,
        longitude: d.lon,
        timezone: d.timezone,
        isp: d.isp,
      }),
    },
    {
      name: 'ipapi.co',
      url: `https://ipapi.co/${ip}/json/`,
      parse: (d) => ({
        success: !d.error,
        ip: d.ip,
        country: d.country_name,
        region: d.region,
        city: d.city,
        countryCode: d.country_code,
        latitude: d.latitude,
        longitude: d.longitude,
        timezone: d.timezone,
        isp: d.org,
      }),
    },
    {
      name: 'ipinfo.io',
      url: `https://ipinfo.io/${ip}/json`,
      parse: (d) => {
        const [lat, lon] = d.loc?.split(',') || [null, null];
        return {
          success: !d.error && d.city,
          ip: d.ip,
          country: d.country,
          region: d.region,
          city: d.city,
          countryCode: d.country,
          latitude: lat,
          longitude: lon,
          timezone: d.timezone,
          isp: d.org,
        };
      },
    },
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api.url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) continue;

      const data = await res.json();
      const parsed = api.parse(data);

      if (parsed.success) return { ...defaultResponse, ...parsed, success: true };
    } catch (err) {
      continue
    }
  }

  return { ...defaultResponse, error: 'All geolocation services failed' };
}

// Validate IP address (basic public IP check)
function isValidPublicIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  if (ip === '::1' || ip === '127.0.0.1') return false;
  if (ip.startsWith('192.168.') || ip.startsWith('10.')) return false;
  if (ip.startsWith('172.')) {
    const octet = parseInt(ip.split('.')[1], 10);
    if (octet >= 16 && octet <= 31) return false;
  }

  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip);
}

// Extract Client Details
export async function getClientDetails(req) {
  const userAgent = req.headers["user-agent"] || "";
  const userIp = extractClientIp(req, req?.socket?.remoteAddress ?? null) || "";
  const geoLocation = await extractClientGeoLocation(userIp);

  return {userAgent, userIp, geoLocation}
}
