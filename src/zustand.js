import create from 'zustand'

export const useStore = create((set) => ({
    isExpended: true,
    userInfo: {},
    setExpandOrCollapce: () => set((state) => ({
        ...state,
        isExpended: !state.isExpended
    })),
    setUserInfo: (userInfo) => set((state) => ({
        ...state,
        userInfo
    }))
}))