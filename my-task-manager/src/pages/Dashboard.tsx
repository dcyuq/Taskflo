import TopNav from "../components/TopNav";
import { Outlet } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
    return(
        <div> 
           <TopNav /> 
           <div className="main-content">
                <Outlet />
           </div>
        </div>
    )
}

export default Dashboard