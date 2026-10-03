import './Sidebar.css';
import { getWorkspaces } from '../services/workspace';
import {useState, useEffect} from 'react';
import NewWorkspaceModal from './NewWorkspaceModal';
import { NavLink } from 'react-router-dom';


interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {

    const[showModal, setShowModal] = useState(false);
    const[workspaces, setWorkspaces] = useState<{id: string, name: string}[]>([]);

    function fetchWorkspaces() {
      getWorkspaces().then(({ data }) => {
        if (data) setWorkspaces(data);
      });
    }

    // Refetch on open so workspaces created or joined elsewhere (e.g. first run) show up.
    useEffect(fetchWorkspaces, [open]);

    useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} />

      <nav className={`sidebar ${open ? 'open' : ''}`} aria-label="Workspaces" inert={!open}>

        <div className="sidebar-header">
          <span className="sidebar-title">Workspaces</span>
          <button className="sidebar-close" aria-label="Close workspaces" onClick={onClose}>✕</button>
        </div>

        <div className="sidebar-content">
          {workspaces.map(workspace => (
            <NavLink key={workspace.id} className="sidebar-workspace-item" to={`/dashboard/workspace/${workspace.id}`} onClick={onClose}>
              {workspace.name}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-new-workspace" onClick={() => setShowModal(true)}>
            + New workspace
          </button>
        </div>

      </nav>

      {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} onCreated={fetchWorkspaces} />}
    </>
  );
}

export default Sidebar;
