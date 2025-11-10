import React, { useState, useEffect } from 'react';
// --- NUEVA IMPORTACIÓN ---
import ToppingsModal from './ToppingsModal'; 

function ProductModal({ show, handleClose, handleSave, productoActual }) {
  // CAMBIO: El estado ahora maneja un arreglo 'imagenes' en lugar de 'imagen_url'
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    imagenes: [''], // Se inicializa con un campo de imagen vacío
    descuento_porcentaje: 0,
    en_oferta: false,
  });

  // --- NUEVO ESTADO para controlar el modal de toppings ---
  const [showToppingsModal, setShowToppingsModal] = useState(false);

  useEffect(() => {
    if (show) {
      // Resetear el modal de toppings por si acaso
      setShowToppingsModal(false); 

      if (productoActual) {
        // Si editamos, llenamos el form con los datos, incluyendo el arreglo de imágenes
        setFormData({
          id: productoActual.id,
          nombre: productoActual.nombre || '',
          descripcion: productoActual.descripcion || '',
          precio: productoActual.precio || '',
          stock: productoActual.stock || 0,
          categoria: productoActual.categoria || '',
          // CAMBIO: Si no hay imágenes o está vacío, se asegura de que haya al menos un campo
          imagenes: (productoActual.imagenes && productoActual.imagenes.length > 0) ? productoActual.imagenes : [''],
          descuento_porcentaje: productoActual.descuento_porcentaje || 0,
          en_oferta: productoActual.en_oferta || false,
        });
      } else {
        // Si añadimos uno nuevo, reseteamos el formulario con un campo de imagen
        setFormData({
          nombre: '',
          descripcion: '',
          precio: '',
          stock: '',
          categoria: '',
          imagenes: [''],
          descuento_porcentaje: 0,
          en_oferta: false,
        });
      }
    }
  }, [productoActual, show]);

  if (!show) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // --- NUEVAS FUNCIONES PARA MANEJAR MÚLTIPLES IMÁGENES ---

  const handleImageChange = (index, value) => {
    const newImages = [...formData.imagenes];
    newImages[index] = value;
    setFormData({ ...formData, imagenes: newImages });
  };

  const handleAddImageField = () => {
    setFormData({ ...formData, imagenes: [...formData.imagenes, ''] });
  };

  const handleRemoveImageField = (index) => {
    if (formData.imagenes.length <= 1) return; // No permitir eliminar el último campo
    const newImages = formData.imagenes.filter((_, i) => i !== index);
    setFormData({ ...formData, imagenes: newImages });
  };

  // --- NUEVA FUNCIÓN onSave para limpiar datos antes de guardar ---

  const onSave = (e) => {
    e.preventDefault();
    // Filtramos las URLs vacías antes de enviar los datos
    const cleanedData = {
      ...formData,
      imagenes: formData.imagenes.filter(url => url && url.trim() !== ''),
    };
    // Le quitamos el ID si es un producto nuevo (por si acaso)
    if (!productoActual) {
      delete cleanedData.id;
    }
    handleSave(cleanedData);
  };

  return (
    <>
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={onSave}>
              <div className="modal-header">
                <h5 className="modal-title">{formData.id ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h5>
                <button type="button" className="btn-close" onClick={handleClose}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* --- CAMPOS EXISTENTES --- */}
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">Nombre del Producto</label>
                  <input type="text" className="form-control" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">Descripción (Opcional)</label>
                  <textarea className="form-control" id="descripcion" name="descripcion" rows="3" value={formData.descripcion} onChange={handleChange}></textarea>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="precio" className="form-label">Precio</label>
                    <input type="number" step="0.01" className="form-control" id="precio" name="precio" value={formData.precio} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="stock" className="form-label">Stock</label>
                    <input type="number" className="form-control" id="stock" name="stock" value={formData.stock} onChange={handleChange} />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="categoria" className="form-label">Categoría</label>
                  <input type="text" className="form-control" id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} />
De             </div>
                
                {/* --- CAMBIO: SECCIÓN DINÁMICA PARA MÚLTIPLES IMÁGENES --- */}
                <div className="p-3 mb-3 border rounded">
                  <h6 className="mb-3">Imágenes del Producto</h6>
                  {formData.imagenes.map((url, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <input
                        type="text"
                        className="form-control me-2"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={url}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                      />
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveImageField(index)} disabled={formData.imagenes.length <= 1}>
                        &times;
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={handleAddImageField}>
                    Añadir URL de Imagen
                  </button>
                </div>

                {/* --- CAMPOS PARA OFERTAS --- */}
                <div className="p-3 mb-3 border rounded">
                  <h6 className="mb-3">Configuración de Oferta</h6>
                  <div className="mb-3">
                    <label htmlFor="descuento_porcentaje" className="form-label">Porcentaje de Descuento (%)</label>
                    <input type="number" className="form-control" id="descuento_porcentaje" name="descuento_porcentaje" value={formData.descuento_porcentaje} onChange={handleChange} />
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="en_oferta" name="en_oferta" checked={formData.en_oferta} onChange={handleChange} />
Of               <label className="form-check-label" htmlFor="en_oferta">Activar oferta para este producto</label>
                  </div>
                </div>
            
                {/* --- NUEVA SECCIÓN: BOTÓN DE ADMINISTRAR OPCIONES --- */}
                {formData.id && ( // Solo muestra este botón si estamos EDITANDO (el producto ya existe)
                  <div className="p-3 mb-3 border rounded bg-light">
                    <h6 className="mb-3">Opciones del Producto (Toppings)</h6>
                    <p className="form-text">Añade o edita opciones como "Jarabe de Chocolate" o "Leche de Almendra" para este producto.</p>
                    <button 
                      type="button" 
                      className="btn btn-outline-success w-100"
                      onClick={() => setShowToppingsModal(true)}
                    >
                      Administrar Opciones / Toppings
S                 </button>
                  </div>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* --- NUEVO MODAL DE TOPPINGS --- */}
      <ToppingsModal 
        show={showToppingsModal}
        handleClose={() => setShowToppingsModal(false)}
        producto={productoActual} 
      />
    </>
  );
}

export default ProductModal;
