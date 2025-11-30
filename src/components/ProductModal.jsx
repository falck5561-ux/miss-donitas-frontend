import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

// --- ESTILOS DINÁMICOS ---
const getStyles = (isPicante) => ({
  modalContent: isPicante ? '#1E1E1E' : '#FFFFFF',
  text: isPicante ? '#FFFFFF' : '#212529',
  inputBg: isPicante ? '#2C2C2C' : '#F8F9FA',
  inputBorder: isPicante ? '#444' : '#DEE2E6',
  inputText: isPicante ? '#FFF' : '#000',
  cardBg: isPicante ? '#252525' : '#FFFFFF',
  cardBorder: isPicante ? '#333' : '#E0E0E0',
  muted: isPicante ? '#AAAAAA' : '#6c757d',
  accent: isPicante ? '#FF1744' : '#0d6efd'
});

// --- SUB-COMPONENTE: TARJETA DE GRUPO (TOPPINGS) ---
function GrupoOpcionesCard({ grupo, onOptionAdded, onOptionDeleted, onGroupDeleted, styles }) {
  const [nombreOpcion, setNombreOpcion] = useState('');
  const [precioOpcion, setPrecioOpcion] = useState(0);

  const handleAddOption = async () => {
    if (!nombreOpcion.trim()) return toast.error('Nombre vacío');
    try {
      const optionData = { nombre: nombreOpcion, precio_adicional: parseFloat(precioOpcion) || 0 };
      const res = await apiClient.post(`/productos/grupos/${grupo.id}/opciones`, optionData);
      onOptionAdded(grupo.id, res.data);
      setNombreOpcion(''); setPrecioOpcion(0);
      toast.success('Opción agregada');
    } catch (error) { console.error(error); toast.error('Error al agregar'); }
  };

  const handleDeleteOption = async (opcionId) => {
    if (!window.confirm('¿Eliminar opción?')) return;
    try {
      await apiClient.delete(`/productos/opciones/${opcionId}`);
      onOptionDeleted(grupo.id, opcionId);
    } catch (error) { toast.error('Error al eliminar'); }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`¿Eliminar grupo "${grupo.nombre}"?`)) return;
    try {
      await apiClient.delete(`/productos/grupos/${grupo.id}`);
      onGroupDeleted(grupo.id);
      toast.success('Grupo eliminado');
    } catch (error) { toast.error('Error al eliminar grupo'); }
  };

  return (
    <div className="card mb-3 shadow-sm" style={{ backgroundColor: styles.cardBg, borderColor: styles.cardBorder, color: styles.text }}>
      <div className="card-header d-flex justify-content-between align-items-center py-2" style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderBottom: `1px solid ${styles.cardBorder}` }}>
        <small className="fw-bold text-uppercase">{grupo.nombre} <span className="badge bg-secondary ms-1">{grupo.tipo_seleccion}</span></small>
        <button type="button" className="btn btn-sm btn-link text-danger p-0 text-decoration-none" onClick={handleDeleteGroup}>Borrar</button>
      </div>
      <div className="card-body p-3">
        {/* Lista de Opciones */}
        <ul className="list-group list-group-flush mb-3 rounded" style={{overflow: 'hidden'}}>
            {grupo.opciones && grupo.opciones.map(op => (
              <li key={op.id} className="list-group-item d-flex justify-content-between align-items-center px-2 py-1" 
                  style={{ backgroundColor: styles.inputBg, color: styles.text, borderColor: styles.cardBorder }}>
                <span>{op.nombre} <small style={{color: styles.accent}}>(+${Number(op.precio_adicional).toFixed(2)})</small></span>
                <button type="button" className="btn btn-sm text-danger" onClick={() => handleDeleteOption(op.id)}>×</button>
              </li>
            ))}
            {(!grupo.opciones || grupo.opciones.length === 0) && <li className="list-group-item text-center small text-muted p-1" style={{backgroundColor: 'transparent', border:'none'}}>Sin opciones</li>}
        </ul>

        {/* Añadir Nueva Opción */}
        <div className="input-group input-group-sm">
            <input type="text" className="form-control" placeholder="Nombre (ej. Nutella)" 
                   value={nombreOpcion} onChange={(e) => setNombreOpcion(e.target.value)}
                   style={{backgroundColor: styles.inputBg, color: styles.inputText, borderColor: styles.cardBorder}} />
            <input type="number" className="form-control" placeholder="$" style={{maxWidth: '70px', backgroundColor: styles.inputBg, color: styles.inputText, borderColor: styles.cardBorder}}
                   value={precioOpcion} onChange={(e) => setPrecioOpcion(e.target.value)} />
            <button className="btn btn-primary" onClick={handleAddOption}>+</button>
        </div>
      </div>
    </div>
  );
}

