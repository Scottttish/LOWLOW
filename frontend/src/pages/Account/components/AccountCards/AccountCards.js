import React, { useState, useEffect } from 'react';
import { useAccount } from '../../../../context/AccountContext';
import './AccountCards.css';

const AccountCards = () => {
  const { cards, saveCard, deleteCard, setDefaultCard, refreshCards } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [cardData, setCardData] = useState({
    number: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
    isDefault: false
  });

  const [cardErrors, setCardErrors] = useState({});

  useEffect(() => {
    const loadCards = async () => {
      try {
        await refreshCards();
      } catch (error) {
        console.error('Error loading cards:', error);
      }
    };

    loadCards();
  }, []);

  const detectCardType = (number) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^2/.test(cleanNumber)) return 'mir';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    return 'unknown';
  };

  const formatCardNumber = (number) => {
    return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const validateCardNumber = (number) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (!/^\d+$/.test(cleanNumber)) return 'Только цифры';
    if (cleanNumber.length !== 16) return 'Должно быть 16 цифр';
    return '';
  };

  const validateExpiry = (expiry) => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Формат: ММ/ГГ';
    const [month, year] = expiry.split('/');
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (monthNum < 1 || monthNum > 12) return 'Неверный месяц';
    
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      return 'Карта просрочена';
    }
    
    return '';
  };

  const validateCVV = (cvv) => {
    if (!/^\d+$/.test(cvv)) return 'Только цифры';
    if (cvv.length !== 3) return 'Должно быть 3 цифры';
    return '';
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    if (name === 'number') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    }
    
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
    }
    
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }
    
    if (name === 'cardHolder') {
      formattedValue = value.toUpperCase();
    }
    
    setCardData(prev => ({ ...prev, [name]: formattedValue }));
    
    if (name === 'number' && value) {
      setCardErrors(prev => ({ ...prev, number: validateCardNumber(value) }));
    }
    if (name === 'expiry' && value) {
      setCardErrors(prev => ({ ...prev, expiry: validateExpiry(value) }));
    }
    if (name === 'cvv' && value) {
      setCardErrors(prev => ({ ...prev, cvv: validateCVV(value) }));
    }
  };

  const isCardFormValid = () => {
    if (editingCardId) {
      return cardData.number && 
             cardData.cardHolder && 
             cardData.expiry &&
             !cardErrors.number &&
             !cardErrors.expiry &&
             (!cardData.cvv || !cardErrors.cvv);
    } else {
      return cardData.number && 
             cardData.cardHolder && 
             cardData.expiry && 
             cardData.cvv &&
             !cardErrors.number &&
             !cardErrors.expiry &&
             !cardErrors.cvv;
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    
    const errors = {
      number: validateCardNumber(cardData.number),
      cardHolder: cardData.cardHolder ? '' : 'Введите имя владельца',
      expiry: validateExpiry(cardData.expiry),
      cvv: validateCVV(cardData.cvv)
    };
    
    setCardErrors(errors);
    
    if (Object.values(errors).some(error => error)) {
      return;
    }
    
    const cardType = detectCardType(cardData.number);
    const newCard = {
      cardNumber: cardData.number.replace(/\s/g, ''),
      cardHolderName: cardData.cardHolder,
      expiryMonth: cardData.expiry.split('/')[0],
      expiryYear: cardData.expiry.split('/')[1],
      cardType: cardType,
      isDefault: cardData.isDefault || cards.length === 0
    };
    
    try {
      setLoading(true);
      await saveCard(newCard);
      resetForm();
      setShowForm(false);
      alert('Карта успешно добавлена!');
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Ошибка при добавлении карты: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCard = (cardId) => {
    const cardToEdit = cards.find(card => card.id === cardId);
    if (cardToEdit) {
      let cardNumber = '';
      if (cardToEdit.card_number && cardToEdit.card_number.includes('••••')) {
        cardNumber = cardToEdit.card_number;
      } else {
        const cardNum = cardToEdit.cardNumber || cardToEdit.card_number || '0000000000000000';
        cardNumber = formatCardNumber(cardNum);
      }
      
      setCardData({
        number: cardNumber,
        cardHolder: cardToEdit.card_holder_name || cardToEdit.cardHolderName || cardToEdit.cardHolder || '',
        expiry: `${cardToEdit.expiry_month || cardToEdit.expiryMonth || '01'}/${cardToEdit.expiry_year || cardToEdit.expiryYear || '25'}`,
        cvv: '',
        isDefault: cardToEdit.is_default || cardToEdit.isDefault || false
      });
      setEditingCardId(cardId);
      setShowForm(true);
    }
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();
    
    const errors = {
      number: validateCardNumber(cardData.number),
      cardHolder: cardData.cardHolder ? '' : 'Введите имя владельца',
      expiry: validateExpiry(cardData.expiry),
      cvv: cardData.cvv ? validateCVV(cardData.cvv) : ''
    };
    
    setCardErrors(errors);
    
    if (Object.values(errors).some(error => error && error !== '')) {
      return;
    }
    
    const cardType = detectCardType(cardData.number);
    const updatedCard = {
      id: editingCardId,
      cardNumber: cardData.number.replace(/\s/g, ''),
      cardHolderName: cardData.cardHolder,
      expiryMonth: cardData.expiry.split('/')[0],
      expiryYear: cardData.expiry.split('/')[1],
      cardType: cardType,
      isDefault: cardData.isDefault
    };
    
    try {
      setLoading(true);
      await saveCard(updatedCard);
      resetForm();
      setShowForm(false);
      alert('Карта успешно обновлена!');
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Ошибка при обновлении карты: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultCard = async (cardId) => {
    try {
      setLoading(true);
      await setDefaultCard(cardId);
      alert('Карта установлена как основная!');
    } catch (error) {
      console.error('Error setting default card:', error);
      alert('Ошибка при установке основной карты: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту карту?')) {
      try {
        setLoading(true);
        await deleteCard(cardId);
        alert('Карта успешно удалена!');
      } catch (error) {
        console.error('Error deleting card:', error);
        alert('Ошибка при удалении карты: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setCardData({
      number: '',
      cardHolder: '',
      expiry: '',
      cvv: '',
      isDefault: false
    });
    setCardErrors({});
    setEditingCardId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleStartAddCard = () => {
    resetForm();
    setCardData(prev => ({
      ...prev,
      isDefault: cards.length === 0
    }));
    setShowForm(true);
  };

  const renderCardsList = () => (
    <>
      <div className="section-header">
        <h2 className="section-title">Мои карты</h2>
      </div>
      
      {cards.length === 0 ? (
        <div className="empty-cards">
          <div className="empty-cards-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="18" cy="15" r="1" fill="currentColor"/>
            </svg>
          </div>
          <h3>У вас пока нет сохраненных карт</h3>
          <p>Добавьте карту для быстрой оплаты заказов</p>
          <button 
            className="add-first-card-btn"
            onClick={handleStartAddCard}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Добавить первую карту'}
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className={`card-item ${card.is_default ? 'active-card' : 'inactive-card'}`}
            >
              <div className="card-header">
                <div className="card-type">
                  {card.card_type === 'visa' && (
                    <span className="card-type-badge visa">VISA</span>
                  )}
                  {card.card_type === 'mastercard' && (
                    <span className="card-type-badge mastercard">MasterCard</span>
                  )}
                  {card.card_type === 'mir' && (
                    <span className="card-type-badge mir">MIR</span>
                  )}
                  {card.card_type === 'amex' && (
                    <span className="card-type-badge amex">AMEX</span>
                  )}
                  {card.card_type === 'discover' && (
                    <span className="card-type-badge discover">Discover</span>
                  )}
                  {(!card.card_type || card.card_type === 'unknown') && (
                    <span className="card-type-badge unknown">CARD</span>
                  )}
                </div>
                {card.is_default && (
                  <span className="default-badge">Основная</span>
                )}
              </div>
              
              <div className="card-number">
                •••• •••• •••• {card.card_last4 || '0000'}
              </div>
              
              <div className="card-footer">
                <div className="card-info">
                  <div className="card-holder">{card.card_holder_name || ''}</div>
                  <div className="card-expiry">
                    {card.expiry_month || '01'}/{card.expiry_year || '25'}
                  </div>
                </div>
                <div className="card-actions">
                  <button 
                    className="card-action-btn edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCard(card.id);
                    }}
                    title="Редактировать карту"
                    disabled={loading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {!card.is_default && (
                    <button 
                      className="card-action-btn set-default"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefaultCard(card.id);
                      }}
                      title="Сделать основной"
                      disabled={loading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  <button 
                    className="card-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card.id);
                    }}
                    title="Удалить карту"
                    disabled={loading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {cards.length < 3 && (
            <div className="add-card-placeholder" onClick={handleStartAddCard}>
              <div className="add-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Добавить карту</span>
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderCardForm = () => (
    <>
      <div className="section-header">
        <h2 className="section-title">
          {editingCardId ? 'Редактировать карту' : 'Добавить карту'}
        </h2>
        <button 
          className="back-button"
          onClick={handleCancel}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Назад к картам
        </button>
      </div>
      
      <div className="add-card-form">
        <div className="card-preview">
          <div className="card-front active-card">
            <div className="card-chip"></div>
            <div className="card-number-preview">
              {cardData.number ? formatCardNumber(cardData.number) : '•••• •••• •••• ••••'}
            </div>
            <div className="card-details-preview">
              <div className="card-holder-preview">
                {cardData.cardHolder || 'ИМЯ ВЛАДЕЛЬЦА'}
              </div>
              <div className="card-expiry-preview">
                {cardData.expiry || 'ММ/ГГ'}
              </div>
            </div>
            <div className="card-type-preview">
              {detectCardType(cardData.number) === 'visa' && 'VISA'}
              {detectCardType(cardData.number) === 'mastercard' && 'MasterCard'}
              {detectCardType(cardData.number) === 'mir' && 'MIR'}
              {detectCardType(cardData.number) === 'amex' && 'AMEX'}
              {detectCardType(cardData.number) === 'discover' && 'Discover'}
              {detectCardType(cardData.number) === 'unknown' && 'CARD'}
            </div>
          </div>
        </div>
        
        <form onSubmit={editingCardId ? handleUpdateCard : handleAddCard} className="card-form">
          <div className="form-group">
            <label className="form-label">Номер карты *</label>
            <input
              type="text"
              name="number"
              value={cardData.number}
              onChange={handleCardInputChange}
              className="form-input"
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              disabled={loading}
            />
            {cardErrors.number && <span className="error-text">{cardErrors.number}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Имя владельца *</label>
            <input
              type="text"
              name="cardHolder"
              value={cardData.cardHolder}
              onChange={handleCardInputChange}
              className="form-input"
              placeholder="IVAN IVANOV"
              style={{ textTransform: 'uppercase' }}
              disabled={loading}
            />
            {cardErrors.cardHolder && <span className="error-text">{cardErrors.cardHolder}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Срок действия *</label>
            <input
              type="text"
              name="expiry"
              value={cardData.expiry}
              onChange={handleCardInputChange}
              className="form-input"
              placeholder="ММ/ГГ"
              maxLength="5"
              disabled={loading}
            />
            {cardErrors.expiry && <span className="error-text">{cardErrors.expiry}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">
              CVV {!editingCardId && '*'}
              {editingCardId && <span className="optional-text"> (необязательно)</span>}
            </label>
            <input
              type="password"
              name="cvv"
              value={cardData.cvv}
              onChange={handleCardInputChange}
              className="form-input"
              placeholder="123"
              maxLength="3"
              disabled={loading}
            />
            {cardErrors.cvv && <span className="error-text">{cardErrors.cvv}</span>}
            {editingCardId && (
              <span className="hint-text">Оставьте пустым, если не хотите менять CVV</span>
            )}
          </div>
          
          <div className="form-group checkbox-container">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={cardData.isDefault}
                onChange={(e) => setCardData(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="checkbox-input"
                disabled={loading}
              />
              <span className="checkbox-custom"></span>
              Сделать основной картой
            </label>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="save-btn" 
              disabled={!isCardFormValid() || loading}
            >
              {loading ? 'Сохранение...' : editingCardId ? 'Обновить карту' : 'Сохранить карту'}
            </button>
            <button type="button" className="cancel-btn" onClick={handleCancel} disabled={loading}>
              Отмена
            </button>
          </div>
          
          <div className="security-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Ваши данные защищены и передаются в зашифрованном виде</span>
          </div>
        </form>
      </div>
    </>
  );

  return (
    <div className="account-section">
      {showForm ? renderCardForm() : renderCardsList()}
    </div>
  );
};

export default AccountCards;