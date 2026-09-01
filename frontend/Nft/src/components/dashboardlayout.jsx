import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;