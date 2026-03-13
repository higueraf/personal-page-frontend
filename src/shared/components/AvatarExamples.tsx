import React from 'react';
import Avatar from './Avatar';
import './Avatar.css';

// Ejemplos de uso del componente Avatar
export const AvatarExamples = () => {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Avatar básico en perfil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Avatar
          src="/path/to/tu/foto.jpg"
          alt="Tu foto de perfil"
          size="lg"
          fallback="FH"
        />
        <div>
          <h3 style={{ margin: 0, color: 'var(--color-text)' }}>Francisco Higuera</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Admin</p>
        </div>
      </div>

      {/* 2. Avatar en navegación */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Avatar
          src="/path/to/tu/foto.jpg"
          size="sm"
          fallback="FH"
          className="nav-avatar"
        />
        <span>Mi cuenta</span>
      </div>

      {/* 3. Avatar con fallback si no hay imagen */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <Avatar
          src=""
          size="md"
          fallback="TU"
        />
        <Avatar
          src=""
          size="md"
          fallback="FH"
        />
        <Avatar
          src=""
          size="md"
          fallback="PH"
        />
      </div>

      {/* 4. Avatar grande para página de perfil */}
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Avatar
          src="/path/to/tu/foto.jpg"
          size="xl"
          fallback="FH"
          className="profile-avatar"
        />
        <h2 style={{ marginTop: '15px', color: 'var(--color-text)' }}>
          Francisco Higuera
        </h2>
      </div>

    </div>
  );
};
