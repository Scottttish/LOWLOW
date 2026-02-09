import React, { useState, useEffect, useRef } from 'react';
import './FAQ.css';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
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

  const faqItems = [
    {
      question: "ПОЧЕМУ ЦЕНЫ ТАКИЕ НИЗКИЕ?",
      answer: "Так как данный сайт был разработан специально для борьбы с выбросами пищи, цены тут значительно ниже."
    },
    {
      question: "КТО МОЖЕТ СТАТЬ УЧАСТНИКОМ ПЛАТФОРМЫ?",
      answer: "Любой - как частные лица, так и кафе, рестораны или магазины."
    },
    {
      question: "КАКОЙ МЕТОД ОПЛАТЫ ВЫ ПРИНИМАЕТЕ?",
      answer: "На данный момент у нас оплата проходит только по карте."
    },
    {
      question: "ЧТО ДЕЛАТЬ, ЕСЛИ ПРОДУКТ ОКАЗАЛСЯ ИСПОРЧЕННЫМ?",
      answer: "Сообщите об этом через форму обратной связи - мы проверим ситуацию и примем меры."
    }
  ];

  const toggleItem = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className={`faq ${isVisible ? 'visible' : ''}`} ref={sectionRef}>
      <div className="faq-container">
        {/* Верхний контейнер */}
        <div className="faq-top">
          <div className="faq-header">
            <div className="faq-subtitle">/FAQ</div>
            <h2 className="faq-title">Частые вопросы</h2>
            <p className="faq-description">
              Ознакомьтесь с ответами на самые<br />
              частые вопросами.
            </p>
          </div>
        </div>

        {/* Нижний контейнер с аккордеоном */}
        <div className="faq-bottom">
          <div className="faq-items">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeIndex === index ? 'active' : ''} faq-item-${index + 1}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleItem(index)}
                >
                  <span className="question-text">{item.question}</span>
                  <span className="faq-icon">
                    {activeIndex === index ? '−' : '+'}
                  </span>
                </button>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;