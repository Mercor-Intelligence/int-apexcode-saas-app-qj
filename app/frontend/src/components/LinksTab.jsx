import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../utils/api'
import { 
  Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, 
  Link2, Type, ExternalLink, X, Check 
} from 'lucide-react'
import './LinksTab.css'

function SortableLink({ link, onEdit, onDelete, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`link-item ${!link.isActive ? 'inactive' : ''}`}
    >
      <button className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={18} />
      </button>
      
      <div className="link-content">
        <div className="link-info">
          <span className="link-type-badge">{link.type}</span>
          <h4>{link.title}</h4>
          {link.url && (
            <p className="link-url">
              <ExternalLink size={12} />
              {link.url}
            </p>
          )}
        </div>
        
        <div className="link-stats">
          <span className="click-count">{link.clickCount || 0} clicks</span>
        </div>
      </div>
      
      <div className="link-actions">
        <button 
          className="action-btn"
          onClick={() => onToggle(link)}
          title={link.isActive ? 'Hide link' : 'Show link'}
        >
          {link.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        <button 
          className="action-btn"
          onClick={() => onEdit(link)}
          title="Edit link"
        >
          <Pencil size={18} />
        </button>
        <button 
          className="action-btn delete"
          onClick={() => onDelete(link.id)}
          title="Delete link"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

export default function LinksTab({ links, setLinks }) {
  const [showModal, setShowModal] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    type: 'CLASSIC',
  })
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const oldIndex = links.findIndex(l => l.id === active.id)
      const newIndex = links.findIndex(l => l.id === over.id)
      
      const newLinks = arrayMove(links, oldIndex, newIndex)
      setLinks(newLinks)
      
      try {
        await api.post('/links/reorder', { 
          linkIds: newLinks.map(l => l.id) 
        })
      } catch (error) {
        console.error('Failed to reorder:', error)
      }
    }
  }

  const openAddModal = (type = 'CLASSIC') => {
    setEditingLink(null)
    setLinkForm({ title: '', url: '', type })
    setShowModal(true)
  }

  const openEditModal = (link) => {
    setEditingLink(link)
    setLinkForm({
      title: link.title,
      url: link.url || '',
      type: link.type,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      if (editingLink) {
        const updated = await api.put(`/links/${editingLink.id}`, linkForm)
        setLinks(links.map(l => l.id === editingLink.id ? updated : l))
      } else {
        const newLink = await api.post('/links', linkForm)
        setLinks([...links, newLink])
      }
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save link:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (link) => {
    try {
      const updated = await api.put(`/links/${link.id}`, { 
        isActive: !link.isActive 
      })
      setLinks(links.map(l => l.id === link.id ? updated : l))
    } catch (error) {
      console.error('Failed to toggle:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this link?')) return
    
    try {
      await api.delete(`/links/${id}`)
      setLinks(links.filter(l => l.id !== id))
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  return (
    <div className="links-tab">
      <div className="tab-header">
        <div>
          <h2>Links</h2>
          <p>Add and manage your links</p>
        </div>
      </div>

      {/* Add Link Buttons */}
      <div className="add-link-section">
        <button className="add-link-btn primary" onClick={() => openAddModal('CLASSIC')}>
          <Plus size={20} />
          <span>Add Link</span>
        </button>
        <button className="add-link-btn" onClick={() => openAddModal('HEADER')}>
          <Type size={18} />
          <span>Add Header</span>
        </button>
      </div>

      {/* Links List */}
      <div className="links-list">
        {links.length === 0 ? (
          <div className="empty-state">
            <Link2 size={48} />
            <h3>No links yet</h3>
            <p>Add your first link to get started</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
              {links.map((link) => (
                <SortableLink
                  key={link.id}
                  link={link}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
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
              <h3>{editingLink ? 'Edit Link' : 'Add Link'}</h3>
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
                  onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                  placeholder="My awesome link"
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
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    placeholder="https://example.com"
                    className="input"
                  />
                </div>
              )}
              
              <div className="input-group">
                <label>Type</label>
                <div className="type-buttons">
                  {['CLASSIC', 'HEADER', 'MUSIC', 'COMMERCE'].map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`type-btn ${linkForm.type === type ? 'active' : ''}`}
                      onClick={() => setLinkForm({ ...linkForm, type })}
                    >
                      {type.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingLink ? 'Update' : 'Add Link'}
                  {!saving && <Check size={18} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

