import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, BookOpen, Video, Users, 
  FolderGit2, UserCircle, BookMarked, MessageSquare, 
  GripVertical 
} from "lucide-react";

interface MenuItem {
  id: string;
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  end?: boolean;
}

const DEFAULT_MENU: MenuItem[] = [
  { id: "1", to: "/admin",               label: "Dashboard",  icon: LayoutDashboard, end: true },
  { id: "2", to: "/admin/tutorials",     label: "Tutoriales", icon: BookOpen },
  { id: "3", to: "/admin/video-courses", label: "Cursos",     icon: Video },
  { id: "4", to: "/admin/projects",      label: "Proyectos",  icon: FolderGit2 },
  { id: "5", to: "/admin/profile",       label: "Perfil / CV",icon: UserCircle },
  { id: "6", to: "/admin/resources",     label: "Recursos",   icon: BookMarked },
  { id: "7", to: "/admin/contact",       label: "Contacto",   icon: MessageSquare },
  { id: "8", to: "/admin/users",         label: "Usuarios",   icon: Users },
];

export default function DraggableMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('admin-menu-order');
    return saved ? JSON.parse(saved) : DEFAULT_MENU;
  });
  
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('admin-menu-order', JSON.stringify(menuItems));
  }, [menuItems]);

  const handleDragStart = (e: React.DragEvent, item: MenuItem, index: number) => {
    setDraggedItem(item);
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedItem && dragItemRef.current !== null) {
      const draggedIndex = dragItemRef.current;
      const newItems = [...menuItems];
      
      // Remover el item arrastrado
      const [removed] = newItems.splice(draggedIndex, 1);
      
      // Insertar en la nueva posición
      newItems.splice(dropIndex, 0, removed);
      
      setMenuItems(newItems);
    }
    
    setDraggedItem(null);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const resetToDefault = () => {
    setMenuItems(DEFAULT_MENU);
    localStorage.removeItem('admin-menu-order');
  };

  return (
    <div className="draggable-menu">
      <div className="draggable-menu-header">
        <h3 style={{ 
          fontSize: "0.9rem", 
          fontWeight: 600, 
          color: "var(--color-text-muted)",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <GripVertical size={16} />
          Menú de Navegación (Arrastra para reordenar)
        </h3>
        <button
          onClick={resetToDefault}
          style={{
            padding: "6px 12px",
            fontSize: "0.75rem",
            background: "var(--color-bg-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary-soft)";
            e.currentTarget.style.color = "var(--color-primary)";
            e.currentTarget.style.borderColor = "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-bg-muted)";
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          Restablecer orden
        </button>
      </div>

      <div className="draggable-menu-list">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isDragged = draggedItem?.id === item.id;
          const isDragOver = dragOverIndex === index;

          // Verificar que Icon sea un componente válido
          if (!Icon || typeof Icon !== 'function') {
            console.error('Invalid icon component for item:', item);
            return null;
          }

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`draggable-menu-item ${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              style={{
                opacity: isDragged ? 0.5 : 1,
                transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                border: isDragOver ? `2px dashed var(--color-primary)` : '1px solid var(--color-border)',
                background: isDragOver ? 'var(--color-primary-soft)' : 'var(--color-surface)'
              }}
            >
              <div className="drag-handle">
                <GripVertical size={14} style={{ color: "var(--color-text-muted)" }} />
              </div>
              
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `draggable-menu-link ${isActive ? "draggable-menu-link--active" : ""}`}
                style={{ 
                  pointerEvents: isDragged ? 'none' : 'auto',
                  textDecoration: 'none'
                }}
                onClick={(e) => {
                  if (isDragged) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            </div>
          );
        })}
      </div>
    </div>
  );
}
