import React, { createContext, ReactNode, useContext, useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {

      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>();

  useEffect(() => {

    prevCartRef.current = cart;
  });

  const cartPreviusValue = prevCartRef.current ?? cart;

  useEffect(() => {

    if (cartPreviusValue !== cart) {

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviusValue]);

  const addProduct = async (productId: number) => {

    try {

      const newCart = [...cart];
      const itemCart = newCart.find(product => product.id === productId);
      const itemStock = await api.get(`/stock/${productId}`)
        .then(response => response.data.amount);

      if (itemStock && itemCart && itemStock <= itemCart?.amount) {

        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (itemCart) {

        itemCart.amount += 1;
      } else {

        const response = await api.get<Product>(`/products/${productId}`)
        newCart.push({ ...response.data, amount: 1 });
      }

      setCart(newCart);
    } catch {

      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {

    try {

      const item = cart.find(product => product.id === productId);

      if (!item) {

        throw new Error;
      }

      const newCart = cart.filter(product => product.id !== productId);

      setCart(newCart);
    } catch {

      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {

        return;
      }

      const itemStock = await api.get<Stock>(`/stock/${productId}`);

      if (itemStock && itemStock.data.amount < amount) {

        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = [...cart];
      const item = newCart.find(product => product.id === productId);

      if (!item) {

        throw new Error;
      }

      item.amount = amount;
      setCart(newCart);
    } catch {

      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
