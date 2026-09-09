import { create } from 'zustand';

export const useAuthStroe = create((set) => ({
    authUser: { name: "Suraj", _id: 123, age: 22 },
    isLoggedIn: false,
    isLoading: false,

    login: () => {
        console.log("We just logged in");
        set({ isLoggedIn: true, isLoading: true });
    },
}));