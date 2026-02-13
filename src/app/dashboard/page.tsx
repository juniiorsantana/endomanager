
"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Laptop, Wrench, ChevronDown } from "lucide-react";
import DashboardStats from "@/components/dashboard/dashboard-stats";
import RepairTimeChart from "@/components/dashboard/repair-time-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import TopBrandsChart from "@/components/dashboard/top-brands-chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import TechnicianPerformanceChart from "@/components/dashboard/technician-performance-chart";


export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Novo
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>O que você quer criar?</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/orders/new')}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Nova Ordem de Serviço</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/clients/new')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Novo Cliente</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/equipment/new')}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>Novo Equipamento</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DashboardStats />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <div className="lg:col-span-5">
          <RepairTimeChart />
        </div>
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
      </div>
       <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopBrandsChart />
        <TechnicianPerformanceChart />
      </div>
    </>
  );
}
