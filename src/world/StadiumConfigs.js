// Configuración de estadios ficticios. El constructor del estadio usa estos datos.
export const STADIUMS = {
  palmas: {
    id: 'palmas', name: 'Estadio Municipal Las Palmas', city: 'San Isidro', capacity: 9800, tier: 1,
    nearRows: 24, endRows: 12, farRows: 16, rowDepth: 0.8, rowHeight: 0.42,
    roof: 'main', corners: false, lights: 'towers', crowdDensity: 0.62,
    seatColors: ['#c8102e', '#1a1a1a'], facade: '#e9e2d0', facadeBand: '#c8102e', hasBarra: true,
    description: 'Estadio municipal de tamaño mediano. Graderías cercanas a la cancha y ambiente familiar.',
  },
  irazu: {
    id: 'irazu', name: 'Estadio Metropolitano Irazú', city: 'San José', capacity: 32000, tier: 2,
    nearRows: 26, endRows: 26, farRows: 26, rowDepth: 0.78, rowHeight: 0.46,
    roof: 'full', corners: true, lights: 'roof', crowdDensity: 0.8,
    seatColors: ['#2b5fae', '#dcdcdc'], facade: '#cfd6dc', facadeBand: '#2b5fae', hasBarra: true,
    description: 'Recinto moderno de gran capacidad, techo perimetral e iluminación LED.',
  },
  fortaleza: {
    id: 'fortaleza', name: 'Estadio La Fortaleza', city: 'Alajuela Sur', capacity: 22000, tier: 3,
    nearRows: 24, endRows: 22, farRows: 24, rowDepth: 0.72, rowHeight: 0.52,
    roof: 'main', corners: true, lights: 'towers', crowdDensity: 0.95,
    seatColors: ['#8a1020', '#f2f2f2'], facade: '#b9b1a3', facadeBand: '#8a1020', hasBarra: true, clasico: true,
    description: 'Graderías empinadas y barras ruidosas. El escenario de los clásicos.',
  },
};
