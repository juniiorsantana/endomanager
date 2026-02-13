
"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
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
import { getClients, getEquipment, getServiceOrders, saveServiceOrder } from "@/lib/data";
import { Separator } from "../ui/separator";
import ImageInspectionCanvas, { InspectionData as VisualInspectionData } from "./image-inspection-canvas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "../ui/table";
import { PlusCircle, Trash2, ChevronLeft, ChevronRight, History } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import type { ServiceOrder, Client, Equipment, ServiceOrderStatus, BudgetItem, InspectionChecklist, InspectionChecklistItem } from "@/types";
import { inspectionItems } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ClientForm from "./client-form";
import EquipmentForm from "./equipment-form";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";


const allStatuses: ServiceOrderStatus[] = [
    "Aberta",
    "Em Diagnóstico",
    "Aguardando Aprovação",
    "Em Andamento",
    "Finalizada",
    "Entregue",
];

const inspectionChecklistItemSchema = z.object({
    status: z.enum(['OK', 'Defeito', 'Troca']),
    observation: z.string().optional(),
});

const formSchema = z.object({
    id: z.string().optional(),
    readableId: z.string().optional(),
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
            quantity: z.coerce.number().min(0, "Qtd. deve ser >= 0."),
            unitPrice: z.coerce.number().min(0, "Preço deve ser >= 0."),
        })).optional().default([]),
        paymentMethod: z.string().optional(),
        observations: z.string().optional(),
    }).optional(),
});


interface OrderFormProps {
    defaultClientId?: string;
    defaultEquipmentId?: string;
    onSave?: (order: ServiceOrder) => void;
    onCancel?: () => void;
    isModal?: boolean;
}

const TABS = [
    { id: 'identification', name: 'Identificação', fields: ['clientId', 'problemDescription'] },
    { id: 'equipment', name: 'Equipamento', fields: ['equipmentId'] },
    { id: 'inspection', name: 'Inspeção', fields: [] },
    { id: 'budget', name: 'Orçamento', fields: [] },
    { id: 'execution', name: 'Execução', fields: [] },
] as const;

type TabId = typeof TABS[number]['id'];

