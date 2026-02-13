
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getClients, saveEquipment, equipmentTypes, equipmentTechnicalStatusValues, saveServiceOrder } from "@/lib/data";
import type { Equipment, EquipmentAvailabilityType, ServiceOrder, Client } from "@/types";
import { Building, Store, Car, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import OrderForm from "./order-form";


const availabilityOptions = {
    internal: {
        label: "Uso Interno",
        description: "Equipamento pertence ao cliente, usado para manutenção.",
        icon: Building,
    },
    sale: {
        label: "Disponível para Venda",
        description: "Equipamento de propriedade da empresa para venda.",
        icon: Store,
    },
    rent: {
        label: "Disponível para Aluguel",
        description: "Equipamento de propriedade da empresa para aluguel.",
        icon: Car,
    }
};

const formSchema = z.object({
    ownerId: z.string({ required_error: "Selecione o cliente proprietário." }),
    serialNumber: z.string().min(1, { message: "O nº de série é obrigatório." }),
    brand: z.string().min(1, { message: "A marca é obrigatória." }),
    model: z.string().min(1, { message: "O modelo é obrigatório." }),
    equipmentType: z.string({ required_error: "Selecione o tipo de equipamento." }),
    technicalObservations: z.string().optional(),
    availabilityType: z.enum(['internal', 'sale', 'rent']),
    technicalStatus: z.string({ required_error: "Selecione o status técnico." }),
    // Commercial fields - sale
    salePrice: z.coerce.number().optional(),
    saleStatus: z.enum(['available', 'sold']).optional(),
    // Commercial fields - rent
    rentPriceDaily: z.coerce.number().optional(),
    rentPriceWeekly: z.coerce.number().optional(),
    rentPriceMonthly: z.coerce.number().optional(),
    rentalStatus: z.enum(['available', 'rented']).optional(),
});

interface EquipmentFormProps {
    isModal?: boolean;
    defaultOwnerId?: string;
    onSave?: (equipment: Equipment) => void;
    onCancel?: () => void;
}


export default function EquipmentForm({ isModal = false, defaultOwnerId, onSave, onCancel }: EquipmentFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [newlyCreatedEquipment, setNewlyCreatedEquipment] = useState<Equipment | null>(null);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const clientsData = await getClients();
                setClients(clientsData);
            } catch (error) {
                console.error("Failed to fetch clients:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao buscar clientes",
                    description: "Não foi possível carregar a lista de clientes.",
                });
            }
        };
        fetchClients();
    }, [toast]);


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ownerId: defaultOwnerId || "",
            serialNumber: "",
            brand: "",
            model: "",
            equipmentType: "",
            technicalObservations: "",
            availabilityType: 'internal',
            technicalStatus: 'in_use',
            salePrice: 0,
            saleStatus: 'available',
            rentPriceDaily: 0,
            rentPriceWeekly: 0,
            rentPriceMonthly: 0,
            rentalStatus: 'available',
        },
    });

    const availabilityType = form.watch("availabilityType");

    const processSubmit = async (values: z.infer<typeof formSchema>): Promise<Equipment> => {
        setIsSubmitting(true);
        try {
            const newEquipmentData: Omit<Equipment, 'id'> = {
                ...(values as any),
                rentalPrice: {
                    daily: values.rentPriceDaily || 0,
                    weekly: values.rentPriceWeekly || 0,
                    monthly: values.rentPriceMonthly || 0,
                }
            };
            const savedEquipment = await saveEquipment(newEquipmentData);
            return savedEquipment;
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const savedEquipment = await processSubmit(values);
            if (isModal && onSave) {
                onSave(savedEquipment);
            } else {
                toast({
                    title: "Equipamento Cadastrado!",
                    description: "O novo equipamento foi salvo com sucesso.",
                });
                router.push("/dashboard/equipment");
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível salvar o equipamento. Tente novamente.",
            });
        }
    }

    const handleSaveAndCreateOS = async () => {
        const isValid = await form.trigger();
        if (isValid) {
            try {
                const values = form.getValues();
                const savedEquipment = await processSubmit(values);
                setNewlyCreatedEquipment(savedEquipment);
                setIsOrderModalOpen(true);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao Salvar",
                    description: "Não foi possível salvar o equipamento antes de criar a OS.",
                });
            }
        } else {
            toast({
                variant: "destructive",
                title: "Erro de Validação",
                description: "Por favor, preencha todos os campos obrigatórios.",
            });
        }
    }

    const handleOrderSaved = (order: ServiceOrder) => {
        saveServiceOrder(order);
        setIsOrderModalOpen(false);
        toast({
            title: "Ordem de Serviço Criada!",
            description: `A OS para o equipamento ${newlyCreatedEquipment?.brand} ${newlyCreatedEquipment?.model} foi criada.`,
        });
        router.push("/dashboard/orders");
    }

    const handleCancelClick = () => {
        if (isModal && onCancel) {
            onCancel();
        } else {
            router.back();
        }
    }


    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-4 lg:grid-cols-3 lg:gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Identificação do Equipamento</CardTitle>
                                    <CardDescription>
                                        Informações técnicas para rastreabilidade.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="ownerId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cliente Vinculado</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isModal || clients.length === 0}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione o cliente proprietário" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {clients.map((client) => (
                                                                <SelectItem key={client.id} value={client.id}>
                                                                    {client.companyName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="serialNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nº de Série</FormLabel>
                                                    <FormControl><Input placeholder="SN12345ABC" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="brand"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Marca</FormLabel>
                                                    <FormControl><Input placeholder="Olympus" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="model"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Modelo</FormLabel>
                                                    <FormControl><Input placeholder="GIF-HQ190" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="equipmentType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo de Equipamento</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione o tipo" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {Object.entries(equipmentTypes).map(([key, label]) => (
                                                                <SelectItem key={key} value={key}>{label}</SelectItem>
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
                                        name="technicalObservations"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Observações Técnicas</FormLabel>
                                                <FormControl><Textarea placeholder="Detalhes sobre o estado inicial, histórico, etc." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {availabilityType !== 'internal' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Informações Comerciais</CardTitle>
                                        <CardDescription>
                                            Detalhes para {availabilityType === 'sale' ? 'venda' : 'aluguel'} do equipamento.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {availabilityType === 'sale' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="salePrice"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Preço de Venda</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                    <Input type="number" placeholder="25000,00" className="pl-8" {...field} />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="saleStatus"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Status da Venda</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="available">Disponível</SelectItem>
                                                                    <SelectItem value="sold">Vendido</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                        {availabilityType === 'rent' && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="rentPriceDaily"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Aluguel (Diário)</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                        <Input type="number" placeholder="150,00" className="pl-8" {...field} />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="rentPriceWeekly"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Aluguel (Semanal)</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                        <Input type="number" placeholder="900,00" className="pl-8" {...field} />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="rentPriceMonthly"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Aluguel (Mensal)</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                        <Input type="number" placeholder="3000,00" className="pl-8" {...field} />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="rentalStatus"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Status do Aluguel</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="available">Disponível</SelectItem>
                                                                    <SelectItem value="rented">Locado</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="lg:col-span-1 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Disponibilidade e Status</CardTitle>
                                    <CardDescription>
                                        Defina como este equipamento será gerenciado.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <FormField
                                        control={form.control}
                                        name="availabilityType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Disponibilidade</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger aria-label="Selecione o tipo">
                                                            <SelectValue placeholder="Selecione o tipo de disponibilidade" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(availabilityOptions).map(([key, { label, icon: Icon }]) => (
                                                            <SelectItem key={key} value={key}>
                                                                <div className="flex items-center gap-3">
                                                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                                                    <span>{label}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    {availabilityOptions[availabilityType as EquipmentAvailabilityType].description}
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Separator />
                                    <FormField
                                        control={form.control}
                                        name="technicalStatus"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status Técnico</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger aria-label="Selecione o status">
                                                            <SelectValue placeholder="Selecione o status técnico" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(equipmentTechnicalStatusValues).map(([key, label]) => (
                                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex-col gap-2 items-stretch">
                                    <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Criar Equipamento"}</Button>
                                    <Button type="button" variant="outline" size="lg" onClick={handleCancelClick} disabled={isSubmitting}>Cancelar</Button>
                                    {!isModal && (
                                        <>
                                            <Separator className="my-2" />
                                            <Button type="button" variant="secondary" size="lg" onClick={handleSaveAndCreateOS} disabled={isSubmitting}>Criar e Abrir OS</Button>
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>

            <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
                        <DialogDescription>
                            OS para o equipamento: {newlyCreatedEquipment?.brand} {newlyCreatedEquipment?.model} (S/N: {newlyCreatedEquipment?.serialNumber})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-auto pr-6 -mr-6">
                        {newlyCreatedEquipment && (
                            <OrderForm
                                defaultClientId={newlyCreatedEquipment.ownerId}
                                defaultEquipmentId={newlyCreatedEquipment.id}
                                onSave={handleOrderSaved}
                                onCancel={() => setIsOrderModalOpen(false)}
                                isModal={true}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
