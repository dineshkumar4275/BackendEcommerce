// backend/src/services/geocoding.js
export async function getAddressFromCoordinates(latitude, longitude) {
  try {
    console.log(`Getting address for: ${latitude}, ${longitude}`);
    
    // Use OpenStreetMap Nominatim API with higher zoom for street-level details
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=20&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DriverTrackingApp/1.0',
        'Accept-Language': 'en'
      }
    });
    
    const data = await response.json();
    console.log('Geocoding response received');
    
    if (data && data.address) {
      const addr = data.address;
      
      // Priority order for street name - MOST SPECIFIC FIRST
      let street = '';
      
      // 1. Try to get actual road/street name
      if (addr.road) {
        street = addr.road;
      } 
      // 2. Try pedestrian ways
      else if (addr.pedestrian) {
        street = addr.pedestrian;
      }
      // 3. Try footway
      else if (addr.footway) {
        street = addr.footway;
      }
      // 4. Try residential area
      else if (addr.residential) {
        street = addr.residential;
      }
      // 5. Try commercial area
      else if (addr.commercial) {
        street = addr.commercial;
      }
      // 6. Try industrial area
      else if (addr.industrial) {
        street = addr.industrial;
      }
      
      // Add house number if available
      if (addr.house_number && street) {
        street = `${addr.house_number}, ${street}`;
      }
      
      // If still no street, try to get from ways/street_id
      if (!street && data.name) {
        street = data.name;
      }
      
      // Get area (suburb/neighbourhood)
      let area = '';
      if (addr.suburb) {
        area = addr.suburb;
      } else if (addr.neighbourhood) {
        area = addr.neighbourhood;
      } else if (addr.village) {
        area = addr.village;
      } else if (addr.town) {
        area = addr.town;
      }
      
      // Get city
      let city = '';
      if (addr.city) {
        city = addr.city;
      } else if (addr.town) {
        city = addr.town;
      } else if (addr.municipality) {
        city = addr.municipality;
      } else if (addr.district) {
        city = addr.district;
      }
      
      // If no street found, check if there's a known landmark
      if (!street && data.display_name) {
        // Extract first part of display name (usually the street)
        const parts = data.display_name.split(',');
        if (parts.length > 0 && !parts[0].includes('Zone') && !parts[0].includes('Chennai')) {
          street = parts[0].trim();
        } else if (parts.length > 1) {
          street = parts[1].trim();
        }
      }
      
      // If still no street, use a meaningful combination
      if (!street) {
        if (area && city) {
          street = `${area}, ${city}`;
        } else if (area) {
          street = area;
        } else if (city) {
          street = city;
        } else {
          street = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
      }
      
      console.log('✅ Street found:', street);
      console.log('✅ Area found:', area);
      console.log('✅ City found:', city);
      
      return {
        street: street,
        area: area,
        city: city,
        state: addr.state || '',
        country: addr.country || '',
        postcode: addr.postcode || '',
        fullAddress: `${street}${area ? `, ${area}` : ''}${city ? `, ${city}` : ''}`,
        shortAddress: street
      };
    }
    
    // Fallback
    console.log('⚠️ No address found');
    return {
      street: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      area: '',
      city: '',
      state: '',
      country: '',
      postcode: '',
      fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      shortAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    };
    
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return {
      street: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      area: '',
      city: '',
      state: '',
      country: '',
      postcode: '',
      fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      shortAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    };
  }
}