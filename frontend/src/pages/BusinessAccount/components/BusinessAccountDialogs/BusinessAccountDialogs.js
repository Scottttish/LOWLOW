import React from 'react';
import './BusinessAccountDialogs.css';

const BusinessAccountDialogs = ({ 
  showLogoutDialog, 
  showDeleteDialog, 
  onLogoutConfirm, 
  onDeleteConfirm, 
  onCancelDialog 
}) => {
  if (!showLogoutDialog && !showDeleteDialog) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        {showLogoutDialog && (
          <>
            <h3 className="dialog-title">Выход из бизнес-аккаунта</h3>
            <p className="dialog-message">
              Вы уверены, что хотите выйти из бизнес-аккаунта?
            </p>
          </>
        )}
        
        {showDeleteDialog && (
          <>
            <h3 className="dialog-title">Удаление бизнес-аккаунта</h3>
            <p className="dialog-message">
              Внимание: Удаление бизнес-аккаунта приведет к полной потере всех данных компании, 
              включая историю заказов, продукты и персональные настройки. Это действие нельзя отменить.
            </p>
          </>
        )}
        
        <div className="dialog-actions">
          <button 
            className="dialog-btn dialog-btn-cancel"
            onClick={onCancelDialog}
          >
            Отмена
          </button>
          <button 
            className={`dialog-btn ${
              showDeleteDialog ? 'dialog-btn-delete' : 'dialog-btn-confirm'
            }`}
            onClick={showDeleteDialog ? onDeleteConfirm : onLogoutConfirm}
          >
            {showDeleteDialog ? 'Удалить бизнес-аккаунт' : 'Выйти'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessAccountDialogs;