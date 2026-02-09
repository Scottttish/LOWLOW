import React from 'react';
import './AccountDialogs.css';

const AccountDialogs = ({ 
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
            <h3 className="dialog-title">Выход из аккаунта</h3>
            <p className="dialog-message">
              Вы уверены, что хотите выйти из аккаунта?
            </p>
          </>
        )}
        
        {showDeleteDialog && (
          <>
            <h3 className="dialog-title">Удаление аккаунта</h3>
            <p className="dialog-message">
              Внимание: Удаление аккаунта приведет к полной потере всех ваших данных, 
              включая историю заказов и персональные настройки. Это действие нельзя отменить.
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
            {showDeleteDialog ? 'Удалить аккаунт' : 'Выйти'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDialogs;