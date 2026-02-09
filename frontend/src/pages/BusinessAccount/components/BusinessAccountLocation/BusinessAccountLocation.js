// frontend\src\pages\BusinessAccount\components\BusinessAccountLocation\BusinessAccountLocation.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './BusinessAccountLocation.css';

const BusinessAccountLocation = () => {
  const { user, saveBusinessLocation } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [ymapsLoaded, setYmapsLoaded] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const placemarkInstance = useRef(null);

  // Динамическая загрузка Яндекс Карт
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

  // Загружаем сохраненное местоположение из базы данных
  useEffect(() => {
    if (user) {
      if (user.longitude && user.latitude) {
        setUserLocation([parseFloat(user.latitude), parseFloat(user.longitude)]);
        setIsSaved(true);
      }
      if (user.city) setCity(user.city);
      if (user.address) setAddress(user.address);
    }
  }, [user]);

  // Инициализация карты
  useEffect(() => {
    if (mapRef.current && ymapsLoaded && !mapInitialized) {
      initializeMap();
    }
  }, [ymapsLoaded, mapInitialized]);

  const initializeMap = () => {
    if (typeof window.ymaps === 'undefined') return;

    window.ymaps.ready(() => {
      try {
        const initialCoords = userLocation || [43.238949, 76.889709]; // Алматы по умолчанию
        
        mapInstance.current = new window.ymaps.Map(mapRef.current, {
          center: initialCoords,
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        });

        mapInstance.current.options.set('theme', 'dark');

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
    setIsSaved(false);
    // Обновляем балун метки
    if (placemarkInstance.current) {
      placemarkInstance.current.properties.set('balloonContent', 'Координаты: ' + formatCoordinates(coords));
    }
  };

  const formatCoordinates = (coords) => {
    if (!coords) return 'Не выбрано';
    return `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = [latitude, longitude];
          
          setUserLocation(newLocation);
          setIsSaved(false);
          
          if (placemarkInstance.current && mapInstance.current) {
            placemarkInstance.current.geometry.setCoordinates(newLocation);
            placemarkInstance.current.properties.set('balloonContent', 'Координаты: ' + formatCoordinates(newLocation));
            mapInstance.current.setCenter(newLocation, 15);
          }
          
          // Получаем адрес по координатам
          try {
            if (typeof window.ymaps !== 'undefined') {
              window.ymaps.ready(async () => {
                const geocoder = window.ymaps.geocode(newLocation);
                geocoder.then((res) => {
                  const firstGeoObject = res.geoObjects.get(0);
                  if (firstGeoObject) {
                    const address = firstGeoObject.getAddressLine();
                    const city = firstGeoObject.getLocalities()[0] || '';
                    setAddress(address);
                    setCity(city);
                  }
                });
              });
            }
          } catch (error) {
            console.error('Error getting address:', error);
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

  const saveLocation = async () => {
    if (userLocation) {
      try {
        await saveBusinessLocation(
          userLocation[1], // longitude
          userLocation[0], // latitude
          city,
          address
        );
        
        setIsSaved(true);
        alert('Координаты успешно сохранены!');
      } catch (error) {
        console.error('Ошибка сохранения координат:', error);
        alert(error.message || 'Ошибка сохранения координат');
      }
    }
  };

  const changeLocation = () => {
    setIsSaved(false);
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    setIsSaved(false);
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
    setIsSaved(false);
  };

  return (
    <div className="business-account-section">
      <h2 className="section-title">Местоположение компании</h2>
      
      <div className="map-container">
        <div 
          ref={mapRef} 
          className="yandex-map"
          style={{ width: '100%', height: '400px' }}
        >
          {!ymapsLoaded && (
            <div className="map-loading">
              <div className="loading-spinner"></div>
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
              
              <div className="address-inputs">
                <div className="form-group">
                  <label className="form-label">Город</label>
                  <input
                    type="text"
                    value={city}
                    onChange={handleCityChange}
                    className="form-input"
                    placeholder="Введите город"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Адрес</label>
                  <input
                    type="text"
                    value={address}
                    onChange={handleAddressChange}
                    className="form-input"
                    placeholder="Введите адрес"
                  />
                </div>
              </div>
              
              <div className="control-buttons">
                <button 
                  className="location-btn"
                  onClick={getCurrentLocation}
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
                  <button className="save-btn" onClick={saveLocation}>
                    Сохранить координаты
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
              {address && (
                <div className="saved-address">
                  <div className="saved-label">Адрес</div>
                  <div className="saved-address-text">
                    {city && `${city}, `}{address}
                  </div>
                </div>
              )}
              <button className="change-btn" onClick={changeLocation}>
                Изменить координаты
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessAccountLocation;