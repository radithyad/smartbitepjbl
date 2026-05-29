import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [keranjang, setKeranjang] = useState({});
  const [toko, setToko] = useState(null);
  const [menuList, setMenuList] = useState([]);

  return (
    <CartContext.Provider value={{ keranjang, setKeranjang, toko, setToko, menuList, setMenuList }}>
      {children}
    </CartContext.Provider>
  );
};