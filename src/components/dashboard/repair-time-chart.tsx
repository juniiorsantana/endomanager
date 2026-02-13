
"use client";

import { useMemo, useState, useEffect } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServiceOrders } from "@/lib/data";
import type { ServiceOrder } from "@/types";
import { Skeleton } from "../ui/skeleton";

type MonthlyData = {
  month: string;
  days: number;
  count: number;
};

export default function RepairTimeChart() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const serviceOrders = await getServiceOrders();
      setOrders(serviceOrders);
      setIsLoading(false);
    };
    fetchOrders();
  }, []);

  const chartData = useMemo(() => {
    const completedOrders = orders.filter(o => (o.status === 'Finalizada' || o.status === 'Entregue') && o.exitDate);

    const monthlyStats = completedOrders.reduce((acc, order) => {
      const entryDate = new Date(order.entryDate);
      const exitDate = new Date(order.exitDate!);
      const repairTime = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);

      if (repairTime < 0) return acc; // Ignore invalid data

      const month = entryDate.toLocaleString('pt-BR', { month: 'short' });
      const year = entryDate.getFullYear();
      const monthKey = `${month.charAt(0).toUpperCase() + month.slice(1)}/${String(year).slice(-2)}`;


      if (!acc[monthKey]) {
        acc[monthKey] = { totalDays: 0, count: 0, date: entryDate };
      }

      acc[monthKey].totalDays += repairTime;
      acc[monthKey].count += 1;

      return acc;
    }, {} as { [key: string]: { totalDays: number; count: number, date: Date } });

    const dataForChart = Object.entries(monthlyStats)
      .map(([month, { totalDays, count, date }]) => ({
        month,
        days: totalDays / count,
        date
      }))
      .sort((a,b) => a.date.getTime() - b.date.getTime())
      .slice(-6); // Last 6 months

      return dataForChart;

  }, [orders]);

  if (isLoading) {
    return (
        <Card className="h-full">
             <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="w-full h-[300px]" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline">Tempo Médio de Reparo</CardTitle>
        <CardDescription>Média de dias para finalizar uma ordem de serviço (últimos 6 meses).</CardDescription>
      </CardHeader>
      <CardContent>
         {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(1)}d`}
                />
                <Tooltip
                cursor={{ fill: 'hsla(var(--accent))' }}
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                }}
                 formatter={(value, name, props) => [`${(value as number).toFixed(1)} dias`, "Tempo Médio"]}
                />
                <Bar dataKey="days" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
         ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                <p>Não há dados suficientes para exibir o gráfico.</p>
                <p className="text-xs">Finalize algumas ordens de serviço para começar a ver as métricas.</p>
            </div>
         )}
      </CardContent>
    </Card>
  );
}
