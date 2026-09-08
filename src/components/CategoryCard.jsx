import {ArrowUpRight} from 'lucide-react';import {Link} from 'react-router-dom';
export default function CategoryCard({category}){return <Link to={`/categories?category=${category.id}`} className="category-card" style={{background:category.color}}><div className="category-icon">{category.icon}</div><div><h3>{category.name}</h3><p>{category.description}</p></div><ArrowUpRight/></Link>}
