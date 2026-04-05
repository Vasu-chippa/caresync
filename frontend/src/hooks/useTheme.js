export const useTheme = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  return {
    theme: 'dark',
    toggleTheme: () => {},
  };
};


