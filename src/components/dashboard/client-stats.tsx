
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServiceOrders } from "@/lib/data";
import { BarChart, Briefcase, Users, UserPlus } from "lucide-react";
import type { Client, ServiceOrder } from "@/types";

interface ClientStatsProps {
  clientData: Client[];
}

export default function ClientStats({ clientData }: ClientStatsProps) {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const orders = await getServiceOrders();
      setServiceOrders(orders);
    };
    fetchOrders();
  }, []);

  const activeClientsLastYear = new Set(
    serviceOrders
      .filter(o => new Date(o.entryDate) > new Date(new Date().setFullYear(new Date().getFullYear() - 1)))
      .map(o => o.clientId)
  ).size;

  const clientsWithOpenOrders = new Set(
    serviceOrders
      .filter(o => o.status === "Em Andamento" || o.status === "Aberta" || o.status === "Em Diagnóstico")
      .map(o => o.clientId)
  ).size;

  const stats = [
    { title: "Clientes Ativos", value: clientData.length, icon: Users, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "Com OS (12 meses)", value: activeClientsLastYear, icon: Briefcase, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-900/20" },
    { title: "Com OS em Andamento", value: clientsWithOpenOrders, icon: BarChart, color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-900/20" },
    { title: "Novos Clientes (Mês)", value: "2", icon: UserPlus, color: "text-cyan-500", bgColor: "bg-cyan-50 dark:bg-cyan-900/20" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
