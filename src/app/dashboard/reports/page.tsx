
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-headline text-3xl font-bold">Relatórios</h1>
        <div className="flex items-center gap-2">
          <Select defaultValue="last_30_days">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
              <SelectItem value="last_year">Último ano</SelectItem>
              <SelectItem value="all_time">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar (PDF)
          </Button>
        </div>
      </div>

      <Tabs defaultValue="technical" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="technical">Técnico</TabsTrigger>
          <TabsTrigger value="commercial">Comercial</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de OS</CardTitle>
                <CardDescription>Status das ordens de serviço no período.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Em breve: Gráfico de OS abertas, em execução e finalizadas.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Manutenção</CardTitle>
                 <CardDescription>Equipamentos com mais OS e problemas comuns.</CardDescription>
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-muted-foreground">Em breve: Ranking de equipamentos e gráfico de defeitos.</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Alertas Preventivos</CardTitle>
                <CardDescription>Equipamentos com revisão próxima ou falhas recorrentes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Em breve: Lista de equipamentos para atenção.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="commercial" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Vendas de Equipamentos</CardTitle>
                 <CardDescription>Total de vendas, ticket médio e mais vendidos.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Em breve: Métricas de vendas de equipamentos.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Aluguel de Equipamentos</CardTitle>
                 <CardDescription>Receita, taxa de ocupação e mais alugados.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Em breve: Métricas de aluguel de equipamentos.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="financial" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Faturamento Total</CardTitle>
                <CardDescription>Faturamento por cliente e por tipo de serviço.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Em breve: Gráficos de faturamento.</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Fluxo de Receita</CardTitle>
                <CardDescription>Visão mensal da entrada de receita.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Em breve: Gráfico de linha da receita mensal.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="clients" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Atividade de Clientes</CardTitle>
                        <CardDescription>Ativos vs. inativos e clientes com mais OS.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Em breve: Gráficos e listas de atividade.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Rentabilidade</CardTitle>
                        <CardDescription>Ranking dos clientes mais rentáveis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Em breve: Lista de clientes por rentabilidade.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Reativação</CardTitle>
                        <CardDescription>Clientes sem atividade recente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Em breve: Lista de clientes para contato.</p>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
