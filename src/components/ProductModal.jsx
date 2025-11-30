import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

// --- Componente Interno para la Tarjeta de Grupo de Opciones ---
function GrupoOpcionesCard({ grupo, onOptionAdded, onOptionDeleted, onGroupDeleted, theme }) {
  const [nombreOpcion, setNombreOpcion] = useState('');
  const [precioOpcion, setPrecioOpcion] = useState(0);

  // Mantenemos tus estilos oscuros aquí, que ya estaban bien
  const cardClass = theme === 'dark' ? 'card text-bg-dark border-secondary' : 'card';
  const inputClass = theme === 'dark' ? 'form-control bg-dark text-white border-secondary' : 'form-control';
  const listGroupClass = theme === 'dark' ? 'list-group-item bg-dark text-white border-secondary' : 'list-group-item';

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
    <div className={`${cardClass} mb-4`}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>Grupo: <strong>{grupo.nombre}</strong> (Selección: {grupo.tipo_seleccion})</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleDeleteGroup}>
          Eliminar Grupo
        </button>
      </div>
      <div className="card-body">
        <h6 className="card-title">Opciones existentes:</h6>
        {grupo.opciones && grupo.opciones.length > 0 ? (
          <ul className="list-group list-group-flush mb-3">
            {grupo.opciones.map(op => (
              <li key={op.id} className={`${listGroupClass} d-flex justify-content-between align-items-center`}>
                <span>{op.nombre} (+${Number(op.precio_adicional).toFixed(2)})</span>
                <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => handleDeleteOption(op.id)}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted small">No hay opciones en este grupo.</p>
        )}
        <hr className="border-secondary" />
        <h6 className="card-title">Añadir nueva opción:</h6>
        
        <div className="row g-2">
          <div className="col-md-6">
            <input
              type="text"
              className={inputClass}
              placeholder="Ej: Nutella"
              value={nombreOpcion}
              onChange={(e) => setNombreOpcion(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <input
              type="number"
              step="0.01"
              className={inputClass}
              placeholder="Ej: 15"
              value={precioOpcion}
              onChange={(e) => setPrecioOpcion(e.target.value)}
            />
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button type="button" onClick={handleAddOption} className="btn btn-primary btn-sm w-100">Añadir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- Fin del Componente Interno ---


// --- Modal Principal de Producto (CORREGIDO) ---
function ProductModal({ show, handleClose, handleSave, productoActual }) {
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: 0,
    categoria: 'General',
    imagenes: [''],
    descuento_porcentaje: 0,
    en_oferta: false,
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
            const productoCompleto = res.data;
            if (productoCompleto.grupos_opciones && productoCompleto.grupos_opciones.length > 0) {
              setGrupos(productoCompleto.grupos_opciones);
              setGestionarOpciones(true); 
            } else {
              setGrupos([]);
              setGestionarOpciones(false);
            }
          })
          .catch(err => {
            console.error("Error cargando detalles del producto:", err);
            toast.error("No se pudieron cargar las opciones del producto");
            setGrupos([]);
          })
          .finally(() => {
            setLoadingGrupos(false);
          });

      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          precio: '',
          stock: 0,
          categoria: 'General',
          imagenes: [''],
          descuento_porcentaje: 0,
          en_oferta: false,
        });
        setGrupos([]);
        setGestionarOpciones(false);
        setLoadingGrupos(false);
      }
    }
  }, [productoActual, show]);
  
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...(formData.imagenes || [''])];
    newImages[index] = value;
    setFormData({ ...formData, imagenes: newImages });
  };

  const handleAddImageField = () => {
    setFormData({ ...formData, imagenes: [...(formData.imagenes || ['']), ''] });
  };

  const handleRemoveImageField = (index) => {
    if (!formData.imagenes || formData.imagenes.length <= 1) return;
    const newImages = formData.imagenes.filter((_, i) => i !== index);
    setFormData({ ...formData, imagenes: newImages });
  };

  const onSave = (e) => {
    e.preventDefault();
    const datosParaEnviar = {
      ...formData,
      imagenes: (formData.imagenes || []).filter(url => url && url.trim() !== ''),
    };
    handleSave(datosParaEnviar);
  };

  // --- Manejadores para Grupos y Opciones ---

  const handleAddGroup = async () => {
    if (!productoActual?.id) {
      return toast.error('Guarda el producto antes de añadir grupos.');
    }
    if (!nombreGrupo.trim()) return toast.error('El nombre del grupo no puede estar vacío.');

    try {
      const groupData = { nombre: nombreGrupo, tipo_seleccion: tipoSeleccion };
      const res = await apiClient.post(`/productos/${productoActual.id}/grupos`, groupData);
      res.data.opciones = []; 
      setGrupos([...grupos, res.data]);
      setNombreGrupo('');
      setTipoSeleccion('unico');
      toast.success('Grupo creado');
    } catch (error) {
      console.error("Error al crear grupo:", error);
      toast.error('No se pudo crear el grupo.');
    }
  };

  const handleOptionAdded = (grupoId, nuevaOpcion) => {
    setGrupos(gruposActuales => gruposActuales.map(g =>
      g.id === grupoId ? { ...g, opciones: [...g.opciones, nuevaOpcion] } : g
    ));
  };

  const handleOptionDeleted = (grupoId, opcionId) => {
    setGrupos(gruposActuales => gruposActuales.map(g =>
      g.id === grupoId ? { ...g, opciones: g.opciones.filter(o => o.id !== opcionId) } : g
    ));
  };

  const handleGroupDeleted = (grupoId) => {
    setGrupos(gruposActuales => gruposActuales.filter(g => g.id !== grupoId));
  };
  // --- Fin Manejadores Grupos y Opciones ---

  // --- DEFINICIÓN DE ESTILOS UNIFICADOS ---
  const theme = 'dark'; 
  const modalContentClass = "modal-content bg-dark text-white"; 
  // ESTE ES EL CAMBIO CLAVE: Todos los inputs tendrán fondo oscuro y texto blanco
  const inputStyle = "form-control bg-dark text-white border-secondary";

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className={modalContentClass}> 
          
          <div className="modal-header border-secondary">
            <h5 className="modal-title">{formData.id ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
          </div>
          
          <form onSubmit={onSave} className="d-flex flex-column flex-grow-1" style={{ minHeight: "0" }}>
            
            <div className="modal-body">
              
              {/* --- CAMPOS BÁSICOS DEL PRODUCTO --- */}
              <div className="mb-3">
                <label className="form-label">Nombre del Producto</label>
                {/* Se aplicó inputStyle */}
                <input type="text" className={inputStyle} name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Descripción</label>
                {/* Se aplicó inputStyle */}
                <textarea className={inputStyle} name="descripcion" rows="2" value={formData.descripcion || ''} onChange={handleChange}></textarea>
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Precio</label>
                  {/* Se aplicó inputStyle */}
                  <input type="number" step="0.01" className={inputStyle} name="precio" value={formData.precio || ''} onChange={handleChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Stock</label>
                  {/* Se aplicó inputStyle */}
                  <input type="number" className={inputStyle} name="stock" value={formData.stock || 0} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Categoría</label>
                  {/* Se aplicó inputStyle */}
                  <input type="text" className={inputStyle} name="categoria" value={formData.categoria || 'General'} onChange={handleChange} />
                </div>
              </div>
              
              <hr className="border-secondary my-4" />
              
              <div className="p-3 mb-3 border border-secondary rounded bg-opacity-10 bg-white">
                <h6 className="mb-3">Imágenes del Producto</h6>
                {(formData.imagenes || ['']).map((url, index) => (
                  <div key={index} className="d-flex align-items-center mb-2">
                    {/* Se aplicó inputStyle y margen */}
                    <input type="text" className={`${inputStyle} me-2`} placeholder="https://ejemplo.com/imagen.jpg" value={url || ''} onChange={(e) => handleImageChange(index, e.target.value)} />
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveImageField(index)} disabled={!formData.imagenes || formData.imagenes.length <= 1}>&times;</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={handleAddImageField}>Añadir URL de Imagen</button>
              </div>

              <div className="p-3 mb-3 border border-secondary rounded bg-opacity-10 bg-white">
                <h6 className="mb-3">Configuración de Oferta</h6>
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Porcentaje de Descuento (%)</label>
                    {/* Se aplicó inputStyle */}
                    <input type="number" className={inputStyle} name="descuento_porcentaje" value={formData.descuento_porcentaje || 0} onChange={handleChange} />
                  </div>
                  <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <div className="form-check form-switch fs-5 mt-3">
                      <input className="form-check-input" type="checkbox" role="switch" name="en_oferta" checked={formData.en_oferta || false} onChange={handleChange} />
                      <label className="form-check-label">Activar Oferta</label>
                    </div>
                  </div>
                </div>
              </div>
              {/* --- FIN CAMPOS BÁSICOS --- */}


              {/* --- SECCIÓN DE OPCIONES (TOPPINGS) --- */}
              <div className="card text-bg-dark border-secondary">
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
                    />
                    <label className="form-check-label" htmlFor="gestionarOpcionesSwitch">Gestionar Opciones (Toppings)</label>
                  </div>
                  {!formData.id && (
                    <div className="form-text text-white-50">Guarda el producto primero para poder añadirle opciones.</div>
                  )}

                  
                  {gestionarOpciones && formData.id && (
                    <div className="mt-4">
                      {/* Formulario para CREAR NUEVO GRUPO */}
                      <div className="p-3 mb-4 border rounded text-bg-dark border-secondary bg-opacity-10"> 
                        <h5 className="mb-3">Crear Nuevo Grupo</h5>
                        
                        <div className="row g-3">
                          <div className="col-md-5">
                            <label className="form-label">Nombre del Grupo</label>
                            {/* Se aplicó inputStyle */}
                            <input type="text" className={inputStyle} placeholder="Ej: Elige tu Jarabe" value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Tipo de Selección</label>
                            {/* Se aplicó inputStyle */}
                            <select className={inputStyle} value={tipoSeleccion} onChange={(e) => setTipoSeleccion(e.target.value)}>
                              <option value="unico" className="text-dark">Única (Radio Button)</option>
                              <option value="multiple" className="text-dark">Múltiple (Checkbox)</option>
                            </select>
                          </div>
                          <div className="col-md-3 d-flex align-items-end">
                            <button type="button" onClick={handleAddGroup} className="btn btn-success w-100">Crear Grupo</button>
                          </div>
                        </div>
                      </div>

                      <hr className="border-secondary" />

                      {/* Lista de Grupos Existentes */}
                      {loadingGrupos ? (
                        <div className="text-center my-3"><div className="spinner-border text-light" role="status"></div><p className="mt-2">Cargando opciones...</p></div>
                      ) : (
                        grupos.length > 0 ? (
                          grupos.map(grupo => (
                            <GrupoOpcionesCard
                              key={grupo.id}
                              grupo={grupo}
                              onOptionAdded={handleOptionAdded} 
                              onOptionDeleted={handleOptionDeleted} 
                              onGroupDeleted={handleGroupDeleted} 
                              theme={theme} 
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
            
            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
              {/* Botón personalizado con color Rosa */}
              <button type="submit" className="btn" style={{ backgroundColor: '#ec4899', color: 'white' }}>Guardar Cambios</button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}

export default ProductModal;