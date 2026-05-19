import React from 'react';
import Modal from './Modal';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  variant = 'danger' 
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="confirmation-modal-body">
        <div className={`confirmation-icon ${variant}`}>
          {variant === 'danger' ? '⚠️' : 'ℹ️'}
        </div>
        <p className="confirmation-message">{message}</p>
        <div className="confirmation-actions">
          <button className="btn-ghost confirmation-cancel-btn" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`btn-confirm ${variant}`} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
