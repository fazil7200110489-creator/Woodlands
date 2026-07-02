import { Bell, Menu, Search, User } from "lucide-react";
import Link from "next/link";

export default function Header({ 
  onMenuClick, 
  user 
}: { 
  onMenuClick: () => void; 
  user?: { username: string; role: string } 
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex relative w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border-0 bg-gray-100 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#BF976A] sm:text-sm sm:leading-6 transition-colors"
            placeholder="Search..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors">
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        
        <Link href="/admin/profile" className="flex items-center gap-3 border-l pl-4 hover:opacity-85 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#BF976A] text-white">
            <User size={16} />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-gray-900">{user?.username || "Admin"}</span>
            <span className="text-[10px] text-gray-400 capitalize">{user?.role || "Staff"}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
