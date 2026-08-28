import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Leaf } from 'lucide-react';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError('Credenciales incorrectas o usuario inactivo.');
      }
    } catch (err) {
      setError('Error al conectar con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #18261E 0%, #2E5339 50%, #1D3524 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        padding: '36px',
        boxSizing: 'border-box'
      }}>
        {/* Encabezado Marca */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#F0F7F2',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#2E5339'
          }}>
            <Leaf size={36} />
          </div>
          <h1 style={{
            fontFamily: "'Libre Caslon Text', serif",
            fontSize: '28px',
            color: '#18261E',
            margin: '0 0 8px 0',
            fontWeight: 700
          }}>
            Flor y Ser
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Almacén Natural · ERP & CRM v2.0
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#2E5339',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              transition: 'background-color 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Pie */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
            Sistema protegido. Acceso solo para personal autorizado.
          </p>
        </div>
      </div>
    </div>
  );
};
