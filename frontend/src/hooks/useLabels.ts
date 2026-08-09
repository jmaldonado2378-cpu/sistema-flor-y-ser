import { useQuery, useMutation } from '@tanstack/react-query';
import { printProductLabel, printShippingLabel, getFinalProducts } from '../api/labels';

export const useFinalProducts = () => useQuery({ queryKey: ['finalProductsForLabels'], queryFn: getFinalProducts });
export const usePrintProductLabel = () => useMutation({ mutationFn: printProductLabel });
export const usePrintShippingLabel = () => useMutation({ mutationFn: printShippingLabel });
