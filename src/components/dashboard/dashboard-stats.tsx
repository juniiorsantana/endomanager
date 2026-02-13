
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServiceOrders } from "@/lib/data";
import { AlertCircle, CheckCircle, Clock, Loader } from "lucide-react";
import type { ServiceOrder } from "@/types";

export default function DashboardStats() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const serviceOrders = await getServiceOrders();
        setOrders(serviceOrders);
      } catch (error) {
        console.error("Failed to fetch service orders:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);


  const openOrders = orders.filter(
    (order) => order.status === "Aberta"
  ).length;
  const inProgressOrders = orders.filter(
    (order) => order.status === "Em Andamento"
  ).length;
  const pendingOrders = orders.filter(
    (order) => order.status === "Aguardando Aprovação"
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === "Finalizada"
  ).length;

  const stats = [
    {
      title: "Abertas",
      value: openOrders,
      icon: AlertCircle,
      color: "text-red-500",
    },
    {
      title: "Em Andamento",
      value: inProgressOrders,
      icon: Loader,
      color: "text-blue-500",
    },
    {
      title: "Aguardando Aprovação",
      value: pendingOrders,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Finalizadas",
      value: completedOrders,
      icon: CheckCircle,
      color: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
            <p className="text-xs text-muted-foreground">
              Total de ordens de serviço ativas
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
