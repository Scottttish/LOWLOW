import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Добавьте этот импорт
import './News.css';

// Импортируем изображения новостей
import news1 from '../assets/news/news1.png';
import news2 from '../assets/news/news2.png';
import news3 from '../assets/news/news3.png';
import news4 from '../assets/news/news4.png';

const News = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const navigate = useNavigate(); // Добавьте useNavigate

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.3,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const newsItems = [
    { 
      image: news1, 
      title: "K 2035 году Казахстан повысит продовольственную безопасность", 
      key: "news1",
      url: "https://astanatimes.com/2024/08/kazakhstan-to-boost-food-security-by-2035-say-experts/" 
    },
    { 
      image: news2, 
      title: "В Дифферданже открылся пункт обмена еды", 
      key: "news2",
      url: "https://foodsharing.lu/foodsharing-point-opened-in-differdange/"
    },
    { 
      image: news3, 
      title: "Казахстанцы тратят более половины семейного бюджета на еду", 
      key: "news3",
      url: "https://timesca.com/kazakhstanis-spend-over-half-their-family-budget-on-food/"
    },
    { 
      image: news4, 
      title: "Спящий великан пробуждается", 
      key: "news4",
      url: "https://www.eureporter.co/world/kazakhstan/2025/09/16/from-oil-to-soil-how-kazakhstans-quiet-food-diplomacy-can-rebalance-a-fragmented-world/"
    }
  ];

  const handleNewsClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAllNewsClick = () => {
    navigate('/all-news'); // Измените на внутренний переход
  };

  return (
    <section className={`news ${isVisible ? 'visible' : ''}`} ref={sectionRef}>
      <div className="news-container">
        {/* Верхний контейнер */}
        <div className="news-top">
          <div className="news-header">
            <div className="news-subtitle">/новости мира</div>
            <h1 className="news-title">
              Что происходит в мире<br />фудшеринга
            </h1>
          </div>
          <button className="news-button" onClick={handleAllNewsClick}>
            к новостям
          </button>
        </div>

        {/* Разделительная линия */}
        <div className="divider"></div>

        {/* Нижний контейнер с новостями */}
        <div className="news-bottom">
          <div className="news-grid">
            {newsItems.map((news, index) => (
              <button
                key={news.key}
                className={`news-item news-${index + 1}`}
                onClick={() => handleNewsClick(news.url)}
              >
                <img 
                  src={news.image} 
                  alt={news.title}
                  className="news-image"
                />
                <div className="news-overlay">
                  <span className="news-title-text">{news.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default News;