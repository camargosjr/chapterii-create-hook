import { createContext, ReactNode, useContext, useState } from 'react';
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  async function checkStock(productId: number, productAmount: number) {
    const { data } = await api.get(`stock/${productId}`);
    return data.amount >= productAmount;
  }

  const addProduct = async (productId: number) => {

    try {
      const [product] = cart.filter((product) => product.id === productId);
      const { data } = await api.get(`products/${productId}`);

      if (product) {
        const amount = product.amount +1;
        if (await checkStock(productId, product.amount)) {
          updateProductAmount({ productId, amount })
          return;
        } else {
          toast.error('Quantidade solicitada fora de estoque')
        }
      }

      data.amount = 1;
      const updatedCart = [...cart, data];
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto')
    }
  };
  const removeProduct = (productId: number) => {
    try {
      // TODO
     
      const isProductInCart= cart.filter((product) => product.id === productId);
      
      if(isProductInCart.length <= 0){
        toast.error('Erro na remoção do produto')
        return;
      }

      const newCart = cart.filter((product) => product.id !== productId);

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) return;
      const product = cart.filter((product) => product.id === productId);
      if (product.length <= 0) {
        toast.error('Erro na alteração de quantidade do produto')
        return;
      }

      if (await checkStock(productId, amount)) {
        const updatedCart = cart.map((product) => {
          if (product.id === productId) {
            product.amount = amount
          }
          return product;
        });
        setCart(updatedCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

      } else {
        toast.error('Quantidade solicitada fora de estoque')
        
      }

    } catch {
      toast.error('Erro na alteração da quantidade do produto')
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
