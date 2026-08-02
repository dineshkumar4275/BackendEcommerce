// backend/src/routes/locationRoutes.js

import express from 'express';
import axios from 'axios';

const router = express.Router();

// ✅ Reverse Geocoding - Get address from coordinates
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    console.log(`📍 Reverse geocoding: lat=${lat}, lng=${lng}`);

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
      {
        headers: {
          'User-Agent': 'EcommerceApp/1.0'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.address) {
      const address = response.data.address;
      
      const street = address.road || 
                     address.pedestrian || 
                     address.footway || 
                     address.street || 
                     address.path ||
                     address.lane ||
                     address.highway ||
                     address.residential ||
                     null;
      
      const houseNumber = address.house_number || null;
      const neighborhood = address.neighbourhood || 
                          address.suburb || 
                          address.quarter ||
                          null;
      
      const locationName = response.data.namedetails?.name || 
                          street || 
                          neighborhood || 
                          address.city || 
                          address.town || 
                          address.village ||
                          null;
      
      const parts = [];
      if (street) parts.push(street);
      if (houseNumber) parts.push(houseNumber);
      if (neighborhood) parts.push(neighborhood);
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
      }
      if (address.state || address.region) {
        parts.push(address.state || address.region);
      }
      if (address.country) parts.push(address.country);
      if (address.postcode) parts.push(address.postcode);
      
      const result = {
        success: true,
        data: {
          street: street,
          houseNumber: houseNumber,
          neighborhood: neighborhood,
          locationName: locationName,
          city: address.city || address.town || address.village || null,
          state: address.state || address.region || null,
          country: address.country || null,
          countryCode: address.country_code?.toUpperCase() || null,
          postalCode: address.postcode || null,
          fullAddress: parts.filter(Boolean).join(', '),
          formatted: response.data.display_name || null,
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        }
      };

      console.log('✅ Reverse geocoding successful');
      res.status(200).json(result);
    } else {
      res.status(404).json({
        success: false,
        message: 'No address found for these coordinates'
      });
    }

  } catch (error) {
    console.error('❌ Reverse geocoding error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get address from coordinates',
      error: error.message
    });
  }
});

