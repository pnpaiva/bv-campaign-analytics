
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-gray-900">Campaign Manager</h1>
          <div className="flex space-x-4">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "default" : "ghost"}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
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
          </div>
        </div>
      </div>
    </nav>
  );
};
