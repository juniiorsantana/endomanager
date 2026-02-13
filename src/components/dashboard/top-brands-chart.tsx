
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
import { getServiceOrders, getEquipment } from "@/lib/data";
import type { ServiceOrder, Equipment } from "@/types";
import { Skeleton } from "../ui/skeleton";

export default function TopBrandsChart() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [serviceOrders, equipmentData] = await Promise.all([
        getServiceOrders(),
        getEquipment()
      ]);
      setOrders(serviceOrders);
      setEquipment(equipmentData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const chartData = useMemo(() => {
    if (orders.length === 0 || equipment.length === 0) return [];

    const brandCounts = orders.reduce((acc, order) => {
      const eq = equipment.find(e => e.id === order.equipmentId);
      if (eq) {
        acc[eq.brand] = (acc[eq.brand] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(brandCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 brands

  }, [orders, equipment]);

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
        <CardTitle className="font-headline">Marcas Mais Reparadas</CardTitle>
        <CardDescription>As 5 marcas com mais ordens de serviço registradas.</CardDescription>
      </CardHeader>
      <CardContent>
         {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                />
                <Tooltip
                cursor={{ fill: 'hsla(var(--accent))' }}
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                }}
                 formatter={(value, name) => [`${value} OS`, "Total"]}
                />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={30}/>
            </BarChart>
            </ResponsiveContainer>
         ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                <p>Nenhum dado de equipamento encontrado nas OS.</p>
                <p className="text-xs">Crie ordens de serviço e vincule equipamentos para ver o gráfico.</p>
            </div>
         )}
      </CardContent>
    </Card>
  );
}
