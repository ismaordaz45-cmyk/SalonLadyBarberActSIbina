import React, { useState, useRef, useEffect } from 'react';
import { HomeRounded, PersonOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';    

const EncabezadoPublico = () => {
  const [active, setActive] = useState('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await axios.get('https://backendreservas-m2zp.onrender.com/api/perfilF');
        const data = response.data;
        setNombreEmpresa(data.NombreEmpresa || 'Nombre no disponible');
        setLogoUrl(data.Logo ? `data:image/jpeg;base64,${data.Logo}` : '');
      } catch (error) {
        console.error('Error al obtener datos del perfil:', error);
      }
    };

    fetchPerfil();
  }, []);

  const handleClick = (option) => {
    setActive(option);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClick = (key) => {
    switch (key) {
      case "home":
        navigate('/');
        break;
      case "hoteles":
        navigate('/hotelesp');
        break;
      case "login":
        navigate('/login');
        break;
      default:
        console.log("No se reconoce la acción del menú");
    }
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <style>{`
        :root {
          --color-primary: #2C3E50;
          --color-primary-dark: #1A252F;
          --color-gold: #D4AF37;
          --color-text-light: #F9FAFB;
          --color-hover: rgba(212, 175, 55, 0.15);
          --color-mobile-bg: #1A252F;
          --color-mobile-text: #F9FAFB;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: var(--color-text-light);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
        }

        .logo {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .logo img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          margin-right: 10px;
        }

        .logo h3 {
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: var(--color-text-light);
        }

        .menu ul {
          display: flex;
          gap: 18px;
          list-style: none;
          margin: 0;
          padding: 0;
          z-index: 2000;
        }

        .menu ul li {
          font-size: 1.05rem;
          cursor: pointer;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--color-text-light);
          border-radius: 9999px;
          transition: background-color 0.25s ease, color 0.25s ease, transform 0.15s ease;
        }

        .menu ul li:hover {
          background-color: var(--color-hover);
          transform: translateY(-1px);
        }

        .menu ul li.active {
          background-color: rgba(212, 175, 55, 0.22);
          color: var(--color-gold);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        .mobile-menu-icon {
          display: none;
          flex-direction: column;
          cursor: pointer;
          gap: 4px;
        }

        .hamburger {
          width: 25px;
          height: 3px;
          background-color: var(--color-secondary);
        }

        .menu-overlay {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(44, 62, 80, 0.45);
          z-index: 1500;
          transition: opacity 0.3s;
        }

        @media (max-width: 768px) {
          .menu ul {
            flex-direction: column;
            position: fixed;
            top: 0;
            left: -100%;
            width: 70%;
            height: 100%;
            background-color: var(--color-mobile-bg);
            padding: 20px;
            transition: left 0.3s ease-in-out;
            box-shadow: 2px 0 5px rgba(0,0,0,0.5);
            z-index: 2000;
          }

          .menu.menu-open ul {
            left: 0;
          }

          .menu ul li {
            padding: 20px;
            border-bottom: 1px solid var(--color-hover);
            color: var(--color-mobile-text);
          }

          .mobile-menu-icon {
            display: flex;
          }
          .menu-overlay {
            display: block;
          }
        }
        @media (min-width: 769px) {
          .menu-overlay {
            display: none;
          }
        }
      `}</style>

      {isMobileMenuOpen && (
        <div className="menu-overlay" onClick={toggleMobileMenu}></div>
      )}
      <header className="header">
        <div className="logo">
          {logoUrl && (
            <img src={logoUrl} alt="Logo Empresa" />
          )}
          <h3>{nombreEmpresa}</h3>
        </div>
        <nav className={`menu ${isMobileMenuOpen ? 'menu-open' : ''}`} ref={menuRef}>
          <ul>
            <li className={active === 'home' ? 'active' : ''} onClick={() => { handleClick('home'); handleMenuClick('home'); }}>
              <HomeRounded style={{ color: '#D4AF37', fontSize: 24 }} />
              Inicio
            </li>
            {/* <li className={active === 'hoteles' ? 'active' : ''} onClick={() => { handleClick('hoteles'); handleMenuClick('hoteles'); }}>
              <BankOutlined style={{ color: '#E67E22' }} />
              Hoteles
            </li> */}
            <li className={active === 'login' ? 'active' : ''} onClick={() => { handleClick('login'); handleMenuClick('login'); }}>
              <PersonOutline style={{ color: '#D4AF37', fontSize: 22 }} />
              Iniciar sesión
            </li>
          </ul>
        </nav>
        <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
          <div className="hamburger"></div>
          <div className="hamburger"></div>
          <div className="hamburger"></div>
        </div>
      </header>
    </>
  );
};

export default EncabezadoPublico;