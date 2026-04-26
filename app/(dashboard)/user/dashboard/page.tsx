/* eslint-disable @typescript-eslint/no-explicit-any */
// app/user/dashboard/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {  TrendingUp, Fuel, MapPin, AlertTriangle, Gauge } from "lucide-react";
import { useStatistics } from "@/lib/hooks/useUserStatistics";

const formatFCFA = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('XAF', 'FCFA');
};


export default function DashboardPage() {
  const { dashboardStats, consumptionData, monthlyExpenses, evolutionData, alerts, loading, error } = useStatistics();
  
  const [isMobile, setIsMobile] = useState(false);

  // Détection responsive
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Troncature des noms longs
  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const statsCards = [
    { label: "Dépenses totales", value: formatFCFA(dashboardStats?.totalDepenses || 0), icon: TrendingUp, color: "blue" },
    { label: "Carburant total", value: `${(dashboardStats?.totalLitres || 0).toFixed(1)} L`, icon: Fuel, color: "green" },
    { label: "Kilomètres", value: `${(dashboardStats?.totalKm || 0).toFixed(0)} km`, icon: MapPin, color: "purple" },
    { label: "Consommation moy.", value: `${(dashboardStats?.consommationMoyenneGenerale || 0).toFixed(1)} L/100km`, icon: Gauge, color: "orange" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
          

        </div>



        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</p>
                  <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 mt-1 wrap-break-word">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}-500 shrink-0 ml-2`} />
              </div>
            </div>
          ))}
        </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graphique 1: Dépenses mensuelles */}
<div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
    Dépenses mensuelles
  </h2>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={monthlyExpenses} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="mois" 
        tick={{ fontSize: isMobile ? 9 : 11 }} 
        interval={isMobile ? 1 : 0}
        angle={isMobile ? -25 : 0}
        textAnchor={isMobile ? "end" : "middle"}
        height={isMobile ? 50 : 30}
      />
      <YAxis 
        yAxisId="left" 
        tickFormatter={(v) => isMobile ? `${Math.round(v/1000)}k` : `${Math.round(v/1000)}k`}
        tick={{ fontSize: 10 }}
        width={isMobile ? 40 : 60}
      />
      {!isMobile && (
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={40} />
      )}
      <Tooltip 
        formatter={(value, name) => {
          if (name === 'montant') return [formatFCFA(value as number), 'Montant'];
          if (name === 'litres') return [`${value} L`, 'Litres'];
          return [value, name];
        }}
        contentStyle={{ fontSize: 11 }}
      />
      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
      <Bar 
        yAxisId="left" 
        dataKey="montant" 
        fill="#3B82F6" 
        name="Montant" 
        radius={[4, 4, 0, 0]}
      />
      {!isMobile && (
        <Bar 
          yAxisId="right" 
          dataKey="litres" 
          fill="#10B981" 
          name="Litres" 
          radius={[4, 4, 0, 0]}
        />
      )}
    </BarChart>
  </ResponsiveContainer>
</div>

        {/* Graphique 2: Évolution des consommations */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Évolution des consommations
            </h2>
          </div>
          {evolutionData.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
              <p>Aucune donnée pour cette période</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return isMobile ? `${d.getDate()}/${d.getMonth()+1}` : d.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit' });
                  }}
                  tick={{ fontSize: isMobile ? 9 : 11 }}
                  interval={isMobile ? 1 : 0}
                  angle={isMobile ? -25 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 50 : 30}
                />
                <YAxis tick={{ fontSize: 10 }} width={isMobile ? 40 : 60} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString("fr-FR")}
                  formatter={(value) => [`${value} L/100km`, 'Consommation']}
                  contentStyle={{ fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line 
                  type="monotone" 
                  dataKey="consommation" 
                  stroke="#F59E0B" 
                  name="Consommation (L/100km)" 
                  strokeWidth={2} 
                  dot={{ r: isMobile ? 2 : 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
 </div>
        {/* Alertes */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-semibold text-red-600 mb-3 sm:mb-4 flex items-center gap-2">
              <AlertTriangle size={18} />
              Alertes consommation anormale
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {alerts.slice(0, isMobile ? 3 : alerts.length).map((alert) => (
                <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-red-800 text-sm sm:text-base wrap-break-word">
                        {truncateName(alert.vehiculeName, 20)}
                      </p>
                      <p className="text-xs sm:text-sm text-red-600 mt-1 wrap-break-word">{alert.message}</p>
                      <p className="text-xs text-red-500 mt-1">
                        {new Date(alert.date).toLocaleDateString("fr-FR")} - 
                        Conso: {alert.consoCalculee} L/100km | 
                        Théorique: {alert.consommationTheorique} L/100km
                      </p>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-red-600 whitespace-nowrap">+{alert.ecart}%</span>
                  </div>
                </div>
              ))}
              {isMobile && alerts.length > 3 && (
                <button className="w-full text-center text-xs sm:text-sm text-blue-600 py-2 hover:text-blue-700">
                  Voir +{alerts.length - 3} alertes
                </button>
              )}
            </div>
          </div>
        )}

        {/* Résumé par véhicule */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Résumé par véhicule</h2>
          </div>
          
          {/* Version desktop - tableau */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Véhicule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recharges</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total km</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total FCFA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conso moy.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consumptionData.map((vehicle) => (
                  <tr key={vehicle.vehiculeId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{vehicle.vehiculeName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.nombreRecharges}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.totalLitres.toFixed(1)} L</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.totalKm.toFixed(0)} km</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatFCFA(vehicle.totalMontant)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{vehicle.consommationMoyenne.toFixed(1)} L/100km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version mobile - cartes */}
          <div className="sm:hidden divide-y divide-gray-200">
            {consumptionData.map((vehicle) => (
              <div key={vehicle.vehiculeId} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm wrap-break-word flex-1">
                    {vehicle.vehiculeName}
                  </h3>
                  <span className="text-xs font-medium text-blue-600 ml-2">
                    {vehicle.consommationMoyenne.toFixed(1)} L/100km
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Recharges:</span>
                    <span className="ml-1 font-medium text-gray-900">{vehicle.nombreRecharges}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total L:</span>
                    <span className="ml-1 font-medium text-gray-900">{vehicle.totalLitres.toFixed(1)} L</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total km:</span>
                    <span className="ml-1 font-medium text-gray-900">{vehicle.totalKm.toFixed(0)} km</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total FCFA:</span>
                    <span className="ml-1 font-medium text-gray-900">{formatFCFA(vehicle.totalMontant)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}