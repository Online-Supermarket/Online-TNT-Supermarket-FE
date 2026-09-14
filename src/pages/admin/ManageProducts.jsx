import {Plus} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import DataTable from '../../components/DataTable';
import {PageHeader,SearchBox,Status} from '../../components/Ui';
import {useToast} from '../../components/ToastProvider';
import useApiCollection from '../../hooks/useApiCollection';
import {categoryService, getCategoryErrorMessage, getCategoryLabel, unwrapCategories} from '../../services/categoryService';
import {productService} from '../../services/productService';

const productForm = {name: '', categoryId: '', price: '', stockQuantity: ''};

function mapProduct(product) {
  return {
    ...product,
    image: product.image || product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=180&q=80',
    stock: product.stock ?? product.stockQuantity ?? 0,
  };
}

export default function ManageProducts() {
  const {showToast} = useToast();
  const {data:products} = useApiCollection('/api/products');
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(productForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      setCategoryError('');
      try {
        const response = await categoryService.getCategories({isActive: true});
        if (active) setCategories(unwrapCategories(response.data));
      } catch (error) {
        if (active) setCategoryError(getCategoryErrorMessage(error, 'Categories could not load.'));
      }
    }
    loadCategories();
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => products.map(mapProduct).filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(q.toLowerCase());
    const productCategoryId = product.categoryId || product.category;
    const matchesCategory = cat === 'all' || productCategoryId === cat || product.category === cat;
    return matchesSearch && matchesCategory;
  }), [products, q, cat]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      await productService.create({
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
      });
      setForm(productForm);
      setShow(false);
      showToast('Product saved successfully.');
    } catch (error) {
      showToast(error.response?.data?.message || 'Product could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing, and availability."
        action={<button className="btn btn-primary" onClick={() => setShow(!show)}><Plus/> Add product</button>}
      />
      {show && (
        <form className="panel quick-form" onSubmit={handleSubmit}>
          <input value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} placeholder="Product name" required/>
          <select value={form.categoryId} onChange={(event) => setForm({...form, categoryId: event.target.value})} aria-label="Product category">
            <option value="">No category</option>
            {categories.map((category) => <option key={category.id || category.categoryId} value={category.id || category.categoryId}>{getCategoryLabel(category)}</option>)}
          </select>
          <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({...form, price: event.target.value})} placeholder="Price" required/>
          <input type="number" min="0" value={form.stockQuantity} onChange={(event) => setForm({...form, stockQuantity: event.target.value})} placeholder="Stock" required/>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save product'}</button>
        </form>
      )}
      {categoryError && <div className="error" role="alert">{categoryError}</div>}
      <section className="panel">
        <div className="table-tools">
          <SearchBox value={q} onChange={setQ} placeholder="Search products..."/>
          <select value={cat} onChange={(event) => setCat(event.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((category) => <option value={category.id || category.categoryId} key={category.id || category.categoryId}>{getCategoryLabel(category)}</option>)}
          </select>
        </div>
        <DataTable rows={rows} columns={[
          {key:'name',label:'PRODUCT',render:(row)=><div className="table-product"><img src={row.image} alt=""/><div><b>{row.name}</b><small>#{String(row.id).padStart(5,'0')}</small></div></div>},
          {key:'category',label:'CATEGORY',render:(row)=>row.category || 'Uncategorized'},
          {key:'price',label:'PRICE',render:(row)=>`$${Number(row.price || 0).toFixed(2)}`},
          {key:'stock',label:'STOCK',render:(row)=><span>{row.stock} units</span>},
          {key:'available',label:'STATUS',render:(row)=><Status>{row.stock>10?'In Stock':row.stock?'Low Stock':'Out of Stock'}</Status>},
        ]}/>
      </section>
    </>
  );
}
