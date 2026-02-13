
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
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { saveClient } from "@/lib/data";
import type { Client } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// Basic validation for CPF and CNPJ (doesn't check digits, just format)
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
const cepRegex = /^\d{5}-\d{3}$/;


const formSchema = z.object({
  clientType: z.enum(["fisica", "juridica"], {
    required_error: "Selecione o tipo de cliente.",
  }),
  companyName: z.string().min(1, { message: "O nome da empresa é obrigatório." }),
  contactName: z.string().min(1, { message: "O nome do contato é obrigatório." }),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().regex(phoneRegex, { message: "Telefone inválido." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  address: z.string().min(1, { message: "O endereço é obrigatório." }),
  cep: z.string().regex(cepRegex, { message: "CEP inválido." }),
  uf: z.string().min(1, { message: "Selecione um UF." }),
  city: z.string().min(1, { message: "Selecione uma cidade." }),
  observations: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.clientType === "fisica" && (!data.cpf || !cpfRegex.test(data.cpf))) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O CPF é obrigatório e deve ser válido.",
            path: ["cpf"],
        });
    }
     if (data.clientType === "juridica" && (!data.cnpj || !cnpjRegex.test(data.cnpj))) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O CNPJ é obrigatório e deve ser válido.",
            path: ["cnpj"],
        });
    }
});

interface ClientFormProps {
    isModal?: boolean;
    onSave?: (client: Client) => void;
    onCancel?: () => void;
}

type Uf = {
    id: number;
    sigla: string;
    nome: string;
}

type City = {
    id: number;
    nome: string;
}

export default function ClientForm({ isModal = false, onSave, onCancel }: ClientFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [clientType, setClientType] = useState<"fisica" | "juridica">("juridica");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ufs, setUfs] = useState<Uf[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [isCityLoading, setIsCityLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientType: "juridica",
            companyName: "",
            contactName: "",
            phone: "",
            email: "",
            address: "",
            cep: "",
            uf: "",
            city: "",
            observations: "",
            cpf: "",
            cnpj: "",
        },
    });

    useEffect(() => {
        const fetchUfs = async () => {
            try {
                const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
                const data = await response.json();
                setUfs(data);
            } catch (error) {
                console.error("Failed to fetch UFs:", error);
                 toast({ variant: "destructive", title: "Erro ao buscar UFs" });
            }
        };
        fetchUfs();
    }, [toast]);

    const selectedUf = form.watch("uf");

    useEffect(() => {
        if (!selectedUf) {
            setCities([]);
            return;
        }
        
        const fetchCities = async () => {
            setIsCityLoading(true);
            try {
                const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`);
                const data = await response.json();
                setCities(data);
            } catch (error) {
                console.error("Failed to fetch cities:", error);
                toast({ variant: "destructive", title: "Erro ao buscar cidades" });
            } finally {
                setIsCityLoading(false);
            }
        };

        fetchCities();
    }, [selectedUf, toast]);


    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d)(\d{4})$/, "$1-$2");
        form.setValue("phone", value);
    };

     const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
        form.setValue("cep", value);
    };


    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        form.setValue("cpf", value);
    }

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{2})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
        form.setValue("cnpj", value);
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
             // Combine address fields before saving
            const fullAddress = `${values.address}, ${values.city}, ${values.uf}, ${values.cep}`;
            const clientDataToSave = { ...values, address: fullAddress };
            
            const newClient = await saveClient(clientDataToSave as Omit<Client, 'id'>);
            if (isModal && onSave) {
                onSave(newClient);
            } else {
                toast({
                    title: "Cliente Cadastrado!",
                    description: "O novo cliente foi salvo com sucesso.",
                });
                router.push("/dashboard/clients");
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: "Não foi possível salvar o cliente. Tente novamente.",
            });
            console.error("Failed to save client:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Cliente</CardTitle>
                        <CardDescription>
                            Preencha os dados para cadastrar um novo cliente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="clientType"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Tipo de Cliente</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setClientType(value as "fisica" | "juridica");
                                            form.setValue('cpf', '');
                                            form.setValue('cnpj', '');
                                        }}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="juridica" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Pessoa Jurídica</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="fisica" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Pessoa Física</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{clientType === 'juridica' ? 'Nome da Empresa / Razão Social' : 'Nome Completo'}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={clientType === 'juridica' ? "Ex: Hospital Central" : "Ex: João da Silva"} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {clientType === 'juridica' ? (
                            <FormField
                                control={form.control}
                                name="cnpj"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CNPJ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="00.000.000/0000-00" {...field} maxLength={18} onChange={handleCnpjChange}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="cpf"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPF</FormLabel>
                                        <FormControl>
                                            <Input placeholder="000.000.000-00" {...field} maxLength={14} onChange={handleCpfChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}


                         <FormField
                            control={form.control}
                            name="contactName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Contato</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Dr. João da Silva" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(11) 99999-9999" {...field} maxLength={15} onChange={handlePhoneChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contato@hospital.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                           <FormField
                                control={form.control}
                                name="uf"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-1">
                                        <FormLabel>UF</FormLabel>
                                         <Select onValueChange={(value) => {field.onChange(value); form.setValue('city', '')}} value={field.value} >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="UF" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ufs.map((uf) => (
                                                <SelectItem key={uf.id} value={uf.sigla}>
                                                    {uf.sigla}
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
                                name="city"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-3">
                                        <FormLabel>Cidade</FormLabel>
                                         <Select onValueChange={field.onChange} value={field.value} disabled={!selectedUf || isCityLoading}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isCityLoading ? "Carregando..." : (selectedUf ? "Selecione a cidade" : "Selecione um UF primeiro")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {cities.map((city) => (
                                                <SelectItem key={city.id} value={city.nome}>
                                                    {city.nome}
                                                </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="cep"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-1">
                                        <FormLabel>CEP</FormLabel>
                                        <FormControl>
                                            <Input placeholder="00000-000" {...field} maxLength={9} onChange={handleCepChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-3">
                                        <FormLabel>Endereço</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Rua das Palmeiras, 123, Bairro" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Cliente com contrato de manutenção..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => isModal && onCancel ? onCancel() : router.back()} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Criar Cliente"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}


    