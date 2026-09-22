"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
}: ConfirmationDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center pt-2">
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isDestructive ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h4 className="text-lg font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1 font-bold"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
