// app/admin/dashboard/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useStatistics } from "@/lib/hooks/useStatistics";
import { useAdminRefuels } from "@/lib/hooks/useAdminRefuels";
import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, Fuel, Car, DollarSign, AlertTriangle, Users, BarChart3, UserCheck, Calendar, X, ChevronDown, ChevronUp } from "lucide-react";
import React from "react";

const formatFCFA = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('XAF', 'FCFA');
};

const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 sm:p-3 rounded-lg shadow-lg border border-gray-100 text-xs sm:text-sm">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="text-gray-600">
            {p.name}: <span className="font-semibold text-gray-900">{p.value}{unit}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

type FilterPeriod = "today" | "week" | "month" | "custom";

export default function AdminDashboardPage() {
  const { 
    dashboardStats, 
    consumptionData, 
    monthlyExpenses, 
    evolutionData, 
    alerts, 
    consumptionByUser,
    loading, 
    error 
  } = useStatistics();

  const { refuels, loading: refuelsLoading } = useAdminRefuels();
  const [totalNonAdminUsers, setTotalNonAdminUsers] = useState<number>(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  
  // États pour les filtres
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  // Récupérer le nombre d'utilisateurs non-admin
  useEffect(() => {
    const fetchNonAdminUsers = async () => {
      try {
        const response = await fetch('/api/admin/users?role=non-admin');
        const data = await response.json();
        if (data.success) {
          setTotalNonAdminUsers(data.data?.length || 0);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchNonAdminUsers();
  }, []);

  // Fonction pour filtrer les données selon la période
  const filterDataByPeriod = (data: any[], dateField: string) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    switch (filterPeriod) {
      case "today":
        startDate = today;
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          return data;
        }
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Filtrer les recharges par période
  const filteredRefuels = useMemo(() => {
    if (!refuels || refuels.length === 0) return [];
    return filterDataByPeriod(refuels, "dateHeure");
  }, [refuels, filterPeriod, customStartDate, customEndDate]);

  // Filtrer l'évolution des consommations
  const filteredEvolutionData = useMemo(() => {
    if (!evolutionData || evolutionData.length === 0) return [];
    return filterDataByPeriod(evolutionData, "date");
  }, [evolutionData, filterPeriod, customStartDate, customEndDate]);

  // Calculer les totaux filtrés
  const filteredTotals = useMemo(() => {
    const totalDepenses = filteredRefuels.reduce((sum, item) => sum + (item.montant || 0), 0);
    const totalLitres = filteredRefuels.reduce((sum, item) => sum + (item.quantiteLitres || 0), 0);
    const totalKm = filteredRefuels.reduce((sum, item) => sum + (item.distanceParcourue || 0), 0);
    const consoMoyenne = totalKm > 0 ? (totalLitres / totalKm) * 100 : 0;
    
    return {
      totalDepenses,
      totalLitres,
      totalKm,
      consoMoyenne,
    };
  }, [filteredRefuels]);

  // Troncature des noms longs
  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Recharges par utilisateur avec données filtrées
  const refuelsByUserWithVehicles = () => {
    const userMap = new Map<string, { 
      count: number; 
      totalLitres: number; 
      totalMontant: number;
      vehicles: Map<string, { count: number; totalLitres: number }>;
    }>();
    
    filteredRefuels.forEach((refuel: any) => {
      const userName = refuel.utilisateurName;
      const vehicleName = `${refuel.vehiculeName}`;
      
      if (!userMap.has(userName)) {
        userMap.set(userName, { 
          count: 0, 
          totalLitres: 0, 
          totalMontant: 0,
          vehicles: new Map()
        });
      }
      
      const userData = userMap.get(userName)!;
      userData.count += 1;
      userData.totalLitres += refuel.quantiteLitres;
      userData.totalMontant += refuel.montant;
      
      if (!userData.vehicles.has(vehicleName)) {
        userData.vehicles.set(vehicleName, { count: 0, totalLitres: 0 });
      }
      const vehicleData = userData.vehicles.get(vehicleName)!;
      vehicleData.count += 1;
      vehicleData.totalLitres += refuel.quantiteLitres;
    });
    
    return Array.from(userMap.entries())
      .map(([nom, data]) => ({
        nom: nom,
        prenom: nom.split(' ')[0],
        nombreRecharges: data.count,
        totalLitres: parseFloat(data.totalLitres.toFixed(1)),
        totalMontant: data.totalMontant,
        vehicles: Array.from(data.vehicles.entries()).map(([name, v]) => ({
          name: name,
          count: v.count,
          totalLitres: v.totalLitres
        }))
      }))
      .sort((a, b) => b.nombreRecharges - a.nombreRecharges)
      .slice(0, 10);
  };

  const refuelsByUserData = refuelsByUserWithVehicles();

  const toggleUserExpand = (userId: number) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Appliquer les filtres personnalisés
  const applyCustomFilter = () => {
    if (customStartDate && customEndDate) {
      setFilterPeriod("custom");
      setShowCustomPicker(false);
    }
  };

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case "today": return "Aujourd'hui";
      case "week": return "7 derniers jours";
      case "month": return "30 derniers jours";
      case "custom": return `${customStartDate} au ${customEndDate}`;
      default: return "";
    }
  };

  if (loading || refuelsLoading || loadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error}
      </div>
    );
  }

  // Calcul du total des km pour tous les utilisateurs
  const totalKmAllUsers = consumptionByUser.reduce((sum: number, user: any) => sum + (user.totalKm || 0), 0);

  const statsCards = [
    {
      title: 'Dépenses totales',
      value: formatFCFA(filteredTotals.totalDepenses),
      icon: DollarSign,
      color: 'blue',
    },
    {
      title: 'Carburant total',
      value: `${filteredTotals.totalLitres.toFixed(1)} L`,
      icon: Fuel,
      color: 'green',
    },
    {
      title: 'Kilomètres parcourus',
      value: `${totalKmAllUsers.toLocaleString()} km`,
      icon: TrendingUp,
      color: 'orange',
    },
    {
      title: 'Véhicules actifs',
      value: dashboardStats?.vehiculesActifs || 0,
      icon: Car,
      color: 'purple',
    },
    {
      title: 'Utilisateurs',
      value: totalNonAdminUsers,
      icon: UserCheck,
      color: 'teal',
    },
  ];

  const getColorClass = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      orange: 'bg-orange-50 text-orange-600',
      purple: 'bg-purple-50 text-purple-600',
      teal: 'bg-teal-50 text-teal-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 sm:space-y-6">
        
        {/* Header avec filtres */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Vue d&apos;ensemble des performances carburant</p>
          </div>
          
          {/* Bouton filtres mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 sm:hidden"
          >
            <Calendar size={16} />
            Filtres
            {filterPeriod !== "today" && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Filtres desktop */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { setFilterPeriod("today"); setShowCustomPicker(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                filterPeriod === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={() => { setFilterPeriod("week"); setShowCustomPicker(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                filterPeriod === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Cette semaine
            </button>
            <button
              type="button"
              onClick={() => { setFilterPeriod("month"); setShowCustomPicker(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                filterPeriod === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Ce mois
            </button>
            <button
              type="button"
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer flex items-center gap-2 ${
                filterPeriod === "custom"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Calendar size={16} />
              Personnalisé
            </button>
            
            {filterPeriod !== "today" && (
              <button
                type="button"
                onClick={() => { setFilterPeriod("today"); setCustomStartDate(""); setCustomEndDate(""); }}
                className="p-2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                title="Réinitialiser"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Filtres mobiles expandables */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:hidden space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setFilterPeriod("today"); setShowCustomPicker(false); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  filterPeriod === "today" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Aujourd&apos;hui
              </button>
              <button
                onClick={() => { setFilterPeriod("week"); setShowCustomPicker(false); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  filterPeriod === "week" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Cette semaine
              </button>
              <button
                onClick={() => { setFilterPeriod("month"); setShowCustomPicker(false); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  filterPeriod === "month" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Ce mois
              </button>
              <button
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 ${
                  filterPeriod === "custom" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                <Calendar size={12} />
                Perso
              </button>
            </div>
            {filterPeriod !== "today" && filterPeriod !== "custom" && (
              <button
                onClick={() => { setFilterPeriod("today"); setCustomStartDate(""); setCustomEndDate(""); }}
                className="text-xs text-red-600"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* Picker date personnalisé */}
        {showCustomPicker && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date début</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={applyCustomFilter}
                  disabled={!customStartDate || !customEndDate}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Indicateur de période */}
        {filterPeriod !== "today" && (
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
            Période: {getPeriodLabel()}
          </div>
        )}

        {/* Stats Cards - responsive grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.title}</p>
                  <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 mt-1 wrap-break-word">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ml-2 ${getColorClass(stat.color)}`}>
                  <stat.icon size={isMobile ? 16 : 20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
{/* Graphique: Top utilisateurs - Recharges */}
<div className="bg-white rounded-lg shadow-sm p-3 md:p-5">
  <div className="flex items-center gap-2 mb-3 sm:mb-4">
    <BarChart3 size={isMobile ? 16 : 18} className="text-emerald-600" />
    <h2 className="text-sm sm:text-base font-semibold text-gray-900">Top utilisateurs - Recharges</h2>
  </div>
  <p className="text-xs text-gray-400 mb-3 sm:mb-4">Classement des utilisateurs les plus actifs</p>
  <ResponsiveContainer width="100%" height={350}>
    <BarChart 
      data={refuelsByUserData} 
     margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis 
        dataKey="nom" 
        angle={-45} 
        textAnchor="end" 
        height={isMobile ? 80 : 70}
        tick={{ fontSize: isMobile ? 9 : 11, fill: '#6B7280' }}
        tickFormatter={(value) => {
          // Prendre uniquement la première partie du nom (avant l'espace)
          const firstName = value.split(' ')[0];
          return isMobile ? truncateName(firstName, 10) : firstName;
        }}
      />
      <YAxis 
        tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
        width={isMobile ? 40 : 50}
      />
      <Tooltip 
        formatter={(value, name) => {
          if (name === 'nombreRecharges') return [`${value} recharges`, 'Nombre'];
          return [value, name];
        }}
        labelFormatter={(label) => {
          // Afficher le nom complet dans le tooltip
          return `Utilisateur: ${label}`;
        }}
        contentStyle={{ fontSize: isMobile ? 10 : 12 }}
      />
      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
      <Bar 
        dataKey="nombreRecharges" 
        fill="#10B981" 
        name="Nombre de recharges" 
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
</div>

{/* Graphique: Consommation par véhicule */}
<div className="bg-white rounded-lg shadow-sm p-3 md:p-5">
  <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Consommation par véhicule</h2>
  <p className="text-xs text-gray-400 mb-3 sm:mb-4">L/100km - Moyenne par véhicule</p>
  <ResponsiveContainer width="100%" height={350}>
    <BarChart data={consumptionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis 
        dataKey="vehiculeName" 
        angle={-45} 
        textAnchor="end" 
        height={isMobile ? 80 : 70} 
        tick={{ fontSize: isMobile ? 9 : 11, fill: '#6B7280' }}
        tickFormatter={(value) => {
          // Retirer tout ce qui est après le tiret - (immatriculation)
          const nameWithoutImmat = value.split(' - ')[0];
          return isMobile ? truncateName(nameWithoutImmat, 12) : nameWithoutImmat;
        }}
      />
      <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }} width={isMobile ? 30 : 40} />
      <Tooltip 
        content={<CustomTooltip unit=" L/100km" />}
        formatter={(value) => [`${value} L/100km`, 'Consommation']}
        labelFormatter={(label) => {
          // Retirer l'immatriculation dans le tooltip aussi
          return label.split(' - ')[0];
        }}
      />
      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
      <Bar 
        dataKey="consommationMoyenne" 
        fill="#3B82F6" 
        name="Consommation (L/100km)" 
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
</div>
        </div>

        {/* Graphique: Dépenses mensuelles */}


        <div className="bg-white rounded-lg shadow-sm p-3 md:p-5">
         <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Dépenses mensuelles</h2>
          <p className="text-xs text-gray-400 mb-3 sm:mb-4">Évolution des dépenses et volumes</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Graphique: Évolution des consommations */}
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-5">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Évolution des consommations</h2>
            <p className="text-xs text-gray-400 mb-3 sm:mb-4">Tendance L/100km dans le temps</p>
            {filteredEvolutionData.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <p className="text-sm">Aucune donnée pour cette période</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={filteredEvolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return isMobile ? `${d.getDate()}/${d.getMonth()+1}` : d.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit' });
                    }}
                    tick={{ fontSize: isMobile ? 9 : 11, fill: '#6B7280' }}
                    interval={isMobile ? 1 : 0}
                    angle={isMobile ? -25 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 50 : 30}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }} width={isMobile ? 35 : 45} />
                  <Tooltip content={<CustomTooltip unit=" L/100km" />} />
                  <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Area 
                    type="monotone" 
                    dataKey="consommation" 
                    stroke="#F59E0B" 
                    name="Consommation (L/100km)"
                    fill="#FEF3C7"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Graphique: Consommation moyenne par utilisateur - version responsive */}
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Users size={isMobile ? 16 : 18} className="text-indigo-600" />
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Consommation par utilisateur</h2>
            </div>
            <p className="text-xs text-gray-400 mb-3 sm:mb-4">L/100km - Moyenne par utilisateur</p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={consumptionByUser} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="prenom" 
                  angle={-45} 
                  textAnchor="end" 
                  height={isMobile ? 90 : 70} 
                  tick={{ fontSize: isMobile ? 9 : 11, fill: '#6B7280' }}
                  tickFormatter={(value) => isMobile ? truncateName(value, 10) : value}
                />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }} width={isMobile ? 35 : 45} />
                <Tooltip content={<CustomTooltip unit=" L/100km" />} />
                <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                <Bar 
                  dataKey="consoMoyennePar100km" 
                  fill="#8B5CF6" 
                  name="Consommation moyenne (L/100km)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tableau utilisateurs détaillé - responsive */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Détail des recharges par utilisateur</h2>
          </div>

          {/* Version desktop - tableau */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nb recharges</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Litres</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total dépenses</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {refuelsByUserData.map((user, userIdx) => (
                  <React.Fragment key={userIdx}>
                    {user.vehicles.map((vehicle: any, vehicleIdx: number) => (
                      <tr key={`${userIdx}-${vehicleIdx}`} className="hover:bg-gray-50">
                        {vehicleIdx === 0 && (
                          <>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 align-top" rowSpan={user.vehicles.length}>
                              {user.nom}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.count}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.totalLitres.toFixed(1)} L</td>
                            <td className="px-4 py-3 text-sm text-gray-600 align-top" rowSpan={user.vehicles.length}>
                              {formatFCFA(user.totalMontant)}
                            </td>
                          </>
                        )}
                        {vehicleIdx !== 0 && (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.count}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.totalLitres.toFixed(1)} L</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version mobile - cartes */}
          <div className="lg:hidden divide-y divide-gray-200">
            {refuelsByUserData.map((user, idx) => {
              const isExpanded = expandedUsers.has(idx);
              return (
                <div key={idx} className="divide-y divide-gray-100">
                  {/* En-tête utilisateur */}
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleUserExpand(idx)}
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{user.nom}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {user.vehicles.length} véhicule(s) • {user.nombreRecharges} recharges
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-blue-600">{formatFCFA(user.totalMontant)}</span>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </div>
                  
                  {/* Détails véhicules */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-gray-50">
                      {user.vehicles.map((vehicle: any, vIdx: number) => (
                        <div key={vIdx} className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="font-medium text-gray-800 text-xs sm:text-sm wrap-break-word">{vehicle.name}</p>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                            <div>
                              <span className="text-gray-500">Recharges:</span>
                              <span className="ml-1 font-medium text-gray-900">{vehicle.count}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Litres:</span>
                              <span className="ml-1 font-medium text-gray-900">{vehicle.totalLitres.toFixed(1)} L</span>
                            </div>
                            <div className="col-span-1">
                              <span className="text-gray-500">Moy:</span>
                              <span className="ml-1 font-medium text-gray-900">{((vehicle.totalLitres / vehicle.count) || 0).toFixed(1)} L</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tableau récapitulatif utilisateurs - version responsive */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Récapitulatif par utilisateur</h2>
          </div>

          {/* Version desktop - tableau */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Litres</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total KM</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Dépenses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conso moy.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recharges</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {consumptionByUser.map((user: any) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.prenom} {user.nom}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.totalLitres} L</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.totalKm.toLocaleString()} km</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFCFA(user.totalMontant)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-indigo-600">{user.consoMoyennePar100km} L/100km</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.nombreRecharges}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version mobile - cartes */}
          <div className="lg:hidden divide-y divide-gray-200">
            {consumptionByUser.map((user: any) => (
              <div key={user.userId} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{user.prenom} {user.nom}</h3>
                  <span className="text-xs font-bold text-indigo-600">{user.consoMoyennePar100km} L/100km</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Litres:</span>
                    <span className="ml-1 font-medium text-gray-900">{user.totalLitres} L</span>
                  </div>
                  <div>
                    <span className="text-gray-500">KM:</span>
                    <span className="ml-1 font-medium text-gray-900">{user.totalKm.toLocaleString()} km</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dépenses:</span>
                    <span className="ml-1 font-medium text-gray-900">{formatFCFA(user.totalMontant)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Recharges:</span>
                    <span className="ml-1 font-medium text-gray-900">{user.nombreRecharges}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes - responsive */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <AlertTriangle size={isMobile ? 16 : 18} className="text-red-500" />
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Alertes consommation anormale</h2>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {(isMobile ? alerts.slice(0, 3) : alerts).map((alert: any) => (
                <div key={alert.id} className="bg-red-50 border border-red-100 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-red-800 text-sm sm:text-base truncate">{alert.vehiculeName}</p>
                      <p className="text-xs sm:text-sm text-red-600 mt-1 wrap-break-word">{alert.message}</p>
                      <p className="text-xs text-red-500 mt-1">
                        {new Date(alert.date).toLocaleDateString('fr-FR')} • 
                        Conso: {alert.consoCalculee} L/100km • 
                        Théorique: {alert.consommationTheorique} L/100km
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-600 whitespace-nowrap">+{alert.ecart}%</span>
                  </div>
                </div>
              ))}
              {isMobile && alerts.length > 3 && (
                <button className="w-full text-center text-xs text-blue-600 py-2 hover:text-blue-700">
                  Voir +{alerts.length - 3} alertes
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}