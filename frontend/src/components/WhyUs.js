import React, { useState, useEffect, useRef } from 'react';
import './WhyUs.css';

// Импортируем логотипы из правильной папки
import line_brew from '../assets/partners/line_brew.png';
import delpapa from '../assets/partners/delpapa.png';
import c_boom from '../assets/partners/c_boom.png';
import brioche from '../assets/partners/brioche.png';
import c_shop from '../assets/partners/c_shop.png';
import pizza_house from '../assets/partners/pizza_house.png';
import c_travelers from '../assets/partners/c_travelers.png';

const WhyUs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

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

  const partners = [
    { logo: line_brew, name: "INF BREW" },
    { logo: delpapa, name: "DELPAPA" },
    { logo: c_boom, name: "C BOOM" },
    { logo: brioche, name: "BRIOCHE" },
    { logo: c_shop, name: "C SHOP" },
    { logo: pizza_house, name: "PIZZA HOUSE" },
    { logo: c_travelers, name: "C TRAVELERS" }
  ];

  const scrollingPartners = [...partners, ...partners];

  return (
    <section className={`why-us ${isVisible ? 'visible' : ''}`} ref={sectionRef}>
      <div className="why-us-container">
        {/* Верхний контейнер */}
        <div className="why-us-top">
          <div className="why-us-header">
            <div className="why-us-subtitle">/почему выбирают нас</div>
            <h2 className="why-us-title">Проверенные заведения</h2>
            <p className="why-us-description">
              Все заведения проверенные и каждая еда, закуски продаются по доступным ценам.
            </p>
          </div>
        </div>

        {/* Нижний контейнер с бегущей строкой партнеров */}
        <div className="why-us-bottom">
          {/* Градиентные блюры по краям */}
          <div className="fade-left"></div>
          <div className="fade-right"></div>
          
          <div className="partners-scroll">
            <div className="partners-track">
              {scrollingPartners.map((partner, index) => (
                <div key={index} className="partner-item">
                  <img 
                    src={partner.logo} 
                    alt={partner.name}
                    className="partner-logo"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;