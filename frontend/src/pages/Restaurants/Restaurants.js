import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Restaurants.css';
import restaurant1 from '../../assets/images/restaurant1.jpg';
import headerImage1 from '../../assets/images/header-food1.jpg';
import headerImage2 from '../../assets/images/header-food2.jpg';

const Restaurants = () => {
  const { user: currentUser, getToken, getRestaurants } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState('distance');
  const [cityFilter, setCityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    loadRestaurants();
    getUserLocation();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const restaurantsData = await getRestaurants();
      
      const formattedCompanies = restaurantsData.map(restaurant => ({
        id: restaurant.id,
        companyName: restaurant.company_name,
        email: restaurant.email,
        phone: restaurant.phone,
        city: restaurant.city || 'Астана',
        avatar: restaurant.avatar_url,
        rating: 4.5,
        coordinates: {
          lat: restaurant.latitude || 51.137255,
          lng: restaurant.longitude || 71.435313
        },
        address: restaurant.address
      }));
      
      setCompanies(formattedCompanies);
    } catch (error) {
      console.error('Ошибка загрузки ресторанов:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              source: 'geolocation'
            });
          },
          (error) => {
            getLocationFromProfile();
          },
          {
            timeout: 10000,
            enableHighAccuracy: false
          }
        );
      } else {
        getLocationFromProfile();
      }
    } catch (error) {
      getLocationFromProfile();
    }
  };

  const getLocationFromProfile = () => {
    try {
      if (currentUser && currentUser.longitude && currentUser.latitude) {
        setUserLocation({
          lat: currentUser.latitude,
          lng: currentUser.longitude,
          source: 'profile'
        });
      } else {
        const defaultCity = currentUser?.city || 'Астана';
        const defaultCoords = getCityCoordinates(defaultCity);
        setUserLocation({
          ...defaultCoords,
          source: 'default_city'
        });
      }
    } catch (error) {
      setUserLocation({
        lat: 51.137255,
        lng: 71.435313,
        source: 'fallback'
      });
    }
  };

  const getCityCoordinates = (city) => {
    const cityCoordinates = {
      'Астана': { lat: 51.137255, lng: 71.435313 },
      'Алматы': { lat: 43.238949, lng: 76.889709 },
      'Шымкент': { lat: 42.341686, lng: 69.590101 },
      'Караганда': { lat: 49.804836, lng: 73.095901 },
      'Актобе': { lat: 50.283933, lng: 57.166817 }
    };
    return cityCoordinates[city] || cityCoordinates['Астана'];
  };

  const getCompanyCoordinates = (company) => {
    try {
      if (company.coordinates && company.coordinates.lat && company.coordinates.lng) {
        return company.coordinates;
      }
      
      const cityCoords = getCityCoordinates(company.city || 'Астана');
      const randomOffset = () => (Math.random() - 0.5) * 0.02;
      
      return {
        lat: cityCoords.lat + randomOffset(),
        lng: cityCoords.lng + randomOffset()
      };
    } catch (error) {
      return getCityCoordinates(company.city || 'Астана');
    }
  };

  const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    try {
      const distanceThreshold = 500000;
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      if (distance > distanceThreshold) {
        return 1000;
      }
      
      return Math.max(1, distance);
    } catch (error) {
      return 500;
    }
  };

  const calculateWalkingTime = (distanceMeters) => {
    try {
      const walkingSpeed = 1.4;
      const timeInMinutes = Math.round(distanceMeters / walkingSpeed / 60);
      return Math.max(1, timeInMinutes);
    } catch (error) {
      return 10;
    }
  };

  const getCompanyData = (company) => {
    try {
      if (!userLocation || !company.coordinates) {
        return getFallbackCompanyData(company);
      }

      const distanceMeters = calculateDistanceInMeters(
        userLocation.lat, userLocation.lng,
        company.coordinates.lat, company.coordinates.lng
      );
      
      const walkingTime = calculateWalkingTime(distanceMeters);

      let distanceDisplay;
      if (distanceMeters < 1000) {
        distanceDisplay = `${Math.round(distanceMeters)} м`;
      } else {
        distanceDisplay = `${(distanceMeters / 1000).toFixed(1)} км`;
      }

      const deliveryTime = getDeliveryTime(distanceMeters);

      return {
        distance: distanceDisplay,
        walkingTime: walkingTime.toString(),
        deliveryTime,
        distanceMeters
      };
    } catch (error) {
      return getFallbackCompanyData(company);
    }
  };

  const getFallbackCompanyData = (company) => {
    const distances = ['350 м', '650 м', '1.2 км', '1.8 км', '2.5 км'];
    const randomDistance = distances[Math.floor(Math.random() * distances.length)];
    
    return {
      distance: randomDistance,
      walkingTime: '8',
      deliveryTime: '20-25 минут',
      distanceMeters: 500
    };
  };

  const getDeliveryTime = (distanceMeters) => {
    if (distanceMeters < 500) return '15-20 минут';
    if (distanceMeters < 1000) return '20-25 минут';
    if (distanceMeters < 2000) return '25-30 минут';
    if (distanceMeters < 5000) return '30-40 минут';
    return '40-50 минут';
  };

  const isCurrentUserCompany = (company) => {
    if (!currentUser) return false;
    return currentUser.email === company.email || 
           (currentUser.companyName && currentUser.companyName === company.companyName);
  };

  const openYandexRoute = (company, e) => {
    e.stopPropagation();
    try {
      if (!userLocation || !company.coordinates) {
        const searchQuery = encodeURIComponent(`${company.companyName} ${company.city}`);
        window.open(`https://yandex.ru/maps/10335/kazakhstan/search/${searchQuery}`, '_blank');
        return;
      }

      const { lat: userLat, lng: userLng } = userLocation;
      const { lat: companyLat, lng: companyLng } = company.coordinates;

      const yandexUrl = `https://yandex.ru/maps/?rtext=${userLat},${userLng}~${companyLat},${companyLng}&rtt=pd`;
      window.open(yandexUrl, '_blank');
      
    } catch (error) {
      const searchQuery = encodeURIComponent(`${company.companyName} ${company.city}`);
      window.open(`https://yandex.ru/maps/10335/kazakhstan/search/${searchQuery}`, '_blank');
    }
  };

  const handleRestaurantClick = (company) => {
    if (!currentUser) {
      setShowAuthDialog(true);
      return;
    }
    navigate(`/restaurant/${company.id}`);
  };

  const handleAuthConfirm = () => {
    setShowAuthDialog(false);
    navigate('/login');
  };

  const handleAuthCancel = () => {
    setShowAuthDialog(false);
  };

  const getSortedCompanies = () => {
    try {
      let filteredCompanies = companies;

      if (cityFilter !== 'all') {
        filteredCompanies = companies.filter(company => 
          company.city === cityFilter
        );
      }

      if (sortBy === 'rating') {
        return [...filteredCompanies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortBy === 'distance' && userLocation) {
        return [...filteredCompanies].sort((a, b) => {
          const dataA = getCompanyData(a);
          const dataB = getCompanyData(b);
          return dataA.distanceMeters - dataB.distanceMeters;
        });
      }

      return filteredCompanies;
    } catch (error) {
      return companies;
    }
  };

  const getCompanyImage = (company) => {
    try {
      if (company.avatar && typeof company.avatar === 'string' && company.avatar.startsWith('data:image')) {
        return company.avatar;
      }
      return restaurant1;
    } catch (error) {
      return restaurant1;
    }
  };

  const sortedCompanies = getSortedCompanies();

  if (loading) {
    return (
      <section className="restaurants-page">
        <div className="restaurants-container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            color: 'white',
            fontSize: '18px'
          }}>
            Определяем местоположение...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="restaurants-page">
      <div className="restaurants-container">
        <div className="restaurants-header">
          <h1 className="restaurants-title">
            Бери выгоду без<br /> переплат
          </h1>
          <div className="header-content">
            <div className="header-text">
              <p className="header-description">
                Покупайте продукты вовремя, чтобы<br />
                блюда оставались вкусными и<br />
                ароматными
              </p>
            </div>
            <div className="header-images">
              <div className="header-image">
                <img src={headerImage1} alt="Food 1" />
              </div>
              <div className="header-image">
                <img src={headerImage2} alt="Food 2" />
              </div>
            </div>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-container">
            <div className="filter-group">
              <span className="filter-label">Сортировка</span>
              <select 
                className="filter-select" 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="distance">По расстоянию</option>
                <option value="rating">По рейтингу</option>
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">Город</span>
              <select 
                className="filter-select"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="all">Все города</option>
                <option value="Астана">Астана</option>
                <option value="Алматы">Алматы</option>
                <option value="Шымкент">Шымкент</option>
              </select>
            </div>
          </div>
        </div>

        <div className="restaurants-grid">
          {sortedCompanies.length === 0 ? (
            <div className="empty-state">
              <h3>В базе данных пока нет ресторанов</h3>
              <p>Зарегистрируйте свой ресторан в системе!</p>
            </div>
          ) : (
            sortedCompanies.map((company) => {
              const companyData = getCompanyData(company);
              const isOwnCompany = isCurrentUserCompany(company);
              
              return (
                <div 
                  key={company.id} 
                  className="restaurant-card"
                  onClick={() => handleRestaurantClick(company)}
                >
                  <div className="restaurant-image">
                    <img 
                      src={getCompanyImage(company)} 
                      alt={company.companyName} 
                      onError={(e) => {
                        e.target.src = restaurant1;
                      }}
                    />
                    <div className="rating-badge">
                      ⭐ {typeof company.rating === 'number' ? company.rating.toFixed(1) : '4.5'}
                    </div>
                    {isOwnCompany && (
                      <div className="own-restaurant-badge">
                        Ваш ресторан
                      </div>
                    )}
                  </div>
                  <div className="restaurant-info">
                    <h3 className="restaurant-name">{company.companyName}</h3>
                    <p className="delivery-time">{companyData.deliveryTime}</p>
                    <div className="restaurant-meta">
                      <div className="distance-info">
                        <div className="distance">{companyData.distance}</div>
                        <div className="walking-time">~{companyData.walkingTime} мин пешком</div>
                      </div>
                      {!isOwnCompany && (
                        <button 
                          className="route-button"
                          onClick={(e) => openYandexRoute(company, e)}
                          title="Построить маршрут в Яндекс Картах"
                        >
                          Маршрут
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAuthDialog && (
        <div className="auth-dialog-overlay">
          <div className="auth-dialog">
            <div className="auth-dialog-content">
              <h3>Требуется вход в систему</h3>
              <p>Чтобы просмотреть меню ресторана, необходимо войти в систему</p>
              <div className="auth-dialog-actions">
                <button 
                  className="auth-cancel-btn"
                  onClick={handleAuthCancel}
                >
                  Отмена
                </button>
                <button 
                  className="auth-confirm-btn"
                  onClick={handleAuthConfirm}
                >
                  Войти
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Restaurants;