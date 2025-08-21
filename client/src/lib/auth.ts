export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const setCurrentUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearCurrentUser = () => {
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};
