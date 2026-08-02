// // backend/src/routes/locationRoutes.js

// import express from 'express';
// import axios from 'axios';

// const router = express.Router();

// // ✅ Reverse Geocoding - Get address from coordinates
// router.get('/reverse', async (req, res) => {
//   try {
//     const { lat, lng } = req.query;

//     if (!lat || !lng) {
//       return res.status(400).json({
//         success: false,
//         message: 'Latitude and longitude are required'
//       });
//     }

//     console.log(`📍 Reverse geocoding: lat=${lat}, lng=${lng}`);

//     const response = await axios.get(
//       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
//       {
//         headers: {
//           'User-Agent': 'EcommerceApp/1.0'
//         },
//         timeout: 10000
//       }
//     );

//     if (response.data && response.data.address) {
//       const address = response.data.address;
      
//       const street = address.road || 
//                      address.pedestrian || 
//                      address.footway || 
//                      address.street || 
//                      address.path ||
//                      address.lane ||
//                      address.highway ||
//                      address.residential ||
//                      null;
      
//       const houseNumber = address.house_number || null;
//       const neighborhood = address.neighbourhood || 
//                           address.suburb || 
//                           address.quarter ||
//                           null;
      
//       const locationName = response.data.namedetails?.name || 
//                           street || 
//                           neighborhood || 
//                           address.city || 
//                           address.town || 
//                           address.village ||
//                           null;
      
//       const parts = [];
//       if (street) parts.push(street);
//       if (houseNumber) parts.push(houseNumber);
//       if (neighborhood) parts.push(neighborhood);
//       if (address.city || address.town || address.village) {
//         parts.push(address.city || address.town || address.village);
//       }
//       if (address.state || address.region) {
//         parts.push(address.state || address.region);
//       }
//       if (address.country) parts.push(address.country);
//       if (address.postcode) parts.push(address.postcode);
      
//       const result = {
//         success: true,
//         data: {
//           street: street,
//           houseNumber: houseNumber,
//           neighborhood: neighborhood,
//           locationName: locationName,
//           city: address.city || address.town || address.village || null,
//           state: address.state || address.region || null,
//           country: address.country || null,
//           countryCode: address.country_code?.toUpperCase() || null,
//           postalCode: address.postcode || null,
//           fullAddress: parts.filter(Boolean).join(', '),
//           formatted: response.data.display_name || null,
//           lat: parseFloat(lat),
//           lng: parseFloat(lng)
//         }
//       };

//       console.log('✅ Reverse geocoding successful');
//       res.status(200).json(result);
//     } else {
//       res.status(404).json({
//         success: false,
//         message: 'No address found for these coordinates'
//       });
//     }

//   } catch (error) {
//     console.error('❌ Reverse geocoding error:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get address from coordinates',
//       error: error.message
//     });
//   }
// });

// // ✅ Search location - Fixed version
// router.get('/search/:query', async (req, res) => {
//   try {
//     const { query } = req.params;
    
//     if (!query || query.length < 2) {
//       return res.status(400).json({
//         success: false,
//         message: 'Search query must be at least 2 characters'
//       });
//     }

//     console.log(`🔍 Searching for: "${query}"`);

//     try {
//       // Try OpenStreetMap Nominatim
//       const response = await axios.get(
//         `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=15&addressdetails=1&namedetails=1&accept-language=en`,
//         {
//           headers: {
//             'User-Agent': 'EcommerceApp/1.0'
//           },
//           timeout: 10000
//         }
//       );

//       console.log(`📦 OpenStreetMap response status: ${response.status}`);
//       console.log(`📦 Results count: ${response.data?.length || 0}`);

//       if (response.data && response.data.length > 0) {
//         const results = response.data.map(loc => {
//           const address = loc.address || {};
          
