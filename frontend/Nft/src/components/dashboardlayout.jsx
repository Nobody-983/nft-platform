import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main
        className={`
          min-h-screen
          pt-16
          transition-all
          duration-300
          lg:pt-6
          ${sidebarOpen ? "lg:pl-72" : "lg:pl-24"}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;