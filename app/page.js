import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatsRow from "./components/StatsRow";
import WorkflowsTable from "./components/WorkflowsTable";
import RunsFeed from "./components/RunsFeed";

export default function Home() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <StatsRow />
        <WorkflowsTable />
        <RunsFeed />
      </div>
    </div>
  );
}
