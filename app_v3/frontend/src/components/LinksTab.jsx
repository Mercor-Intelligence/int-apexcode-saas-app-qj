import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../utils/api';
import { Plus, GripVertical, Eye, EyeOff, Pencil, Trash2, X, Check, Link2, Type, Loader2 } from 'lucide-react';
import './LinksTab.css';

// Sortable link item
function SortableLink({ link, onEdit, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className={`link-item ${!link.isActive ? 'inactive' : ''}`}>
      <button className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={18} />
      </button>
      
      <div className="link-content">
        <div className="link-info">
          <span className="link-title">{link.title}</span>
          {link.url && <span className="link-url">{link.url}</span>}
        </div>
      </div>
      
      <div className="link-actions">
        <button className="action-btn" onClick={() => onToggle(link)} title={link.isActive ? 'Hide' : 'Show'}>
          {link.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        <button className="action-btn" onClick={() => onEdit(link)} title="Edit">
          <Pencil size={18} />
        </button>
        <button className="action-btn delete" onClick={() => onDelete(link.id)} title="Delete">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function LinksTab({ links, setLinks, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkForm, setLinkForm] = useState({ title: '', url: '', type: 'CLASSIC' });
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = links.findIndex(l => l.id === active.id);
      const newIndex = links.findIndex(l => l.id === over.id);
      const newLinks = arrayMove(links, oldIndex, newIndex);
      
      setLinks(newLinks);
      
      // Save new order
      await api.post('/links/reorder', { linkIds: newLinks.map(l => l.id) });
    }
  };

  const openAddModal = (type = 'CLASSIC') => {
    setEditingLink(null);
    setLinkForm({ title: '', url: '', type });
    setShowModal(true);
  };

  const openEditModal = (link) => {
    setEditingLink(link);
    setLinkForm({ title: link.title, url: link.url || '', type: link.type });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingLink) {
        await api.put(`/links/${editingLink.id}`, linkForm);
      } else {
        await api.post('/links', linkForm);
      }
      setShowModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving link:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (link) => {
    await api.patch(`/links/${link.id}/toggle`);
    onUpdate();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this link?')) {
      await api.delete(`/links/${id}`);
      onUpdate();
    }
  };

  return (
    <div className="links-tab">
      <div className="tab-header">
        <h2>Links</h2>
        <p>Add and manage your links</p>
      </div>

      {/* Add buttons */}
      <div className="add-buttons">
        <button className="add-link-btn primary" onClick={() => openAddModal('CLASSIC')}>
          <Plus size={20} />
          <span>Add Link</span>
        </button>
        <button className="add-link-btn" onClick={() => openAddModal('HEADER')}>
          <Type size={20} />
          <span>Add Header</span>
        </button>
      </div>

      {/* Links list */}
      <div className="links-list">
        {links.length === 0 ? (
          <div className="empty-state">
            <Link2 size={48} />
            <h3>No links yet</h3>
            <p>Add your first link to get started</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
              {links.map(link => (
                <SortableLink
                  key={link.id}
                  link={link}
                  onEdit={openEditModal}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLink ? 'Edit Link' : linkForm.type === 'HEADER' ? 'Add Header' : 'Add Link'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  value={linkForm.title}
                  onChange={e => setLinkForm({ ...linkForm, title: e.target.value })}
                  placeholder={linkForm.type === 'HEADER' ? 'Section title' : 'My awesome link'}
                  className="input"
                  required
                  autoFocus
                />
              </div>
              
              {linkForm.type !== 'HEADER' && (
                <div className="input-group">
                  <label>URL</label>
                  <input
                    type="url"
                    value={linkForm.url}
                    onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
                    placeholder="https://example.com"
                    className="input"
                  />
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
                  {editingLink ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

