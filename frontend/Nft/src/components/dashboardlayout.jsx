import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      
      <Sidebar />

      <div className="ml-64">
        {/* <Topbar /> */}

        <main>
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export default DashboardLayout;