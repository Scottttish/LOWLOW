import React, { useState, useEffect, useRef } from 'react';
import './Goal.css';

const Goal = () => {
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
        threshold: 0.3, // Сработает когда 30% секции будет видно
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

  return (
    <section className={`goal ${isVisible ? 'visible' : ''}`} ref={sectionRef}>
      <div className="goal-container">
        {/* Верхний контейнер */}
        <div className="goal-top">
          <div className="goal-header">
            <div className="goal-subtitle">/наша цель</div>
            <div className="goal-title">
              <span className="title-line">Совместное</span>
              <span className="title-line">использование еды</span>
            </div>
          </div>
          <div className="goal-description">
            Наши партнеры делятся свежими продуктами и блюдами, помогая друг другу и заботясь о планете.
          </div>
        </div>

        {/* Нижний контейнер с шагами */}
        <div className="goal-bottom">
          <div className="goal-item">
            <div className="goal-number">1</div>
            <div className="goal-text">Доступность еды для всех</div>
          </div>
          
          <div className="goal-item">
            <div className="goal-number">2</div>
            <div className="goal-text">Повышение социальной ответственности</div>
          </div>
          
          <div className="goal-item">
            <div className="goal-number">3</div>
            <div className="goal-text">Снижение излишков еды</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Goal;