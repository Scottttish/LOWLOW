import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AllNews.css';

// Импортируем изображения новостей (добавьте недостающие 5 изображений)
import news1 from '../../assets/news/news1.png';
import news2 from '../../assets/news/news2.png';
import news3 from '../../assets/news/news3.png';
import news4 from '../../assets/news/news4.png';
import news5 from '../../assets/news/news5.png';
import news6 from '../../assets/news/news6.png';
import news7 from '../../assets/news/news7.png';
import news8 from '../../assets/news/news8.png';
import news9 from '../../assets/news/news9.png';

const AllNews = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const allNewsItems = [
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
    },
    // Дополнительные 5 новостей
    { 
      image: news5, 
      title: "Европарламент повышает нормы сокращения пищевых отходов.", 
      key: "news5",
      url: "https://xn--90aiaaaep3bdjldk.xn--p1ai/%d0%b5%d0%b2%d1%80%d0%be%d0%bf%d0%b0%d1%80%d0%bb%d0%b0%d0%bc%d0%b5%d0%bd%d1%82-%d0%bf%d0%be%d0%b2%d1%8b%d1%88%d0%b0%d0%b5%d1%82-%d0%bd%d0%be%d1%80%d0%bc%d1%8b-%d1%81%d0%be%d0%ba%d1%80%d0%b0%d1%89/"
    },
    { 
      image: news6, 
      title: "Секреты устойчивой гастрономии", 
      key: "news6",
      url: "https://www.dw.com/ru/gotovim-ekologochno-soveti-nemezkogo-shef-povara/a-58230347"
    },
    { 
      image: news7, 
      title: "Фудтех: как IT-решения меняют рынок еды", 
      key: "news7",
      url: "https://www.simbirsoft.com/blog/fudtekh-kak-it-resheniya-menyayut-rynok-edy/"
    },
    { 
      image: news8, 
      title: "Подарил — считай, продал", 
      key: "news8",
      url: "https://esg.x5.ru/ru/news/281122/"
    },
    { 
      image: news9, 
      title: "Экономика совместного потребления в Казахстане", 
      key: "news9",
      url: "https://caer.narxoz.kz/jour/article/view/1093"
    }
  ];

  const handleNewsClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className={`all-news ${isVisible ? 'visible' : ''}`}>
      <div className="all-news-container">
        {/* Верхний контейнер */}
        <div className="all-news-top">
          <div className="all-news-header">
            <div className="all-news-subtitle">/все новости</div>
            <h1 className="all-news-title">
              Все новости мира<br />фудшеринга
            </h1>
          </div>
          <button className="all-news-back-button" onClick={handleBackClick}>
            на главную
          </button>
        </div>

        {/* Разделительная линия */}
        <div className="all-news-divider"></div>

        {/* Контейнер со всеми новостями */}
        <div className="all-news-bottom">
          <div className="all-news-grid">
            {allNewsItems.map((news, index) => (
              <button
                key={news.key}
                className={`all-news-item all-news-${index + 1}`}
                onClick={() => handleNewsClick(news.url)}
              >
                <img 
                  src={news.image} 
                  alt={news.title}
                  className="all-news-image"
                />
                <div className="all-news-overlay">
                  <span className="all-news-title-text">{news.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllNews;