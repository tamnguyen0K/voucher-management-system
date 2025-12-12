/**
 * File: public/js/maps.js
 * 
 * Mô tả: Google Maps integration
 * - Hiển thị bản đồ cho location detail
 * - Geocoding địa chỉ thành tọa độ
 * - Marker và InfoWindow
 * - Directions và Distance Matrix
 */

let map;
let marker;
let geocoder;

// Khởi tạo Google Maps
function initMap(lat = 10.8231, lng = 106.6297) {
  const mapOptions = {
    center: { lat, lng },
    zoom: 15,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true
  };

  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  geocoder = new google.maps.Geocoder();
}

// Geocode địa chỉ thành tọa độ và hiển thị marker
function geocodeAddress(address, locationName) {
  if (!geocoder) {
    console.error('Geocoder chưa được khởi tạo');
    return;
  }

  geocoder.geocode({ address: address + ', Vietnam' }, (results, status) => {
    if (status === 'OK') {
      const location = results[0].geometry.location;
      map.setCenter(location);

      // Xóa marker cũ nếu có
      if (marker) {
        marker.setMap(null);
      }

      // Tạo marker mới
      marker = new google.maps.Marker({
        map: map,
        position: location,
        title: locationName,
        animation: google.maps.Animation.DROP
      });

      // Tạo InfoWindow
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h6 style="margin: 0 0 5px 0; font-weight: bold;">${locationName}</h6>
            <p style="margin: 0; font-size: 13px; color: #666;">${address}</p>
          </div>
        `
      });

      // Hiển thị InfoWindow khi click marker
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Tự động mở InfoWindow
      infoWindow.open(map, marker);
    } else {
      console.error('Geocode không thành công: ' + status);
      // Fallback về tọa độ mặc định (Sài Gòn)
      initMap();
    }
  });
}

// Tính khoảng cách từ vị trí hiện tại đến location
function calculateDistance(destinationAddress) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const origin = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );

      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destinationAddress + ', Vietnam'],
          travelMode: 'DRIVING'
        },
        (response, status) => {
          if (status === 'OK') {
            const distance = response.rows[0].elements[0].distance.text;
            const duration = response.rows[0].elements[0].duration.text;
            
            const distanceElement = document.getElementById('distance-info');
            if (distanceElement) {
              distanceElement.innerHTML = `
                <div class="alert alert-info">
                  <i class="fas fa-route"></i> 
                  Khoảng cách: <strong>${distance}</strong> 
                  (${duration} bằng xe)
                </div>
              `;
            }
          }
        }
      );
    });
  }
}

// Load Google Maps script dynamically
function loadGoogleMapsScript(apiKey, callback) {
  if (typeof google !== 'undefined' && google.maps) {
    callback();
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initializeMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  
  window.initializeMap = callback;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initMap,
    geocodeAddress,
    calculateDistance,
    loadGoogleMapsScript
  };
}