// --- MODAL PRINCIPAL ---
function ProductModal({ show, handleClose, handleSave, productoActual, isPicante }) {
  const styles = getStyles(isPicante);
  
  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', precio: '', stock: 0, categoria: 'General',
    imagenes: [''], descuento_porcentaje: 0, en_oferta: false,
  });

  const [grupos, setGrupos] = useState([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [gestionarOpciones, setGestionarOpciones] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [tipoSeleccion, setTipoSeleccion] = useState('unico');

  // Carga de datos
  useEffect(() => {
    if (show) {
      if (productoActual) {
        setFormData(productoActual);
        setLoadingGrupos(true);
        apiClient.get(`/productos/${productoActual.id}`)
          .then(res => {
            const prod = res.data;
            if (prod.grupos_opciones?.length > 0) {
              setGrupos(prod.grupos_opciones);
              setGestionarOpciones(true); 
            } else {
              setGrupos([]);
              setGestionarOpciones(false);
            }
          })
          .catch(() => { toast.error("Error cargando opciones"); setGrupos([]); })
          .finally(() => setLoadingGrupos(false));
      } else {
        // Reset para nuevo
        setFormData({ nombre: '', descripcion: '', precio: '', stock: 0, categoria: 'General', imagenes: [''], descuento_porcentaje: 0, en_oferta: false });
        setGrupos([]);
        setGestionarOpciones(false);
      }
    }
  }, [productoActual, show]);

  if (!show) return null;

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleImageChange = (index, value) => {
    const newImages = [...(formData.imagenes || [''])];
    newImages[index] = value;
    setFormData({ ...formData, imagenes: newImages });
  };
  
  const handleAddImageField = () => setFormData({ ...formData, imagenes: [...(formData.imagenes || ['']), ''] });
  const handleRemoveImageField = (index) => { if(formData.imagenes.length > 1) setFormData({ ...formData, imagenes: formData.imagenes.filter((_, i) => i !== index) }); };
  
  const onSave = (e) => {
    e.preventDefault();
    const datos = { ...formData, imagenes: (formData.imagenes || []).filter(url => url && url.trim() !== '') };
    handleSave(datos);
  };

  // Handlers de Grupos
  const handleAddGroup = async () => {
    if (!productoActual?.id) return toast.error('Guarda el producto primero.');
    if (!nombreGrupo.trim()) return toast.error('Nombre de grupo vacío');
    try {
      const res = await apiClient.post(`/productos/${productoActual.id}/grupos`, { nombre: nombreGrupo, tipo_seleccion: tipoSeleccion });
      res.data.opciones = []; 
      setGrupos([...grupos, res.data]);
      setNombreGrupo('');
      toast.success('Grupo creado');
    } catch { toast.error('Error al crear grupo'); }
  };

  const handleOptionAdded = (gId, op) => setGrupos(gs => gs.map(g => g.id === gId ? { ...g, opciones: [...g.opciones, op] } : g));
  const handleOptionDeleted = (gId, opId) => setGrupos(gs => gs.map(g => g.id === gId ? { ...g, opciones: g.opciones.filter(o => o.id !== opId) } : g));
  const handleGroupDeleted = (gId) => setGrupos(gs => gs.filter(g => g.id !== gId));

  // --- RENDER ---
  return (
    <div className="modal show fade" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered"> {/* MODAL EXTRA GRANDE (XL) */}
        <div className="modal-content shadow-lg border-0" style={{ backgroundColor: styles.modalContent, color: styles.text, borderRadius: '16px', overflow: 'hidden' }}>
          
          {/* HEADER */}
          <div className="modal-header py-3 px-4 border-bottom" style={{ borderColor: styles.inputBorder }}>
            <h5 className="modal-title fw-bold">{formData.id ? '✏️ Editar Producto' : '✨ Nuevo Producto'}</h5>
            <button type="button" className="btn-close" onClick={handleClose} style={{ filter: isPicante ? 'invert(1)' : 'none' }}></button>
          </div>
          
          <form onSubmit={onSave}>
            <div className="modal-body p-0">
                <div className="row g-0">
                    
                    {/* COLUMNA IZQUIERDA: DATOS BÁSICOS */}
                    <div className="col-lg-5 p-4" style={{borderRight: `1px solid ${styles.inputBorder}`}}>
                        <h6 className="fw-bold mb-3 text-uppercase small" style={{color: styles.muted}}>Información General</h6>
                        
                        <div className="mb-3">
                            <label className="form-label small">Nombre del Producto</label>
                            <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleChange} required 
                                   style={{backgroundColor: styles.inputBg, color: styles.inputText, borderColor: styles.inputBorder}} />
                        </div>

                        <div className="row g-2 mb-3">
                            <div className="col-6">
                                <label className="form-label small">Precio ($)</label>
                                <input type="number" step="0.01" className="form-control fw-bold" name="precio" value={formData.precio} onChange={handleChange} required 
                                       style={{backgroundColor: styles.inputBg, color: styles.accent, borderColor: styles.inputBorder}} />
                            </div>
                            <div className="col-6">
                                <label className="form-label small">Stock</label>
                                <input type="number" className="form-control" name="stock" value={formData.stock} onChange={handleChange} 
                                       style={{backgroundColor: styles.inputBg, color: styles.inputText, borderColor: styles.inputBorder}} />
                            </div>
                        </div>

                        <div className="mb-3">
                             <label className="form-label small">Categoría</label>
                             <select className="form-select" name="categoria" value={formData.categoria} onChange={handleChange}
                                     style={{backgroundColor: styles.inputBg, color: styles.inputText, borderColor: styles.inputBorder}}>
                                <option value="General">General</option>
                                <option value="Clásica">Clásica</option>
                                <option value="Gourmet">Gourmet</option>
                                <option value="Bebida">Bebida</option>
                             </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label small">Descripción</label>
                            <textarea className="form-control" name="descripcion" rows="4" value={formData.descripcion} onChange={handleChange}
                                      style={{backgroundColor: styles.inputBg, color: styles.inputText, borderColor: styles.inputBorder}}></textarea>
                        </div>

                        <div className="p-3 rounded-3 mt-4" style={{backgroundColor: styles.inputBg, border: `1px solid ${styles.inputBorder}`}}>
                            <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" name="en_oferta" checked={formData.en_oferta} onChange={handleChange} />
                                <label className="form-check-label fw-bold">Activar Oferta</label>
                            </div>
                            {formData.en_oferta && (
                                <div className="mt-2">
                                    <label className="form-label small">Descuento (%)</label>
                                    <input type="number" className="form-control" name="descuento_porcentaje" value={formData.descuento_porcentaje} onChange={handleChange} 
                                           style={{backgroundColor: styles.modalContent, color: styles.inputText, borderColor: styles.inputBorder}} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: IMAGENES Y TOPPINGS */}
                    <div className="col-lg-7 p-4 bg-opacity-10" style={{backgroundColor: isPicante ? '#121212' : '#F9FAFB'}}>
                        
                        {/* SECCION IMAGENES */}
                        <div className="mb-4">
                            <h6 className="fw-bold mb-3 text-uppercase small" style={{color: styles.muted}}>Multimedia</h6>
                            {(formData.imagenes || ['']).map((url, index) => (
                                <div key={index} className="input-group mb-2">
                                    <span className="input-group-text" style={{backgroundColor: styles.inputBg, borderColor: styles.inputBorder, color: styles.muted}}>🖼️</span>
                                    <input type="text" className="form-control" placeholder="URL de la imagen" value={url} onChange={(e) => handleImageChange(index, e.target.value)}
                                           style={{backgroundColor: styles.modalContent, color: styles.inputText, borderColor: styles.inputBorder}} />
                                    {formData.imagenes.length > 1 && <button type="button" className="btn btn-outline-danger" onClick={() => handleRemoveImageField(index)}>×</button>}
                                </div>
                            ))}
                            <button type="button" className="btn btn-sm btn-link text-decoration-none" onClick={handleAddImageField}>+ Agregar otra imagen</button>
                        </div>
                        
                        <hr style={{borderColor: styles.inputBorder}} />

                        {/* SECCION TOPPINGS (GRUPOS) */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                             <h6 className="fw-bold m-0 text-uppercase small" style={{color: styles.muted}}>Personalización (Toppings)</h6>
                             <div className="form-check form-switch m-0">
                                <input className="form-check-input" type="checkbox" checked={gestionarOpciones} onChange={(e) => setGestionarOpciones(e.target.checked)} disabled={!formData.id} />
                             </div>
                        </div>

                        {!formData.id && <div className="alert alert-secondary py-2 small">Guarda el producto para añadir opciones.</div>}

                        {gestionarOpciones && formData.id && (
                            <div className="animate-fade-in">
                                {/* Crear Grupo */}
                                <div className="p-3 mb-3 rounded-3" style={{backgroundColor: styles.cardBg, border: `1px solid ${styles.inputBorder}`}}>
                                    <div className="row g-2">
                                        <div className="col-5">
                                            <input type="text" className="form-control form-control-sm" placeholder="Nuevo Grupo (ej. Salsas)" 
                                                   value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)}
                                                   style={{backgroundColor: styles.inputBg, color: styles.inputText, borderColor: styles.inputBorder}} />
                                        </div>
                                        <div className="col-4">
                                            <select className="form-select form-select-sm" value={tipoSeleccion} onChange={(e) => setTipoSeleccion(e.target.value)}
                                                    style={{backgroundColor: styles.inputBg, color: styles.inputText, borderColor: styles.inputBorder}}>
                                                <option value="unico">Selección Única</option>
                                                <option value="multiple">Múltiple</option>
                                            </select>
                                        </div>
                                        <div className="col-3">
                                            <button type="button" onClick={handleAddGroup} className="btn btn-sm btn-success w-100 fw-bold">Crear</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de Grupos */}
                                <div style={{maxHeight: '300px', overflowY: 'auto', paddingRight: '5px'}}>
                                    {loadingGrupos ? <div className="text-center small">Cargando...</div> : 
                                     grupos.length > 0 ? grupos.map(g => (
                                        <GrupoOpcionesCard key={g.id} grupo={g} onOptionAdded={handleOptionAdded} onOptionDeleted={handleOptionDeleted} onGroupDeleted={handleGroupDeleted} styles={styles} />
                                     )) : <div className="text-center text-muted small py-4">No hay grupos de opciones aún.</div>
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="modal-footer py-2 border-top" style={{ borderColor: styles.inputBorder, backgroundColor: styles.modalContent }}>
                <button type="button" className="btn btn-link text-decoration-none text-secondary" onClick={handleClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary px-4 rounded-pill fw-bold shadow-sm">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;