type HeaderValue = string | string[] | undefined;

const getHeaderValue = (value: HeaderValue): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

const sanitizeHost = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return "";
  }
  return trimmed;
};

const ensureScheme = (value: string): string => {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
};

const normalizeOrigin = (value: HeaderValue): string | null => {
  const raw = getHeaderValue(value).trim();
  if (!raw) return null;
  if (raw === "null" || raw === "undefined") return null;

  const candidate = ensureScheme(raw);
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "null" || hostname === "undefined") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
};

export const resolveCheckoutOrigin = (
  req: { headers: Record<string, HeaderValue> },
  siteUrl?: string
): string => {
  const originFromEnv = normalizeOrigin(siteUrl);
  if (originFromEnv) {
    return originFromEnv;
  }

  const originFromHeader = normalizeOrigin(req.headers.origin);
  if (originFromHeader) {
    return originFromHeader;
  }

  const refererHeader = getHeaderValue(req.headers.referer || req.headers.referrer);
  const originFromReferer = normalizeOrigin(refererHeader);
  if (originFromReferer) {
    return originFromReferer;
  }

  const forwardedProto = getHeaderValue(req.headers["x-forwarded-proto"]).split(",")[0]?.trim();
  const forwardedHostRaw = getHeaderValue(req.headers["x-forwarded-host"]).split(",")[0]?.trim();
  const hostHeaderRaw = getHeaderValue(req.headers.host).split(",")[0]?.trim();
  const forwardedHost = sanitizeHost(forwardedHostRaw);
  const hostHeader = sanitizeHost(hostHeaderRaw);

  const protocol =
    forwardedProto && ["http", "https"].includes(forwardedProto)
      ? forwardedProto
      : "https";
  const host = forwardedHost || hostHeader;
  if (host) {
    const originFromHost = normalizeOrigin(`${protocol}://${host}`);
    if (originFromHost) {
      return originFromHost;
    }
  }

  return "http://localhost:3000";
};

export const buildCheckoutUrl = (
  origin: string,
  path: string,
  rawQueryString?: string
): string => {
  const baseUrl = new URL(path, origin);
  if (!rawQueryString) {
    return baseUrl.toString();
  }
  const queryString = rawQueryString.replace(/^\?/, "");
  return `${baseUrl.toString()}?${queryString}`;
};
