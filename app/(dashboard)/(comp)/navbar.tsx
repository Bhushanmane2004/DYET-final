import { Search, Bell, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@clerk/nextjs";

const Navbar = () => {
  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-256px)] h-16 flex items-center z-30 bg-white border-b border-gray-200 px-4 md:px-6 justify-between shadow-sm">
      {/* Left space for menu button on mobile */}
      <div className="w-10 md:hidden"></div>

      {/* Search input */}
      <div className="hidden md:flex relative flex-1 max-w-xl bg-white">
        <Input
          type="text"
          placeholder="Search documents, courses & flashcards"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
        />
        <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
      </div>

      {/* Mobile search icon */}
      <button className="hidden p-2 bg-gray-100 rounded-lg">
        <Search size={20} className="text-gray-500" />
      </button>

      {/* Right side actions */}
      <div className="flex items-center space-x-3 md:space-x-6 ml-auto">
        <Button
          variant="outline"
          className="hidden md:flex items-center space-x-2"
        >
          <PlusCircle size={18} />
          <span>Add</span>
        </Button>
        <button className="p-2 bg-gray-100 rounded-full">
          <Bell className="text-gray-500" size={20} />
        </button>
        <button className=" bg-gray-100 rounded-full">
          <UserButton />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
