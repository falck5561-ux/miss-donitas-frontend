import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

// Este componente es una "tarjeta" para un solo grupo de opciones
function GrupoOpcionesCard({ grupo, productoId, onOptionAdded, onOptionDeleted, onGroupDeleted, theme }) {
  const [nombreOpcion, setNombreOpcion] = useState('');
  const [precioOpcion, setPrecioOpcion] = useState(0);

  const cardClass = theme === 'dark' ? 'card text-bg-dark border-secondary' : 'card';
  const inputClass = theme === 'dark' ? 'form-control form-control-dark bg-dark text-white' : 'form-control';
  const listGroupClass = theme === 'dark' ? 'list-group-item bg-dark text-white border-secondary' : 'list-group-item';

  // Manejador para agregar una NUEVA OPCIÓN (ej: "Nutella") a este grupo
  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!nombreOpcion.trim()) return toast.error('El nombre de la opción no puede estar vacío.');

    try {
      const optionData = { nombre: nombreOpcion, precio_adicional: parseFloat(precioOpcion) || 0 };
      // Llamamos a la API que YA EXISTE en tu backend
      const res = await apiClient.post(`/productos/grupos/${grupo.id}/opciones`, optionData);
      onOptionAdded(grupo.id, res.data); // Actualiza el estado en el modal principal
      setNombreOpcion('');
      setPrecioOpcion(0);
      toast.success('Opción agregada');
    } catch (error) {
      console.error("Error al agregar opción:", error);
      toast.error('No se pudo agregar la opción.');
    }
  };

  // Manejador para eliminar una OPCIÓN (ej: "Nutella")
  const handleDeleteOption = async (opcionId) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta opción?')) return;
    try {
      // Llamamos a la API que YA EXISTE en tu backend
      await apiClient.delete(`/productos/opciones/${opcionId}`);
      onOptionDeleted(grupo.id, opcionId); // Actualiza el estado en el modal principal
      toast.success('Opción eliminada');
    } catch (error) {
      console.error("Error al eliminar opción:", error);
      toast.error('No se pudo eliminar la opción.');
    }
  };

  // Manejador para eliminar el GRUPO ENTERO (ej: "Elige Jarabe")
  const handleDeleteGroup = async () => {
    if (!window.confirm(`¿Seguro que quieres eliminar el grupo "${grupo.nombre}" y todas sus opciones?`)) return;
    try {
      // Llamamos a la API que YA EXISTE en tu backend
      await apiClient.delete(`/productos/grupos/${grupo.id}`);
      onGroupDeleted(grupo.id); // Actualiza el estado en el modal principal
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
        <button className="btn btn-sm btn-outline-danger" onClick={handleDeleteGroup}>
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
                <button className="btn btn-sm btn-link text-danger" onClick={() => handleDeleteOption(op.id)}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No hay opciones en este grupo.</p>
        )}

        <hr />
        
        <h6 className="card-title">Añadir nueva opción:</h6>
        <form onSubmit={handleAddOption} className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Nombre Opción</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Ej: Nutella"
              value={nombreOpcion}
              onChange={(e) => setNombreOpcion(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Precio Adicional</label>
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
            <button type="submit" className="btn btn-primary w-100">Añadir</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Este es el Modal principal que contiene todo
function OpcionesModal({ show, handleClose, producto, theme }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de CREAR UN NUEVO GRUPO
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [tipoSeleccion, setTipoSeleccion] = useState('unico'); // 'unico' (radio) o 'multiple' (checkbox)

  const modalClass = theme === 'dark' ? 'modal-content text-bg-dark' : 'modal-content';
  const closeButtonClass = theme === 'dark' ? 'btn-close btn-close-white' : 'btn-close';
  const inputClass = theme === 'dark' ? 'form-control form-control-dark bg-dark text-white' : 'form-control';
  const selectClass = theme === 'dark' ? 'form-select form-select-dark bg-dark text-white' : 'form-select';


  // Carga los grupos y opciones del producto cuando el modal se abre
  useEffect(() => {
    if (show && producto) {
      setLoading(true);
      // Hacemos la llamada a la API que YA EXISTE en tu backend
      apiClient.get(`/productos/${producto.id}`)
        .then(res => {
          // El backend ya nos devuelve el producto con 'grupos_opciones'
          setGrupos(res.data.grupos_opciones || []);
        })
        .catch(err => {
          console.error("Error al cargar opciones:", err);
          toast.error('No se pudieron cargar las opciones.');
        })
        .finally(() => setLoading(false));
    }
  }, [show, producto]);

  // Manejador para CREAR UN NUEVO GRUPO (ej: "Elige tu leche")
  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!nombreGrupo.trim()) return toast.error('El nombre del grupo no puede estar vacío.');

    try {
      const groupData = { nombre: nombreGrupo, tipo_seleccion: tipoSeleccion };
      // Llamamos a la API que YA EXISTE en tu backend
      const res = await apiClient.post(`/productos/${producto.id}/grupos`, groupData);
      res.data.opciones = []; // El nuevo grupo empieza sin opciones
      setGrupos([...grupos, res.data]);
      setNombreGrupo('');
      setTipoSeleccion('unico');
      toast.success('Grupo creado');
    } catch (error) {
      console.error("Error al crear grupo:", error);
      toast.error('No se pudo crear el grupo.');
    }
  };

  // --- Funciones para actualizar el estado local (sin recargar) ---
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
  // --- Fin de funciones de actualización ---


  if (!show) return null;

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      {/* Hacemos el modal más grande (modal-xl) y con scroll interno */}
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className={modalClass}>
          <div className="modal-header">
            <h5 className="modal-title">Gestionar Opciones para: {producto?.nombre}</h5>
            <button type="button" className={closeButtonClass} onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            
            {/* Formulario para CREAR NUEVO GRUPO */}
            <div className="p-3 mb-4 border rounded">
              <h5 className="mb-3">Crear Nuevo Grupo de Opciones</h5>
              <form onSubmit={handleAddGroup} className="row g-3">
                <div className="col-md-5">
                  <label className="form-label">Nombre del Grupo</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ej: Elige tu Jarabe"
                    value={nombreGrupo}
                    onChange={(e) => setNombreGrupo(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Tipo de Selección</label>
                  <select
                    className={selectClass}
                    value={tipoSeleccion}
                    onChange={(e) => setTipoSeleccion(e.target.value)}
                  >
                    <option value="unico">Única (Radio Button)</option>
                    <option value="multiple">Múltiple (Checkbox)</option>
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-success w-100">Crear Grupo</button>
                </div>
              </form>
            </div>

            <hr />

            {/* Lista de Grupos Existentes */}
            {loading ? (
              <div className="text-center"><div className="spinner-border" role="status"></div></div>
            ) : (
              grupos.length > 0 ? (
                grupos.map(grupo => (
                  <GrupoOpcionesCard
                    key={grupo.id}
                    grupo={grupo}
                    productoId={producto.id}
                    onOptionAdded={handleOptionAdded}
                    onOptionDeleted={handleOptionDeleted}
                    onGroupDeleted={handleGroupDeleted}
                    theme={theme}
                  />
                ))
              ) : (
                <p className="text-center text-muted">Este producto aún no tiene grupos de opciones. ¡Crea uno!</p>
              )
            )}

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpcionesModal;