import React, { useState, useEffect } from 'react';
import './Quotes.css';
import quoteBackground from '../assets/images/quote-bg.jpg';

const Quotes = () => {
  const [currentQuote, setCurrentQuote] = useState(0);

  const quotes = [
    {
      text: "ОСОЗНАННОСТЬ\nНАЧИНАЕТСЯ С ТОГО, КАК МЫ ОБРАЩАЕМСЯ С ХЛЕБОМ.",
      author: "АЛЬБЕРТ ШВЕЙЦЕР",
      title: "Лауреат Нобелевской премии мира"
    },
    {
      text: "ЛЮБОВЬ И ГОЛОД\nПРАВЯТ МИРОМ.",
      author: "Ф. ШИЛЛЕР",
      title: "Поэт"
    },
    {
      text: "ЖИЗНЬ - ЭТО КОМБИНАЦИЯ\nМАГИИ И МАКАРОН.",
      author: "ФЕДЕРИКО ФЕЛЛИНИ",
      title: "Победитель премии Оскар"
    },
    {
      text: "НЕТ ЛЮБВИ БОЛЕЕ ИСКРЕННЕЙ, ЧЕМ\nЛЮБОВЬ К ЕДЕ.",
      author: "БЕРНАРД ШОУ",
      title: "Драматург"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <section className="quotes">
      <div 
        className="quotes-background"
        style={{ backgroundImage: `url(${quoteBackground})` }}
      >
        <div className="quotes-container">
          <div className="quote-content">
            <div className="quote-mark">“</div>
            <div className="quote-text">
              {quotes[currentQuote].text.split('\n').map((line, index) => (
                <span key={index}>
                  {line}
                  {index < quotes[currentQuote].text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
            <div className="quote-author">
              <div className="author-name">{quotes[currentQuote].author}</div>
              <div className="author-title">{quotes[currentQuote].title}</div>
            </div>
          </div>
        </div>
        
        {/* Индикаторы */}
        <div className="quote-indicators">
          {quotes.map((_, index) => (
            <div 
              key={index}
              className={`quote-indicator ${index === currentQuote ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Quotes;