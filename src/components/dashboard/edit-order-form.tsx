
"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getClients, getEquipment } from "@/lib/data";
import { Separator } from "../ui/separator";
import ImageInspectionCanvas, { InspectionData as VisualInspectionData } from "./image-inspection-canvas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "../ui/table";
import { PlusCircle, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import type { ServiceOrder, Client, Equipment, ServiceOrderStatus, BudgetItem, InspectionChecklist, BudgetStatus } from "@/types";
import { inspectionItems } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import DeleteConfirmationDialog from "../shared/delete-confirmation-dialog";

const allStatuses: ServiceOrderStatus[] = [
    "Aberta",
    "Em Diagnóstico",
    "Aguardando Aprovação",
    "Em Andamento",
    "Finalizada",
    "Entregue",
];

const budgetStatuses: BudgetStatus[] = [
    "Pendente",
    "Aprovado",
    "Reprovado"
];

const inspectionChecklistItemSchema = z.object({
    status: z.enum(['OK', 'Defeito', 'Troca']),
    observation: z.string().optional(),
});

const formSchema = z.object({
    id: z.string().optional(),
    entryDate: z.string().min(1, { message: "Data de entrada é obrigatória." }),
    exitDate: z.string().optional(),
    clientId: z.string().min(1, { message: "Selecione um cliente." }),
    equipmentId: z.string().min(1, { message: "Selecione um equipamento." }),
    status: z.enum(allStatuses as [string, ...string[]]),
    problemDescription: z.string().min(1, { message: "Descrição do problema é obrigatória." }),
    inspectionChecklist: z.object(
        Object.keys(inspectionItems).reduce((acc, key) => {
            acc[key as keyof typeof inspectionItems] = inspectionChecklistItemSchema.optional();
            return acc;
        }, {} as Record<keyof typeof inspectionItems, z.ZodOptional<typeof inspectionChecklistItemSchema>>)
    ).optional(),
    visualInspection: z.custom<VisualInspectionData>().optional(),
    technicianNotes: z.string().optional(),
    budget: z.object({
        items: z.array(z.object({
            id: z.number().optional(),
            description: z.string().min(1, "Descrição é obrigatória."),
            quantity: z.coerce.number().min(1, "Qtd. deve ser > 0."),
            unitPrice: z.coerce.number().min(0, "Preço deve ser >= 0."),
        })).optional().default([]),
        paymentMethod: z.string().optional(),
        observations: z.string().optional(),
        status: z.enum(budgetStatuses as [string, ...string[]]).default('Pendente'),
    }).optional(),
    execution: z.object({
        technician: z.string().optional(),
        procedures: z.string().optional(),
        completionDate: z.string().optional(),
    }).optional(),
    delivery: z.object({
        deliveryDate: z.string().optional(),
        finalObservations: z.string().optional(),
    }).optional(),
});


interface EditOrderFormProps {
    order: ServiceOrder;
    onSave: (order: ServiceOrder) => Promise<void>;
    onCancel: () => void;
    onDelete: (orderId: string) => Promise<void>;
}

const TABS = [
    { id: 'general', name: 'Informações Gerais' },
    { id: 'diagnosis', name: 'Diagnóstico' },
    { id: 'budget', name: 'Orçamento' },
    { id: 'execution', name: 'Execução' },
    { id: 'delivery', name: 'Entrega' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function EditOrderForm({ order, onSave, onCancel, onDelete }: EditOrderFormProps) {
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentTab, setCurrentTab] = useState<TabId>('general');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...order,
            entryDate: order.entryDate.split('T')[0],
            exitDate: order.exitDate ? order.exitDate.split('T')[0] : "",
            inspectionChecklist: order.inspectionChecklist || {},
            visualInspection: order.visualInspection || {
                generalObservations: "",
                markers: [],
            },
            budget: {
                items: order.budget?.items || [],
                paymentMethod: order.budget?.paymentMethod || "",
                observations: order.budget?.observations || "",
                status: order.budget?.status || 'Pendente',
            },
            execution: order.execution || {
                technician: "",
                procedures: "",
                completionDate: ""
            },
            delivery: order.delivery || {
                deliveryDate: "",
                finalObservations: ""
            }
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "budget.items",
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [clientsData, equipmentData] = await Promise.all([
                    getClients(),
                    getEquipment(),
                ]);
                setClients(clientsData);
                setEquipment(equipmentData);
            } catch (error) {
                console.error("Failed to load initial data:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao Carregar Dados",
                    description: "Não foi possível carregar clientes e equipamentos."
                });
            }
        };
        loadData();
    }, [toast]);

    const selectedClientId = form.watch("clientId");

    const filteredEquipment = useMemo(() => {
        if (!selectedClientId) return equipment;
        return equipment.filter(eq => eq.ownerId === selectedClientId);
    }, [selectedClientId, equipment]);

    const handleAddItem = () => {
        append({ description: '', quantity: 1, unitPrice: 0 });
    };

    const handleRemoveItem = (index: number) => {
        remove(index);
    };

    const budgetItems = form.watch("budget.items");

    const totalBudget = useMemo(() => {
        return budgetItems?.reduce((total, item) => total + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0;
    }, [budgetItems]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const orderToSave: ServiceOrder = {
                ...order,
                ...(values as any),
            };
            await onSave(orderToSave);
        } catch (error) {
            // Toast for error is handled in the parent component
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDelete = async (orderId: string) => {
        try {
            await onDelete(orderId);
        } catch (e) {
            // Parent handles toast
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex items-center border-b mb-4 sticky top-0 bg-background z-10">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`py-2 px-4 text-sm font-medium ${currentTab === tab.id
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-muted-foreground'
                                }`}
                            onClick={() => setCurrentTab(tab.id)}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* Aba 1: Informações Gerais */}
                    <div style={{ display: currentTab === 'general' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cliente</FormLabel>
                                                <Select onValueChange={(value) => { field.onChange(value); form.setValue('equipmentId', '') }} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger></FormControl>
                                                    <SelectContent>{clients.map((client) => (<SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>))}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="equipmentId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Equipamento</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder={!selectedClientId ? "Selecione um cliente primeiro" : "Selecione um equipamento"} /></SelectTrigger></FormControl>
                                                    <SelectContent>{filteredEquipment.map((eq) => (<SelectItem key={eq.id} value={eq.id}>{eq.brand} {eq.model} (S/N: {eq.serialNumber})</SelectItem>))}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status da OS</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                                                    <SelectContent>{allStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="entryDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data de Entrada</FormLabel>
                                                <FormControl><Input {...field} type="date" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="exitDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data Prevista</FormLabel>
                                                <FormControl><Input {...field} type="date" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="problemDescription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição do Problema</FormLabel>
                                            <FormControl><Textarea placeholder="Descreva o problema relatado pelo cliente..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Aba 2: Diagnóstico */}
                    <div style={{ display: currentTab === 'diagnosis' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader><CardTitle>Diagnóstico e Inspeção</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="font-semibold">Inspeção Visual (Imagem e Lente)</Label>
                                    <FormField
                                        control={form.control}
                                        name="visualInspection"
                                        render={({ field }) => (
                                            <ImageInspectionCanvas
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>
                                <Separator />
                                <div>
                                    <Label className="font-semibold">Checklist de Itens</Label>
                                    <div className="mt-2 rounded-lg border">
                                        <Table>
                                            <TableHeader><TableRow><TableHead className="w-[200px]">Item</TableHead><TableHead className="w-[250px]">Status</TableHead><TableHead>Observação</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {Object.entries(inspectionItems).map(([key, label]) => (
                                                    <TableRow key={key}>
                                                        <TableCell className="font-medium">{label}</TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`inspectionChecklist.${key as keyof InspectionChecklist}.status`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4">
                                                                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="OK" /></FormControl><FormLabel className="font-normal text-sm">OK</FormLabel></FormItem>
                                                                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Defeito" /></FormControl><FormLabel className="font-normal text-sm">Defeito</FormLabel></FormItem>
                                                                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Troca" /></FormControl><FormLabel className="font-normal text-sm">Troca</FormLabel></FormItem>
                                                                            </RadioGroup>
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`inspectionChecklist.${key as keyof InspectionChecklist}.observation`}
                                                                render={({ field }) => (
                                                                    <FormItem><FormControl><Input {...field} placeholder="Observação sobre o item..." /></FormControl></FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Aba 3: Orçamento */}
                    <div style={{ display: currentTab === 'budget' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader><CardTitle>Orçamento</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader><TableRow><TableHead className="w-[40%]">Item / Serviço</TableHead><TableHead>Qtd.</TableHead><TableHead>Vlr. Unit.</TableHead><TableHead>Vlr. Total</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => {
                                                const item = budgetItems?.[index];
                                                const totalItem = (item?.quantity || 0) * (item?.unitPrice || 0);
                                                return (
                                                    <TableRow key={field.id}>
                                                        <TableCell><FormField control={form.control} name={`budget.items.${index}.description`} render={({ field }) => (<Input {...field} placeholder="Ex: Troca de Lente" />)} /></TableCell>
                                                        <TableCell><FormField control={form.control} name={`budget.items.${index}.quantity`} render={({ field }) => (<Input type="number" {...field} className="w-20" />)} /></TableCell>
                                                        <TableCell><FormField control={form.control} name={`budget.items.${index}.unitPrice`} render={({ field }) => (<div className="relative"><span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground sm:text-sm">R$</span><Input type="number" {...field} placeholder="150,00" className="w-32 pl-10" /></div>)} /></TableCell>
                                                        <TableCell className="font-medium">{totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                                        <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={2}><Button variant="outline" size="sm" type="button" onClick={handleAddItem}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Item</Button></TableCell>
                                                <TableCell colSpan={2} className="text-right font-bold text-lg">Total:</TableCell>
                                                <TableCell className="font-bold text-lg">{totalBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="budget.status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status do Orçamento</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>{budgetStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="budget.paymentMethod"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Forma de Pagamento</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                    <SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="transferencia">Transferência</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="budget.observations"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observações / Termos do Orçamento</FormLabel>
                                            <FormControl><Textarea id="budget-observations" placeholder="Descreva as condições de garantia, validade do orçamento, etc." {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Aba 4: Execução */}
                    <div style={{ display: currentTab === 'execution' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader><CardTitle>Execução do Serviço</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="execution.technician"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Técnico Responsável</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione um técnico" /></SelectTrigger></FormControl>
                                                    <SelectContent><SelectItem value="tech1">João Silva</SelectItem><SelectItem value="tech2">Mariana Costa</SelectItem><SelectItem value="tech3">Carlos Pereira</SelectItem></SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="execution.completionDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data de Conclusão Técnica</FormLabel>
                                                <FormControl><Input {...field} type="date" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="execution.procedures"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Procedimentos Executados</FormLabel>
                                            <FormControl><Textarea placeholder="Descreva os procedimentos realizados..." {...field} rows={5} /></FormControl>
                                        </FormItem>
                                    )}
                                />

                            </CardContent>
                        </Card>
                    </div>

                    {/* Aba 5: Entrega */}
                    <div style={{ display: currentTab === 'delivery' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="delivery.deliveryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de Entrega</FormLabel>
                                            <FormControl><Input {...field} type="date" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="delivery.finalObservations"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observações Finais da Entrega</FormLabel>
                                            <FormControl><Textarea placeholder="Descreva qualquer observação final..." {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <CardFooter className="flex justify-between mt-6 gap-2 sticky bottom-0 bg-background/95 py-4 z-10">
                    <div>
                        {order.id && (
                            <DeleteConfirmationDialog
                                onConfirm={() => handleDelete(order.id)}
                                itemName={`OS ${order.readableId}`}
                            >
                                <Button type="button" variant="destructive" disabled={isSubmitting}>
                                    Excluir OS
                                </Button>
                            </DeleteConfirmationDialog>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </div>
                </CardFooter>
            </form>
        </Form>
    );
}

