"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/components/LocationContext";

const SelectLocation = () => {
  const router = useRouter();
  const { locations, currentLocation, setCurrentLocation, loading } = useLocation();

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    console.log("Selected ID:", selectedId);
    const selectedLocation = locations.find(loc => loc.id === selectedId);
    console.log("Selected Location:", selectedLocation);
    if (selectedLocation) {
      setCurrentLocation(selectedLocation);
      console.log("Location set, routing to /");
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
      <div className="flex flex-1 flex-col items-center justify-center">
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
        <select
          className="w-80 p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#e51c2a] text-gray-700"
          value={currentLocation?.id || ""}
          onChange={handleLocationChange}
        >
          <option value="" disabled>
            Select Location
          </option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectLocation;