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
// Sede principal: inspirada en la arquitectura del estadio de Tibás conocido como "La Cueva".
// Tribunas laterales de dos niveles con techos de cerchas blancas, cabeceras abiertas,
// butacas moradas con pasillos amarillos y fachada granate con letras gigantes.
STADIUMS.cueva = {
  id: 'cueva', name: 'Estadio La Cueva', city: 'Tibás', capacity: 23000, tier: 1,
  nearRows: 26, endRows: 14, farRows: 28, rowDepth: 0.74, rowHeight: 0.5,
  roof: 'sides', corners: false, lights: 'roof', crowdDensity: 0.92,
  seatColors: ['#4a2370', '#6e6a78'], aisleColor: '#f2b705', aisleEvery: 9,
  tiers: { near: { row: 13, rise: 2.2 }, far: { row: 14, rise: 2.6 } },
  banners: { near: ['ASCENSO TOTAL · LA CASA DEL FÚTBOL TICO', 'JUNTOS SOMOS MÁS FUERTES', 'ASCENSO TOTAL'], far: ['LA VIDA POR LOS COLORES', 'ASCENSO TOTAL · FOTO Y VIDEO', 'AQUÍ SE VIVE EL FÚTBOL'] },
  facade: '#5c1a33', facadeBand: '#6d1f3a', facadeLetters: ['L', 'A', '★', 'C', 'U', 'E', 'V', 'A'],
  hasBarra: true, tifo: 'La Cueva nunca duerme',
  description: 'La Cueva: graderías encima de la cancha, techos de cerchas y una barra que no para de cantar.',
};
