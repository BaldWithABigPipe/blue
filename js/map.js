// Map initialization with error handling and loading states - IE11 compatible
document.addEventListener('DOMContentLoaded', function() {
    var mapContainer = document.getElementById('map');
    
    if (!mapContainer) {
        return;
    }

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        return;
    }

    try {
        // Initialize map with correct coordinates for Chavannes de Bogis
        var map = L.map('map', {
            center: [46.3200, 6.1700],
            zoom: 15,
            zoomControl: true,
            scrollWheelZoom: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            boxZoom: false,
            keyboard: false,
            tap: true
        });
        
        // Add OpenStreetMap tiles with better configuration
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
            minZoom: 10,
            subdomains: 'abc'
        }).addTo(map);
        
        // Function to get marker size based on screen width
        var getMarkerSize = function() {
            var width = window.innerWidth;
            if (width <= 320) return 24;
            if (width <= 400) return 28;
            if (width <= 600) return 32;
            if (width <= 768) return 36;
            if (width <= 900) return 40;
            return 48; // Default size
        };

        // Create custom marker icon with improved design
        var createCustomIcon = function(size) {
            var halfSize = size / 2;
            return L.divIcon({
                className: 'custom-marker',
                html: 
                    '<div class="marker-icon">' +
                        '<div class="marker-pulse"></div>' +
                        '<svg width="' + (size * 0.5) + '" height="' + (size * 0.5) + '" viewBox="0 0 24 24" fill="currentColor">' +
                            '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>' +
                        '</svg>' +
                    '</div>',
                iconSize: [size, size],
                iconAnchor: [halfSize, halfSize], // Center both horizontally and vertically
                popupAnchor: [0, -halfSize]
            });
        };

        var initialSize = getMarkerSize();
        var customIcon = createCustomIcon(initialSize);
        
        // Add marker for ROYALTRANSFER location with fixed coordinates
        var markerCoords = [46.3200, 6.1700];
        var marker = L.marker(markerCoords, {
            icon: customIcon,
            title: 'ROYALTRANSFER'
        }).addTo(map);
        
        // Create enhanced popup content
        var popupContent = 
            '<div class="map-popup">' +
                '<h3>ROYALTRANSFER</h3>' +
                '<p><strong>Les Champs Blancs</strong><br>' +
                '1279 Chavannes de Bogis<br>' +
                'Switzerland</p>' +
                '<p style="margin-top: 8px; font-size: 12px; opacity: 0.8;">' +
                    'Premium luxury transportation services' +
                '</p>' +
                '<div style="margin-top: 12px; text-align: center;">' +
                    '<small style="color: var(--color-accent); font-weight: 600;">' +
                        'Click for more info' +
                    '</small>' +
                '</div>' +
            '</div>';
        
        // Bind popup to marker with enhanced options
        marker.bindPopup(popupContent, {
            maxWidth: 280,
            className: 'custom-popup',
            closeButton: true,
            autoClose: false,
            closeOnClick: false
        });
        
        // Remove loading indicator
        var loadingElement = mapContainer.querySelector('.map-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Center map on marker with proper zoom and ensure marker is visible
        setTimeout(function() {
            map.setView(markerCoords, 16);
            
            // Ensure marker is properly positioned
            var markerElement = marker.getElement();
            if (markerElement) {
                // Marker element found and positioned
            }
        }, 200);
        
        // Add click handler to open popup with animation
        marker.on('click', function() {
            this.openPopup();
            // Add click animation using CSS classes instead of transform
            var markerElement = this.getElement();
            if (markerElement) {
                var iconElement = markerElement.querySelector('.marker-icon');
                if (iconElement) {
                    iconElement.classList.add('marker-click');
                    setTimeout(function() {
                        iconElement.classList.remove('marker-click');
                    }, 200);
                }
            }
        });
        
        // Add hover effects using CSS classes
        marker.on('mouseover', function() {
            var markerElement = this.getElement();
            if (markerElement) {
                var iconElement = markerElement.querySelector('.marker-icon');
                if (iconElement) {
                    iconElement.classList.add('marker-hover');
                }
            }
        });
        
        marker.on('mouseout', function() {
            var markerElement = this.getElement();
            if (markerElement) {
                var iconElement = markerElement.querySelector('.marker-icon');
                if (iconElement) {
                    iconElement.classList.remove('marker-hover');
                }
            }
        });
        
        // Handle map load events
        map.whenReady(function() {
            // Map loaded successfully
            
            // Ensure marker stays at correct position after map loads
            setTimeout(function() {
                marker.setLatLng(markerCoords);
            }, 500);
        });
        
        // Prevent marker from moving during zoom/pan operations
        map.on('zoomend', function() {
            marker.setLatLng(markerCoords);
        });
        
        map.on('moveend', function() {
            marker.setLatLng(markerCoords);
        });

        // Handle window resize to update marker size
        var resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                var newSize = getMarkerSize();
                var newIcon = createCustomIcon(newSize);
                marker.setIcon(newIcon);
            }, 250);
        });
        
    } catch (error) {
        mapContainer.innerHTML = 
            '<div class="map-loading">' +
                '<p class="map-loading__text">Error loading map</p>' +
            '</div>';
    }
}); 