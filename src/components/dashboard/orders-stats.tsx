
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Microscope, Search, Wrench, CheckCircle, Clock } from "lucide-react";
import type { ServiceOrder } from "@/types";

interface OrdersStatsProps {
    orders: ServiceOrder[];
}

export default function OrdersStats({ orders }: OrdersStatsProps) {
    const getCount = (status: string) => orders.filter(o => o.status === status).length;

    const stats = [
        { title: "OS em Aberto", value: getCount("Aberta"), icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" },
        { title: "Em Diagnóstico", value: getCount("Em Diagnóstico"), icon: Microscope, color: "text-cyan-500", bgColor: "bg-cyan-50 dark:bg-cyan-900/20" },
        { title: "Aguardando Aprovação", value: getCount("Aguardando Aprovação"), icon: Search, color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-900/20" },
        { title: "Em Execução", value: getCount("Em Andamento"), icon: Wrench, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
        { title: "Finalizadas no Mês", value: getCount("Finalizada"), icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-900/20" },
        { title: "Tempo Médio de Reparo", value: "3.2d", icon: Clock, color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-900/20" },
    ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.title} className={`hover:bg-muted/50 cursor-pointer transition-colors ${stat.bgColor}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
             <p className="text-xs text-muted-foreground">
              +2.1% vs. mês anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
