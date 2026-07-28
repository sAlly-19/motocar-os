import { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog } from '../ui/Dialog';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message: string;
  type?: 'confirm' | 'success' | 'error' | 'info' | 'warning';
  confirmLabel?: string;
  cancelLabel?: string;
  buttons?: DialogButton[];
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
  showAlert: (title: string, message?: string, onConfirm?: () => void) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  showOptions: (title: string, message: string, buttons: DialogButton[]) => void;
}

const DialogContext = createContext<DialogContextType>({
  showDialog: () => {},
  hideDialog: () => {},
  showAlert: () => {},
  showConfirm: () => {},
  showOptions: () => {},
});

export function DialogProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<DialogOptions & { visible: boolean }>({
    visible: false,
    title: '',
    message: '',
  });

  const hideDialog = () => setModalState((prev) => ({ ...prev, visible: false }));

  const showDialog = (options: DialogOptions) => {
    setModalState({ ...options, visible: true });
  };

  const showAlert = (title: string, message = '', onConfirm?: () => void) => {
    showDialog({
      title,
      message,
      type: 'info',
      confirmLabel: 'OK',
      onConfirm: () => { hideDialog(); if (onConfirm) onConfirm(); },
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    showDialog({
      title,
      message,
      type: 'confirm',
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      onConfirm: () => { hideDialog(); onConfirm(); },
      onCancel: () => { hideDialog(); if (onCancel) onCancel(); },
    });
  };

  const showOptions = (title: string, message: string, buttons: DialogButton[]) => {
    showDialog({ title, message, type: 'info', buttons });
  };

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog, showAlert, showConfirm, showOptions }}>
      {children}
      <Dialog
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        confirmLabel={modalState.confirmLabel}
        cancelLabel={modalState.cancelLabel}
        type={modalState.type}
        buttons={modalState.buttons}
        onConfirm={() => { if (modalState.onConfirm) modalState.onConfirm(); hideDialog(); }}
        onCancel={() => { if (modalState.onCancel) modalState.onCancel(); hideDialog(); }}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  return useContext(DialogContext);
}
