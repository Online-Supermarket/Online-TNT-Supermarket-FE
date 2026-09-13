import {Search} from 'lucide-react';
export const PageHeader=({eyebrow,title,description,action})=><div className="page-header"><div>{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>;
export const Status=({children})=><span className={`status status-${String(children).toLowerCase().replaceAll(' ','-')}`}>{children}</span>;
export const SearchBox=({value,onChange,placeholder='Search...'})=><label className="search-box"><Search/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>;
export const Empty=({title='Nothing here yet',text='Try changing your search or filters.'})=><div className="empty"><span>🛒</span><h3>{title}</h3><p>{text}</p></div>;
