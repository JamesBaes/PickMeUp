"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import supabase from "@/utils/supabase/client";

type Location = {
  id: string;
  name: string;
};

type LocationContextType = {
  locations: Location[];
  currentLocation: Location | null;
  setCurrentLocation: (loc: Location | null) => void;
  loading: boolean;
  isHydrated: boolean;
};

// Helper function to convert text to title case (handles spaces and underscores)
const toTitleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(/[\s_]+/) // Split by spaces or underscores
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem("selectedLocation");
    if (savedLocation) {
      try {
        setCurrentLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error("Error parsing saved location:", error);
      }
    }
    setIsHydrated(true); // Mark as hydrated after localStorage is loaded
  }, []);

  // Save location to localStorage whenever it changes
  const handleSetCurrentLocation = (loc: Location | null) => {
    setCurrentLocation(loc);
    if (loc) {
      localStorage.setItem("selectedLocation", JSON.stringify(loc));
    } else {
      localStorage.removeItem("selectedLocation");
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("restaurant_locations").select("*");
        console.log("Raw data from Supabase:", data);
        console.log("Error:", error);
        
        if (error) throw error;
        if (data) {
          const mappedLocations = data.map((loc: any) => ({
            id: loc.restaurant_id.toString(),
            name: toTitleCase(loc.location_name),
          }));
          console.log("Mapped locations:", mappedLocations);
          setLocations((mappedLocations as Location[]) || []);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  return (
    <LocationContext.Provider value={{ locations, currentLocation, setCurrentLocation: handleSetCurrentLocation, loading, isHydrated }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used within a LocationProvider");
  return context;
};