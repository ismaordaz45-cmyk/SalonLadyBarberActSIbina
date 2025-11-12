import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  ContentCut as CorteIcon, // Ícono tijeras para corte
  FaceRetouchingNatural as FacialIcon, // Ícono facial para belleza
  School as ClaseIcon, // Ícono clase para particular
  LocalShipping as EnviosIcon,
  Verified as VerificadoIcon,
  Favorite as FavoritoIcon,
} from '@mui/icons-material'; // Íconos ajustados a barbería/belleza (guía íconos 24px)

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const PaginaPrincipal = () => {
  const categorias = [
    { nombre: 'Barbería', icono: <CorteIcon />, color: '#2C3E50' }, // Azul para barbería
    { nombre: 'Belleza', icono: <FacialIcon />, color: '#D4AF37' }, // Dorado para belleza
    { nombre: 'Tratamientos', icono: <ClaseIcon />, color: '#2C3E50' }, // Azul
    { nombre: 'Especiales', icono: <FavoritoIcon />, color: '#D4AF37' }, // Dorado
  ];

  const servicios = [ // Cambiado de "productos" a "servicios" de barbería
    {
      nombre: 'Corte Clásico',
      precio: '$150',
      imagen: '/placeholder.svg?height=200&width=200', // Placeholder, cambia por imagen real
      categoria: 'Barbería',
    },
    {
      nombre: 'Tratamiento Facial',
      precio: '$300',
      imagen: '/placeholder.svg?height=200&width=200',
      categoria: 'Belleza',
    },
    {
      nombre: 'Clase Particular',
      precio: '$500',
      imagen: '/placeholder.svg?height=200&width=200',
      categoria: 'Tratamientos',
    },
    {
      nombre: 'Estilo Premium',
      precio: '$250',
      imagen: '/placeholder.svg?height=200&width=200',
      categoria: 'Especiales',
    },
    {
      nombre: 'Corte Moderno',
      precio: '$180',
      imagen: '/placeholder.svg?height=200&width=200',
      categoria: 'Barbería',
    },
    {
      nombre: 'Manicure Express',
      precio: '$120',
      imagen: '/placeholder.svg?height=200&width=200',
      categoria: 'Belleza',
    },
  ];

  const beneficios = [
    {
      icono: <EnviosIcon sx={{ fontSize: 50 }} />,
      titulo: 'Citas Rápidas',
      descripcion: 'Reserva en minutos con disponibilidad real-time',
    },
    {
      icono: <VerificadoIcon sx={{ fontSize: 50 }} />,
      titulo: 'Calidad Garantizada',
      descripcion: 'Profesionales certificados y productos premium',
    },
    {
      icono: <FavoritoIcon sx={{ fontSize: 50 }} />,
      titulo: 'Personalizado',
      descripcion: 'Estilos únicos adaptados a tu personalidad',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <Box sx={{ 
      bgcolor: '#FFFFFF', // Blanco puro
      minHeight: '100vh', 
      py: 6, // Padding vertical secciones grandes
      fontFamily: "'Geist Sans', Arial, sans-serif", // Fuente principal
    }}>
      <Container maxWidth="lg"> {/* Max-width 1280px */}
        {/* Hero Section */}
        <MotionBox
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          sx={{
            textAlign: 'center',
            mb: 8,
            p: 4, // Padding secciones medianas
            background: `linear-gradient(135deg, #2C3E50 0%, #D4AF37 100%)`, // Degradado principal a acento
            borderRadius: 12, // Radius tarjetas 12px
            color: '#FFFFFF', // Blanco texto
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Sombra suave
          }}
        >
          <Typography variant="h1" component="h1" gutterBottom fontWeight="700" fontFamily="'Playfair Display', serif"> {/* Playfair H1 bold */}
            Lady Barber ID'M
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1rem', lineHeight: 1.6 }}> {/* Body regular 16px */}
            Elegancia dual en barbería y belleza. Transformamos tu estilo con pasión y precisión
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#FFFFFF', // Blanco fondo
              color: '#2C3E50', // Azul texto
              '&:hover': { 
                backgroundColor: alpha('#FFFFFF', 0.9), // Hover 90% blanco
                color: '#D4AF37', // Hover dorado texto
              },
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500,
              borderRadius: 8, // 8px botones
              transition: 'all 200ms ease', // 200ms
              boxShadow: 'none',
              '&:active': { backgroundColor: '#F5F5F5' }, // Active más oscuro
            }}
          >
            Ver Servicios
          </Button>
        </MotionBox>

        {/* Categorías */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h2" // H2 48px base
            component="h2"
            textAlign="center"
            gutterBottom
            fontWeight="700"
            color="#1A252F" // Negro suave
            fontFamily="'Playfair Display', serif"
            mb={4}
          >
            Nuestras Categorías
          </Typography>
          <Grid container spacing={3}> {/* Spacing 24px md ajustado */}
            {categorias.map((categoria, index) => (
              <Grid item xs={6} md={3} key={index}>
                <MotionCard
                  whileHover={{ scale: 1.05, rotate: 2 }} // Hover escala 5% + rotación sutil
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  sx={{
                    textAlign: 'center',
                    p: 3, // Padding 24px
                    cursor: 'pointer',
                    backgroundColor: categoria.color, // Color específico (azul/dorado)
                    color: '#FFFFFF', // Blanco texto
                    height: '100%',
                    borderRadius: 12, // 12px tarjetas
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Sombra suave
                    transition: 'all 200ms ease', // 200ms
                    '&:hover': {
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', // Hover sombra elevada
                    },
                  }}
                >
                  <Box sx={{ fontSize: 60, mb: 2 }}> {/* Ícono grande 24px escalado */}
                    {categoria.icono}
                  </Box>
                  <Typography variant="h4" fontWeight="600" fontFamily="'Geist Sans', Arial, sans-serif"> {/* H4 20px semibold */}
                    {categoria.nombre}
                  </Typography>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Servicios Destacados (cambiado de Productos) */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            gutterBottom
            fontWeight="700"
            color="#1A252F"
            fontFamily="'Playfair Display', serif"
            mb={4}
          >
            Servicios Destacados
          </Typography>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={4}> {/* Spacing xl 32px ajustado */}
              {servicios.map((servicio, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <MotionCard
                    variants={itemVariants}
                    whileHover={{ y: -10, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }} // Hover elevación + sombra elevada
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 12, // 12px tarjetas
                      overflow: 'hidden',
                      backgroundColor: '#FFFFFF', // Blanco
                      border: `1px solid ${alpha('#2C3E50', 0.2)}`, // Borde azul 20%
                      transition: 'all 200ms ease',
                      '&:hover': {
                        borderColor: alpha('#2C3E50', 0.4), // Hover border 40%
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={servicio.imagen}
                      alt={servicio.nombre}
                    />
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                      <Chip
                        label={servicio.categoria}
                        size="small"
                        sx={{ 
                          mb: 2, 
                          backgroundColor: servicio.categoria === 'Barbería' ? '#2C3E50' : '#D4AF37', // Azul o dorado según categoría
                          color: '#FFFFFF',
                          fontWeight: 500,
                        }}
                      />
                      <Typography variant="h4" component="h3" gutterBottom fontWeight="600" color="#1A252F"> {/* H4 20px semibold */}
                        {servicio.nombre}
                      </Typography>
                      <Typography variant="body2" color={alpha('#1A252F', 0.8)} sx={{ mb: 2, lineHeight: 1.6 }}> {/* Secondary 80% */}
                        Servicio premium con atención personalizada
                      </Typography>
                      <Typography variant="h5" color="#D4AF37" fontWeight="600" mb={2}> {/* Dorado precio */}
                        {servicio.precio}
                      </Typography>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: '#D4AF37', // Dorado
                          color: '#1A252F',
                          '&:hover': {
                            backgroundColor: alpha('#D4AF37', 0.9),
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                          },
                          borderRadius: 8,
                          fontWeight: 500,
                          transition: 'all 200ms ease',
                        }}
                      >
                        Reservar Ahora
                      </Button>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Box>

        {/* Beneficios */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            gutterBottom
            fontWeight="700"
            color="#1A252F"
            fontFamily="'Playfair Display', serif"
            mb={4}
          >
            ¿Por Qué Elegirnos?
          </Typography>
          <Grid container spacing={4}>
            {beneficios.map((beneficio, index) => (
              <Grid item xs={12} md={4} key={index}>
                <MotionBox
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  sx={{
                    textAlign: 'center',
                    p: 4,
                    backgroundColor: '#FFFFFF', // Blanco
                    borderRadius: 12, // 12px
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Sombra suave
                    transition: 'all 200ms ease',
                    '&:hover': {
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', // Hover elevada
                    },
                  }}
                >
                  <Box sx={{ color: '#D4AF37', mb: 2 }}> {/* Dorado ícono */}
                    {beneficio.icono}
                  </Box>
                  <Typography variant="h4" gutterBottom fontWeight="600" color="#1A252F"> {/* H4 20px */}
                    {beneficio.titulo}
                  </Typography>
                  <Typography variant="body1" color={alpha('#1A252F', 0.8)} lineHeight={1.6}> {/* Secondary 80% */}
                    {beneficio.descripcion}
                  </Typography>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default PaginaPrincipal;