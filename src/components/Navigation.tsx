
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Users, BarChart3 } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-gray-900">BV | Creator Tracker</h1>
          <div className="flex space-x-4">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "default" : "ghost"}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Campaign Dashboard
              </Button>
            </Link>
            <Link to="/campaigns">
              <Button 
                variant={location.pathname === "/campaigns" ? "default" : "ghost"}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Campaigns
              </Button>
            </Link>
            <Link to="/roster">
              <Button 
                variant={location.pathname === "/roster" ? "default" : "ghost"}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Roster
              </Button>
            </Link>
            <Link to="/roster-dashboard">
              <Button 
                variant={location.pathname === "/roster-dashboard" ? "default" : "ghost"}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Roster Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
