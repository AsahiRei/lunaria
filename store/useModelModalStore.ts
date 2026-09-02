import { create } from "zustand";

type ModelModalStore = {
  visible: boolean;
  openModelModal: () => void;
  closeModelModal: () => void;
};

export const useModelModalStore = create<ModelModalStore>((set) => ({
  visible: false,
  openModelModal: () => set({ visible: true }),
  closeModelModal: () => set({ visible: false }),
}));
