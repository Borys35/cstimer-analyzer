import TimerPage from "@/components/TimerPage";
import { SessionSidebar } from "@/components/SessionSidebar";

export default function Home() {
  return (
    <div className="flex h-full">
      <SessionSidebar />
      <div className="flex-1 overflow-hidden">
        <TimerPage />
      </div>
    </div>
  );
}
