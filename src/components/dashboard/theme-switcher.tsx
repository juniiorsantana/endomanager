
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "../ui/skeleton";

interface ThemeSwitcherProps {
  selectedTheme?: string;
  onThemeChange: (theme: string) => void;
}

export default function ThemeSwitcher({ selectedTheme, onThemeChange }: ThemeSwitcherProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
             <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        );
    }
  
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={selectedTheme === 'light' ? 'default' : 'outline'}
        onClick={() => onThemeChange("light")}
      >
        <Sun className="mr-2 h-4 w-4" />
        Claro
      </Button>
      <Button
        variant={selectedTheme === 'dark' ? 'default' : 'outline'}
        onClick={() => onThemeChange("dark")}
      >
        <Moon className="mr-2 h-4 w-4" />
        Escuro
      </Button>
       <Button
        variant={selectedTheme === 'system' ? 'default' : 'outline'}
        onClick={() => onThemeChange("system")}
      >
        Sistema
      </Button>
    </div>
  )
}