//           const street = address.road || 
//                          address.street || 
//                          address.pedestrian || 
//                          address.footway ||
//                          address.highway ||
//                          address.residential ||
//                          address.tertiary ||
//                          address.secondary ||
//                          address.primary ||
//                          null;
          
//           const locationName = loc.namedetails?.name || 
//                               street || 
//                               address.suburb || 
//                               address.neighbourhood ||
//                               address.city ||
//                               address.town ||
//                               address.village ||
//                               null;

//           return {
//             displayName: loc.display_name || `${locationName || 'Unknown'}`,
//             name: locationName,
//             street: street,
//             houseNumber: address.house_number || null,
//             neighborhood: address.neighbourhood || address.suburb || null,
//             city: address.city || address.town || address.village || null,
//             state: address.state || address.region || null,
//             country: address.country || null,
//             countryCode: address.country_code?.toUpperCase() || null,
//             postalCode: address.postcode || null,
//             lat: parseFloat(loc.lat),
//             lon: parseFloat(loc.lon),
//             type: loc.type || 'unknown',
//             class: loc.class || 'unknown',
//             fullAddress: loc.display_name || ''
//           };
//         });

//         console.log(`✅ Found ${results.length} results for "${query}"`);
        
//         return res.status(200).json({
//           success: true,
//           data: results,
//           count: results.length
//         });
//       } else {
//         console.log(`❌ No results found for "${query}"`);
//         return res.status(200).json({
//           success: true,
//           data: [],
//           count: 0,
//           message: 'No locations found'
//         });
//       }
//     } catch (osmError) {
//       console.error('❌ OpenStreetMap error:', osmError.message);
      
//       // Fallback: Try a simpler query
//       try {
//         console.log('🔄 Trying fallback search...');
//         const fallbackResponse = await axios.get(
//           `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10`,
//           {
//             headers: {
//               'User-Agent': 'EcommerceApp/1.0'
//             },
//             timeout: 8000
//           }
//         );

//         if (fallbackResponse.data && fallbackResponse.data.length > 0) {
//           const results = fallbackResponse.data.map(loc => ({
//             displayName: loc.display_name || 'Unknown',
//             name: loc.display_name?.split(',')[0] || 'Unknown',
//             street: null,
//             houseNumber: null,
//             neighborhood: null,
//             city: null,
//             state: null,
//             country: null,
//             countryCode: null,
//             postalCode: null,
//             lat: parseFloat(loc.lat),
//             lon: parseFloat(loc.lon),
//             type: loc.type || 'unknown',
//             class: loc.class || 'unknown',
//             fullAddress: loc.display_name || ''
//           }));

//           console.log(`✅ Fallback found ${results.length} results`);
//           return res.status(200).json({
//             success: true,
//             data: results,
//             count: results.length
//           });
//         }
//       } catch (fallbackError) {
//         console.error('❌ Fallback search also failed:', fallbackError.message);
//       }

//       // If all fails, return empty results with success
//       return res.status(200).json({
//         success: true,
//         data: [],
//         count: 0,
//         message: 'Search service temporarily unavailable'
//       });
//     }

//   } catch (error) {
//     console.error('❌ Search error:', error.message);
//     // Return empty results instead of 500 error
//     res.status(200).json({
//       success: true,
//       data: [],
//       count: 0,
//       message: 'Search service error'
//     });
//   }
// });

// // ✅ Get user location from IP
// router.get('/detect', async (req, res) => {
//   try {
//     const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
//                req.socket?.remoteAddress || 
//                req.connection?.remoteAddress ||
//                req.ip ||
//                '';

//     console.log('📍 Detecting location for IP:', ip);

//     let locationData = null;

//     try {
//       const response = await axios.get('https://ipapi.co/json/', {
//         timeout: 5000,
//         headers: { 'User-Agent': 'EcommerceApp/1.0' }
//       });
      
