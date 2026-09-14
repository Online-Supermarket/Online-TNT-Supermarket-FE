import {Edit2, Plus, Power, PowerOff, RefreshCw, Save, Trash2, X} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Empty, PageHeader, SearchBox, Status} from '../../components/Ui';
import {useToast} from '../../components/ToastProvider';
import {
  categoryService,
  getCategoryDescription,
  getCategoryErrorMessage,
  getCategoryLabel,
  getCategoryStatus,
  unwrapCategories,
} from '../../services/categoryService';

const blankForm = {name: '', description: '', isActive: true};

function normalizeCategory(category) {
  return {
    ...category,
    id: category.id || category.categoryId,
    name: getCategoryLabel(category),
    description: getCategoryDescription(category),
    status: getCategoryStatus(category),
    isActive: getCategoryStatus(category).toLowerCase() !== 'inactive',
  };
}

function buildPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    isActive: form.isActive,
  };
}

export default function CategoryManagement() {
  const {showToast} = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await categoryService.getCategories();
      setCategories(unwrapCategories(response.data).map(normalizeCategory));
    } catch (requestError) {
      setCategories([]);
      setError(getCategoryErrorMessage(requestError, 'Categories could not load.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(term) ||
      category.description.toLowerCase().includes(term) ||
      category.status.toLowerCase().includes(term)
    );
  }, [categories, query]);

  const beginCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setFormError('');
  };

  const beginEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    });
    setFormError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Category name is required.';
    if (form.name.trim().length > 100) return 'Category name must be 100 characters or fewer.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = buildPayload(form);
      if (editing) {
        await categoryService.updateCategory(editing.id, payload);
        showToast('Category updated successfully.');
      } else {
        await categoryService.createCategory(payload);
        showToast('Category created successfully.');
      }
      beginCreate();
      await loadCategories();
    } catch (requestError) {
      setFormError(getCategoryErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (category) => {
    const nextActive = !category.isActive;
    const label = nextActive ? 'activate' : 'deactivate';
    const confirmed = window.confirm(`Are you sure you want to ${label} ${category.name}?`);
    if (!confirmed) return;

    setActionId(category.id);
    try {
      if (nextActive) {
        await categoryService.activateCategory(category.id);
      } else {
        await categoryService.deactivateCategory(category.id);
      }
      showToast(`Category ${nextActive ? 'activated' : 'deactivated'} successfully.`);
      await loadCategories();
    } catch (requestError) {
      showToast(getCategoryErrorMessage(requestError), 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(`Delete ${category.name}? This may fail if products are assigned to it.`);
    if (!confirmed) return;

    setActionId(category.id);
    try {
      await categoryService.deleteCategory(category.id);
      showToast('Category deleted successfully.');
      await loadCategories();
    } catch (requestError) {
      showToast(getCategoryErrorMessage(requestError, 'Category could not be deleted.'), 'error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organize product groups for catalog browsing and product setup."
        action={<button className="btn btn-primary" type="button" onClick={beginCreate}><Plus/> New category</button>}
      />

      <section className="category-management">
        <form className="panel category-form" onSubmit={handleSubmit} aria-label="Category form">
          <div className="panel-head">
            <div>
              <h2>{editing ? 'Edit category' : 'Create category'}</h2>
              <p>{editing ? 'Update the selected category details.' : 'Add a new product grouping.'}</p>
            </div>
            {editing && <button className="btn btn-light btn-small" type="button" onClick={beginCreate}><X/> Cancel</button>}
          </div>
          {formError && <div className="error" role="alert">{formError}</div>}
          <label>
            Category name
            <input value={form.name} maxLength={100} onChange={(event) => setForm({...form, name: event.target.value})} required/>
          </label>
          <label>
            Description
            <textarea value={form.description} maxLength={500} rows={4} onChange={(event) => setForm({...form, description: event.target.value})}/>
          </label>
          <label className="category-toggle">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({...form, isActive: event.target.checked})}/>
            Active category
          </label>
          <button className="btn btn-primary full" type="submit" disabled={saving}>
            <Save/> {saving ? 'Saving...' : editing ? 'Save changes' : 'Create category'}
          </button>
        </form>

        <section className="panel category-list-panel">
          <div className="category-toolbar">
            <SearchBox value={query} onChange={setQuery} placeholder="Search categories..."/>
            <button className="btn btn-light btn-small" type="button" onClick={loadCategories} disabled={loading}>
              <RefreshCw/> Refresh
            </button>
          </div>

          {loading && <div className="catalog-status">Loading categories...</div>}
          {!loading && error && <Empty title="Categories could not load" text={error}/>}
          {!loading && !error && filteredCategories.length === 0 && (
            <Empty title="No categories found" text="Create a category or adjust your search."/>
          )}
          {!loading && !error && filteredCategories.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id}>
                      <td><b>{category.name}</b></td>
                      <td>{category.description || 'No description'}</td>
                      <td><Status>{category.status}</Status></td>
                      <td>
                        <div className="category-actions">
                          <button className="btn btn-light btn-small" type="button" onClick={() => beginEdit(category)}>
                            <Edit2/> Edit
                          </button>
                          <button className="btn btn-light btn-small" type="button" disabled={actionId === category.id} onClick={() => handleStatusChange(category)}>
                            {category.isActive ? <PowerOff/> : <Power/>} {category.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn btn-light btn-small danger" type="button" disabled={actionId === category.id} onClick={() => handleDelete(category)}>
                            <Trash2/> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </>
  );
}
