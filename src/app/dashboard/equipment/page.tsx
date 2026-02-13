
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getEquipment, getClients, getServiceOrders } from "@/lib/data";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import EquipmentStats from "@/components/dashboard/equipment-stats";
import type { Equipment, Client, ServiceOrder } from "@/types";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import EquipmentDetails from "@/components/dashboard/equipment-details";

const getEquipmentStatus = (equipmentId: string, serviceOrders: ServiceOrder[]) => {
    const order = serviceOrders
        .filter(o => o.equipmentId === equipmentId)
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())[0];

    if (!order || order.status === 'Entregue' || order.status === 'Finalizada') {
        return { text: 'Em Uso', style: 'bg-green-100 text-green-800 border-green-200' };
    }
    if (order.status === 'Em Andamento' || order.status === 'Em Diagnóstico') {
         return { text: 'Em Manutenção', style: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
     if (order.status === 'Aguardando Aprovação') {
         return { text: 'Aguardando Aprovação', style: 'bg-orange-100 text-orange-800 border-orange-200' };
    }

    return { text: 'Disponível', style: 'bg-gray-100 text-gray-800 border-gray-200' };
};

export default function EquipmentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [equipmentData, clientsData, serviceOrdersData] = await Promise.all([
          getEquipment(),
          getClients(),
          getServiceOrders()
        ]);
        setEquipment(equipmentData);
        setClients(clientsData);
        setServiceOrders(serviceOrdersData);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getLastServiceDate = (equipmentId: string, currentServiceOrders: ServiceOrder[]) => {
    const order = currentServiceOrders
        .filter(o => o.equipmentId === equipmentId && o.exitDate)
        .sort((a, b) => new Date(b.exitDate!).getTime() - new Date(a.exitDate!).getTime())[0];
    return order ? new Date(order.exitDate!).toLocaleDateString('pt-BR') : 'N/A';
  }

  const handleRowClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsDetailsModalOpen(true);
  };
  
  const handleEditClick = (equipmentId: string) => {
    // TODO: Navigate to edit page
    console.log("Navigate to edit page for equipment:", equipmentId);
  }

  const handleCreateOrder = (equipmentId: string) => {
    const equipmentToUse = equipment.find(e => e.id === equipmentId);
    if (equipmentToUse) {
      router.push(`/dashboard/orders/new?clientId=${equipmentToUse.ownerId}&equipmentId=${equipmentId}`);
    }
  };

  const filteredEquipment = equipment.filter((eq) => {
    const client = clients.find((c) => c.id === eq.ownerId);
    const searchTerm = searchQuery.toLowerCase();
    return (
      eq.brand.toLowerCase().includes(searchTerm) ||
      eq.model.toLowerCase().includes(searchTerm) ||
      eq.serialNumber.toLowerCase().includes(searchTerm) ||
      client?.companyName.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-headline text-3xl font-bold">Equipamentos</h1>
        <Button onClick={() => router.push('/dashboard/equipment/new')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Equipamento
        </Button>
      </div>

      <EquipmentStats equipmentData={equipment} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Lista de Equipamentos</CardTitle>
           <div className="md:flex items-center justify-between">
             <CardDescription>
                Gerencie todos os equipamentos cadastrados.
             </CardDescription>
             <div className="relative mt-2 md:mt-0 w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por marca, modelo, S/N..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Nº de Série</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Manutenção</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
             {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredEquipment.map((eq) => {
                const client = clients.find((c) => c.id === eq.ownerId);
                const status = getEquipmentStatus(eq.id, serviceOrders);
                const lastServiceDate = getLastServiceDate(eq.id, serviceOrders);

                return (
                  <TableRow key={eq.id} onClick={() => handleRowClick(eq)} className="cursor-pointer">
                    <TableCell className="font-medium">{eq.brand}</TableCell>
                    <TableCell>{eq.model}</TableCell>
                    <TableCell>{eq.serialNumber}</TableCell>
                    <TableCell>{client?.companyName}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn("font-semibold", status.style)}>
                           {status.text}
                        </Badge>
                    </TableCell>
                    <TableCell>{lastServiceDate}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleRowClick(eq)}>Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateOrder(eq.id); }}>Criar OS</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(eq.id); }}>Editar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedEquipment && (
         <EquipmentDetails
          isOpen={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          equipment={selectedEquipment}
          client={clients.find(c => c.id === selectedEquipment.ownerId)}
          serviceOrders={serviceOrders.filter(o => o.equipmentId === selectedEquipment.id)}
          onEdit={handleEditClick}
          onCreateOrder={handleCreateOrder}
        />
      )}
    </>
  );
}

