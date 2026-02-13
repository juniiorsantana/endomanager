
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
import { getClients, getServiceOrders, getEquipment } from "@/lib/data";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import ClientStats from "@/components/dashboard/client-stats";
import type { Client, ServiceOrder, Equipment } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import ClientDetails from "@/components/dashboard/client-details";


export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const [clientsData, ordersData, equipmentData] = await Promise.all([
          getClients(),
          getServiceOrders(),
          getEquipment(),
        ]);
        setClients(clientsData);
        setServiceOrders(ordersData);
        setEquipment(equipmentData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const getClientOSCount = (clientId: string) => {
    return serviceOrders.filter(order => order.clientId === clientId).length;
  }

  const handleRowClick = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEdit = (clientId: string) => {
    // TODO: Implement navigation to client edit page
    console.log("Navigate to edit page for client:", clientId);
  };
  
  const handleCreateOrder = (clientId: string) => {
    router.push(`/dashboard/orders/new?clientId=${clientId}`);
  };


  const filteredClients = clients.filter((client) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      client.companyName.toLowerCase().includes(searchTerm) ||
      client.contactName.toLowerCase().includes(searchTerm) ||
      client.phone.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-headline text-3xl font-bold">Clientes</h1>
        <Button onClick={() => router.push('/dashboard/clients/new')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <ClientStats clientData={clients} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
           <div className="md:flex items-center justify-between">
             <CardDescription>
                Gerencie seus clientes e veja seus detalhes.
             </CardDescription>
             <div className="relative mt-2 md:mt-0 w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome, telefone, email..."
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
                <TableHead>Empresa</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Nº OS</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} onClick={() => handleRowClick(client)} className="cursor-pointer">
                    <TableCell className="font-medium">{client.companyName}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.address.split(',')[2]?.trim() || client.address.split(',')[1]?.trim()}</TableCell>
                    <TableCell className="text-center">{getClientOSCount(client.id)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleRowClick(client)}>Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(client.id); }}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateOrder(client.id); }}>Criar OS</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedClient && (
        <ClientDetails
            isOpen={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            client={selectedClient}
            equipment={equipment.filter(e => e.ownerId === selectedClient.id)}
            serviceOrders={serviceOrders.filter(o => o.clientId === selectedClient.id)}
            onEditClient={handleOpenEdit}
            onCreateOrder={handleCreateOrder}
        />
      )}
    </>
  );
}
