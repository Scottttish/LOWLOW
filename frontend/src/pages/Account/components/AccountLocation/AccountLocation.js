import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from '../../../../context/AccountContext';
import './AccountLocation.css';

const AccountLocation = () => {
  const { location, saveLocation, refreshLocation } = useAccount();
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [ymapsLoaded, setYmapsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const placemarkInstance = useRef(null);

  useEffect(() => {
    if (typeof window.ymaps !== 'undefined') {
      setYmapsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
    script.type = 'text/javascript';
    
    script.onload = () => setYmapsLoaded(true);
    script.onerror = () => setYmapsLoaded(false);

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const initLocation = async () => {
      try {
        const result = await refreshLocation();
        if (result.success && result.location) {
          setUserLocation([result.location.latitude, result.location.longitude]);
          setIsSaved(true);
        } else {
          setUserLocation([43.238949, 76.889709]);
          setIsSaved(false);
        }
      } catch (error) {
        setUserLocation([43.238949, 76.889709]);
        setIsSaved(false);
      }
    };

    initLocation();
  }, []);

  useEffect(() => {
    if (mapRef.current && ymapsLoaded && !mapInitialized && userLocation) {
      initializeMap();
    }
  }, [ymapsLoaded, mapInitialized, userLocation]);

  const initializeMap = () => {
    if (typeof window.ymaps === 'undefined') return;

    window.ymaps.ready(() => {
      try {
        const initialCoords = userLocation || [43.238949, 76.889709];
        
        mapInstance.current = new window.ymaps.Map(mapRef.current, {
          center: initialCoords,
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        });

        placemarkInstance.current = new window.ymaps.Placemark(
          initialCoords,
          { balloonContent: 'Координаты: ' + formatCoordinates(initialCoords) },
          { preset: 'islands#blueFoodIcon', draggable: true }
        );

        mapInstance.current.geoObjects.add(placemarkInstance.current);

        placemarkInstance.current.events.add('dragend', (e) => {
          const coords = placemarkInstance.current.geometry.getCoordinates();
          handleLocationSelect(coords);
        });

        mapInstance.current.events.add('click', (e) => {
          const coords = e.get('coords');
          placemarkInstance.current.geometry.setCoordinates(coords);
          handleLocationSelect(coords);
        });

        setMapInitialized(true);
        
        if (userLocation) {
          mapInstance.current.setCenter(userLocation, 15);
        }

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    });
  };

  const handleLocationSelect = (coords) => {
    setUserLocation(coords);
    if (placemarkInstance.current) {
      placemarkInstance.current.properties.set('balloonContent', 'Координаты: ' + formatCoordinates(coords));
    }
  };

  const formatCoordinates = (coords) => {
    if (!coords) return 'Не выбрано';
    return `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
  };

  const detectCurrentLocation = async () => {
    setIsLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = [latitude, longitude];
          
          setUserLocation(newLocation);
          
          if (placemarkInstance.current && mapInstance.current) {
            placemarkInstance.current.geometry.setCoordinates(newLocation);
            placemarkInstance.current.properties.set('balloonContent', 'Координаты: ' + formatCoordinates(newLocation));
            mapInstance.current.setCenter(newLocation, 15);
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          setIsLoading(false);
          alert('Не удалось определить местоположение');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Геолокация не поддерживается');
      setIsLoading(false);
    }
  };

  const saveLocationHandler = async () => {
    if (!userLocation) return;

    setSaving(true);
    try {
      const [latitude, longitude] = userLocation;
      
      await saveLocation({
        latitude,
        longitude
      });
      
      setIsSaved(true);
      alert('Местоположение успешно сохранено!');
      
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Ошибка при сохранении местоположения: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const changeLocation = () => {
    setIsSaved(false);
  };

  return (
    <div className="account-section">
      <h2 className="section-title">Мое местоположение</h2>
      
      <div className="map-container">
        <div 
          ref={mapRef} 
          className="yandex-map"
          style={{ width: '100%', height: '400px' }}
        >
          {!ymapsLoaded && (
            <div className="map-loading">
              <p>Загрузка карты...</p>
            </div>
          )}
        </div>
        
        <div className="map-controls">
          {!isSaved ? (
            <>
              <div className="location-info">
                <div className="coordinates-label">Координаты</div>
                <div className="coordinates-text">
                  {userLocation ? formatCoordinates(userLocation) : 'Выберите местоположение на карте'}
                </div>
              </div>
              
              <div className="control-buttons">
                <button 
                  className="location-btn"
                  onClick={detectCurrentLocation}
                  disabled={isLoading || !mapInitialized}
                >
                  {isLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      Определение...
                    </>
                  ) : (
                    'Определить местоположение'
                  )}
                </button>
                
                {userLocation && (
                  <button 
                    className="save-btn" 
                    onClick={saveLocationHandler}
                    disabled={saving}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить координаты'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="saved-location">
              <div className="saved-badge">
                <span className="check-icon">✓</span>
                Координаты сохранены
              </div>
              <div className="saved-coordinates">
                <div className="saved-label">Текущие координаты</div>
                <div className="saved-coordinates-text">
                  {formatCoordinates(userLocation)}
                </div>
              </div>
              <button 
                className="change-btn" 
                onClick={changeLocation}
                disabled={saving}
              >
                Изменить координаты
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountLocation;