"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Rating,
  Avatar,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import {
  ContentCut as BarberIcon, // Ícono tijeras para barbería
  FaceRetouchingNatural as BellezaIcon, // Ícono facial para belleza
  School as ClaseIcon, // Ícono clase para particular
  LocalShipping as EnviosIcon,
  Payment as PagoIcon,
  Verified as VerificadoIcon,
  Favorite as FavoritoIcon,
  TrendingUp as TrendingIcon,
  ShoppingCart as ReservaIcon, // Adaptado a reserva
  CardGiftcard as EspecialIcon, // Ícono especial
} from "@mui/icons-material" // Íconos ajustados a barbería/belleza (guía íconos 24px)

// Componente para animaciones con scroll
const ScrollReveal = ({ children, delay = 0 }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: false,
    margin: "-100px",
    amount: 0.3,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}

const PaginaPrincipalCliente = () => {
  const categorias = [
    {
      nombre: "Barbería",
      icono: <BarberIcon sx={{ fontSize: 40 }} />,
      color: "#2C3E50", // Azul para barbería
      descripcion: "Cortes y estilos masculinos clásicos",
      imagen: "/barberia-placeholder.jpg", // Placeholder, cambia por imagen real
    },
    {
      nombre: "Belleza",
      icono: <BellezaIcon sx={{ fontSize: 40 }} />,
      color: "#D4AF37", // Dorado para belleza
      descripcion: "Tratamientos faciales y cuidado personal",
      imagen: "/belleza-placeholder.jpg",
    },
    {
      nombre: "Clases",
      icono: <ClaseIcon sx={{ fontSize: 40 }} />,
      color: "#2C3E50", // Azul
      descripcion: "Lecciones particulares de estilo",
      imagen: "/clases-placeholder.jpg",
    },
    {
      nombre: "Especiales",
      icono: <EspecialIcon sx={{ fontSize: 40 }} />,
      color: "#D4AF37", // Dorado
      descripcion: "Paquetes premium personalizados",
      imagen: "/especiales-placeholder.jpg",
    },
  ]

  const serviciosDestacados = [ // Cambiado de "productos" a "servicios" de barbería
    {
      nombre: "Corte Premium",
      precio: "$299",
      imagen: "/corte-premium.jpg",
      rating: 5,
      reviews: 128,
      descuento: "20% OFF",
      nuevo: true,
    },
    {
      nombre: "Facial Importado",
      precio: "$149",
      imagen: "/facial-importado.jpg",
      rating: 4.5,
      reviews: 95,
      descuento: null,
      nuevo: false,
    },
    {
      nombre: "Clase Artesanal",
      precio: "$89",
      imagen: "/clase-artesanal.jpg",
      rating: 4.8,
      reviews: 203,
      descuento: "15% OFF",
      nuevo: true,
    },
    {
      nombre: "Estilo Vintage",
      precio: "$119",
      imagen: "/estilo-vintage.jpg",
      rating: 4.7,
      reviews: 156,
      descuento: null,
      nuevo: false,
    },
    {
      nombre: "Tratamiento Gourmet",
      precio: "$349",
      imagen: "/tratamiento-gourmet.jpg",
      rating: 5,
      reviews: 89,
      descuento: "10% OFF",
      nuevo: true,
    },
    {
      nombre: "Paquete Mexicano",
      precio: "$179",
      imagen: "/paquete-mexicano.jpg",
      rating: 4.9,
      reviews: 234,
      descuento: null,
      nuevo: false,
    },
  ]

  const beneficios = [
    {
      icono: <EnviosIcon sx={{ fontSize: 50, color: "#D4AF37" }} />, // Dorado ícono
      titulo: "Citas Rápidas",
      descripcion: "Reserva en minutos con disponibilidad real-time",
    },
    {
      icono: <PagoIcon sx={{ fontSize: 50, color: "#D4AF37" }} />,
      titulo: "Pago Seguro",
      descripcion: "Múltiples métodos de pago confiables",
    },
    {
      icono: <VerificadoIcon sx={{ fontSize: 50, color: "#D4AF37" }} />,
      titulo: "Calidad Garantizada",
      descripcion: "Profesionales certificados y productos premium",
    },
    {
      icono: <FavoritoIcon sx={{ fontSize: 50, color: "#D4AF37" }} />,
      titulo: "Atención Personalizada",
      descripcion: "Servicio al cliente 24/7 dedicado",
    },
  ]

  const testimonios = [
    {
      nombre: "María González",
      avatar: "/mujer-sonriente.jpg",
      comentario: "¡Los mejores servicios de barbería! La calidad es excepcional y el servicio es increíble.",
      rating: 5,
      fecha: "Hace 2 días",
    },
    {
      nombre: "Carlos Ramírez",
      avatar: "/hombre-feliz.jpg",
      comentario: "Excelente variedad de tratamientos. Mis amigos están encantados con el estilo.",
      rating: 5,
      fecha: "Hace 1 semana",
    },
    {
      nombre: "Ana Martínez",
      avatar: "/young-woman.png",
      comentario: "Pedí un paquete y quedaron fascinados. Definitivamente volveré a reservar.",
      rating: 4.5,
      fecha: "Hace 3 días",
    },
  ]

  const estadisticas = [
    { numero: "10,000+", label: "Clientes Felices", icono: <FavoritoIcon /> },
    { numero: "500+", label: "Servicios", icono: <ReservaIcon /> },
    { numero: "15", label: "Años de Experiencia", icono: <TrendingIcon /> },
    { numero: "98%", label: "Satisfacción", icono: <VerificadoIcon /> },
  ]

  return (
    <Box sx={{ 
      bgcolor: "#FFFFFF", // Blanco puro
      minHeight: "100vh", 
      overflow: "hidden",
      fontFamily: "'Geist Sans', Arial, sans-serif", // Fuente principal
    }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, #2C3E50 0%, #D4AF37 100%)`, // Degradado azul a dorado
          color: "white",
          py: { xs: 8, md: 12 }, // Responsive padding
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <ScrollReveal>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h1" // H1 56px
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "2.5rem", md: "3.5rem" }, // Responsive H1
                  textAlign: "center",
                  fontFamily: "'Playfair Display', serif", // Playfair títulos
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  lineHeight: 1.1, // H1 line-height 1.1
                }}
              >
                Lady Barber ID'M
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  textAlign: "center",
                  mb: 4,
                  fontSize: { xs: "1.125rem", md: "1.5rem" }, // Body large 18px desktop
                  fontWeight: 400,
                  lineHeight: 1.6, // Line-height 1.6
                  opacity: 0.9,
                }}
              >
                Elegancia dual en barbería y belleza. Transformamos tu estilo con pasión y precisión
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                      transition: 'all 200ms ease',
                      boxShadow: 'none',
                      '&:active': { backgroundColor: '#F5F5F5' }, // Active más oscuro
                    }}
                  >
                    Ver Servicios
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: '#FFFFFF', // Blanco borde
                      color: '#FFFFFF', // Blanco texto
                      '&:hover': { 
                        borderColor: '#FFFFFF',
                        backgroundColor: alpha('#FFFFFF', 0.1), // Hover 10% blanco
                      },
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 500,
                      borderRadius: 8,
                      transition: 'all 200ms ease',
                    }}
                  >
                    Ofertas Especiales
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          </ScrollReveal>
        </Container>

        {/* Decorative elements - Opcional, discreto para prototipo */}
        <motion.div
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            fontSize: "3rem",
          }}
        >
          {/* Ícono barbería */}
        </motion.div>
        <motion.div
          animate={{
            y: [0, 20, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            bottom: "20%",
            right: "10%",
            fontSize: "3rem",
          }}
        >
          {/* Ícono belleza */}
        </motion.div>
      </Box>

      {/* Categorías */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <ScrollReveal>
          <Typography
            variant="h2" // H2 48px
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              textAlign: "center",
              mb: 6,
              color: "#1A252F", // Negro suave
              fontFamily: "'Playfair Display', serif", // Playfair
            }}
          >
            Nuestras Categorías
          </Typography>
        </ScrollReveal>

        <Grid container spacing={3}> {/* Spacing 24px */}
          {categorias.map((categoria, index) => (
            <Grid item xs={6} md={3} key={index}>
              <ScrollReveal delay={index * 0.1}>
                <motion.div whileHover={{ scale: 1.05, y: -10 }} whileTap={{ scale: 0.95 }}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 12, // 12px tarjetas
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", // Sombra suave
                      transition: "all 200ms ease",
                      backgroundColor: '#FFFFFF', // Blanco
                      border: `1px solid ${alpha(categoria.color, 0.2)}`, // Borde color 20%
                      '&:hover': {
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)", // Hover elevada
                        borderColor: alpha(categoria.color, 0.4), // Hover 40%
                      },
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: categoria.color, // Color específico
                        color: '#FFFFFF', // Blanco
                        p: 3,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {categoria.icono}
                    </Box>
                    <CardMedia component="img" height="160" image={categoria.imagen} alt={categoria.nombre} />
                    <CardContent sx={{ flexGrow: 1, textAlign: "center", p: 3 }}>
                      <Typography variant="h4" component="h3" gutterBottom fontWeight="600" color="#1A252F"> {/* H4 20px */}
                        {categoria.nombre}
                      </Typography>
                      <Typography variant="body1" color={alpha('#1A252F', 0.8)} lineHeight={1.6}> {/* Secondary 80% */}
                        {categoria.descripcion}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Servicios Destacados */}
      <Box sx={{ 
        backgroundColor: '#FFFFFF', // Blanco
        py: 8 
      }}>
        <Container maxWidth="lg">
          <ScrollReveal>
            <Typography
              variant="h2"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 700,
                textAlign: "center",
                mb: 2,
                color: "#1A252F", // Negro suave
                fontFamily: "'Playfair Display', serif", // Playfair
              }}
            >
              Servicios Destacados
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                mb: 6,
                color: alpha('#1A252F', 0.6), // Secondary 60%
                fontWeight: 400,
                fontSize: '1rem',
                lineHeight: 1.6,
              }}
            >
              Los favoritos de nuestros clientes
            </Typography>
          </ScrollReveal>

          <Grid container spacing={4}>
            {serviciosDestacados.map((servicio, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <ScrollReveal delay={index * 0.1}>
                  <motion.div whileHover={{ y: -10 }} transition={{ duration: 0.3 }}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 12, // 12px
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", // Sombra suave
                        transition: "all 200ms ease",
                        backgroundColor: '#FFFFFF',
                        border: `1px solid ${alpha('#2C3E50', 0.2)}`, // Borde azul 20%
                        '&:hover': {
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)", // Hover elevada
                          borderColor: alpha('#2C3E50', 0.4), // Hover 40%
                        },
                        position: "relative",
                      }}
                    >
                      {servicio.nuevo && (
                        <Chip
                          label="NUEVO"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            zIndex: 1,
                            backgroundColor: '#D4AF37', // Dorado
                            color: '#1A252F', // Negro suave
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {servicio.descuento && (
                        <Chip
                          label={servicio.descuento}
                          sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            zIndex: 1,
                            backgroundColor: '#2C3E50', // Azul
                            color: '#FFFFFF',
                            fontWeight: 600,
                          }}
                        />
                      )}
                      <CardMedia component="img" height="250" image={servicio.imagen} alt={servicio.nombre} />
                      <CardContent sx={{ flexGrow: 1, textAlign: "center", p: 3 }}>
                        <Chip
                          label={servicio.categoria}
                          size="small"
                          sx={{ 
                            mb: 2, 
                            backgroundColor: servicio.categoria === 'Barbería' ? '#2C3E50' : '#D4AF37', // Azul o dorado
                            color: '#FFFFFF',
                            fontWeight: 500,
                          }}
                        />
                        <Typography variant="h4" component="h3" gutterBottom fontWeight="600" color="#1A252F"> {/* H4 20px */}
                          {servicio.nombre}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <Rating value={servicio.rating} precision={0.5} readOnly size="small" />
                          <Typography variant="body2" color={alpha('#1A252F', 0.6)} sx={{ ml: 1 }}> {/* Secondary 60% */}
                            ({servicio.reviews})
                          </Typography>
                        </Box>
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
                              backgroundColor: alpha('#D4AF37', 0.9), // Hover 90%
                              transform: 'translateY(-2px)', // Elevación 2px
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', // Sombra elevada
                            },
                            '&:active': {
                              backgroundColor: '#C19B2E', // Más oscuro
                              transform: 'scale(0.98)',
                            },
                            borderRadius: 8,
                            fontWeight: 500,
                            transition: 'all 200ms ease',
                          }}
                        >
                          Reservar Ahora
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </ScrollReveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Beneficios */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <ScrollReveal>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              textAlign: "center",
              mb: 6,
              color: "#1A252F", // Negro suave
              fontFamily: "'Playfair Display', serif", // Playfair
            }}
          >
            ¿Por qué Elegirnos?
          </Typography>
        </ScrollReveal>

        <Grid container spacing={4}>
          {beneficios.map((beneficio, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <ScrollReveal delay={index * 0.15}>
                <motion.div whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }} transition={{ duration: 0.3 }}>
                  <Card
                    sx={{
                      height: "100%",
                      textAlign: "center",
                      p: 3, // Padding 24px
                      borderRadius: 12, // 12px
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", // Sombra suave
                      transition: "all 200ms ease",
                      backgroundColor: '#FFFFFF',
                      '&:hover': {
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)", // Hover elevada
                      },
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {beneficio.icono}
                    </motion.div>
                    <Typography variant="h4" component="h3" gutterBottom fontWeight="600" color="#1A252F"> {/* H4 20px */}
                      {beneficio.titulo}
                    </Typography>
                    <Typography variant="body1" color={alpha('#1A252F', 0.8)} lineHeight={1.6}> {/* Secondary 80% */}
                      {beneficio.descripcion}
                    </Typography>
                  </Card>
                </motion.div>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Estadísticas */}
      <Box sx={{ 
        background: `linear-gradient(135deg, #2C3E50 0%, #D4AF37 100%)`, // Degradado azul a dorado
        py: 8 
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {estadisticas.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <ScrollReveal delay={index * 0.1}>
                  <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Box sx={{ fontSize: 40, mb: 1, color: '#FFFFFF' }}> {/* Blanco ícono */}
                          {stat.icono}
                        </Box>
                      </motion.div>
                      <Typography variant="h3" component="div" fontWeight={700} sx={{ mb: 1, color: '#FFFFFF' }}> {/* Blanco */}
                        {stat.numero}
                      </Typography>
                      <Typography variant="h6" fontWeight={400} color="rgba(255, 255, 255, 0.9)"> {/* Blanco 90% */}
                        {stat.label}
                      </Typography>
                    </Box>
                  </motion.div>
                </ScrollReveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonios */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <ScrollReveal>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              textAlign: "center",
              mb: 2,
              color: "#1A252F", // Negro suave
              fontFamily: "'Playfair Display', serif", // Playfair
            }}
          >
            Lo que dicen nuestros clientes
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: "center",
              mb: 6,
              color: alpha('#1A252F', 0.6), // Secondary 60%
              fontWeight: 400,
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          >
            Testimonios reales de personas satisfechas
          </Typography>
        </ScrollReveal>

        <Grid container spacing={4}>
          {testimonios.map((testimonio, index) => (
            <Grid item xs={12} md={4} key={index}>
              <ScrollReveal delay={index * 0.15}>
                <motion.div whileHover={{ y: -10, rotate: [0, 1, -1, 0] }} transition={{ duration: 0.3 }}>
                  <Card
                    sx={{
                      height: "100%",
                      p: 3, // Padding 24px
                      borderRadius: 12, // 12px
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", // Sombra suave
                      transition: "all 200ms ease",
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${alpha('#2C3E50', 0.2)}`, // Borde azul 20%
                      '&:hover': {
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)", // Hover elevada
                        borderColor: alpha('#2C3E50', 0.4),
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar src={testimonio.avatar} alt={testimonio.nombre} sx={{ width: 60, height: 60, mr: 2 }} />
                      <Box>
                        <Typography variant="h6" fontWeight={600} color="#1A252F"> {/* H6 24px negro suave */}
                          {testimonio.nombre}
                        </Typography>
                        <Typography variant="caption" color={alpha('#1A252F', 0.6)} lineHeight={1.4}> {/* Secondary 60% */}
                          {testimonio.fecha}
                        </Typography>
                      </Box>
                    </Box>
                    <Rating value={testimonio.rating} precision={0.5} readOnly sx={{ mb: 2 }} />
                    <Typography variant="body2" color={alpha('#1A252F', 0.8)} sx={{ fontStyle: "italic", lineHeight: 1.6 }}> {/* Secondary 80%, italic */}
                      "{testimonio.comentario}"
                    </Typography>
                  </Card>
                </motion.div>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Final */}
      <Box
        sx={{
          background: `linear-gradient(135deg, #2C3E50 0%, #D4AF37 100%)`, // Degradado azul a dorado
          color: "white",
          py: 10,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <ScrollReveal>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Typography
                variant="h2" // H2 48px
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  fontFamily: "'Playfair Display', serif", // Playfair
                  color: '#FFFFFF',
                }}
              >
                ¿Listo para transformar tu estilo?
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, fontSize: '1rem', lineHeight: 1.6, opacity: 0.9 }}> {/* Body 16px */}
                Descubre nuestra increíble selección de servicios de barbería y belleza
              </Typography>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: '#FFFFFF', // Blanco
                    color: '#2C3E50', // Azul texto
                    px: 6,
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    borderRadius: 8, // 8px
                    '&:hover': { 
                      backgroundColor: alpha('#FFFFFF', 0.9), // Hover 90%
                      color: '#D4AF37', // Hover dorado texto
                    },
                    transition: 'all 200ms ease',
                  }}
                >
                  Reservar Ahora
                </Button>
              </motion.div>
            </motion.div>
          </ScrollReveal>
        </Container>
      </Box>
    </Box>
  )
}

export default PaginaPrincipalCliente;