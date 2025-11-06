import { useState } from 'react'

interface ModalState {
  isOpen: boolean
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  showCancel: boolean
  confirmText: string
  cancelText: string
  onConfirm?: () => void
  onCancel?: () => void
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel'
  })

  const showModal = (config: Partial<ModalState>) => {
    setModalState({
      isOpen: true,
      title: config.title || '',
      message: config.message || '',
      type: config.type || 'info',
      showCancel: config.showCancel || false,
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Cancel',
      onConfirm: config.onConfirm,
      onCancel: config.onCancel
    })
  }

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const showAlert = (message: string, title: string = 'Alert', type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    showModal({ title, message, type })
  }

  const showConfirm = (
    message: string, 
    title: string = 'Confirm', 
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText: string = 'OK',
    cancelText: string = 'Cancel'
  ) => {
    showModal({
      title,
      message,
      type: 'warning',
      showCancel: true,
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    })
  }

  return {
    modalState,
    showModal,
    hideModal,
    showAlert,
    showConfirm
  }
}
