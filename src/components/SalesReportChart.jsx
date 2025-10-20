// Archivo: src/components/SalesReportChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registra los componentes necesarios de Chart.js para que funcionen
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function SalesReportChart({ reportData }) {
  // Prepara los datos en el formato que Chart.js entiende
  const data = {
    // Las etiquetas del eje X (las fechas)
    labels: reportData.map(item => new Date(item.dia).toLocaleDateString()),
    datasets: [
      {
        label: 'Ventas Totales ($)',
        // Los datos del eje Y (el total vendido)
        data: reportData.map(item => item.total_ventas),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Reporte de Ventas por Día',
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export default SalesReportChart;