// ✅ Enhanced Search - Multiple strategies
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    console.log(`🔍 Searching for: "${query}"`);

    let allResults = [];
    let usedQuery = query;

    // ✅ Method 1: Try with full address (OpenStreetMap)
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=15&addressdetails=1&namedetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'EcommerceApp/1.0'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.length > 0) {
        console.log(`✅ Found ${response.data.length} results for full query`);
        allResults = response.data;
      }
    } catch (osmError) {
      console.log('⚠️ OpenStreetMap search failed:', osmError.message);
    }

    // ✅ Method 2: Remove common suffixes (nagar, street, road, etc.)
    if (allResults.length === 0) {
      try {
        const suffixes = ['nagar', 'street', 'st', 'road', 'rd', 'layout', 'colony', 'city', 'town', 'village'];
        let simplifiedQuery = query;
        
        for (const suffix of suffixes) {
          simplifiedQuery = simplifiedQuery.replace(new RegExp(`\\s+${suffix}`, 'gi'), '');
        }
        simplifiedQuery = simplifiedQuery.trim();
        
        if (simplifiedQuery !== query && simplifiedQuery.length > 2) {
          console.log(`   Trying simplified query: "${simplifiedQuery}"`);
          
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simplifiedQuery)}&format=json&limit=10&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'EcommerceApp/1.0'
              },
              timeout: 8000
            }
          );

          if (response.data && response.data.length > 0) {
            console.log(`   ✅ Found ${response.data.length} results for simplified query`);
            allResults = response.data;
            usedQuery = simplifiedQuery;
          }
        }
      } catch (simplifiedError) {
        console.log('⚠️ Simplified query failed:', simplifiedError.message);
      }
    }

    // ✅ Method 3: Try with city/area name (last part)
    if (allResults.length === 0) {
      try {
        const parts = query.split(/\s+/);
        const lastPart = parts[parts.length - 1];
        
        if (lastPart && lastPart.length > 2 && lastPart !== parts[0]) {
          console.log(`   Trying city search: "${lastPart}"`);
          
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lastPart)}&format=json&limit=10&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'EcommerceApp/1.0'
              },
              timeout: 8000
            }
          );

          if (response.data && response.data.length > 0) {
            console.log(`   ✅ Found ${response.data.length} results for city: "${lastPart}"`);
            allResults = response.data;
            usedQuery = lastPart;
          }
        }
      } catch (cityError) {
        console.log('⚠️ City search failed:', cityError.message);
      }
    }

    // ✅ Method 4: Try with first part (area name)
    if (allResults.length === 0) {
      try {
        const parts = query.split(/\s+/);
        const firstPart = parts[0];
        
        if (firstPart && firstPart.length > 2) {
          console.log(`   Trying area search: "${firstPart}"`);
          
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(firstPart)}&format=json&limit=10&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'EcommerceApp/1.0'
              },
              timeout: 8000
            }
          );

          if (response.data && response.data.length > 0) {
            console.log(`   ✅ Found ${response.data.length} results for area: "${firstPart}"`);
            allResults = response.data;
            usedQuery = firstPart;
          }
        }
      } catch (areaError) {
        console.log('⚠️ Area search failed:', areaError.message);
      }
    }

    // ✅ Method 5: Try with each word individually
    if (allResults.length === 0) {
      try {
        const words = query.split(/\s+/);
        for (const word of words) {
          if (word.length < 3) continue;
          
          console.log(`   Trying word search: "${word}"`);
          
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(word)}&format=json&limit=5&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'EcommerceApp/1.0'
              },
              timeout: 5000
            }
          );

          if (response.data && response.data.length > 0) {
            console.log(`   ✅ Found ${response.data.length} results for word: "${word}"`);
            allResults = response.data;
            usedQuery = word;
            break;
          }
        }
      } catch (wordError) {
        console.log('⚠️ Word search failed:', wordError.message);
      }
    }

    // ✅ Process results
    if (allResults.length > 0) {
      const results = allResults.map(loc => {
        const address = loc.address || {};
        
        const street = address.road || 
                       address.street || 
                       address.pedestrian || 
                       address.footway ||
                       address.highway ||
                       address.residential ||
                       address.tertiary ||
                       address.secondary ||
                       address.primary ||
                       null;
        
        const locationName = loc.namedetails?.name || 
                            street || 
                            address.suburb || 
                            address.neighbourhood ||
                            address.city ||
                            address.town ||
                            address.village ||
                            null;

        return {
          displayName: loc.display_name || `${locationName || 'Unknown'}`,
          name: locationName,
          street: street,
          houseNumber: address.house_number || null,
          neighborhood: address.neighbourhood || address.suburb || null,
          city: address.city || address.town || address.village || null,
          state: address.state || address.region || null,
          country: address.country || null,
          countryCode: address.country_code?.toUpperCase() || null,
          postalCode: address.postcode || null,
          lat: parseFloat(loc.lat),
          lon: parseFloat(loc.lon),
          type: loc.type || 'unknown',
          class: loc.class || 'unknown',
          fullAddress: loc.display_name || '',
          searchMatch: usedQuery
        };
      });

      console.log(`✅ Found ${results.length} total results for "${query}" (matched using: "${usedQuery}")`);
      
      return res.status(200).json({
        success: true,
        data: results,
        count: results.length,
        searchQuery: query,
        matchedUsing: usedQuery
      });
    }

    // ✅ No results found - Return helpful message
    console.log(`❌ No results found for "${query}"`);
    return res.status(200).json({
      success: true,
      data: [],
      count: 0,
      message: 'No locations found. Try searching by city name (e.g., "Coimbatore") or area name.',
      searchQuery: query,
      suggestions: [
        `Try searching without "nagar" or "street" suffix`,
        `Try searching by area/city name only`,
        `Try searching by landmark or nearby area`
      ]
    });

  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(200).json({
      success: true,
      data: [],
      count: 0,
      message: 'Search service temporarily unavailable'
    });
  }
});

