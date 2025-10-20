// Archivo: src/components/ProductSalesReport.jsx (Versión Final)

import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function ProductSalesReport() {
  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const ultimoDiaMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [fechas, setFechas] = useState({
    inicio: primerDiaMes,
    fin: ultimoDiaMes,
  });

  const handleDateChange = (e) => {
    setFechas({ ...fechas, [e.target.name]: e.target.value });
  };

  const generarReporte = async () => {
    if (!fechas.inicio || !fechas.fin) {
      return toast.error('Por favor, selecciona ambas fechas.');
    }
    setLoading(true);
    try {
      // --- ¡URL CORREGIDA! ---
      // Ahora usamos la URL relativa gracias a la configuración global de axios.
      const res = await axios.get(`/api/ventas/reporte-productos`, {
        params: fechas, // axios convertirá esto a ?inicio=FECHA&fin=FECHA
      });
      setReporte(res.data);
      if (res.data.length === 0) {
        toast.success('No se encontraron ventas en el periodo seleccionado.');
      }
    } catch (err) {
      toast.error('No se pudo generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Reporte de Ventas por Producto</h1>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label htmlFor="inicio" className="form-label">Fecha de Inicio</label>
              <input type="date" className="form-control" name="inicio" value={fechas.inicio} onChange={handleDateChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="fin" className="form-label">Fecha de Fin</label>
              <input type="date" className="form-control" name="fin" value={fechas.fin} onChange={handleDateChange} />
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary w-100" onClick={generarReporte} disabled={loading}>
                {loading ? 'Generando...' : 'Generar Reporte'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {reporte.length > 0 && (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th>Producto</th>
                <th>Unidades Vendidas</th>
                <th>Ingreso Total</th>
              </tr>
            </thead>
            <tbody>
              {reporte.map(item => (
                <tr key={item.id}>
                  <td>{item.nombre}</td>
                  <td>{item.unidades_vendidas}</td>
                  <td>${Number(item.ingreso_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProductSalesReport;