import './Sidebar.css';
import { getWorkspaces } from '../services/workspace';
import {useState, useEffect} from 'react';
import NewWorkspaceModal from './NewWorkspaceModal';
import { useNavigate } from 'react-router-dom';


interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {

    const[showModal, setShowModal] = useState(false);
    const[workspaces, setWorkspaces] = useState<{id: string, name: string}[]>([]);
    const navigate = useNavigate();

    async function fetchWorkspaces() {
      const { data } = await getWorkspaces();
      if (data) setWorkspaces(data);
    }

    // Refetch on open so workspaces created or joined elsewhere (e.g. first run) show up.
    useEffect(() => {
      fetchWorkspaces();
    }, [open]);

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} />

      <div className={`sidebar ${open ? 'open' : ''}`}>

        <div className="sidebar-header">
          <span className="sidebar-title">Workspaces</span>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        <div className="sidebar-content">
          {workspaces.map(workspace => (
            <div key={workspace.id} className="sidebar-workspace-item" onClick={() => navigate(`/dashboard/workspace/${workspace.id}`)}>
              {workspace.name}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-new-workspace" onClick={() => setShowModal(true)}>
            +  New Workspace
          </button>

          <button className="sidebar-new-workspace">
            +  Join a Workspace
          </button>
        </div>

      </div>

      {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} onCreated={fetchWorkspaces} />}
    </>
  );
}

export default Sidebar;