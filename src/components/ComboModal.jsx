import React, { useState, useEffect } from 'react';

function ComboModal({ show, handleClose, handleSave, comboActual }) {
  // Estado inicial con los dos interruptores independientes
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    precio: '',
    imagenes: [''],
    descuento_porcentaje: 0,
    oferta_activa: false,  // Para activar/desactivar el descuento
    activa: true,         // Para la visibilidad del combo
  });

  useEffect(() => {
    if (show) {
      if (comboActual) {
        // Si estamos editando, llenamos el formulario con los datos existentes
        setFormData({
          id: comboActual.id,

          // --- ¡CORRECCIÓN #1: LEER 'nombre'! ---
          // Leemos 'nombre' del combo, pero lo guardamos en el estado 'titulo'
          // para que el input 'name="titulo"' funcione.
          titulo: comboActual.nombre || '', 
          
          descripcion: comboActual.descripcion || '',
          precio: comboActual.precio || '',
          imagenes: (comboActual.imagenes && comboActual.imagenes.length > 0) ? comboActual.imagenes : (comboActual.imagen_url ? [comboActual.imagen_url] : ['']),
          descuento_porcentaje: comboActual.descuento_porcentaje || 0,
          oferta_activa: comboActual.oferta_activa !== undefined ? comboActual.oferta_activa : (comboActual.en_oferta || false),
          activa: comboActual.activa !== undefined ? comboActual.activa : (comboActual.esta_activo !== undefined ? comboActual.esta_activo : true),
        });
      } else {
        // Reseteamos el formulario para un combo nuevo
        setFormData({
          titulo: '',
          descripcion: '',
          precio: '',
          imagenes: [''],
          descuento_porcentaje: 0,
          oferta_activa: false,
          activa: true,
        });
      }
    }
  }, [comboActual, show]); // Se ejecuta cuando el modal se muestra o el combo cambia

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' || type === 'switch' ? checked : value,
    }));
  };
  
  const handleImageChange = (index, value) => {
    const newImages = [...formData.imagenes];
    newImages[index] = value;
    setFormData({ ...formData, imagenes: newImages });
  };

  const handleAddImageField = () => {
    setFormData({ ...formData, imagenes: [...formData.imagenes, ''] });
  };

  const handleRemoveImageField = (index) => {
    if (formData.imagenes.length <= 1) return;
    const newImages = formData.imagenes.filter((_, i) => i !== index);
    setFormData({ ...formData, imagenes: newImages });
  };

  // ==========================================
  // ¡AQUÍ ESTÁ LA CORRECCIÓN DEL ERROR 400!
  // ==========================================
  const onSave = (e) => {
    e.preventDefault();
    
    // Limpiamos las URLs de imagen vacías
    const cleanedData = {
      ...formData,
      imagenes: formData.imagenes.filter(url => url && url.trim() !== ''),
    };

    // NO borramos 'titulo'. El backend (combosController) 
    // lo espera en req.body.titulo para la validación.
    // delete cleanedData.titulo;  <-- ESTA LÍNEA SE ELIMINÓ
    
    // Enviamos 'cleanedData' que ahora SÍ contiene 'titulo' y 'precio'
    handleSave(cleanedData);
  };
  // ==========================================


  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={onSave}>
            <div className="modal-header">
              <h5 className="modal-title">{formData.id ? 'Editar Combo' : 'Añadir Nuevo Combo'}</h5>
              <button type="button" className="btn-close" onClick={handleClose}></button>
            </div>
            <div className="modal-body">
              {/* Campos de Título, Descripción, Precio e Imágenes */}
              <div className="mb-3">
                <label htmlFor="titulo" className="form-label">Título del Combo</label>
                {/* Este input sigue usando 'name="titulo"' y 'value={formData.titulo}', lo cual está perfecto */}
                <input type="text" className="form-control" id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label htmlFor="descripcion" className="form-label">Descripción</label>
                <textarea className="form-control" id="descripcion" name="descripcion" rows="3" value={formData.descripcion} onChange={handleChange}></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="precio" className="form-label">Precio</label>
                <input type="number" step="0.01" className="form-control" id="precio" name="precio" value={formData.precio} onChange={handleChange} required />
              </div>
              <div className="p-3 mb-3 border rounded">
                <h6 className="mb-3">Imágenes del Combo</h6>
                {formData.imagenes.map((url, index) => (
                  <div key={index} className="d-flex align-items-center mb-2">
                    <input type="text" className="form-control me-2" placeholder="https://ejemplo.com/imagen.jpg" value={url} onChange={(e) => handleImageChange(index, e.target.value)} />
                    <button type="button" className="btn-outline-danger btn-sm" onClick={() => handleRemoveImageField(index)} disabled={formData.imagenes.length <= 1}>&times;</button>
                  </div>
                ))}
                <button type="button" className="btn-outline-primary btn-sm mt-2" onClick={handleAddImageField}>Añadir URL de Imagen</button>
              </div>

              {/* --- SECCIÓN DE INTERRUPTORES (Esta ya estaba bien) --- */}
              <div className="p-3 border rounded">
                <h6 className="mb-3">Configuración de Oferta y Visibilidad</h6>
                <div className="mb-3">
                  <label htmlFor="descuento_porcentaje" className="form-label">Porcentaje de Descuento (%)</label>
                  <input type="number" className="form-control" id="descuento_porcentaje" name="descuento_porcentaje" value={formData.descuento_porcentaje} onChange={handleChange} />
                </div>
                
                {/* Interruptor para el DESCUENTO */}
                <div className="form-check form-switch mb-2">
                  <input className="form-check-input" type="checkbox" role="switch" id="oferta_activa" name="oferta_activa" checked={formData.oferta_activa} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="oferta_activa">Activar Descuento</label>
                </div>

                {/* Interruptor para la VISIBILIDAD */}
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="activa" name="activa" checked={formData.activa} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="activa">Combo Visible para Clientes</label>
                </div>
              </div>

            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ComboModal;