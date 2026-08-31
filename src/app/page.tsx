import TimerPage from "@/components/TimerPage";
import { SessionSidebar } from "@/components/SessionSidebar";

export default function Home() {
  return (
    <div className="flex h-screen">
      <SessionSidebar />
      <div className="flex-1 overflow-auto">
        <TimerPage />
      </div>
    </div>
  );
}
