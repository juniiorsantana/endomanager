
"use client";

import { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export default function TechnicianPerformanceChart() {
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
    const completedOrders = orders.filter(o => o.status === 'Finalizada' || o.status === 'Entregue');
    
    const techPerformance = completedOrders.reduce((acc, order) => {
        const tech = order.execution?.technician || 'Não atribuído';
        if (tech) {
            acc[tech] = (acc[tech] || 0) + 1;
        }
        return acc;
    }, {} as { [key: string]: number });

    return Object.entries(techPerformance)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

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
        <CardTitle className="font-headline">Performance dos Técnicos</CardTitle>
        <CardDescription>Número de ordens de serviço finalizadas por técnico.</CardDescription>
      </CardHeader>
      <CardContent>
         {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Tooltip
                        cursor={{ fill: 'hsla(var(--accent))' }}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                        }}
                    />
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
         ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                <p>Não há dados de performance para exibir.</p>
                <p className="text-xs">Atribua técnicos e finalize OS para ver o desempenho.</p>
            </div>
         )}
      </CardContent>
    </Card>
  );
}
