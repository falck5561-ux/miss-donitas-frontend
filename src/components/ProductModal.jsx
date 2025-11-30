import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

// --- DEFINICIÓN DE ESTILOS "MISS DONITAS" (TEMA CREMA) ---
const styles = {
  modalContent: {
    backgroundColor: '#fffbf0', // Fondo crema suave
    color: '#5c4236',           // Texto café oscuro
    border: '2px solid #fecaca' // Borde sutil rosado
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#fda4af',     // Borde rosa/rojizo como en la foto 1
    color: '#4a3b32'
  },
  label: {
    color: '#8d6e63',           // Color café claro para labels
    fontWeight: '500'
  },
  cardGrupo: {
    backgroundColor: '#ffffff',
    border: '1px solid #fda4af'
  }
};

// --- Componente Interno para la Tarjeta de Grupo de Opciones ---
function GrupoOpcionesCard({ grupo, onOptionAdded, onOptionDeleted, onGroupDeleted }) {
  const [nombreOpcion, setNombreOpcion] = useState('');
  const [precioOpcion, setPrecioOpcion] = useState(0);

  const handleAddOption = async () => {
    if (!nombreOpcion.trim()) return toast.error('El nombre de la opción no puede estar vacío.');
    try {
      const optionData = { nombre: nombreOpcion, precio_adicional: parseFloat(precioOpcion) || 0 };
      const res = await apiClient.post(`/productos/grupos/${grupo.id}/opciones`, optionData);
      onOptionAdded(grupo.id, res.data);
      setNombreOpcion('');
      setPrecioOpcion(0);
      toast.success('Opción agregada');
    } catch (error) {
      console.error("Error al agregar opción:", error);
      toast.error('No se pudo agregar la opción.');
    }
  };

  const handleDeleteOption = async (opcionId) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta opción?')) return;
    try {
      await apiClient.delete(`/productos/opciones/${opcionId}`);
      onOptionDeleted(grupo.id, opcionId);
      toast.success('Opción eliminada');
    } catch (error) {
      console.error("Error al eliminar opción:", error);
      toast.error('No se pudo eliminar la opción.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`¿Seguro que quieres eliminar el grupo "${grupo.nombre}" y todas sus opciones?`)) return;
    try {
      await apiClient.delete(`/productos/grupos/${grupo.id}`);
      onGroupDeleted(grupo.id);
      toast.success('Grupo eliminado');
    } catch (error) {
      console.error("Error al eliminar grupo:", error);
      toast.error('No se pudo eliminar el grupo.');
    }
  };

  return (
    <div className="card mb-4" style={styles.cardGrupo}>
      <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#fff1f2', borderBottom: '1px solid #fda4af' }}>
        <span style={{ color: '#881337' }}>Grupo: <strong>{grupo.nombre}</strong> ({grupo.tipo_seleccion})</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleDeleteGroup}>
          Eliminar Grupo
        </button>
      </div>
      <div className="card-body">
        <h6 className="card-title" style={styles.label}>Opciones existentes:</h6>
        {grupo.opciones && grupo.opciones.length > 0 ? (
          <ul className="list-group list-group-flush mb-3">
            {grupo.opciones.map(op => (
              <li key={op.id} className="list-group-item d-flex justify-content-between align-items-center" style={{ borderColor: '#ffe4e6' }}>
                <span style={{ color: '#4a3b32' }}>{op.nombre} (+${Number(op.precio_adicional).toFixed(2)})</span>
                <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => handleDeleteOption(op.id)}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted small">No hay opciones en este grupo.</p>
        )}
        <hr style={{ borderColor: '#fda4af' }} />
        <h6 className="card-title" style={styles.label}>Añadir nueva opción:</h6>
        
        <div className="row g-2">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              style={styles.input}
              placeholder="Ej: Nutella"
              value={nombreOpcion}
              onChange={(e) => setNombreOpcion(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <input
              type="number"
              step="0.01"
              className="form-control"
              style={styles.input}
              placeholder="Ej: 15"
              value={precioOpcion}
              onChange={(e) => setPrecioOpcion(e.target.value)}
            />
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button type="button" onClick={handleAddOption} className="btn btn-danger btn-sm w-100" style={{ backgroundColor: '#ec4899', borderColor: '#ec4899' }}>Añadir</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- Modal Principal de Producto (ESTILO VINTAGE / CREMA) ---
function ProductModal({ show, handleClose, handleSave, productoActual }) {
  
  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', precio: '', stock: 0, categoria: 'General',
    imagenes: [''], descuento_porcentaje: 0, en_oferta: false,
  });

  const [grupos, setGrupos] = useState([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [gestionarOpciones, setGestionarOpciones] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [tipoSeleccion, setTipoSeleccion] = useState('unico');

  // Lógica de carga de datos (IGUAL QUE ANTES)
  useEffect(() => {
    if (show) {
      if (productoActual) {
        setFormData(productoActual);
        setLoadingGrupos(true);
        apiClient.get(`/productos/${productoActual.id}`)
          .then(res => {
            const productoCompleto = res.data;
            if (productoCompleto.grupos_opciones?.length > 0) {
              setGrupos(productoCompleto.grupos_opciones);
              setGestionarOpciones(true); 
            } else { setGrupos([]); setGestionarOpciones(false); }
          })
          .catch(err => { console.error(err); setGrupos([]); })
          .finally(() => setLoadingGrupos(false));
      } else {
        setFormData({ nombre: '', descripcion: '', precio: '', stock: 0, categoria: 'General', imagenes: [''], descuento_porcentaje: 0, en_oferta: false });
        setGrupos([]); setGestionarOpciones(false); setLoadingGrupos(false);
      }
    }
  }, [productoActual, show]);
  
  // Bloqueo de scroll
  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [show]);

  if (!show) return null;

  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value, })); };
  const handleImageChange = (index, value) => { const newImages = [...(formData.imagenes || [''])]; newImages[index] = value; setFormData({ ...formData, imagenes: newImages }); };
  const handleAddImageField = () => { setFormData({ ...formData, imagenes: [...(formData.imagenes || ['']), ''] }); };
  const handleRemoveImageField = (index) => { if (!formData.imagenes || formData.imagenes.length <= 1) return; const newImages = formData.imagenes.filter((_, i) => i !== index); setFormData({ ...formData, imagenes: newImages }); };
  const onSave = (e) => { e.preventDefault(); const datosParaEnviar = { ...formData, imagenes: (formData.imagenes || []).filter(url => url && url.trim() !== ''), }; handleSave(datosParaEnviar); };

  // Handlers de grupos
  const handleAddGroup = async () => {
    if (!productoActual?.id) return toast.error('Guarda el producto antes de añadir grupos.');
    if (!nombreGrupo.trim()) return toast.error('Nombre vacío.');
    try {
      const groupData = { nombre: nombreGrupo, tipo_seleccion: tipoSeleccion };
      const res = await apiClient.post(`/productos/${productoActual.id}/grupos`, groupData);
      res.data.opciones = []; setGrupos([...grupos, res.data]); setNombreGrupo(''); toast.success('Grupo creado');
    } catch (error) { toast.error('Error al crear grupo'); }
  };
  const handleOptionAdded = (grupoId, nova) => setGrupos(g => g.map(x => x.id === grupoId ? { ...x, opciones: [...x.opciones, nova] } : x));
  const handleOptionDeleted = (grupoId, opId) => setGrupos(g => g.map(x => x.id === grupoId ? { ...x, opciones: x.opciones.filter(o => o.id !== opId) } : x));
  const handleGroupDeleted = (gid) => setGrupos(g => g.filter(x => x.id !== gid));


  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" style={styles.modalContent}> 
          
          <div className="modal-header" style={{ borderBottom: '1px solid #fda4af' }}>
            <h5 className="modal-title" style={{ color: '#881337', fontWeight: 'bold' }}>
              {formData.id ? 'Editar Producto' : 'Añadir Nuevo Producto'}
            </h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          
          <form onSubmit={onSave} className="d-flex flex-column flex-grow-1" style={{ minHeight: "0" }}>
            
            <div className="modal-body">
              
              {/* --- CAMPOS BÁSICOS --- */}
              <div className="mb-3">
                <label className="form-label" style={styles.label}>Nombre del Producto</label>
                <input type="text" className="form-control" style={styles.input} name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label" style={styles.label}>Descripción</label>
                <textarea className="form-control" style={styles.input} name="descripcion" rows="2" value={formData.descripcion || ''} onChange={handleChange}></textarea>
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label" style={styles.label}>Precio</label>
                  <input type="number" step="0.01" className="form-control" style={styles.input} name="precio" value={formData.precio || ''} onChange={handleChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={styles.label}>Stock</label>
                  <input type="number" className="form-control" style={styles.input} name="stock" value={formData.stock || 0} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={styles.label}>Categoría</label>
                  <input type="text" className="form-control" style={styles.input} name="categoria" value={formData.categoria || 'General'} onChange={handleChange} />
                </div>
              </div>
              
              <hr className="my-4" style={{ borderColor: '#fda4af' }} />
              
              <div className="p-3 mb-3 border rounded" style={{ borderColor: '#fda4af', backgroundColor: '#fff' }}>
                <h6 className="mb-3" style={styles.label}>Imágenes del Producto</h6>
                {(formData.imagenes || ['']).map((url, index) => (
                  <div key={index} className="d-flex align-items-center mb-2">
                    <input type="text" className="form-control me-2" style={styles.input} placeholder="https://ejemplo.com/imagen.jpg" value={url || ''} onChange={(e) => handleImageChange(index, e.target.value)} />
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveImageField(index)} disabled={!formData.imagenes || formData.imagenes.length <= 1}>&times;</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={handleAddImageField}>Añadir URL de Imagen</button>
              </div>

              <div className="p-3 mb-3 border rounded" style={{ borderColor: '#fda4af', backgroundColor: '#fff' }}>
                <h6 className="mb-3" style={styles.label}>Configuración de Oferta</h6>
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label" style={styles.label}>Porcentaje de Descuento (%)</label>
                    <input type="number" className="form-control" style={styles.input} name="descuento_porcentaje" value={formData.descuento_porcentaje || 0} onChange={handleChange} />
                  </div>
                  <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <div className="form-check form-switch fs-5 mt-3">
                      <input className="form-check-input" type="checkbox" role="switch" name="en_oferta" checked={formData.en_oferta || false} onChange={handleChange} style={{ borderColor: '#ec4899' }} />
                      <label className="form-check-label" style={styles.label}>Activar Oferta</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- SECCIÓN DE OPCIONES (TOPPINGS) --- */}
              <div className="card" style={{ border: '1px solid #fda4af', backgroundColor: '#fff1f2' }}>
                <div className="card-body">
                  <div className="form-check form-switch fs-5">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      role="switch" 
                      id="gestionarOpcionesSwitch" 
                      checked={gestionarOpciones} 
                      onChange={(e) => setGestionarOpciones(e.target.checked)}
                      disabled={!formData.id}
                      style={{ borderColor: '#ec4899' }}
                    />
                    <label className="form-check-label" htmlFor="gestionarOpcionesSwitch" style={{ color: '#881337' }}>Gestionar Opciones (Toppings)</label>
                  </div>
                  
                  {gestionarOpciones && formData.id && (
                    <div className="mt-4">
                      {/* Formulario para CREAR NUEVO GRUPO */}
                      <div className="p-3 mb-4 border rounded" style={{ backgroundColor: '#fff', borderColor: '#fda4af' }}> 
                        <h5 className="mb-3" style={{ color: '#881337' }}>Crear Nuevo Grupo</h5>
                        
                        <div className="row g-3">
                          <div className="col-md-5">
                            <label className="form-label" style={styles.label}>Nombre del Grupo</label>
                            <input type="text" className="form-control" style={styles.input} placeholder="Ej: Elige tu Jarabe" value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" style={styles.label}>Tipo de Selección</label>
                            <select className="form-select" style={styles.input} value={tipoSeleccion} onChange={(e) => setTipoSeleccion(e.target.value)}>
                              <option value="unico">Única (Radio Button)</option>
                              <option value="multiple">Múltiple (Checkbox)</option>
                            </select>
                          </div>
                          <div className="col-md-3 d-flex align-items-end">
                            <button type="button" onClick={handleAddGroup} className="btn w-100" style={{ backgroundColor: '#be185d', color: 'white' }}>Crear Grupo</button>
                          </div>
                        </div>
                      </div>

                      <hr style={{ borderColor: '#fda4af' }} />

                      {/* Lista de Grupos Existentes */}
                      {loadingGrupos ? (
                        <div className="text-center my-3"><div className="spinner-border text-danger" role="status"></div></div>
                      ) : (
                        grupos.length > 0 ? (
                          grupos.map(grupo => (
                            <GrupoOpcionesCard
                              key={grupo.id}
                              grupo={grupo}
                              onOptionAdded={handleOptionAdded} 
                              onOptionDeleted={handleOptionDeleted} 
                              onGroupDeleted={handleGroupDeleted} 
                            />
                          ))
                        ) : (
                          <p className="text-center text-muted">Este producto no tiene grupos de opciones. ¡Crea uno!</p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div> 

            </div> {/* Fin .modal-body */}
            
            <div className="modal-footer" style={{ borderTop: '1px solid #fda4af' }}>
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
              <button type="submit" className="btn" style={{ backgroundColor: '#ec4899', color: 'white', border: 'none', padding: '8px 20px', fontWeight: 'bold' }}>
                GUARDAR CAMBIOS
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}

export default ProductModal;