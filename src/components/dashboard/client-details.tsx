
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Client, Equipment, ServiceOrder, ServiceOrderStatus } from "@/types";
import { Pencil, PlusCircle, MapPin, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";


interface ClientDetailsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  client: Client | null;
  equipment: Equipment[];
  serviceOrders: ServiceOrder[];
  onEditClient: (clientId: string) => void;
  onCreateOrder: (clientId: string) => void;
}

const statusStyles: { [key in ServiceOrderStatus]: string } = {
  Aberta: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Em Diagnóstico": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  "Aguardando Aprovação": "bg-orange-100 text-orange-800 border-orange-200",
  Finalizada: "bg-green-100 text-green-800 border-green-200",
  Entregue: "bg-gray-100 text-gray-800 border-gray-200",
  Arquivada: "bg-gray-200 text-gray-800 border-gray-300",
};

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-muted-foreground mt-1" />
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || "---"}</p>
    </div>
  </div>
);


export default function ClientDetails({
  isOpen,
  onOpenChange,
  client,
  equipment,
  serviceOrders,
  onEditClient,
  onCreateOrder,
}: ClientDetailsProps) {
  const router = useRouter();
  if (!client) return null;
  
  const handleEquipmentClick = (equipmentId: string) => {
    // TODO: Navigate to equipment details page or open equipment details modal
    console.log("Navigate to details for equipment:", equipmentId);
  }

  const handleOrderClick = (orderId: string) => {
    // TODO: Open order details modal
    console.log("Navigate to details for order:", orderId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span className="font-headline text-2xl">{client.companyName}</span>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onEditClient(client.id)}><Pencil className="mr-2 h-4 w-4" /> Editar Cliente</Button>
                <Button size="sm" onClick={() => onCreateOrder(client.id)}><PlusCircle className="mr-2 h-4 w-4" /> Criar OS</Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            {client.clientType === 'juridica' ? `CNPJ: ${client.cnpj}` : `CPF: ${client.cpf}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem icon={User} label="Contato Principal" value={client.contactName} />
                <DetailItem icon={Phone} label="Telefone" value={client.phone} />
                <DetailItem icon={Mail} label="Email" value={client.email} />
                <DetailItem icon={MapPin} label="Endereço" value={client.address} />
            </div>

            <div className="px-6 space-y-4">
                 {/* Equipamentos Vinculados */}
                <Card>
                    <CardHeader><CardTitle>Equipamentos Vinculados</CardTitle></CardHeader>
                    <CardContent>
                        {equipment.length > 0 ? (
                             <Table>
                                <TableHeader><TableRow><TableHead>Marca/Modelo</TableHead><TableHead>Nº de Série</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {equipment.map(eq => (
                                        <TableRow key={eq.id} className="cursor-pointer" onClick={() => handleEquipmentClick(eq.id)}>
                                            <TableCell className="font-medium">{eq.brand} {eq.model}</TableCell>
                                            <TableCell>{eq.serialNumber}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{eq.technicalStatus}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum equipamento vinculado a este cliente.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Histórico de Ordens de Serviço */}
                <Card>
                    <CardHeader><CardTitle>Histórico de Ordens de Serviço</CardTitle></CardHeader>
                    <CardContent>
                        {serviceOrders.length > 0 ? (
                             <Table>
                                <TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Equipamento</TableHead><TableHead>Data Entrada</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {serviceOrders.map(order => {
                                        const eq = equipment.find(e => e.id === order.equipmentId);
                                        return (
                                             <TableRow key={order.id} className="cursor-pointer" onClick={() => handleOrderClick(order.id)}>
                                                <TableCell className="font-medium">{order.readableId}</TableCell>
                                                <TableCell>{eq ? `${eq.brand} ${eq.model}` : 'N/A'}</TableCell>
                                                <TableCell>{new Date(order.entryDate).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("font-semibold", statusStyles[order.status])}>{order.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ordem de serviço encontrada para este cliente.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
        
        <DialogFooter className="p-6 border-t mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
