
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { equipmentTypes, equipmentTechnicalStatusValues } from "@/lib/data";
import type { Client, Equipment, ServiceOrder, ServiceOrderStatus } from "@/types";
import { Pencil, PlusCircle, Wrench, Package, Store, Car, DollarSign, Calendar, Upload, FileText, Send, Link as LinkIcon, Building } from "lucide-react";


interface EquipmentDetailsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  equipment: Equipment | null;
  client?: Client;
  serviceOrders: ServiceOrder[];
  onEdit: (equipmentId: string) => void;
  onCreateOrder: (equipmentId: string) => void;
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

const availabilityIcons = {
    internal: Building,
    sale: Store,
    rent: Car,
};

const DetailItem = ({ icon: Icon, label, value, className }: { icon?: React.ElementType; label: string; value: React.ReactNode; className?: string; }) => (
  <div className={cn("flex flex-col gap-1", className)}>
    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
    </p>
    <div className="font-semibold text-base">{value || "---"}</div>
  </div>
);


export default function EquipmentDetails({
  isOpen,
  onOpenChange,
  equipment,
  client,
  serviceOrders,
  onEdit,
  onCreateOrder,
}: EquipmentDetailsProps) {
  if (!equipment) return null;

  const AvailabilityIcon = availabilityIcons[equipment.availabilityType];
  const equipmentTypeName = equipmentTypes[equipment.equipmentType as keyof typeof equipmentTypes] || equipment.equipmentType;
  const technicalStatusName = equipmentTechnicalStatusValues[equipment.technicalStatus] || equipment.technicalStatus;

  const handleOrderClick = (orderId: string) => {
    console.log("Navigate to details for order:", orderId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span className="font-headline text-2xl">{equipment.brand} {equipment.model}</span>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(equipment.id)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                <Button size="sm" onClick={() => onCreateOrder(equipment.id)}><PlusCircle className="mr-2 h-4 w-4" /> Criar OS</Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Número de Série: {equipment.serialNumber}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-grow flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="commercial">Comercial</TabsTrigger>
            <TabsTrigger value="media">Mídia</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-grow">
            <div className="p-6">
              <TabsContent value="details" className="m-0 space-y-6">
                <Card>
                  <CardHeader><CardTitle>Informações Principais</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <DetailItem label="Marca" value={equipment.brand} />
                    <DetailItem label="Modelo" value={equipment.model} />
                    <DetailItem label="Nº de Série" value={equipment.serialNumber} />
                    <DetailItem label="Tipo de Equipamento" value={equipmentTypeName} />
                    <DetailItem 
                        label="Cliente Vinculado" 
                        value={
                            <Button variant="link" className="p-0 h-auto font-semibold">
                                {client?.companyName}
                                <LinkIcon className="ml-2 h-4 w-4" />
                            </Button>
                        } 
                    />
                     <DetailItem 
                        label="Status Técnico" 
                        value={<Badge variant="secondary">{technicalStatusName}</Badge>} 
                    />
                    <DetailItem
                      icon={AvailabilityIcon}
                      label="Disponibilidade"
                      value={
                        equipment.availabilityType === 'internal' ? 'Uso Interno' :
                        equipment.availabilityType === 'sale' ? 'Para Venda' : 'Para Aluguel'
                      }
                    />
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Observações Técnicas</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{equipment.technicalObservations || "Nenhuma observação técnica registrada."}</p>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="m-0 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Histórico de Ordens de Serviço</CardTitle></CardHeader>
                    <CardContent>
                        {serviceOrders.length > 0 ? (
                             <Table>
                                <TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Data Entrada</TableHead><TableHead>Status</TableHead><TableHead>Problema Relatado</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {serviceOrders.map(order => (
                                         <TableRow key={order.id} className="cursor-pointer" onClick={() => handleOrderClick(order.id)}>
                                            <TableCell className="font-medium">{order.readableId}</TableCell>
                                            <TableCell>{new Date(order.entryDate).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("font-semibold", statusStyles[order.status])}>{order.status}</Badge>
                                            </TableCell>
                                            <TableCell className="truncate max-w-xs">{order.problemDescription}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ordem de serviço encontrada para este equipamento.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Histórico de Manutenção Preventiva</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center py-4">Funcionalidade em desenvolvimento.</p>
                    </CardContent>
                </Card>
              </TabsContent>

               <TabsContent value="commercial" className="m-0 space-y-6">
                 <Card>
                  <CardHeader><CardTitle>Informações de Venda</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <DetailItem 
                        icon={Store}
                        label="Status da Venda" 
                        value={<Badge variant={equipment.saleStatus === 'sold' ? 'default' : 'outline'}>{equipment.saleStatus === 'sold' ? 'Vendido' : 'Disponível'}</Badge>} 
                    />
                    <DetailItem icon={DollarSign} label="Preço de Venda" value={(equipment.salePrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                    <DetailItem icon={Calendar} label="Data da Venda" value={equipment.saleDate ? new Date(equipment.saleDate).toLocaleDateString('pt-BR') : 'N/A'} />
                     <DetailItem icon={Wrench} label="Comprador" value={equipment.buyerId || 'N/A'} />
                  </CardContent>
                 </Card>
                 <Card>
                    <CardHeader><CardTitle>Informações de Aluguel</CardTitle></CardHeader>
                     <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <DetailItem 
                        icon={Car}
                        label="Status do Aluguel" 
                        value={<Badge variant={equipment.rentalStatus === 'rented' ? 'default' : 'outline'}>{equipment.rentalStatus === 'rented' ? 'Locado' : 'Disponível'}</Badge>} 
                       />
                       <DetailItem icon={DollarSign} label="Valor Diário" value={(equipment.rentalPrice?.daily || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                       <DetailItem icon={DollarSign} label="Valor Semanal" value={(equipment.rentalPrice?.weekly || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                       <DetailItem icon={DollarSign} label="Valor Mensal" value={(equipment.rentalPrice?.monthly || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                       <DetailItem icon={Wrench} label="Cliente Locatário" value={equipment.rentalClientId || 'N/A'} />
                        <DetailItem icon={Calendar} label="Data de Retirada" value={equipment.rentalStartDate ? new Date(equipment.rentalStartDate).toLocaleDateString('pt-BR') : 'N/A'} />
                       <DetailItem icon={Calendar} label="Devolução Prevista" value={equipment.rentalExpectedReturnDate ? new Date(equipment.rentalExpectedReturnDate).toLocaleDateString('pt-BR') : 'N/A'} />
                     </CardContent>
                 </Card>
              </TabsContent>

               <TabsContent value="media" className="m-0">
                 <Card>
                    <CardHeader>
                      <CardTitle>Mídia e Documentos</CardTitle>
                      <CardDescription>Galeria de imagens e documentos do equipamento.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                           <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Adicionar Imagens</Button>
                           <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Anexar Documentos</Button>
                        </div>
                        <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
                           <p className="text-muted-foreground">Nenhuma mídia adicionada.</p>
                        </div>
                    </CardContent>
                 </Card>
               </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="p-6 border-t mt-auto gap-4 md:gap-2 flex-wrap">
           <div className="flex-grow flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => {}}><FileText className="mr-2 h-4 w-4" /> Gerar Relatório</Button>
              <Button variant="secondary" size="sm" onClick={() => {}}><Send className="mr-2 h-4 w-4" /> Enviar por Email</Button>
           </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
