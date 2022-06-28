import create from 'zustand'

export const useStore = create((set) => ({
    isExpended: true,
    setExpandOrCollapce: () => set((state) => ({ isExpended: !state.isExpended })),
}))