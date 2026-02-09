import React, { useState, useEffect, useRef } from 'react';
import './Hero.css';
import photo1 from '../assets/images/photo1.jpg';
import photo2 from '../assets/images/photo2.jpg';

const Hero = () => {
  const [scale, setScale] = useState(1);
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const newScale = Math.max(0.7, 1 - scrollY * 0.001);
      setScale(newScale);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section className={`hero ${isVisible ? 'visible' : ''}`} ref={sectionRef}>
      <div className="hero-container">
        <div 
          className="images-container"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <img 
            src={photo1} 
            alt="Food 1" 
            className="hero-image left-image"
          />
          <img 
            src={photo2} 
            alt="Food 2" 
            className="hero-image right-image"
          />
        </div>
        <h1 className="hero-title">LOW<span className="title-transparent">LOW</span></h1>
      </div>
    </section>
  );
};

export default Hero;