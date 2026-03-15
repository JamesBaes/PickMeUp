"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/context/locationContext";

const SelectLocation = () => {
  const router = useRouter();
  const { locations, currentLocation, setCurrentLocation, loading } = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const handleLocationSelect = (selectedId: string) => {
    const selectedLocation = locations.find((location) => String(location.id) === selectedId);
    if (selectedLocation) {
      setCurrentLocation(selectedLocation);
      setIsDropdownOpen(false);
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e51c2a] flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e51c2a] flex flex-col">
      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center bg-white rounded-full p-4 mb-2 shadow">
            <img
              src="/gladiator-logo.png"
              alt="Gladiator Logo"
              className="h-24 w-22"
            />
          </div>
          <div className="text-white text-xl font-bold mb-6">GLADIATOR</div>
        </div>
        <div
          className="text-white text-2xl font-bold mb-4 text-center"
          style={{ textShadow: "1px 1px 2px #b71c1c" }}
        >
          Please select a location
        </div>

        <div ref={dropdownRef} className="relative w-full max-w-sm">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((open) => !open)}
            className="w-full p-3 rounded border border-gray-300 bg-white text-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-[#e51c2a] flex items-center justify-between"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <span className="truncate">{currentLocation?.name ?? "Select Location"}</span>
            <span className="ml-3 text-gray-500">▾</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded border border-gray-300 shadow-lg z-30 max-h-64 overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full text-left px-4 py-3 text-gray-500 border-b border-gray-200"
              >
                Select Location
              </button>
              {locations.map((location) => (
                <button
                  type="button"
                  key={location.id}
                  onClick={() => handleLocationSelect(String(location.id))}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {location.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectLocation;