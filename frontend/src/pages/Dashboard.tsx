import { useState } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiLogIn, FiShield, FiLogOut } from "react-icons/fi";
import me from "../images/me.jpg";
import karl from "../images/karl.jpg";
import ijay from "../images/ijay.jpg";
import leb from "../images/leb.jpg";
import laurence from "../images/laurence.jpg";
import shane from "../images/shane.jpg";
import men from "../images/men.jpg";
import women from "../images/women.jpg";

const members = [
  { name: "Julito Matugas", image: me },
  { name: "Karl Pingcalan", image: karl },
  { name: "Laurence Montil", image: laurence },
  { name: "Shane Andoy", image: shane },
  { name: "Mike Quijano", image: men },
  { name: "Cherry mae Havana", image: women },
  { name: "Lebron James Sarra", image: leb },
  { name: "Marwin Boong", image: men },
  { name: "Ijay Mangguinimba", image: ijay },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-800 transition-width duration-300 flex flex-col`}
      >
        <div className="p-6 flex flex-col items-center border-b border-gray-700">
          <FiShield className="text-white text-4xl mb-2" />
          {sidebarOpen && (
            <>
              <h2 className="text-xl font-bold text-white">Cyber Security</h2>
              <p className="text-white text-sm mt-1">BSIT 3A</p>
            </>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/users"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FiUsers className="text-white" /> {sidebarOpen && <span className="text-white">Users</span>}
          </Link>
          <Link
            to="/loginAttempts"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors text-white"
          >
            <FiLogIn className="text-white" /> {sidebarOpen && <span className="text-white">User Login Attempts</span>}
          </Link>
        </nav>
        <Link
            to="/login"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors text-red-400"
          > 
            <FiLogOut className="text-red-400" /> {sidebarOpen && <span className="text-red-400">Logout</span>}
          </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="m-4 p-2 bg-blue-500 rounded-full text-white self-center hover:bg-blue-600 transition-colors"
        >
          {sidebarOpen ? "<" : ">"}
        </button>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-blue-500 mb-6">Members</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {members.map((member, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-blue-500 cursor-pointer hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-xl font-semibold text-center text-white">{member.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}