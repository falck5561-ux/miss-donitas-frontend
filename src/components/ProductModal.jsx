import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

// --- ESTILOS VISUALES (MODAL) ---
const getStyles = (isPicante) => ({
  modalBg: isPicante ? '#1E1E1E' : '#FFFFFF',
  text: isPicante ? '#E0E0E0' : '#333333',
  inputBg: isPicante ? '#2C2C2C' : '#F4F6F8', // Fondo suave para inputs
  inputBorder: isPicante ? '#444' : '#E0E0E0',
  cardBg: isPicante ? '#252525' : '#FFFFFF', // Fondo tarjetas toppings
  cardBorder: isPicante ? '#333' : '#EEEEEE',
  muted: isPicante ? '#888' : '#999',
  accent: isPicante ? '#FF1744' : '#0d6efd'
});

// --- SUB-COMPONENTE: TARJETA DE GRUPO (TOPPINGS) SIN ANIMACIÓN ---
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
      toast.success('Agregado');
    } catch { toast.error('Error'); }
  };

  const handleDeleteOption = async (opcionId) => {
    try {
      await apiClient.delete(`/productos/opciones/${opcionId}`);
      onOptionDeleted(grupo.id, opcionId);
    } catch { toast.error('Error'); }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`¿Borrar grupo "${grupo.nombre}"?`)) return;
    try {
      await apiClient.delete(`/productos/grupos/${grupo.id}`);
      onGroupDeleted(grupo.id);
    } catch { toast.error('Error'); }
  };

  return (
    // IMPORTANTE: "transform: none !important" para evitar que crezca
    <div className="card mb-3" style={{ 
        backgroundColor: styles.cardBg, 
        border: `1px solid ${styles.cardBorder}`, 
        color: styles.text,
        transform: 'none !important', 
        transition: 'none !important',
        boxShadow: 'none'
    }}>
      <div className="card-header d-flex justify-content-between align-items-center py-2 border-0 bg-transparent">
        <small className="fw-bold text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
            {grupo.nombre} 
            <span className="badge ms-2" style={{backgroundColor: styles.inputBg, color: styles.text, border: `1px solid ${styles.inputBorder}`}}>
                {grupo.tipo_seleccion === 'unico' ? 'ÚNICO' : 'MÚLTIPLE'}
            </span>
        </small>
        <button type="button" className="btn btn-sm text-danger p-0" style={{fontSize: '0.75rem'}} onClick={handleDeleteGroup}>Eliminar Grupo</button>
      </div>
      
      <div className="card-body p-3 pt-0">
        {/* Lista Opciones */}
        <div className="d-flex flex-wrap gap-2 mb-3">
            {grupo.opciones && grupo.opciones.map(op => (
              <span key={op.id} className="badge d-flex align-items-center gap-2 fw-normal p-2" 
                    style={{ backgroundColor: styles.inputBg, color: styles.text, border: `1px solid ${styles.inputBorder}` }}>
                {op.nombre} <b style={{color: styles.accent}}>+${op.precio_adicional}</b>
                <span style={{cursor: 'pointer', opacity: 0.5}} onClick={() => handleDeleteOption(op.id)}>×</span>
              </span>
            ))}
            {(!grupo.opciones || grupo.opciones.length === 0) && <small className="text-muted fst-italic">Sin opciones</small>}
        </div>

        {/* Inputs Agregar */}
        <div className="d-flex gap-2">
            <input type="text" className="form-control form-control-sm shadow-none" placeholder="Nueva opción" 
                   value={nombreOpcion} onChange={(e) => setNombreOpcion(e.target.value)}
                   style={{backgroundColor: styles.inputBg, color: styles.text, border: 'none'}} />
            <input type="number" className="form-control form-control-sm shadow-none" placeholder="$" style={{maxWidth: '60px', backgroundColor: styles.inputBg, color: styles.text, border: 'none'}}
                   value={precioOpcion} onChange={(e) => setPrecioOpcion(e.target.value)} />
            <button className="btn btn-sm btn-primary shadow-none" onClick={handleAddOption}>+</button>
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
            } else { setGrupos([]); setGestionarOpciones(false); }
          })
          .catch(() => { setGrupos([]); })
          .finally(() => setLoadingGrupos(false));
      } else {
        setFormData({ nombre: '', descripcion: '', precio: '', stock: 0, categoria: 'General', imagenes: [''], descuento_porcentaje: 0, en_oferta: false });
        setGrupos([]); setGestionarOpciones(false);
      }
    }
  }, [productoActual, show]);

  if (!show) return null;

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

  const handleAddGroup = async () => {
    if (!productoActual?.id) return toast.error('Guarda primero.');
    if (!nombreGrupo.trim()) return toast.error('Nombre vacío');
    try {
      const res = await apiClient.post(`/productos/${productoActual.id}/grupos`, { nombre: nombreGrupo, tipo_seleccion: tipoSeleccion });
      res.data.opciones = []; setGrupos([...grupos, res.data]); setNombreGrupo('');
    } catch { toast.error('Error'); }
  };

  const handleOptionAdded = (gId, op) => setGrupos(gs => gs.map(g => g.id === gId ? { ...g, opciones: [...g.opciones, op] } : g));
  const handleOptionDeleted = (gId, opId) => setGrupos(gs => gs.map(g => g.id === gId ? { ...g, opciones: g.opciones.filter(o => o.id !== opId) } : g));
  const handleGroupDeleted = (gId) => setGrupos(gs => gs.filter(g => g.id !== gId));

  // --- ESTILO DE INPUTS COMPARTIDO ---
  const inputStyle = {
      backgroundColor: styles.inputBg, 
      color: styles.text, 
      border: 'none', 
      borderRadius: '8px',
      padding: '10px 12px'
  };

  return (
    <div className="modal show fade" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ backgroundColor: styles.modalBg, color: styles.text, borderRadius: '20px', overflow: 'hidden' }}>
          
          <div className="modal-header border-0 pb-0 pt-4 px-4">
            <h4 className="modal-title fw-bold" style={{letterSpacing: '-0.5px'}}>{formData.id ? 'Editar Producto' : 'Crear Producto'}</h4>
            <button type="button" className="btn-close" onClick={handleClose} style={{ filter: isPicante ? 'invert(1)' : 'none' }}></button>
          </div>
          
          <form onSubmit={onSave}>
            <div className="modal-body p-4">
                <div className="row g-5">
                    
                    {/* COLUMNA IZQUIERDA */}
                    <div className="col-lg-5">
                        <p className="text-uppercase small fw-bold mb-3" style={{color: styles.muted, fontSize: '0.75rem'}}>Detalles Básicos</p>
                        
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Nombre</label>
                            <input type="text" className="form-control shadow-none" name="nombre" value={formData.nombre} onChange={handleChange} required style={inputStyle} />
                        </div>

                        <div className="row g-2 mb-3">
                            <div className="col-6">
                                <label className="form-label small fw-bold">Precio ($)</label>
                                <input type="number" step="0.01" className="form-control shadow-none fw-bold" name="precio" value={formData.precio} onChange={handleChange} required 
                                       style={{...inputStyle, color: styles.accent}} />
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold">Stock</label>
                                <input type="number" className="form-control shadow-none" name="stock" value={formData.stock} onChange={handleChange} style={inputStyle} />
                            </div>
                        </div>

                        <div className="mb-3">
                             <label className="form-label small fw-bold">Categoría</label>
                             <select className="form-select shadow-none" name="categoria" value={formData.categoria} onChange={handleChange} style={inputStyle}>
                                <option value="General">General</option>
                                <option value="Clásica">Clásica</option>
                                <option value="Gourmet">Gourmet</option>
                                <option value="Bebida">Bebida</option>
                             </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label small fw-bold">Descripción</label>
                            <textarea className="form-control shadow-none" name="descripcion" rows="3" value={formData.descripcion} onChange={handleChange} style={inputStyle}></textarea>
                        </div>
                        
                        <div className="d-flex align-items-center gap-2 mt-4 p-3 rounded" style={{backgroundColor: styles.inputBg}}>
                            <input className="form-check-input shadow-none" type="checkbox" name="en_oferta" checked={formData.en_oferta} onChange={handleChange} />
                            <label className="form-check-label fw-bold small">¿En oferta?</label>
                            {formData.en_oferta && (
                                <input type="number" className="form-control form-control-sm ms-auto shadow-none" placeholder="%" style={{maxWidth: '60px', border:'none'}} 
                                       name="descuento_porcentaje" value={formData.descuento_porcentaje} onChange={handleChange} />
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA */}
                    <div className="col-lg-7" style={{borderLeft: `1px solid ${styles.cardBorder}`}}>
                        
                        {/* IMAGENES */}
                        <div className="mb-4">
                            <p className="text-uppercase small fw-bold mb-3" style={{color: styles.muted, fontSize: '0.75rem'}}>Foto del producto</p>
                            {(formData.imagenes || ['']).map((url, index) => (
                                <div key={index} className="d-flex gap-2 mb-2">
                                    <input type="text" className="form-control shadow-none" placeholder="URL de imagen" value={url} onChange={(e) => handleImageChange(index, e.target.value)} style={inputStyle} />
                                    {formData.imagenes.length > 1 && <button type="button" className="btn btn-light border-0 text-danger" onClick={() => handleRemoveImageField(index)}>×</button>}
                                </div>
                            ))}
                            <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={handleAddImageField}>+ Agregar otra foto</button>
                        </div>

                        <hr style={{borderColor: styles.cardBorder}} />

                        {/* TOPPINGS */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                             <p className="text-uppercase small fw-bold m-0" style={{color: styles.muted, fontSize: '0.75rem'}}>Personalización (Toppings)</p>
                             <div className="form-check form-switch">
                                <input className="form-check-input shadow-none" type="checkbox" checked={gestionarOpciones} onChange={(e) => setGestionarOpciones(e.target.checked)} disabled={!formData.id} />
                             </div>
                        </div>

                        {gestionarOpciones && formData.id && (
                            <div>
                                {/* Crear Grupo Nuevo */}
                                <div className="d-flex gap-2 mb-4 p-2 rounded" style={{backgroundColor: styles.inputBg}}>
                                    <input type="text" className="form-control shadow-none border-0 bg-transparent" placeholder="Nuevo Grupo (Ej. Salsas)" value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)} style={{color: styles.text}} />
                                    <select className="form-select shadow-none border-0 bg-transparent" style={{maxWidth: '140px', color: styles.text}} value={tipoSeleccion} onChange={(e) => setTipoSeleccion(e.target.value)}>
                                        <option value="unico">Selección Única</option>
                                        <option value="multiple">Múltiple</option>
                                    </select>
                                    <button type="button" onClick={handleAddGroup} className="btn btn-sm btn-dark px-3 rounded-pill">Crear</button>
                                </div>

                                {/* Listado de Grupos (Con scroll si son muchos) */}
                                <div style={{maxHeight: '350px', overflowY: 'auto', paddingRight: '5px'}}>
                                     {loadingGrupos ? <span className="small">Cargando...</span> : 
                                      grupos.length > 0 ? grupos.map(g => (
                                         <GrupoOpcionesCard key={g.id} grupo={g} onOptionAdded={handleOptionAdded} onOptionDeleted={handleOptionDeleted} onGroupDeleted={handleGroupDeleted} styles={styles} />
                                      )) : <div className="text-center text-muted small py-3">No hay grupos creados</div>
                                     }
                                </div>
                            </div>
                        )}
                        {!formData.id && <div className="alert alert-light border-0 small text-center" style={{backgroundColor: styles.inputBg, color: styles.muted}}>Guarda el producto para agregar opciones.</div>}
                    </div>
                </div>
            </div>

            <div className="modal-footer border-0 px-4 pb-4 pt-0">
                <button type="button" className="btn btn-link text-decoration-none text-secondary" onClick={handleClose}>Cancelar</button>
                <button type="submit" className="btn px-5 rounded-pill fw-bold text-white shadow-sm" style={{backgroundColor: styles.accent, border: 'none'}}>Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;