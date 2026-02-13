
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Bot, Clipboard } from "lucide-react";
import { getClients, getEquipment, getServiceOrders } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { ServiceOrder, Client, ServiceOrderStatus, Equipment } from "@/types";
import { summarizeServiceOrder } from "@/ai/flows/summarize-service-order";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import OrderDetails from "./order-details";


const statusStyles: { [key in ServiceOrderStatus]: string } = {
  Aberta: "bg-red-100 text-red-800 border-red-200",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  "Aguardando Aprovação": "bg-yellow-100 text-yellow-800 border-yellow-200",
  Finalizada: "bg-green-100 text-green-800 border-green-200",
  Entregue: "bg-gray-100 text-gray-800 border-gray-200",
  "Em Diagnóstico": "bg-cyan-100 text-cyan-800 border-cyan-200",
  Arquivada: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function RecentOrders() {
  const { toast } = useToast();
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [summary, setSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const [orders, clientsData, equipmentData] = await Promise.all([
          getServiceOrders(),
          getClients(),
          getEquipment(),
        ]);
        const sortedOrders = orders.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
        setRecentOrders(sortedOrders.slice(0, 5));
        setClients(clientsData);
        setEquipment(equipmentData);
      } catch (error) {
        console.error("Failed to load recent orders data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSummarize = async (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsSummaryDialogOpen(true);
    setIsSummaryLoading(true);
    setSummary("");
    try {
      const result = await summarizeServiceOrder({
        technicianNotes: order.technicianNotes || "N/A",
        inspectionChecklist: "N/A", // inspectionChecklist is an object now
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setSummary("Desculpe, não foi possível gerar um resumo para esta OS.");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleOpenDetails = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  }

  const handleCopyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast({
        title: "Copiado para a área de transferência!",
        description: "O resumo foi copiado.",
      });
    }
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-headline">Ordens de Serviço Recentes</CardTitle>
          <CardDescription>Uma visão rápida das últimas OS criadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : recentOrders.map((order, index) => {
                const client = clients.find((c) => c.id === order.clientId);
                return (
                  <TableRow
                    key={`${order.id}-${index}`}
                    onClick={() => handleOpenDetails(order)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{client?.companyName}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.readableId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("font-semibold", statusStyles[order.status])}
                      >
                        {order.status}
                      </Badge>
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
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSummarize(order); }}>
                            <Bot className="mr-2 h-4 w-4" />
                            Resumir com IA
                          </DropdownMenuItem>
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

      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline">
              <Bot className="h-6 w-6 text-primary" />
              Resumo com IA
            </DialogTitle>
            <DialogDescription>
              Resumo para a Ordem de Serviço {selectedOrder?.readableId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isSummaryLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{summary}</p>
            )}
          </div>
          <Button onClick={handleCopyToClipboard} variant="outline" className="w-full">
            <Clipboard className="mr-2 h-4 w-4" />
            Copiar Resumo
          </Button>
        </DialogContent>
      </Dialog>

      {selectedOrder && (
        <OrderDetails
          isOpen={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          order={selectedOrder}
          client={clients.find(c => c.id === selectedOrder.clientId)}
          equipment={equipment.find(e => e.id === selectedOrder.equipmentId)}
        />
      )}
    </>
  );
}