export default function OrderForm({ defaultClientId, defaultEquipmentId, onSave, onCancel, isModal = false }: OrderFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [allServiceOrders, setAllServiceOrders] = useState<ServiceOrder[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);

    const [currentTab, setCurrentTab] = useState<TabId>('identification');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: "",
            readableId: "",
            entryDate: new Date().toISOString().split('T')[0],
            exitDate: "",
            status: 'Aberta',
            clientId: defaultClientId || "",
            equipmentId: defaultEquipmentId || "",
            problemDescription: "",
            technicianNotes: "",
            inspectionChecklist: {},
            visualInspection: {
                generalObservations: "",
                markers: [],
            },
            budget: {
                items: [],
                paymentMethod: "",
                observations: "",
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
                const [clientsData, equipmentData, ordersData] = await Promise.all([
                    getClients(),
                    getEquipment(),
                    getServiceOrders(),
                ]);
                setClients(clientsData);
                setEquipment(equipmentData);
                setAllServiceOrders(ordersData);
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
    const selectedEquipmentId = form.watch("equipmentId");

    const filteredEquipment = useMemo(() => {
        if (!selectedClientId) return [];
        return equipment.filter(eq => eq.ownerId === selectedClientId);
    }, [selectedClientId, equipment]);

    const equipmentHistory = useMemo(() => {
        if (!selectedEquipmentId) return [];
        return allServiceOrders
            .filter(order => order.equipmentId === selectedEquipmentId)
            .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    }, [selectedEquipmentId, allServiceOrders]);


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
            const newOrder = await saveServiceOrder(values as Omit<ServiceOrder, 'id' | 'readableId'>);

            if (isModal && onSave) {
                onSave(newOrder);
            } else {
                toast({
                    title: "Ordem de Serviço Criada!",
                    description: "A nova OS foi salva com sucesso.",
                });
                router.push("/dashboard/orders");
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível salvar a OS. Tente novamente.",
            });
            console.error("Failed to save service order:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleClientSaved = (newClient: Client) => {
        const updatedClients = [...clients, newClient];
        setClients(updatedClients);
        form.setValue("clientId", newClient.id, { shouldValidate: true });
        setIsClientModalOpen(false);
        toast({
            title: "Cliente Cadastrado!",
            description: "O novo cliente foi adicionado com sucesso.",
        });
    }

    const handleEquipmentSaved = (newEquipment: Equipment) => {
        const updatedEquipment = [...equipment, newEquipment];
        setEquipment(updatedEquipment);
        form.setValue("equipmentId", newEquipment.id, { shouldValidate: true });
        setIsEquipmentModalOpen(false);
        toast({
            title: "Equipamento Cadastrado!",
            description: "O novo equipamento foi adicionado com sucesso.",
        });
    }

    const handleCancelClick = () => {
        if (isModal && onCancel) {
            onCancel();
        } else {
            router.back();
        }
    }

    const handleNext = async () => {
        const currentTabIndex = TABS.findIndex(t => t.id === currentTab);
        const fieldsToValidate = TABS[currentTabIndex].fields;

        // @ts-ignore
        const isValid = await form.trigger(fieldsToValidate);
        if (isValid && currentTabIndex < TABS.length - 1) {
            setCurrentTab(TABS[currentTabIndex + 1].id);
        }
    }

    const handlePrevious = () => {
        const currentTabIndex = TABS.findIndex(t => t.id === currentTab);
        if (currentTabIndex > 0) {
            setCurrentTab(TABS[currentTabIndex - 1].id);
        }
    }

    const currentTabIndex = TABS.findIndex(t => t.id === currentTab);
    const isLastStep = currentTabIndex === TABS.length - 1;


    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex items-center mb-4">
                        <div className="flex items-center gap-2">
                            {TABS.map((tab, index) => (
                                <React.Fragment key={tab.id}>
                                    <Button
                                        type="button"
                                        variant={currentTab === tab.id ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setCurrentTab(tab.id)}
                                        className={cn(
                                            "rounded-full",
                                            index > currentTabIndex && "pointer-events-none opacity-50"
                                        )}
                                    >
                                        {tab.name}
                                    </Button>
                                    {index < TABS.length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        {!isModal && (
                            <div className="ml-auto flex items-center gap-2">
                                <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: currentTab === 'identification' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Identificação da OS</CardTitle>
                                <CardDescription>
                                    Informações básicas sobre a ordem de serviço e o cliente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="readableId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nº da OS</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Será gerado ao salvar" disabled />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="entryDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data de Entrada</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="date" />
                                                </FormControl>
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
                                                <FormControl>
                                                    <Input {...field} type="date" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cliente</FormLabel>
                                                <Select onValueChange={(value) => { field.onChange(value); form.setValue('equipmentId', '') }} value={field.value} disabled={!!defaultClientId && isModal}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione um cliente" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {clients.map((client) => (
                                                            <SelectItem key={client.id} value={client.id}>
                                                                {client.companyName}
                                                            </SelectItem>
                                                        ))}
                                                        <Separator />
                                                        <Button variant="ghost" className="w-full justify-start pl-8 pr-2 h-auto py-1.5" onClick={(e) => { e.preventDefault(); setIsClientModalOpen(true) }}>
                                                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cliente
                                                        </Button>
                                                    </SelectContent>
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
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {allStatuses.map(status => (
                                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
                                            <FormControl>
                                                <Textarea placeholder="Descreva o problema relatado pelo cliente..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div style={{ display: currentTab === 'equipment' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações do Equipamento</CardTitle>
                                <CardDescription>
                                    Detalhes sobre o equipamento em manutenção.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="equipmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Equipamento</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId || (!!defaultEquipmentId && isModal)}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={!selectedClientId ? "Selecione um cliente primeiro" : "Selecione um equipamento"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {filteredEquipment.map((eq) => (
                                                        <SelectItem key={eq.id} value={eq.id}>
                                                            {eq.brand} {eq.model} (S/N: {eq.serialNumber})
                                                        </SelectItem>
                                                    ))}
                                                    <Separator />
                                                    <Button variant="ghost" className="w-full justify-start pl-8 pr-2 h-auto py-1.5" onClick={(e) => { e.preventDefault(); setIsEquipmentModalOpen(true) }} disabled={!selectedClientId}>
                                                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Equipamento
                                                    </Button>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <Label>Histórico de Consertos</Label>
                                    <div className="rounded-lg border bg-background p-3 space-y-4 max-h-60 overflow-y-auto">
                                        {equipmentHistory && equipmentHistory.length > 0 ? (
                                            equipmentHistory.map((order, index) => (
                                                <div key={`${order.id}-${order.readableId}-${index}`} className="text-sm p-3 bg-muted/50 rounded-md">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold">{order.readableId} - {new Date(order.entryDate).toLocaleDateString('pt-BR')}</p>
                                                            <p className="text-muted-foreground">{order.problemDescription}</p>
                                                        </div>
                                                        <Badge>{order.status}</Badge>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                                                <History className="h-8 w-8 mb-2" />
                                                <p>Nenhum histórico encontrado para este equipamento.</p>
                                                <p className="text-xs">As OS anteriores aparecerão aqui.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div style={{ display: currentTab === 'inspection' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Inspeção Técnica e Visual</CardTitle>
                                <CardDescription>
                                    Realize o checklist, adicione observações e marque os defeitos na imagem.
                                </CardDescription>
                            </CardHeader>
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
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[200px]">Item</TableHead>
                                                    <TableHead className="w-[250px]">Status</TableHead>
                                                    <TableHead>Observação</TableHead>
                                                </TableRow>
                                            </TableHeader>
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
                                                                            <RadioGroup
                                                                                onValueChange={field.onChange}
                                                                                defaultValue={field.value}
                                                                                className="flex items-center space-x-4"
                                                                            >
                                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                                    <FormControl><RadioGroupItem value="OK" /></FormControl>
                                                                                    <FormLabel className="font-normal text-sm">OK</FormLabel>
                                                                                </FormItem>
                                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                                    <FormControl><RadioGroupItem value="Defeito" /></FormControl>
                                                                                    <FormLabel className="font-normal text-sm">Defeito</FormLabel>
                                                                                </FormItem>
                                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                                    <FormControl><RadioGroupItem value="Troca" /></FormControl>
                                                                                    <FormLabel className="font-normal text-sm">Troca</FormLabel>
                                                                                </FormItem>
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
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input {...field} placeholder="Observação sobre o item..." />
                                                                        </FormControl>
                                                                    </FormItem>
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

                    <div style={{ display: currentTab === 'budget' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Orçamento</CardTitle>
                                <CardDescription>
                                    Detalhe os serviços e peças, valores e forma de pagamento.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[40%]">Item / Serviço</TableHead>
                                                <TableHead>Qtd.</TableHead>
                                                <TableHead>Vlr. Unit.</TableHead>
                                                <TableHead>Vlr. Total</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => {
                                                const item = budgetItems?.[index];
                                                const totalItem = (item?.quantity || 0) * (item?.unitPrice || 0);
                                                return (
                                                    <TableRow key={field.id}>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`budget.items.${index}.description`}
                                                                render={({ field }) => (
                                                                    <Input {...field} placeholder="Ex: Troca de Lente" />
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`budget.items.${index}.quantity`}
                                                                render={({ field }) => (
                                                                    <Input type="number" {...field} className="w-20" />
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`budget.items.${index}.unitPrice`}
                                                                render={({ field }) => (
                                                                    <div className="relative">
                                                                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground sm:text-sm">
                                                                            R$
                                                                        </span>
                                                                        <Input type="number" {...field} placeholder="150,00" className="w-32 pl-10" />
                                                                    </div>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={2}>
                                                    <Button variant="outline" size="sm" type="button" onClick={handleAddItem}>
                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                        Adicionar Item
                                                    </Button>
                                                </TableCell>
                                                <TableCell colSpan={2} className="text-right font-bold text-lg">Total:</TableCell>
                                                <TableCell className="font-bold text-lg">
                                                    {totalBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-method">Forma de Pagamento</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a forma de pagamento" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pix">Pix</SelectItem>
                                                <SelectItem value="boleto">Boleto</SelectItem>
                                                <SelectItem value="transferencia">Transferência</SelectItem>
                                                <SelectItem value="outro">Outro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="budget-observations">Observações Técnicas / Termos</Label>
                                    <Textarea id="budget-observations" placeholder="Descreva as condições de garantia, validade do orçamento, etc." />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div style={{ display: currentTab === 'execution' ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Planejamento da Execução</CardTitle>
                                <CardDescription>
                                    Defina os detalhes prévios para quando a execução do serviço começar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="technician">Técnico Responsável</Label>
                                            <Select>
                                                <SelectTrigger id="technician">
                                                    <SelectValue placeholder="A designar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="tech1">João Silva</SelectItem>
                                                    <SelectItem value="tech2">Mariana Costa</SelectItem>
                                                    <SelectItem value="tech3">Carlos Pereira</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Prioridade</Label>
                                            <RadioGroup defaultValue="normal" className="flex items-center gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="urgent" id="urgent" />
                                                    <Label htmlFor="urgent">Urgente</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="high" id="high" />
                                                    <Label htmlFor="high">Alta</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="normal" id="normal" />
                                                    <Label htmlFor="normal">Normal</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="low" id="low" />
                                                    <Label htmlFor="low">Baixa</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="execution-status">Status Inicial da Execução</Label>
                                            <Select>
                                                <SelectTrigger id="execution-status">
                                                    <SelectValue placeholder="Selecione um status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="waiting_parts">Aguardando Peça</SelectItem>
                                                    <SelectItem value="waiting_approval">Aguardando Aprovação</SelectItem>
                                                    <SelectItem value="ready_to_start">Pronto para Execução</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="start-date">Início Previsto</Label>
                                                <Input id="start-date" type="date" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="end-date">Conclusão Prevista</Label>
                                                <Input id="end-date" type="date" />
                                            </div>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="technicianNotes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label>Observações Técnicas Iniciais</Label>
                                                    <FormControl>
                                                        <Textarea placeholder="Ex: Verificar possível dano em lente secundária..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <CardFooter className="flex justify-between mt-4">
                        <div>
                            {currentTabIndex > 0 && (
                                <Button variant="outline" type="button" onClick={handlePrevious} disabled={isSubmitting}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Anterior
                                </Button>
                            )}
                        </div>
                        <div>
                            {isLastStep ? (
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Salvando..." : "Criar Ordem de Serviço"}
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleNext}>
                                    Próximo
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </form>
            </Form>

            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo para cadastrar um novo cliente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-auto pr-6 -mr-6">
                        <ClientForm isModal onSave={handleClientSaved} onCancel={() => setIsClientModalOpen(false)} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEquipmentModalOpen} onOpenChange={setIsEquipmentModalOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Equipamento</DialogTitle>
                        <DialogDescription>
                            OS para o cliente: {clients.find(c => c.id === selectedClientId)?.companyName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-auto pr-6 -mr-6">
                        {selectedClientId && (
                            <EquipmentForm
                                isModal
                                defaultOwnerId={selectedClientId}
                                onSave={handleEquipmentSaved}
                                onCancel={() => setIsEquipmentModalOpen(false)}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

