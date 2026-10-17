import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import DashboardBody from "./components/DashboardBody";

export default function Home() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <DashboardBody />
      </div>
    </div>
  );
}
