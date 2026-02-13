
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getServiceOrders, getClients, getEquipment, saveServiceOrder, archiveServiceOrder } from "@/lib/data";
import { cn } from "@/lib/utils";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import OrdersStats from "@/components/dashboard/orders-stats";
import type { ServiceOrderStatus, ServiceOrder, Client, Equipment } from "@/types";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import OrderDetails from "@/components/dashboard/order-details";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EditOrderForm from "@/components/dashboard/edit-order-form";
import { useToast } from "@/hooks/use-toast";


const statusStyles: { [key: string]: string } = {
  Aberta: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Em Diagnóstico": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  "Aguardando Aprovação": "bg-orange-100 text-orange-800 border-orange-200",
  Finalizada: "bg-green-100 text-green-800 border-green-200",
  Entregue: "bg-gray-100 text-gray-800 border-gray-200",
  Arquivada: "bg-gray-100 text-gray-800 border-gray-200",
};

const allStatuses: ServiceOrderStatus[] = [
  "Aberta",
  "Em Diagnóstico",
  "Aguardando Aprovação",
  "Em Andamento",
  "Finalizada",
  "Entregue",
];

export default function ServiceOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orders, clientsData, equipmentData] = await Promise.all([
          getServiceOrders(),
          getClients(),
          getEquipment()
      ]);
      setServiceOrders(orders);
      setClients(clientsData);
      setEquipment(equipmentData);
    } catch (error) {
      console.error("Falha ao carregar dados", error);
      toast({ variant: "destructive", title: "Erro ao Carregar Dados" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetails = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };
  
  const handleOpenEdit = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleSaveOrUpdateOrder = async (updatedOrder: ServiceOrder) => {
    setIsLoading(true);
    try {
        await saveServiceOrder(updatedOrder);
        toast({
            title: "Ordem de Serviço Atualizada!",
            description: "A OS foi salva com sucesso.",
        });
        await loadData();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Não foi possível salvar a OS. Tente novamente.",
        });
        console.error("Failed to save service order:", error);
    } finally {
      setIsLoading(false);
      setIsEditModalOpen(false);
    }
  };

  const handleOrderDeleted = async (orderId: string) => {
    setIsLoading(true);
    try {
      if (!orderId) {
        toast({
          variant: "destructive",
          title: "Erro ao Arquivar",
          description: "ID da Ordem de Serviço não encontrado. Tente novamente.",
        });
        console.error("Attempted to archive an order without a valid ID.");
        return;
      }

      await archiveServiceOrder(orderId);
        toast({
            title: "Ordem de Serviço Arquivada!",
            description: "A OS foi movida para a lixeira.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Arquivar",
            description: "Não foi possível arquivar a OS. Tente novamente.",
        });
        console.error("Failed to archive service order:", error);
    } finally {
      setIsLoading(false);
      setIsEditModalOpen(false);
      loadData(); 
    }
  };


  const filteredOrders = serviceOrders.filter((order) => {
    const client = clients.find((c) => c.id === order.clientId);
    const eq = equipment.find((e) => e.id === order.equipmentId);
    const searchTerm = searchQuery.toLowerCase();

    const matchesSearch =
      order.readableId.toLowerCase().includes(searchTerm) ||
      client?.companyName.toLowerCase().includes(searchTerm) ||
      (eq && `${eq.brand} ${eq.model}`.toLowerCase().includes(searchTerm));

    const matchesStatus = statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-headline text-3xl font-bold">Ordens de Serviço</h1>
        <Button onClick={() => router.push('/dashboard/orders/new')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Ordem de Serviço
        </Button>
      </div>

      <OrdersStats orders={serviceOrders} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Histórico de Ordens</CardTitle>
          <CardDescription>
            Gerencie e acompanhe todas as ordens de serviço.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por OS, cliente ou equipamento..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Todos os Status</SelectItem>
                {allStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Entrada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                    </TableRow>
                  ))
              ) : filteredOrders.map((order, index) => {
                const client = clients.find((c) => c.id === order.clientId);
                const eq = equipment.find((e) => e.id === order.equipmentId);
                return (
                  <TableRow
                    key={`${order.id}-${index}`}
                    onClick={() => handleOpenDetails(order)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">{order.readableId}</TableCell>
                    <TableCell>{client?.companyName}</TableCell>
                    <TableCell>
                      {eq?.brand} {eq?.model}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("font-semibold", statusStyles[order.status])}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.entryDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleOpenDetails(order)}>Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleOpenEdit(order);}}>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Imprimir</DropdownMenuItem>
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

      {selectedOrder && (
        <OrderDetails
            isOpen={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            order={selectedOrder}
            client={clients.find(c => c.id === selectedOrder.clientId)}
            equipment={equipment.find(e => e.id === selectedOrder.equipmentId)}
        />
      )}

      {selectedOrder && (
         <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Editar Ordem de Serviço: {selectedOrder.readableId}</DialogTitle>
                    <DialogDescription>
                        Faça as alterações necessárias e clique em "Salvar Alterações" quando terminar.
                    </DialogDescription>
                </DialogHeader>
                 <div className="flex-grow overflow-auto -mr-6 pr-6">
                    <EditOrderForm
                        order={selectedOrder}
                        onSave={handleSaveOrUpdateOrder}
                        onCancel={() => setIsEditModalOpen(false)}
                        onDelete={handleOrderDeleted}
                    />
                </div>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