// ✅ Get user location from IP
router.get('/detect', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.socket?.remoteAddress || 
               req.connection?.remoteAddress ||
               req.ip ||
               '';

    console.log('📍 Detecting location for IP:', ip);

    let locationData = null;

    // Method 1: ipapi.co
    try {
      const response = await axios.get('https://ipapi.co/json/', {
        timeout: 5000,
        headers: { 'User-Agent': 'EcommerceApp/1.0' }
      });
      
      if (response.data && response.data.latitude) {
        locationData = {
          ip: response.data.ip,
          city: response.data.city,
          region: response.data.region,
          regionCode: response.data.region_code,
          country: response.data.country_name,
          countryCode: response.data.country_code,
          countryFlag: getCountryFlag(response.data.country_code),
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          postal: response.data.postal,
          timezone: response.data.timezone,
          currency: response.data.currency,
          currencyCode: response.data.currency_code,
          isp: response.data.org,
          method: 'ipapi.co'
        };
        console.log('✅ Location detected via ipapi.co');
      }
    } catch (error) {
      console.log('⚠️ ipapi.co failed');
    }

    // Method 2: ip-api.com (Fallback)
    if (!locationData) {
      try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`, {
          timeout: 5000
        });
        
        if (response.data && response.data.status === 'success') {
          locationData = {
            ip: response.data.query,
            city: response.data.city,
            region: response.data.regionName,
            regionCode: response.data.region,
            country: response.data.country,
            countryCode: response.data.countryCode,
            countryFlag: getCountryFlag(response.data.countryCode),
            latitude: response.data.lat,
            longitude: response.data.lon,
            postal: response.data.zip,
            timezone: response.data.timezone,
            isp: response.data.isp,
            method: 'ip-api.com'
          };
          console.log('✅ Location detected via ip-api.com');
        }
      } catch (error) {
        console.log('⚠️ ip-api.com failed');
      }
    }

    // Method 3: freegeoip.app (Fallback)
    if (!locationData) {
      try {
        const response = await axios.get(`https://freegeoip.app/json/${ip}`, {
          timeout: 5000
        });
        
        if (response.data && response.data.latitude) {
          locationData = {
            ip: response.data.ip,
            city: response.data.city,
            region: response.data.region_name,
            country: response.data.country_name,
            countryCode: response.data.country_code,
            countryFlag: getCountryFlag(response.data.country_code),
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            postal: response.data.zip_code,
            timezone: response.data.time_zone,
            method: 'freegeoip.app'
          };
          console.log('✅ Location detected via freegeoip.app');
        }
      } catch (error) {
        console.log('⚠️ freegeoip.app failed');
      }
    }

    if (!locationData) {
      return res.status(200).json({
        success: true,
        data: {
          method: 'browser',
          message: 'Please allow browser location access',
          useBrowserGeolocation: true
        }
      });
    }

    // Get street name using reverse geocoding
    let streetData = null;
    if (locationData.latitude && locationData.longitude) {
      try {
        const reverseResponse = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${locationData.latitude}&lon=${locationData.longitude}&format=json&zoom=18&addressdetails=1&namedetails=1`,
          {
            headers: {
              'User-Agent': 'EcommerceApp/1.0'
            },
            timeout: 8000
          }
        );

        if (reverseResponse.data && reverseResponse.data.address) {
          const address = reverseResponse.data.address;
          
          const street = address.road || 
                         address.pedestrian || 
                         address.footway || 
                         address.street || 
                         address.highway ||
                         address.residential ||
                         null;
          
          const locationName = reverseResponse.data.namedetails?.name || street;
          
          const parts = [];
          if (street) parts.push(street);
          if (address.house_number) parts.push(address.house_number);
          if (address.city || address.town || address.village) {
            parts.push(address.city || address.town || address.village);
          }
          if (address.state) parts.push(address.state);
          if (address.country) parts.push(address.country);
          
          streetData = {
            street: street,
            locationName: locationName,
            fullAddress: parts.filter(Boolean).join(', '),
            city: address.city || address.town || address.village || null,
            state: address.state || null,
            country: address.country || null,
            postalCode: address.postcode || null
          };
          console.log('✅ Street name fetched');
        }
      } catch (error) {
        console.log('⚠️ Reverse geocoding failed');
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...locationData,
        street: streetData?.street || streetData?.locationName || null,
        locationName: streetData?.locationName || null,
        fullAddress: streetData?.fullAddress || null,
        city: streetData?.city || locationData.city,
        state: streetData?.state || locationData.region,
        country: streetData?.country || locationData.country,
        postalCode: streetData?.postalCode || locationData.postal,
        mapUrl: `https://www.openstreetmap.org/?mlat=${locationData.latitude}&mlon=${locationData.longitude}&zoom=15`,
        detectedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Location detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect location',
      error: error.message
    });
  }
});

// ✅ Get country flag
function getCountryFlag(countryCode) {
  if (!countryCode) return '🌍';
  try {
    const codePoints = countryCode.toUpperCase().split('').map(
      char => 127397 + char.charCodeAt()
    );
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    return '🌍';
  }
}

export default router;