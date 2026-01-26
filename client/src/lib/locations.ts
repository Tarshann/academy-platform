interface LocationDetails {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
}

export const buildDirectionsUrl = (location: LocationDetails) => {
  if (location.latitude != null && location.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
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
