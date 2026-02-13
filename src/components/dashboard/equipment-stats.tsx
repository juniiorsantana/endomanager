
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServiceOrders } from "@/lib/data";
import { Package, PackageCheck, AlertTriangle, Wrench, Siren } from "lucide-react";
import type { Equipment, ServiceOrder } from "@/types";

interface EquipmentStatsProps {
  equipmentData: Equipment[];
}

export default function EquipmentStats({ equipmentData }: EquipmentStatsProps) {
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);

     useEffect(() => {
        const fetchOrders = async () => {
            const orders = await getServiceOrders();
            setServiceOrders(orders);
        };
        fetchOrders();
    }, []);


    const inMaintenance = new Set(serviceOrders.filter(o => o.status === "Em Andamento" || o.status === "Em Diagnóstico").map(o => o.equipmentId)).size;
    const readyForDelivery = new Set(serviceOrders.filter(o => o.status === "Finalizada").map(o => o.equipmentId)).size;
    const waitingForParts = new Set(serviceOrders.filter(o => o.status === "Aguardando Aprovação").map(o => o.equipmentId)).size;

    const stats = [
        { title: "Em Manutenção", value: inMaintenance, icon: Wrench, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
        { title: "Aguardando Peça", value: waitingForParts, icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" },
        { title: "Prontos para Entrega", value: readyForDelivery, icon: PackageCheck, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-900/20" },
        { title: "Total de Equipamentos", value: equipmentData.length, icon: Package, color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-900/20" },
        { title: "Alertas de Revisão", value: "2", icon: Siren, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-900/20" },

    ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title} className={`hover:bg-muted/50 cursor-pointer transition-colors ${stat.bgColor}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
             <p className="text-xs text-muted-foreground">
              Clique para ver detalhes
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
