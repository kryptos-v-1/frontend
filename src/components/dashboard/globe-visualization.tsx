"use client"

import { useState } from "react"
import { World, GlobeConfig } from "@/components/ui/globe"

type Position = {
  order: number
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  arcAlt: number
  color: string
}

const sampleGlobeData: Position[] = [
  { order: 1, startLat: 40.7128, startLng: -74.006, endLat: 51.5074, endLng: -0.1278, arcAlt: 0.2, color: "#00FF94" },
  { order: 2, startLat: 1.3521, startLng: 103.8198, endLat: 25.2048, endLng: 55.2708, arcAlt: 0.25, color: "#00FF94" },
  { order: 3, startLat: 19.076, startLng: 72.8777, endLat: 19.4326, endLng: -81.2149, arcAlt: 0.15, color: "#FFB800" },
  { order: 4, startLat: 35.6762, startLng: 139.6503, endLat: 37.7749, endLng: -122.4194, arcAlt: 0.3, color: "#00FF94" },
  { order: 5, startLat: 52.52, startLng: 13.405, endLat: 48.8566, endLng: 2.3522, arcAlt: 0.1, color: "#00CC76" },
  { order: 6, startLat: 55.7558, startLng: 37.6173, endLat: 39.9042, endLng: 116.4074, arcAlt: 0.2, color: "#00FF94" },
  { order: 7, startLat: -33.8688, startLng: 151.2093, endLat: 36.7783, endLng: -119.4179, arcAlt: 0.25, color: "#FFB800" },
  { order: 8, startLat: 19.4326, startLng: -99.1332, endLat: 25.2048, endLng: 55.2708, arcAlt: 0.15, color: "#00FF94" },
]

const globeConfig: GlobeConfig = {
  pointSize: 1,
  globeColor: "#000000",
  showAtmosphere: true,
  atmosphereColor: "#00FF94",
  atmosphereAltitude: 0.15,
  emissive: "#002010",
  emissiveIntensity: 0.6,
  shininess: 0.9,
  polygonColor: "rgba(255, 255, 255, 0.7)",
  ambientLight: "#ffffff",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1500,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  autoRotate: true,
  autoRotateSpeed: 1.0,
}

export default function GlobeVisualization() {
  return (
    <div className="relative h-full w-full">
      <World globeConfig={globeConfig} data={sampleGlobeData} />
    </div>
  )
}
