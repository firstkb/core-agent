import { useContext } from 'react';
import { RequestContext } from '../contexts/RequestContext';

export const useRequest = () => {
  const context = useContext(RequestContext);
  if (!context) throw new Error('useRequest must be used within a RequestProvider');
  return context;
};
