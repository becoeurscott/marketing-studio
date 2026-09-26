"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

/** Small confirm dialog used for destructive or irreversible prototype actions. */
export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = "Confirmer", danger, loading, children }: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      {children ?? <p className="text-sm text-text2">Cette action est irréversible dans le prototype.</p>}
    </Modal>
  );
}
