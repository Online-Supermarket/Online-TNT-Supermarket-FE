import {ShoppingBasket} from 'lucide-react';
export default function Logo({light=false}){return <div className={`logo ${light?'logo-light':''}`}><span><ShoppingBasket size={21}/></span><div>TNT<small>ONLINE SUPERMARKET</small></div></div>}
