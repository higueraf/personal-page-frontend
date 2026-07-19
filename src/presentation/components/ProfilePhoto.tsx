import React, { useEffect, useRef } from "react";

interface ProfilePhotoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBorder?: boolean;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ 
  size = "md", 
  className = "", 
  showBorder = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const photo = photoRef.current;
    
    if (!container || !photo) return;

    // Crear efecto computacional dinámico
    const createComputationalEffect = () => {
      // Limpiar efectos anteriores
      const existingEffects = container.querySelectorAll('.computational-effect');
      existingEffects.forEach(effect => effect.remove());

      // Crear rectángulos transparentes
      for (let i = 0; i < 8; i++) {
        const rect = document.createElement('div');
        rect.className = 'computational-effect absolute pointer-events-none';
        
        // Posiciones aleatorias alrededor de la foto
        const angle = (i * 45) * (Math.PI / 180);
        const distance = 60 + Math.random() * 20;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        rect.style.cssText = `
          left: ${50 + x}%;
          top: ${50 + y}%;
          width: ${30 + Math.random() * 20}px;
          height: ${2 + Math.random() * 3}px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.1) 25%, 
            rgba(59, 130, 246, 0.3) 50%, 
            rgba(59, 130, 246, 0.1) 75%, 
            transparent 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          transform: rotate(${angle + Math.random() * 30}deg);
          animation: float ${3 + Math.random() * 2}s ease-in-out infinite;
          animation-delay: ${i * 0.2}s;
          backdrop-filter: blur(1px);
        `;
        
        container.appendChild(rect);
      }

      // Efecto de desenfoque dinámico en la foto
      if (photo.style) {
        photo.style.filter = 'brightness(1.1) contrast(1.05)';
        photo.style.transition = 'all 0.3s ease';
      }
    };

    // Animación continua
    const animate = () => {
      const effects = container.querySelectorAll('.computational-effect');
      effects.forEach((effect, index) => {
        const htmlElement = effect as HTMLElement;
        const currentOpacity = parseFloat(htmlElement.style.getPropertyValue('opacity') || '0.3');
        const newOpacity = 0.1 + Math.sin(Date.now() / 1000 + index) * 0.2;
        htmlElement.style.opacity = newOpacity.toString();
        
        // Ligera rotación
        const transformValue = htmlElement.style.transform;
        const rotationMatch = transformValue.match(/rotate\(([^)]+)deg\)/);
        const currentRotation = parseFloat(rotationMatch?.[1] || '0');
        const newRotation = currentRotation + 0.5;
        htmlElement.style.transform = `rotate(${newRotation}deg)`;
      });
      
      requestAnimationFrame(animate);
    };

    createComputationalEffect();
    animate();

    // Recrear efectos periódicamente
    const interval = setInterval(createComputationalEffect, 5000);

    return () => {
      clearInterval(interval);
      const effects = container.querySelectorAll('.computational-effect');
      effects.forEach(effect => effect.remove());
    };
  }, [size, showBorder]);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-24 h-24 sm:w-32 sm:h-32",
    lg: "w-32 h-32 sm:w-48 sm:h-48",
    xl: "w-48 h-48 sm:w-64 sm:h-64",
  };

  const photoPath = "/images/francisco-higuera-photo.jpg";

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full overflow-hidden relative
          ${showBorder ? "border-4 border-white dark:border-[#1E2A42] shadow-2xl" : ""}
          bg-[var(--color-bg-muted)]
          flex items-center justify-center
          transition-all duration-300
        `}
      >
        <img
          ref={photoRef}
          src={photoPath}
          alt="Francisco Higuera"
          className="w-full h-full object-cover relative z-10"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            // Show fallback icon or initials if image fails
            if (target.parentElement) {
              const fallback = document.createElement('div');
              fallback.className = "text-2xl font-bold text-[var(--color-primary)]";
              fallback.innerText = "FH";
              target.parentElement.appendChild(fallback);
            }
          }}
        />
      </div>
    </div>
  );
};

export default ProfilePhoto;
