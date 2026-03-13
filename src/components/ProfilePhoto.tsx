import React from "react";

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
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-24 h-24 sm:w-32 sm:h-32",
    lg: "w-32 h-32 sm:w-48 sm:h-48",
    xl: "w-48 h-48 sm:w-64 sm:h-64",
  };

  const photoPath = "/images/francisco-higuera-photo.jpg";

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full overflow-hidden 
          ${showBorder ? "border-4 border-white dark:border-[#1E2A42] shadow-lg" : ""}
          bg-[var(--color-bg-muted)]
          flex items-center justify-center
        `}
      >
        <img
          src={photoPath}
          alt="Francisco Higuera"
          className="w-full h-full object-cover"
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