//       if (response.data && response.data.latitude) {
//         locationData = {
//           ip: response.data.ip,
//           city: response.data.city,
//           region: response.data.region,
//           regionCode: response.data.region_code,
//           country: response.data.country_name,
//           countryCode: response.data.country_code,
//           countryFlag: getCountryFlag(response.data.country_code),
//           latitude: response.data.latitude,
//           longitude: response.data.longitude,
//           postal: response.data.postal,
//           timezone: response.data.timezone,
//           currency: response.data.currency,
//           currencyCode: response.data.currency_code,
//           isp: response.data.org,
//           method: 'ipapi.co'
//         };
//         console.log('✅ Location detected via ipapi.co');
//       }
//     } catch (error) {
//       console.log('⚠️ ipapi.co failed');
//     }

//     if (!locationData) {
//       try {
//         const response = await axios.get(`http://ip-api.com/json/${ip}`, {
//           timeout: 5000
//         });
        
//         if (response.data && response.data.status === 'success') {
//           locationData = {
//             ip: response.data.query,
//             city: response.data.city,
//             region: response.data.regionName,
//             regionCode: response.data.region,
//             country: response.data.country,
//             countryCode: response.data.countryCode,
//             countryFlag: getCountryFlag(response.data.countryCode),
//             latitude: response.data.lat,
//             longitude: response.data.lon,
//             postal: response.data.zip,
//             timezone: response.data.timezone,
//             isp: response.data.isp,
//             method: 'ip-api.com'
//           };
//           console.log('✅ Location detected via ip-api.com');
//         }
//       } catch (error) {
//         console.log('⚠️ ip-api.com failed');
//       }
//     }

//     if (!locationData) {
//       return res.status(200).json({
//         success: true,
//         data: {
//           method: 'browser',
//           message: 'Please allow browser location access',
//           useBrowserGeolocation: true
//         }
//       });
//     }

//     let streetData = null;
//     if (locationData.latitude && locationData.longitude) {
//       try {
//         const reverseResponse = await axios.get(
//           `https://nominatim.openstreetmap.org/reverse?lat=${locationData.latitude}&lon=${locationData.longitude}&format=json&zoom=18&addressdetails=1&namedetails=1`,
//           {
//             headers: {
//               'User-Agent': 'EcommerceApp/1.0'
//             },
//             timeout: 8000
//           }
//         );

//         if (reverseResponse.data && reverseResponse.data.address) {
//           const address = reverseResponse.data.address;
          
//           const street = address.road || 
//                          address.pedestrian || 
//                          address.footway || 
//                          address.street || 
//                          address.highway ||
//                          address.residential ||
//                          null;
          
//           const locationName = reverseResponse.data.namedetails?.name || street;
          
//           const parts = [];
//           if (street) parts.push(street);
//           if (address.house_number) parts.push(address.house_number);
//           if (address.city || address.town || address.village) {
//             parts.push(address.city || address.town || address.village);
//           }
//           if (address.state) parts.push(address.state);
//           if (address.country) parts.push(address.country);
          
//           streetData = {
//             street: street,
//             locationName: locationName,
//             fullAddress: parts.filter(Boolean).join(', '),
//             city: address.city || address.town || address.village || null,
//             state: address.state || null,
//             country: address.country || null,
//             postalCode: address.postcode || null
//           };
//           console.log('✅ Street name fetched');
//         }
//       } catch (error) {
//         console.log('⚠️ Reverse geocoding failed');
//       }
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         ...locationData,
//         street: streetData?.street || streetData?.locationName || null,
//         locationName: streetData?.locationName || null,
//         fullAddress: streetData?.fullAddress || null,
//         city: streetData?.city || locationData.city,
//         state: streetData?.state || locationData.region,
//         country: streetData?.country || locationData.country,
//         postalCode: streetData?.postalCode || locationData.postal,
//         mapUrl: `https://www.openstreetmap.org/?mlat=${locationData.latitude}&mlon=${locationData.longitude}&zoom=15`,
//         detectedAt: new Date().toISOString()
//       }
//     });

