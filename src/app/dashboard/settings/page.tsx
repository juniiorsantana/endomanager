
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ThemeSwitcher from "@/components/dashboard/theme-switcher";
import DeleteConfirmationDialog from "@/components/shared/delete-confirmation-dialog";
import { collection, writeBatch, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const handleClearAllData = async () => {
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const collectionsToClear = ["clients", "equipment", "serviceOrders"];

      for (const collectionName of collectionsToClear) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }

      await batch.commit();

      toast({
        title: "Dados Limpos!",
        description: "Todos os registros foram removidos com sucesso.",
      });

      // It's a good practice to reload to reflect the empty state everywhere
      window.location.reload();

    } catch (error) {
      console.error("Failed to clear data:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Limpar Dados",
        description: "Não foi possível remover os registros. Tente novamente.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveTheme = () => {
    if (selectedTheme) {
      setTheme(selectedTheme);
      toast({
        title: "Tema Atualizado!",
        description: "A aparência do sistema foi atualizada com sucesso.",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-headline text-3xl font-bold">Configurações</h1>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Atualize as informações da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" defaultValue="Seu Nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="seu-email@exemplo.com" />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Salvar</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Personalize a aparência do sistema. Mude para o modo claro ou escuro.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ThemeSwitcher
              selectedTheme={selectedTheme}
              onThemeChange={setSelectedTheme}
            />
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSaveTheme}>Salvar</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>
              Altere sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" />
              </div>
            </form>
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
            <Button>Alterar Senha</Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações destrutivas que não podem ser desfeitas. Tenha cuidado.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <DeleteConfirmationDialog
              onConfirm={handleClearAllData}
              title="Você tem certeza que quer limpar todos os dados?"
              description="Esta ação é irreversível e irá apagar permanentemente todos os clientes, equipamentos e ordens de serviço. Não será possível recuperar esses dados."
            >
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Limpando dados..." : "Limpar Todos os Dados da Aplicação"}
              </Button>
            </DeleteConfirmationDialog>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
