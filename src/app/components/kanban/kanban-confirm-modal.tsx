"use client";

import { ConfirmModal, type ConfirmModalProps } from "@/app/components/ui/confirm-modal";

export type KanbanConfirmModalProps = ConfirmModalProps;

export function KanbanConfirmModal(props: KanbanConfirmModalProps) {
  return <ConfirmModal {...props} />;
}
