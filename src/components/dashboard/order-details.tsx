
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ServiceOrder, Client, Equipment, InspectionChecklistItemStatus } from "@/types";
import { inspectionItems } from "@/types";
import { FileText, Pencil, Send, CheckCircle, AlertTriangle, WrenchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "../ui/table";
import { useMemo } from "react";
import { Separator } from "../ui/separator";
import ImageInspectionCanvas from "./image-inspection-canvas";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface OrderDetailsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: ServiceOrder | null;
  client?: Client;
  equipment?: Equipment;
}

const statusStyles: { [key: string]: string } = {
  Aberta: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Em Diagnóstico": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  "Aguardando Aprovação": "bg-orange-100 text-orange-800 border-orange-200",
  Finalizada: "bg-green-100 text-green-800 border-green-200",
  Entregue: "bg-gray-100 text-gray-800 border-gray-200",
};

const checklistStatusStyles: { [key in InspectionChecklistItemStatus]: string } = {
    OK: 'text-green-600',
    Defeito: 'text-orange-600',
    Troca: 'text-red-600',
};

const ChecklistStatusIcon = ({ status }: { status: InspectionChecklistItemStatus }) => {
    const iconMap = {
        OK: <CheckCircle className="h-5 w-5 text-green-500" />,
        Defeito: <AlertTriangle className="h-5 w-5 text-orange-500" />,
        Troca: <WrenchIcon className="h-5 w-5 text-red-500" />,
    };
    return iconMap[status];
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="text-base font-semibold">{value || "---"}</div>
  </div>
);

export default function OrderDetails({
  isOpen,
  onOpenChange,
  order,
  client,
  equipment,
}: OrderDetailsProps) {
  const router = useRouter();
  const totalBudget = useMemo(() => {
    if (!order?.budget?.items) return 0;
    return order.budget.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }, [order?.budget?.items]);

  if (!order) return null;

  const handleEdit = () => {
    onOpenChange(false);
    router.push(`/dashboard/orders/${order.id}/edit`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="font-headline text-2xl">
              Detalhes da OS: {order.readableId}
            </span>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}><Pencil className="mr-2 h-4 w-4" /> Editar OS</Button>
                <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> Gerar PDF</Button>
                <Button size="sm"><Send className="mr-2 h-4 w-4" /> Enviar</Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações da ordem de serviço.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6">
          <div className="space-y-6 py-4">
            {/* Bloco 1: Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <DetailItem label="Status" value={<Badge className={statusStyles[order.status]}>{order.status}</Badge>} />
                <DetailItem label="Cliente" value={client?.companyName} />
                <DetailItem label="Equipamento" value={`${equipment?.brand} ${equipment?.model}`} />
                <DetailItem label="Nº de Série" value={equipment?.serialNumber} />
                <DetailItem label="Data de Entrada" value={new Date(order.entryDate).toLocaleDateString('pt-BR')} />
                <DetailItem label="Data Prevista" value={order.exitDate ? new Date(order.exitDate).toLocaleDateString('pt-BR') : "Não definida"} />
              </CardContent>
            </Card>

             {/* Bloco 2: Diagnóstico e Inspeção */}
            <Card>
                <CardHeader>
                    <CardTitle>Diagnóstico e Inspeção</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <DetailItem label="Problema Relatado pelo Cliente" value={order.problemDescription} />
                    <Separator/>
                    <div className="pt-2 space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Checklist de Itens</h4>
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[150px]">Item</TableHead>
                                            <TableHead className="w-[180px]">Status</TableHead>
                                            <TableHead>Observação</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(inspectionItems).map(([key, label]) => {
                                            const item = order.inspectionChecklist?.[key as keyof typeof inspectionItems];
                                            const status = item?.status;
                                            const observation = item?.observation;

                                            return (
                                                <TableRow key={key}>
                                                    <TableCell className="font-medium">{label}</TableCell>
                                                    <TableCell>
                                                        {status ? (
                                                            <div className={cn("flex items-center gap-2 font-semibold", checklistStatusStyles[status])}>
                                                                <ChecklistStatusIcon status={status} />
                                                                <span>{status === 'Troca' ? 'Troca Necessária' : status}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">Não avaliado</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{observation || <span className="text-muted-foreground">---</span>}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        <Separator />
                        {order.visualInspection ? (
                             <ImageInspectionCanvas
                                value={order.visualInspection}
                                readOnly={true}
                             />
                        ) : (
                             <p className="text-sm text-muted-foreground">Nenhum dado de inspeção visual registrado.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

             {/* Bloco 3: Orçamento */}
            <Card>
                <CardHeader>
                    <CardTitle>Orçamento</CardTitle>
                </CardHeader>
                <CardContent>
                     {order.budget && order.budget.items && order.budget.items.length > 0 ? (
                       <div className="rounded-lg border">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item / Serviço</TableHead>
                                    <TableHead className="text-center">Qtd.</TableHead>
                                    <TableHead className="text-right">Vlr. Unit.</TableHead>
                                    <TableHead className="text-right">Vlr. Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.budget.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        <TableCell className="text-right">{(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-bold text-lg">Total:</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{totalBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                </TableRow>
                            </TableFooter>
                         </Table>
                       </div>
                     ) : (
                        <p className="text-sm text-muted-foreground">Nenhum item de orçamento adicionado.</p>
                     )}
                </CardContent>
            </Card>

             {/* Placeholder for Bloco 4: Execução */}
             <Card>
                <CardHeader>
                    <CardTitle>Execução do Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground">Em breve: Técnico, procedimentos, fotos e assinatura.</p>
                </CardContent>
            </Card>

             {/* Placeholder for Bloco 5: Entrega */}
            <Card>
                <CardHeader>
                    <CardTitle>Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Em breve: Data de entrega, assinatura de recebimento.</p>
                </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-background/95">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
