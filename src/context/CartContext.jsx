import {createContext,useContext,useEffect,useMemo,useState} from 'react';
const CartContext=createContext(null);
export function CartProvider({children}){
 const [items,setItems]=useState(()=>{try{return JSON.parse(localStorage.getItem('tnt_cart'))||[]}catch{return []}});
 useEffect(()=>localStorage.setItem('tnt_cart',JSON.stringify(items)),[items]);
 const addToCart=(product)=>setItems(old=>{const x=old.find(i=>i.id===product.id);return x?old.map(i=>i.id===product.id?{...i,quantity:i.quantity+1}:i):[...old,{...product,quantity:1}]});
 const removeFromCart=id=>setItems(old=>old.filter(i=>i.id!==id));
 const increaseQuantity=id=>setItems(old=>old.map(i=>i.id===id?{...i,quantity:i.quantity+1}:i));
 const decreaseQuantity=id=>setItems(old=>old.map(i=>i.id===id?{...i,quantity:i.quantity-1}:i).filter(i=>i.quantity>0));
 const clearCart=()=>setItems([]); const count=items.reduce((s,i)=>s+i.quantity,0); const subtotal=items.reduce((s,i)=>s+i.price*i.quantity,0);
 const value=useMemo(()=>({items,count,subtotal,addToCart,removeFromCart,increaseQuantity,decreaseQuantity,clearCart}),[items,count,subtotal]);
 return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
export const useCart=()=>useContext(CartContext);