//   } catch (error) {
//     console.error('❌ Location detection error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to detect location',
//       error: error.message
//     });
//   }
// });

// // ✅ Get country flag
// function getCountryFlag(countryCode) {
//   if (!countryCode) return '🌍';
//   try {
//     const codePoints = countryCode.toUpperCase().split('').map(
//       char => 127397 + char.charCodeAt()
//     );
//     return String.fromCodePoint(...codePoints);
//   } catch (error) {
//     return '🌍';
//   }
// }

// export default router;
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

// ✅ Enhanced Search - Multiple providers
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

    // ✅ Method 1: Try OpenStreetMap with structured query
    try {
      // Try with full address
      let searchQuery = query;
      
      // If query has "no" or "number", try to extract house number and street
      let formattedQuery = query;
      
      // Try different variations
      const variations = [
        query,
        query.replace(/^no\s+/i, ''), // Remove "no" prefix
        query.replace(/^number\s+/i, ''), // Remove "number" prefix
        query.replace(/\s+no\s+/i, ' '), // Remove "no" in middle
        query.split(',').slice(0, 2).join(','), // First 2 parts only
        query.split(',').slice(0, 3).join(','), // First 3 parts only
      ];

      for (const variation of variations) {
        if (variation.length < 2) continue;
        
        console.log(`   Trying variation: "${variation}"`);
        
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(variation)}&format=json&limit=10&addressdetails=1&namedetails=1&accept-language=en`,
          {
            headers: {
              'User-Agent': 'EcommerceApp/1.0'
            },
            timeout: 8000
          }
        );

        if (response.data && response.data.length > 0) {
          console.log(`   ✅ Found ${response.data.length} results for variation`);
          allResults = response.data;
          break;
        }
      }
    } catch (osmError) {
      console.log('⚠️ OpenStreetMap search failed:', osmError.message);
    }

    // ✅ Method 2: If no results, try with simplified query (city only)
    if (allResults.length === 0) {
      try {
        // Extract city name from query
        const cityMatch = query.match(/(?:chennai|ramapuram|senthamil)/i);
        if (cityMatch) {
          const cityQuery = cityMatch[0];
          console.log(`   Trying city search: "${cityQuery}"`);
          
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=5&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'EcommerceApp/1.0'
              },
              timeout: 8000
            }
          );

          if (response.data && response.data.length > 0) {
            console.log(`   ✅ Found ${response.data.length} city results`);
            allResults = response.data;
          }
        }
      } catch (cityError) {
        console.log('⚠️ City search failed:', cityError.message);
      }
    }

    // ✅ Method 3: Try with street name only
    if (allResults.length === 0) {
      try {
        // Extract street name (look for "street", "st", "road", "rd")
        const streetMatch = query.match(/([^,]+)\s+(?:street|st|road|rd|nagar|colony|layout)/i);
        if (streetMatch) {
          const streetQuery = streetMatch[1].trim() + ' ' + (streetMatch[2] || '');
          console.log(`   Trying street search: "${streetQuery}"`);
          
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(streetQuery)}&format=json&limit=5&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'EcommerceApp/1.0'
              },
              timeout: 8000
            }
          );

          if (response.data && response.data.length > 0) {
            console.log(`   ✅ Found ${response.data.length} street results`);
            allResults = response.data;
          }
        }
      } catch (streetError) {
        console.log('⚠️ Street search failed:', streetError.message);
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
          fullAddress: loc.display_name || ''
        };
      });

      console.log(`✅ Found ${results.length} total results`);
      
      return res.status(200).json({
        success: true,
        data: results,
        count: results.length
      });
    }

    // ✅ No results found - Return empty with message
    console.log(`❌ No results found for "${query}"`);
    return res.status(200).json({
      success: true,
      data: [],
      count: 0,
      message: 'No locations found. Please try a different search term.'
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