import React, { createContext, ReactNode, useContext, useState } from 'react';
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

  const addProduct = async (productId: number) => {

    try {

      const itemCart = cart.find(product => product.id === productId);
      const item = await api.get(`/products/${productId}`)
        .then(response => response.data);
      const itemStock = await api.get(`/stock/${productId}`)
        .then(response => response.data.amount);

      if (itemStock && itemCart && itemStock <= itemCart?.amount) {

        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (itemCart) {

        const newCart = cart.map(product => {

          if (product.id === productId) {

            product.amount += 1;
          }

          return product;
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      } else {

        const newCart = [...cart, {
          ...item,
          amount: 1
        }];

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {

      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {

    try {
      
      const item = cart.find(product => product.id === productId);

      if(!item) {
        
        throw new Error;
      }
      const newCart = cart.filter(product => product.id !== productId);

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
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

      const itemStock = await api.get(`/stock/${productId}`)
        .then(response => response.data.amount);

      if (itemStock && itemStock < amount) {

        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map(product => {

        if (product.id === productId) {

          product.amount = amount;
        }

        return product;
      });

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
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
