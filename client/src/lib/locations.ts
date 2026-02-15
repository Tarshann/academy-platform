interface LocationDetails {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  name?: string | null;
}

export const buildDirectionsUrl = (location: LocationDetails) => {
  const latitude =
    location.latitude != null && location.latitude !== ""
      ? Number(location.latitude)
      : null;
  const longitude =
    location.longitude != null && location.longitude !== ""
      ? Number(location.longitude)
      : null;

  if (
    latitude != null &&
    longitude != null &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  const addressParts = [
    location.address,
    location.city,
    location.state,
    location.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  const query = addressParts || location.name;
  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
