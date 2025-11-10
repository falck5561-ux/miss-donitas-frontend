import React, { useState, useEffect } from 'react';
import { getProductById, createProductGroup, addProductOption, deleteProductGroup, deleteProductOption } from '../services/productService';

// Componente interno para manejar el formulario de agregar opción
function AddOptionForm({ grupoId, onOptionAdded }) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('El nombre de la opción no puede estar vacío.');
      return;
    }
    try {
      await addProductOption(grupoId, { nombre, precio_adicional: precio });
      setNombre('');
      setPrecio(0);
      onOptionAdded(); // Llama a la función para recargar los datos
    } catch (error) {
      console.error("Error al agregar opción:", error);
      alert('Error al agregar la opción. Verifique la consola.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex gap-2 mt-2 mb-3 align-items-center">
      <input
        type="text"
        className="form-control form-control-sm"
        placeholder="Nombre Opción (Ej: Nutella)"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <input
        type="number"
        step="0.01"
        className="form-control form-control-sm"
        placeholder="Precio Adicional"
        value={precio}
        onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
        style={{ width: '100px' }}
      />
      <button type="submit" className="btn btn-success btn-sm text-nowrap">+</button>
    </form>
  );
}

// Modal principal de Toppings
function ToppingsModal({ show, handleClose, producto }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- Estados para el formulario de NUEVO GRUPO ---
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState('');
  const [nuevoGrupoTipo, setNuevoGrupoTipo] = useState('unico');

  // Función para cargar/recargar todos los toppings del producto
  const fetchToppings = async () => {
    if (!producto?.id) return;
    setLoading(true);
    try {
      // Usamos la función getProductById que ya trae los toppings
      const data = await getProductById(producto.id);
      setGrupos(data.grupos_opciones || []);
    } catch (error) {
      console.error("Error al cargar toppings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar los toppings cuando el modal se abre o el producto cambia
  useEffect(() => {
    if (show) {
      fetchToppings();
    }
  }, [show, producto]);

  if (!show) {
    return null;
  }

  const handleCrearGrupo = async (e) => {
    e.preventDefault();
    if (!nuevoGrupoNombre.trim()) {
      alert('El nombre del grupo no puede estar vacío.');
      return;
    }
    try {
      await createProductGroup(producto.id, { nombre: nuevoGrupoNombre, tipo_seleccion: nuevoGrupoTipo });
      setNuevoGrupoNombre('');
      setNuevoGrupoTipo('unico');
      fetchToppings(); // Recargar
    } catch (error) {
      console.error("Error al crear grupo:", error);
      alert('Error al crear el grupo. Verifique la consola.');
    }
  };

  const handleEliminarGrupo = async (grupoId) => {
    if (window.confirm('¿Seguro que quieres eliminar este grupo y TODAS sus opciones?')) {
      try {
        await deleteProductGroup(grupoId);
        fetchToppings(); // Recargar
      } catch (error) {
        console.error("Error al eliminar grupo:", error);
      }
    }
  };

  const handleEliminarOpcion = async (opcionId) => {
    if (window.confirm('¿Seguro que quieres eliminar esta opción?')) {
      try {
        await deleteProductOption(opcionId);
        fetchToppings(); // Recargar
      } catch (error) {
        console.error("Error al eliminar opción:", error);
      }
    }
  };

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Administrar Opciones de: {producto?.nombre}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            
            {/* Formulario para crear NUEVO GRUPO */}
            <div className="p-3 mb-3 border rounded bg-light">
              <h6>Crear Nuevo Grupo de Opciones</h6>
              <form onSubmit={handleCrearGrupo} className="row g-2 align-items-end">
                <div className="col-sm-5">
                  <label htmlFor="newGroupName" className="form-label mb-0_">Nombre Grupo</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id="newGroupName"
                    placeholder="Ej: Elige tu Jarabe"
                    value={nuevoGrupoNombre}
                    onChange={(e) => setNuevoGrupoNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="col-sm-4">
                  <label htmlFor="newGroupType" className="form-label mb-0_">Tipo Selección</label>
                  <select
                    id="newGroupType"
                    className="form-select form-select-sm"
                    value={nuevoGrupoTipo}
                    onChange={(e) => setNuevoGrupoTipo(e.target.value)}
                  >
                    <option value="unico">Selección Única (Ej: 1 jarabe)</option>
                    <option value="multiple">Múltiple Selección (Ej: toppings extra)</option>
                  </select>
                </div>
                <div className="col-sm-3">
                  <button type="submit" className="btn btn-primary btn-sm w-100">Crear Grupo</button>
                </div>
              </form>
            </div>

            {/* Lista de Grupos Existentes */}
            <hr />
            <h6>Grupos de Opciones Existentes</h6>
            {loading && <p>Cargando...</p>}
            {!loading && grupos.length === 0 && <p className="text-muted">Este producto aún no tiene grupos de opciones.</p>}
            
            {grupos.map((grupo) => (
              <div key={grupo.id} className="p-3 mb-3 border rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">{grupo.nombre} <span className="badge bg-secondary ms-2">{grupo.tipo_seleccion}</span></h6>
                  <button 
                    type="button" 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleEliminarGrupo(grupo.id)}
                  >
                    &times; Eliminar Grupo
                  </button>
                </div>

                {/* Lista de Opciones */}
                {grupo.opciones && grupo.opciones.map((opcion) => (
                  <div key={opcion.id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <span>{opcion.nombre}</span>
                    <div>
                      <span className="me-3 text-success">+${parseFloat(opcion.precio_adicional).toFixed(2)}</span>
                      <button 
                        type="button" 
                        className="btn btn-outline-danger btn-sm"
                        style={{'--bs-btn-padding-y': '.1rem', '--bs-btn-padding-x': '.3rem', '--bs-btn-font-size': '.75rem'}}
                        onClick={() => handleEliminarOpcion(opcion.id)}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
                {grupo.opciones?.length === 0 && <p className="text-muted small fst-italic">Este grupo no tiene opciones.</p>}

                {/* Formulario para agregar NUEVA OPCIÓN a este grupo */}
                <AddOptionForm grupoId={grupo.id} onOptionAdded={fetchToppings} />
              </div>
            ))}
          
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToppingsModal;
